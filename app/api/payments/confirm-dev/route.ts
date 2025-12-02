import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';
/**
 * Development-only API route to manually confirm payments
 * Used when webhooks don't work on localhost
 */
export async function POST(request: NextRequest) {
  console.log('🔧 [confirm-dev] API called');
  console.log('🔧 [confirm-dev] NODE_ENV:', process.env.NODE_ENV);
  
  // Warn if used in production (but allow for testing)
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️ [confirm-dev] WARNING: Manual payment confirmation used in production!');
    console.warn('⚠️ [confirm-dev] This should only be used for testing. Configure Xendit webhooks for production.');
  }

  try {
    const { payment_id } = await request.json();
    console.log('🔧 [confirm-dev] Payment ID:', payment_id);

    if (!payment_id) {
      console.log('❌ [confirm-dev] No payment_id provided');
      return NextResponse.json(
        { error: 'payment_id is required' },
        { status: 400 }
      );
    }

    // Check if service role key exists
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ [confirm-dev] SUPABASE_SERVICE_ROLE_KEY not found in environment');
      return NextResponse.json(
        { error: 'Server configuration error: Missing service role key' },
        { status: 500 }
      );
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log('✅ [confirm-dev] Supabase client created');

    // First check if payment exists
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (checkError || !existingPayment) {
      console.error('❌ [confirm-dev] Payment not found:', checkError);
      return NextResponse.json(
        { error: 'Payment not found', details: checkError },
        { status: 404 }
      );
    }

    console.log('✅ [confirm-dev] Found payment:', {
      id: existingPayment.id,
      status: existingPayment.payment_status,
      amount: existingPayment.amount
    });

    // If already paid, don't process again (prevents duplicate notifications)
    if (existingPayment.payment_status === 'paid') {
      console.log('⚠️ [confirm-dev] Payment already paid, skipping to prevent duplicates');
      return NextResponse.json({
        success: true,
        payment: [existingPayment],
        message: 'Payment already confirmed',
        alreadyPaid: true
      });
    }

    // Update payment to paid
    const { data, error } = await supabase
      .from('payments')
      .update({
        payment_status: 'paid',
        paid_date: new Date().toISOString(),
        payment_method: 'GCASH',  // Will work after migration removes enum
        reference_number: 'manual-dev-' + Date.now(),
        notes: 'Auto-confirmed in development mode (webhook not available on localhost)'
      })
      .eq('id', payment_id)
      .select(`
        *,
        tenant:tenants(
          id,
          unit_number,
          user:users(
            id,
            first_name,
            last_name,
            email
          )
        ),
        property:properties(
          id,
          name,
          owner_id
        )
      `);

    if (error) {
      console.error('❌ [confirm-dev] Payment update error:', error);
      return NextResponse.json(
        { error: 'Failed to update payment', details: error },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('❌ [confirm-dev] No rows updated');
      return NextResponse.json(
        { error: 'Payment update returned no rows' },
        { status: 500 }
      );
    }

    console.log('✅ [confirm-dev] Payment confirmed successfully:', {
      id: data[0].id,
      status: data[0].payment_status,
      paid_date: data[0].paid_date
    });

    // Send notifications to tenant and owner
    try {
      const payment = data[0];
      const tenantUserId = (payment as any).tenant?.user?.id;
      const tenantName = `${(payment as any).tenant?.user?.first_name} ${(payment as any).tenant?.user?.last_name}`;
      const unitNumber = (payment as any).tenant?.unit_number;
      const propertyName = (payment as any).property?.name;
      const ownerId = (payment as any).property?.owner_id;

      console.log('🔔 [confirm-dev] Sending notifications:', {
        tenantUserId,
        tenantName,
        ownerId,
        amount: payment.amount
      });

      // Notify tenant
      if (tenantUserId) {
        await supabase.from('notifications').insert({
          user_id: tenantUserId,
          title: '✅ Payment Confirmed',
          message: `Your ${payment.payment_type} payment of ₱${payment.amount.toLocaleString()} has been confirmed for ${propertyName}`,
          type: 'payment',
          priority: 'medium',
          action_url: `/tenant/dashboard/payments`,
          data: {
            payment_id: payment.id,
            amount: payment.amount,
            payment_type: payment.payment_type,
            property_name: propertyName
          }
        });
        console.log('✅ [confirm-dev] Tenant notified');
      }

      // Notify owner
      if (ownerId) {
        await supabase.from('notifications').insert({
          user_id: ownerId,
          title: '💰 Payment Received',
          message: `${tenantName} (Unit ${unitNumber}) has paid ${payment.payment_type} of ₱${payment.amount.toLocaleString()} for ${propertyName}`,
          type: 'payment',
          priority: 'high',
          action_url: `/owner/dashboard/payments`,
          data: {
            payment_id: payment.id,
            tenant_name: tenantName,
            unit_number: unitNumber,
            amount: payment.amount,
            payment_type: payment.payment_type,
            property_name: propertyName
          }
        });
        console.log('✅ [confirm-dev] Owner notified');
      } else {
        console.warn('⚠️ [confirm-dev] No owner_id found, owner not notified');
      }
    } catch (notifError) {
      console.error('❌ [confirm-dev] Notification error (non-fatal):', notifError);
      // Don't fail the payment confirmation if notifications fail
    }

    return NextResponse.json({
      success: true,
      payment: data,
      message: 'Payment confirmed successfully'
    });
  } catch (error) {
    console.error('❌ [confirm-dev] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

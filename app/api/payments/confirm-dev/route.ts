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
      .select();

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

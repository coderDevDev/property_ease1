import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Development-only API route to manually confirm payments
 * Used when webhooks don't work on localhost
 */
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    );
  }

  try {
    const { payment_id } = await request.json();

    if (!payment_id) {
      return NextResponse.json(
        { error: 'payment_id is required' },
        { status: 400 }
      );
    }

    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First check if payment exists
    const { data: existingPayment, error: checkError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single();

    if (checkError || !existingPayment) {
      console.error('Payment not found:', checkError);
      return NextResponse.json(
        { error: 'Payment not found', details: checkError },
        { status: 404 }
      );
    }

    console.log('Found payment:', existingPayment);

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
      console.error('Payment update error:', error);
      return NextResponse.json(
        { error: 'Failed to update payment', details: error },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      console.error('No rows updated');
      return NextResponse.json(
        { error: 'Payment update returned no rows' },
        { status: 500 }
      );
    }

    console.log('✅ Payment confirmed (dev mode):', data[0].id);

    return NextResponse.json({
      success: true,
      payment: data,
      message: 'Payment confirmed successfully'
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-static';
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    console.log('Xendit Webhook Payload:', payload);

    const {
      external_id,
      status,
      paid_at,
      payment_method,
      payment_channel,
      invoice_url,
      id: invoice_id
    } = payload;

    // Extract payment_id from external_id (format: "payment_<id>_<timestamp>")
    const paymentIdMatch = external_id?.match(/^payment_([^_]+)_/);
    if (!paymentIdMatch) {
      console.error('Invalid external_id format:', external_id);
      return NextResponse.json({ error: 'Invalid external_id' }, { status: 400 });
    }
    
    const payment_id = paymentIdMatch[1];

    if (status === 'PAID' || status === 'SETTLED') {
      // Create Supabase client with service role key for webhook
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('payments')
        .update({
          payment_status: 'paid',
          paid_date: paid_at || new Date().toISOString(),
          payment_method: payment_method || payment_channel || 'xendit',
          reference_number: invoice_id || invoice_url,
          receipt_url: invoice_url || null
        })
        .eq('id', payment_id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
      }

      console.log('Payment updated successfully:', data);
    } else if (status === 'EXPIRED' || status === 'FAILED') {
      // Handle failed/expired payments
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      await supabase
        .from('payments')
        .update({
          payment_status: 'failed',
          notes: `Payment ${status.toLowerCase()} via Xendit`
        })
        .eq('id', payment_id);
    }

    return NextResponse.json({ received: true, payment_id });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' }, 
      { status: 500 }
    );
  }
}

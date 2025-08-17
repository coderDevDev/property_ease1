import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const payload = await req.json();
  const {
    external_id,
    status,
    paid_at,
    payment_method,
    payment_channel,
    invoice_url,
    payment_link
  } = payload;

  if (status === 'PAID') {
    const supabase = createServerSupabaseClient();
    await supabase
      .from('payments')
      .update({
        payment_status: 'paid',
        paid_date: paid_at || new Date().toISOString(),
        payment_method: payment_method || payment_channel || 'gcash',
        reference_number: invoice_url,
        receipt_url: payment_link || null
      })
      .eq('id', external_id);
  }

  return NextResponse.json({ received: true });
}

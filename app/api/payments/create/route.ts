import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-static';
console.log({ dex: process.env.XENDIT_SECRET_KEY });
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    tenant_id,
    property_id,
    amount,
    payment_type,
    payment_method,
    due_date,
    description,
    created_by,
    sendXenditLink
  } = body;

  const supabase = createServerSupabaseClient();

  try {
    // 1. Create payment in Supabase (status: pending)
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([
        {
          tenant_id,
          property_id,
          amount,
          payment_type,
          payment_method,
          due_date,
          notes: description,
          created_by,
          payment_status: 'pending'
        }
      ])
      .select('*')
      .single();
    if (error) throw error;

    let xenditInvoiceUrl = null;
    // 2. If requested, create Xendit invoice

    console.log({ dex: process.env.XENDIT_SECRET_KEY });
    if (sendXenditLink) {
      if (!process.env.XENDIT_SECRET_KEY) {
        return NextResponse.json(
          {
            success: false,
            message: 'XENDIT_SECRET_KEY is not set in environment',
            data: null
          },
          { status: 500 }
        );
      }

      console.log({ dex: process.env.XENDIT_SECRET_KEY });
      const xenditRes = await fetch('https://api.xendit.co/v2/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Basic ' +
            Buffer.from(process.env.XENDIT_SECRET_KEY + ':').toString('base64')
        },
        body: JSON.stringify({
          external_id: payment.id,
          payer_email: undefined, // Optionally set tenant email
          description: description || 'Property Payment',
          amount: Math.round(Number(amount)),
          currency: 'PHP',
          success_redirect_url: `${process.env.NEXT_PUBLIC_XENDIT_SUCCESS_URL}/${tenant_id}`,
          payment_method: 
        })
      });
      const xenditData = await xenditRes.json();
      if (!xenditRes.ok || !xenditData.invoice_url) {
        console.error('Xendit API error:', xenditData);
        return NextResponse.json(
          {
            success: false,
            message: xenditData.message || 'Failed to create Xendit invoice',
            data: payment,
            xenditError: xenditData
          },
          { status: 500 }
        );
      }
      xenditInvoiceUrl = xenditData.invoice_url;
      // Update payment with Xendit invoice URL
      await supabase
        .from('payments')
        .update({ reference_number: xenditInvoiceUrl })
        .eq('id', payment.id);
    }

    // 3. Return the created payment and Xendit link
    return NextResponse.json({
      success: true,
      data: {
        ...payment,
        reference_number: xenditInvoiceUrl || payment.reference_number
      },
      xenditInvoiceUrl
    });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || 'Failed to create payment',
        data: null
      },
      { status: 500 }
    );
  }
}

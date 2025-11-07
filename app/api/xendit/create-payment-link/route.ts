import { NextRequest, NextResponse } from 'next/server';


export const dynamic = 'force-static';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, description, external_id, customer_email, customer_name } =
      body;

    // Xendit API configuration
    const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

    console.log({ XENDIT_SECRET_KEY });
    const XENDIT_API_URL = 'https://api.xendit.co/v2/invoices';

    if (!XENDIT_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Xendit secret key not configured' },
        { status: 500 }
      );
    }

    // Create payment link via Xendit API
    const xenditResponse = await fetch(XENDIT_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(XENDIT_SECRET_KEY + ':').toString(
          'base64'
        )}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_id: external_id,
        amount: amount,
        description: description,
        invoice_duration: 86400, // 24 hours
        customer: {
          email: customer_email,
          given_names: customer_name
        },
        customer_notification_preference: {
          invoice_created: ['email'],
          invoice_reminder: ['email'],
          invoice_paid: ['email']
        },
        success_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/tenant/dashboard/payments`,
        failure_redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/tenant/dashboard/payments`,
        currency: 'PHP',
        payment_methods: ['CREDIT_CARD', 'GCASH', 'PAYMAYA', 'BANK_TRANSFER']
      })
    });

    if (!xenditResponse.ok) {
      const errorData = await xenditResponse.json();
      console.error('Xendit API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create Xendit payment link' },
        { status: 500 }
      );
    }

    const xenditData = await xenditResponse.json();

    return NextResponse.json({
      invoice_url: xenditData.invoice_url,
      invoice_id: xenditData.id,
      external_id: xenditData.external_id
    });
  } catch (error) {
    console.error('Xendit payment link creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

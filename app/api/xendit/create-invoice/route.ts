import { NextRequest, NextResponse } from 'next/server';


export const dynamic = 'force-static';
/**
 * Xendit Create Invoice API Route
 * Creates a payment invoice and returns the payment URL
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      payment_id,
      amount,
      payment_method,
      description,
      customer_email,
      customer_name,
      late_fee
    } = body;

    // Validate required fields
    if (!payment_id || !amount || !payment_method || !customer_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get Xendit API key from environment
    const xenditApiKey = process.env.XENDIT_SECRET_KEY;

    if (!xenditApiKey) {
      console.error('XENDIT_API_KEY not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Get base URL (fallback to localhost for development)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // Prepare invoice data
    const invoiceData = {
      external_id: `payment_${payment_id}_${Date.now()}`,
      amount: amount,
      payer_email: customer_email,
      description: description || 'Property Payment',
      invoice_duration: 86400, // 24 hours
      success_redirect_url: `${baseUrl}/tenant/dashboard/payments?payment=success&payment_id=${payment_id}`,
      failure_redirect_url: `${baseUrl}/tenant/dashboard/payments?payment=failed&payment_id=${payment_id}`,
      currency: 'PHP',
      items: [
        {
          name: description || 'Property Payment',
          quantity: 1,
          price: amount,
          category: 'Property Rental'
        }
      ],
      customer: {
        given_names: customer_name,
        email: customer_email
      },
      customer_notification_preference: {
        invoice_created: ['email'],
        invoice_reminder: ['email'],
        invoice_paid: ['email']
      },
      fees:
        late_fee > 0
          ? [
              {
                type: 'Late Fee',
                value: late_fee
              }
            ]
          : [],
      payment_method:['GCASH']
    };

    // Call Xendit API to create invoice
    const xenditResponse = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(xenditApiKey + ':').toString(
          'base64'
        )}`
      },
      body: JSON.stringify(invoiceData)
    });

    if (!xenditResponse.ok) {
      const errorData = await xenditResponse.json();
      console.error('Xendit API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create invoice with payment gateway' },
        { status: xenditResponse.status }
      );
    }

    const invoice = await xenditResponse.json();

    // Return the invoice URL to redirect user
    return NextResponse.json({
      success: true,
      invoice_id: invoice.id,
      invoice_url: invoice.invoice_url,
      external_id: invoice.external_id,
      amount: invoice.amount,
      status: invoice.status
    });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

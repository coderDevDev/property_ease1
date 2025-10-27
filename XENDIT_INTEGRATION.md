# Xendit Payment Integration

This document describes the Xendit payment integration implemented in the PropertyEase application.

## Features

- **Payment Link Generation**: Create secure payment links for tenants
- **Multiple Payment Methods**: Support for GCash, Maya, Bank Transfer, and Credit Cards
- **Automatic Notifications**: Email notifications for payment status updates
- **Secure Processing**: All payments processed through Xendit's secure infrastructure

## Setup

### 1. Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Xendit Configuration
XENDIT_SECRET_KEY=your_xendit_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Xendit Account Setup

1. Create a Xendit account at [https://xendit.co](https://xendit.co)
2. Get your secret key from the Xendit dashboard
3. Configure webhook endpoints for payment status updates (optional)

## Usage

### Owner Dashboard

1. Navigate to `/owner/dashboard/payments`
2. Click "Create Payment"
3. Fill in payment details
4. Check "Send Xendit Payment Link" checkbox
5. Submit the form

### Tenant Experience

1. Tenants receive payment links via email or can access them from their dashboard
2. Click the payment link to open Xendit's secure payment page
3. Choose payment method (GCash, Maya, Bank Transfer, Credit Card)
4. Complete payment securely

## API Endpoints

### Create Payment Link

**POST** `/api/xendit/create-payment-link`

```json
{
  "amount": 5000,
  "description": "Monthly rent payment",
  "external_id": "payment_123456789",
  "customer_email": "tenant@example.com",
  "customer_name": "John Doe"
}
```

**Response:**

```json
{
  "invoice_url": "https://checkout.xendit.co/web/...",
  "invoice_id": "inv_123456789",
  "external_id": "payment_123456789"
}
```

## Payment Methods Supported

- **GCash**: Mobile wallet payments
- **Maya**: Mobile wallet payments
- **Bank Transfer**: Direct bank transfers
- **Credit Card**: Visa, Mastercard, JCB

## Security Features

- All payment data encrypted in transit
- PCI DSS compliant processing
- Secure tokenization for sensitive data
- Fraud detection and prevention

## Error Handling

The integration includes comprehensive error handling:

- Network failures gracefully handled
- Payment creation continues even if Xendit fails
- User-friendly error messages
- Detailed logging for debugging

## Testing

Use Xendit's test environment for development:

- Test API keys start with `xnd_public_development_`
- Test payments don't process real money
- Use test card numbers provided by Xendit

## Support

For issues with the Xendit integration:

1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Ensure Xendit account is properly configured
4. Contact Xendit support for API-related issues


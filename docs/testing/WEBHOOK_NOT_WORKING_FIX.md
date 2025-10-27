# Webhook Not Working - Payment Status Still Pending

**Issue**: Payment completed in Xendit but payment_status still "pending" in database  
**Date**: October 26, 2025  
**Status**: 🔴 Critical

---

## Why Webhooks Don't Work in Development

### Problem:
Xendit webhooks **cannot reach localhost** because:
- Xendit servers are on the internet
- Your localhost (127.0.0.1) is not accessible from outside
- Webhook URL like `http://localhost:3000/api/xendit/webhook` cannot be reached

### Solution Options:

1. **Use ngrok** (Temporary tunnel)
2. **Deploy to production** (Recommended)
3. **Manual payment confirmation** (Development workaround)
4. **Use Xendit test mode with webhook simulation**

---

## Quick Fix: Manual Payment Confirmation

Since webhooks don't work in development, manually update the payment:

### Step 1: Find the Payment ID

```sql
-- Find the payment that was just paid
SELECT id, payment_type, amount, payment_status, created_at
FROM payments
WHERE payment_status = 'pending'
  AND tenant_id = 'YOUR_TENANT_ID'
ORDER BY created_at DESC
LIMIT 5;
```

### Step 2: Manually Mark as Paid

```sql
-- Update the payment to 'paid'
UPDATE payments
SET 
  payment_status = 'paid',
  paid_date = NOW(),
  payment_method = 'GCASH',
  reference_number = 'manual-confirmation-dev',
  notes = 'Manually confirmed - Development mode'
WHERE id = 'YOUR_PAYMENT_ID';
```

### Step 3: Verify Update

```sql
SELECT 
  id,
  payment_type,
  amount,
  payment_status,
  paid_date,
  payment_method
FROM payments
WHERE id = 'YOUR_PAYMENT_ID';
```

**Expected Result:**
```
payment_status: paid ✅
paid_date: 2025-10-26 07:35:00 ✅
payment_method: GCASH ✅
```

---

## Solution 1: Use ngrok (For Development Testing)

### Install ngrok:
```bash
# Download from https://ngrok.com/download
# Or install via npm
npm install -g ngrok
```

### Start ngrok tunnel:
```bash
# Start your Next.js app
npm run dev

# In another terminal, start ngrok
ngrok http 3000
```

### Configure Xendit Webhook:
```
1. ngrok will give you a URL like: https://abc123.ngrok.io
2. Go to Xendit Dashboard → Settings → Webhooks
3. Set webhook URL: https://abc123.ngrok.io/api/xendit/webhook
4. Save settings
```

### Test Payment:
```
1. Make a payment via Xendit
2. Xendit will send webhook to ngrok URL
3. ngrok forwards to your localhost:3000
4. Webhook updates database ✅
```

---

## Solution 2: Deploy to Production (Recommended)

### Deploy to Vercel/Netlify:
```bash
# Deploy your app
vercel deploy --prod
# or
netlify deploy --prod
```

### Configure Xendit Webhook:
```
Webhook URL: https://your-domain.com/api/xendit/webhook
```

### Benefits:
- ✅ Webhooks work automatically
- ✅ Real-time payment updates
- ✅ No manual intervention needed

---

## Solution 3: Create Manual Confirmation UI

Let me create a development-only manual confirmation feature:

### Add Manual Confirmation Button (Dev Only)

**File**: `app/tenant/dashboard/payments/page.tsx`

```typescript
// Add this function (only for development)
const handleManualConfirm = async (paymentId: string) => {
  if (process.env.NODE_ENV !== 'development') {
    toast.error('This feature is only available in development');
    return;
  }

  const confirmed = confirm(
    'Manually mark this payment as paid? (Development only)'
  );
  
  if (!confirmed) return;

  try {
    const { error } = await supabase
      .from('payments')
      .update({
        payment_status: 'paid',
        paid_date: new Date().toISOString(),
        payment_method: 'MANUAL_DEV',
        reference_number: 'manual-dev-' + Date.now(),
        notes: 'Manually confirmed in development mode'
      })
      .eq('id', paymentId);

    if (error) throw error;

    toast.success('Payment marked as paid!');
    loadPayments(); // Reload payments
  } catch (error) {
    console.error('Manual confirm error:', error);
    toast.error('Failed to confirm payment');
  }
};
```

---

## Solution 4: Xendit Webhook Simulator

### Use Xendit Dashboard:
```
1. Go to Xendit Dashboard
2. Find your invoice
3. Click "Simulate Webhook"
4. Select event: "invoice.paid"
5. Xendit will send webhook to your configured URL
```

**Note**: This only works if your webhook URL is publicly accessible (ngrok or production).

---

## Debugging Webhook Issues

### Check 1: Webhook URL Configured?

```
Go to Xendit Dashboard → Settings → Webhooks
Check if webhook URL is set correctly
```

### Check 2: Webhook Logs

```
Xendit Dashboard → Webhooks → Logs
Check if webhook was sent
Check response status (200 = success, 4xx/5xx = error)
```

### Check 3: Server Logs

```bash
# Check your Next.js console for:
"Xendit Webhook Payload: {...}"
"Payment updated successfully: {...}"

# If you don't see these logs, webhook didn't reach your server
```

### Check 4: Environment Variables

```env
# Make sure these are set:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
XENDIT_SECRET_KEY=xnd_development_...
```

---

## Common Issues & Solutions

### Issue 1: "Invalid external_id format"

**Error in webhook logs:**
```
Invalid external_id format: undefined
```

**Solution:**
The `external_id` is not being passed correctly. Check create-invoice endpoint:
```typescript
external_id: `payment_${payment_id}_${Date.now()}`
```

---

### Issue 2: "Database update failed"

**Error in webhook logs:**
```
Supabase update error: {...}
```

**Solution:**
Check if SUPABASE_SERVICE_ROLE_KEY is set correctly:
```bash
echo $SUPABASE_SERVICE_ROLE_KEY
```

---

### Issue 3: Webhook not reaching server

**Symptoms:**
- No logs in console
- Payment stays pending
- Xendit shows webhook sent but got no response

**Solution:**
- Use ngrok for development
- Or deploy to production
- Or manually confirm payments

---

## Recommended Development Workflow

### For Development (localhost):

```
1. Make payment via Xendit ✅
2. Payment completes in Xendit ✅
3. Webhook won't reach localhost ❌
4. Manually confirm payment in database ✅
   OR
5. Use ngrok tunnel ✅
```

### For Production:

```
1. Make payment via Xendit ✅
2. Payment completes in Xendit ✅
3. Webhook reaches server ✅
4. Database updated automatically ✅
```

---

## Quick Manual Confirmation Script

Create this file for easy manual confirmation:

**File**: `scripts/confirmPayment.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function confirmPayment(paymentId: string) {
  const { data, error } = await supabase
    .from('payments')
    .update({
      payment_status: 'paid',
      paid_date: new Date().toISOString(),
      payment_method: 'GCASH',
      reference_number: 'manual-dev-' + Date.now(),
      notes: 'Manually confirmed - Development'
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Payment confirmed:', data);
  }
}

// Usage: ts-node scripts/confirmPayment.ts <payment-id>
const paymentId = process.argv[2];
if (paymentId) {
  confirmPayment(paymentId);
} else {
  console.log('Usage: ts-node scripts/confirmPayment.ts <payment-id>');
}
```

**Run it:**
```bash
npx ts-node scripts/confirmPayment.ts abc-123-payment-id
```

---

## Testing Checklist

### ✅ Development Testing:
- [ ] Payment redirects to Xendit
- [ ] Payment completes in Xendit
- [ ] Manually confirm payment in database
- [ ] Verify payment status updated
- [ ] Verify tenant sees "paid" status

### ✅ Production Testing (with ngrok or deployed):
- [ ] Configure webhook URL in Xendit
- [ ] Make test payment
- [ ] Check webhook logs in Xendit
- [ ] Check server logs for webhook received
- [ ] Verify database updated automatically
- [ ] Verify tenant sees "paid" status

---

## Summary

**Why payment_status is still pending:**
- ✅ Xendit payment completed successfully
- ❌ Webhook cannot reach localhost
- ❌ Database not updated automatically

**Solutions:**
1. **Quick**: Manually update database (SQL above)
2. **Better**: Use ngrok for development
3. **Best**: Deploy to production

**For now, use the manual SQL update to mark payments as paid in development!**

---

**Status**: ⚠️ Expected behavior in development  
**Workaround**: Manual confirmation  
**Production**: Will work automatically with proper webhook URL

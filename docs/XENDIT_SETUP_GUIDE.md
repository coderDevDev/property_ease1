# Xendit Integration Setup Guide
## Complete Setup for Payment Processing

---

## ✅ **What's Already Built:**

1. ✅ Frontend payment dialog
2. ✅ API route: `/api/xendit/create-invoice`
3. ✅ Webhook handler: `/api/xendit/webhook`
4. ✅ Payment calculations (including late fees)

---

## 🔧 **Required Setup Steps:**

### **Step 1: Get Xendit API Keys**

1. Go to [https://dashboard.xendit.co](https://dashboard.xendit.co)
2. Sign up or login
3. Navigate to **Settings → API Keys**
4. Copy your **Secret API Key** (starts with `xnd_`)

---

### **Step 2: Add Environment Variables**

Add these to your `.env.local` file:

```bash
# Xendit Configuration
XENDIT_API_KEY=xnd_development_your_secret_key_here

# Supabase Service Role Key (for webhook)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Base URL for redirects
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Where to find these:**

**XENDIT_API_KEY:**
- Xendit Dashboard → Settings → API Keys → Secret Key

**SUPABASE_SERVICE_ROLE_KEY:**
- Supabase Dashboard → Settings → API → service_role key (⚠️ Keep this secret!)

**NEXT_PUBLIC_BASE_URL:**
- Development: `http://localhost:3000`
- Production: `https://your domain.com`

---

### **Step 3: Test Payment Flow**

**Development Testing (No real money):**

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Login as tenant
3. Go to Payments page
4. Click "Pay Now" on any payment
5. Select payment method
6. Click "Proceed to Payment"
7. You should be redirected to Xendit payment page

**⚠️ Note:** In development mode, use Xendit test credentials

---

### **Step 4: Setup Webhook (Production)**

1. In Xendit Dashboard, go to **Settings → Webhooks**
2. Add new webhook URL:
   ```
   https://yourdomain.com/api/xendit/webhook
   ```
3. Select events:
   - ✅ Invoice Paid
   - ✅ Invoice Expired
   - ✅ Invoice Failed

---

## 💡 **How It Works:**

### **Payment Creation Flow:**
```
1. User clicks "Pay Now"
   ↓
2. Frontend calls: /api/xendit/create-invoice
   ↓
3. Backend creates Xendit invoice with:
   - Amount (including late fees)
   - Customer info
   - Success/failure redirect URLs
   ↓
4. Xendit returns invoice_url
   ↓
5. User redirected to Xendit payment page
   ↓
6. User completes payment (GCash, Maya, etc.)
   ↓
7. Xendit sends webhook to: /api/xendit/webhook
   ↓
8. Webhook updates payment status to 'paid'
   ↓
9. User redirected back to payments page
```

---

## 🧪 **Testing Checklist:**

### **Local Testing:**
- [ ] Environment variables added to `.env.local`
- [ ] Dev server running
- [ ] Can click "Pay Now" without errors
- [ ] Redirects to Xendit page
- [ ] Payment page shows correct amount
- [ ] Late fees included in total

### **Webhook Testing:**
- [ ] Webhook URL configured in Xendit
- [ ] Payment status updates after payment
- [ ] Receipt URL saved
- [ ] Payment shows as "Paid" in UI

---

## 🐛 **Troubleshooting:**

### **Error: "Payment gateway not configured"**
```
Solution: Add XENDIT_API_KEY to .env.local
```

### **Error: "Failed to create payment link"**
```
Check:
1. XENDIT_API_KEY is correct
2. No typos in environment variable name
3. Restart dev server after adding .env variables
```

### **Webhook not updating payment status:**
```
Check:
1. SUPABASE_SERVICE_ROLE_KEY is set
2. Webhook URL is correct in Xendit dashboard
3. Check server logs for webhook errors
```

### **Payment shows wrong amount:**
```
Check:
1. Late fee calculation is correct
2. Amount + late_fee = total shown
```

---

## 📝 **Payment Methods Supported:**

Via Xendit, your users can pay with:
- 💙 GCash
- 💚 Maya (PayMaya)
- 💳 Credit/Debit Cards (Visa, Mastercard)
- 🏦 Bank Transfers (BPI, BDO, etc.)
- 🏪 Over-the-counter (7-Eleven, etc.)

---

## 🔒 **Security Best Practices:**

1. ✅ **Never commit** `.env.local` to git
2. ✅ **Use service_role key** only in backend/webhooks
3. ✅ **Validate webhook** signatures in production
4. ✅ **Use HTTPS** in production
5. ✅ **Store API keys** securely

---

## 💰 **Xendit Fees:**

**Standard Rates (Philippines):**
- GCash: 2.5% + ₱10
- Maya: 2.5% + ₱10
- Cards: 3.5% + ₱15
- Bank Transfer: Free for customers
- Over-the-counter: ₱15 - ₱25

**Note:** Check Xendit dashboard for your actual rates

---

## 🚀 **Going Live:**

### **Production Checklist:**

1. **Switch to Production API Keys:**
   ```bash
   XENDIT_API_KEY=xnd_production_your_key_here
   ```

2. **Update Base URL:**
   ```bash
   NEXT_PUBLIC_BASE_URL=https://yourdomain.com
   ```

3. **Setup Webhook URL:**
   ```
   https://yourdomain.com/api/xendit/webhook
   ```

4. **Test with Small Amount:**
   - Create test payment
   - Pay with real money
   - Verify status updates
   - Check webhook logs

5. **Monitor:**
   - Xendit Dashboard → Transactions
   - Check for failed payments
   - Monitor webhook success rate

---

## 📞 **Support:**

**Xendit Support:**
- Dashboard: [https://dashboard.xendit.co](https://dashboard.xendit.co)
- Docs: [https://developers.xendit.co](https://developers.xendit.co)
- Email: support@xendit.co

**Integration Issues:**
- Check server logs
- Check browser console
- Check Xendit webhook logs

---

## 🎉 **You're Ready!**

Once you add the environment variables:
1. Restart your dev server
2. Try making a payment
3. It should work! 🎊

---

**Last Updated:** October 21, 2025  
**Status:** Ready for Configuration  
**Next Step:** Add environment variables and test!

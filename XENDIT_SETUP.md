# 🚀 Quick Xendit Setup

## ✅ What's Done:
- Frontend payment UI ✅
- API routes created ✅
- Webhook handler fixed ✅

## 🔧 What You Need to Do:

### **Step 1: Add to `.env.local` file:**

```bash
# Xendit API Key
XENDIT_API_KEY=xnd_development_your_key_here

# Supabase Service Role (for webhook)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### **Step 2: Get Xendit API Key**
1. Go to https://dashboard.xendit.co
2. Sign up (free)
3. Settings → API Keys
4. Copy **Secret Key**

### **Step 3: Get Supabase Service Role Key**
1. Supabase Dashboard
2. Settings → API
3. Copy `service_role` key (keep secret!)

### **Step 4: Restart Server**
```bash
npm run dev
```

### **Step 5: Test Payment**
1. Login as tenant
2. Go to Payments
3. Click "Pay Now"
4. Should redirect to Xendit payment page!

---

## 🎉 That's It!

Once you add these 3 environment variables and restart, payments will work!

**Full guide:** See `docs/XENDIT_SETUP_GUIDE.md`

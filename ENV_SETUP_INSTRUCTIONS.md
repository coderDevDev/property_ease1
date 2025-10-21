# ✅ Environment Variables Setup

## Add these to your `.env.local` file:

```bash
# Xendit Configuration
XENDIT_API_KEY=xnd_development_EGKS8hYOXG4ANLtUYhdNHHj2QyS2FiZBSSsvXr2xFg3JZ9VxtGRM7GBkHsaXxi

# Supabase Configuration
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Application URLs
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 🔒 **IMPORTANT: Never Commit API Keys to Git!**

Make sure `.env.local` is in your `.gitignore` file.

## 📝 **After Adding Variables:**

1. Save the `.env.local` file
2. Restart your dev server:
   ```bash
   npm run dev
   ```
3. Test payment flow
4. Redirects should work correctly now!

---

## ✅ **Current Status:**

- ✅ Payment creation working
- ✅ Xendit integration working
- ✅ Redirect URLs fixed
- ⏳ Need to add variables to .env.local properly

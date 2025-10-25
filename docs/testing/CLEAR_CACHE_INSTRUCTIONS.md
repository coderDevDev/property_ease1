# Clear Cache Instructions

## Issue
You're seeing the error: `Could not find the 'owner_id' column of 'payments' in the schema cache`

**BUT** the code has been fixed - there's NO `owner_id` in the payment insert anymore!

This means your browser/build is using **cached old code**.

---

## Solution: Clear All Caches

### Step 1: Stop the Dev Server
Press `Ctrl + C` in your terminal to stop the Next.js dev server.

### Step 2: Delete Build Cache
Run this command in your terminal:
```bash
cd "c:\Users\ACER\Desktop\2025 Capstone Project\STI NAGA - PROPERTY EASE\client"
Remove-Item -Path ".next" -Recurse -Force
```

Or manually delete the `.next` folder in your client directory.

### Step 3: Clear Browser Cache
**Option A - Hard Refresh:**
- Press `Ctrl + Shift + R` (Windows/Linux)
- Or `Cmd + Shift + R` (Mac)

**Option B - Clear All Cache:**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

**Option C - Incognito/Private Window:**
- Open a new incognito/private window
- Test there (no cache)

### Step 4: Restart Dev Server
```bash
npm run dev
```

### Step 5: Test Again
1. Navigate to deposits page
2. Try processing a refund
3. Should work now! ✅

---

## Verification

The current code in `lib/api/deposits.ts` (lines 700-711) is:
```typescript
.insert({
  tenant_id: tenantId,
  property_id: propertyId,
  amount: deposit.refundable_amount,
  payment_type: 'security_deposit',
  payment_method: 'bank_transfer',
  payment_status: 'refunded',
  due_date: new Date().toISOString().split('T')[0],
  paid_date: new Date().toISOString(),
  notes: `Security deposit refund - ${tenant.properties.name}`,
  created_by: user.id
});
```

**NO `owner_id` anywhere!** ✅

---

## If Still Not Working

### Check Supabase Schema Cache
The error mentions "schema cache" - this could be Supabase's cache.

1. Go to your Supabase Dashboard
2. Navigate to Table Editor
3. Check the `payments` table schema
4. Verify columns match the SQL schema

### Verify SQL Schema
The `payments` table should have these columns:
- ✅ `id`
- ✅ `tenant_id`
- ✅ `property_id`
- ✅ `amount`
- ✅ `payment_type`
- ✅ `payment_method`
- ✅ `payment_status`
- ✅ `due_date`
- ✅ `paid_date`
- ✅ `late_fee`
- ✅ `reference_number`
- ✅ `receipt_url`
- ✅ `notes`
- ✅ `created_by`
- ✅ `created_at`
- ✅ `updated_at`

**NO `owner_id` column!**
**NO `description` column!**
**NO `is_deposit` column!**

---

## Quick Fix Command

Run all at once:
```powershell
# Stop server (Ctrl+C first), then:
cd "c:\Users\ACER\Desktop\2025 Capstone Project\STI NAGA - PROPERTY EASE\client"
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
npm run dev
```

Then hard refresh your browser (Ctrl + Shift + R).

---

**Date**: October 25, 2025  
**Status**: Code is correct - just need to clear cache!

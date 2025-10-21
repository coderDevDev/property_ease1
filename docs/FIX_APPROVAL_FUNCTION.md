# 🔧 Fix: Approval Function Error

## ⚠️ **Error:**
```
Could not find the function public.approve_rental_application(application_id, lease_duration_months) in the schema cache
```

**Reason:** The database function doesn't have the `lease_duration_months` parameter yet.

---

## ✅ **Solution: Update Database Function**

### **Step 1: Open Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** (left sidebar)

---

### **Step 2: Run the SQL Update**

1. Click **New Query**
2. Copy the entire contents of `database/UPDATE_APPROVE_FUNCTION.sql`
3. Paste into SQL Editor
4. Click **Run** or press `Ctrl+Enter`

**You should see:** ✅ Success message

---

### **Step 3: Verify Function Updated**

Run this query to check:

```sql
-- Check if function exists with correct parameters
SELECT 
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'approve_rental_application';
```

**Expected result:**
```
function_name: approve_rental_application
parameters: application_id uuid, lease_duration_months integer DEFAULT 12
```

---

### **Step 4: Test the Approval Flow**

1. Go to `/owner/dashboard/applications`
2. Click **Approve** on a pending application
3. Select lease duration (6, 12, or 24 months)
4. Click **Approve & Create Lease**

**Should work now!** ✅

---

## 🚀 **What the Updated Function Does:**

```
Input:
├─ application_id: UUID (required)
└─ lease_duration_months: INTEGER (default: 12)

Process:
1. Validates application exists & is pending
2. Gets property rent amount
3. Calculates lease end date (start + duration)
4. Creates tenant record
5. Generates X monthly payments (based on duration)
6. Updates application to 'approved'
7. Updates property occupied_units

Output:
├─ success: TRUE/FALSE
├─ message: Success/Error message
└─ tenant_id: UUID of created tenant
```

---

## 📋 **Payment Generation Logic:**

```javascript
// Example: 12-month lease starting Oct 30, 2025
Move-in Date: Oct 30, 2025
Lease Duration: 12 months
Payment Due Day: 5th of each month

Generated Payments:
├─ Payment 1: Nov 5, 2025 - ₱5,000 (Month 1)
├─ Payment 2: Dec 5, 2025 - ₱5,000 (Month 2)
├─ Payment 3: Jan 5, 2026 - ₱5,000 (Month 3)
├─ ... (9 more payments)
└─ Payment 12: Oct 5, 2026 - ₱5,000 (Month 12)

Lease End: Oct 30, 2026
```

---

## 🛠️ **Alternative: Quick Temporary Fix**

If you can't update the database right now, temporarily remove the parameter:

**File:** `app/owner/dashboard/applications/page.tsx`

**Change line 217:**

```typescript
// FROM (with parameter):
const { data: result, error: rpcError } = await supabase.rpc(
  actionType === 'approve'
    ? 'approve_rental_application'
    : 'reject_rental_application',
  {
    application_id: selectedApplication.id,
    ...(actionType === 'approve' ? { lease_duration_months: leaseDuration } : {}), // ← Remove this
    ...(actionType === 'reject' ? { rejection_reason: actionNote } : {})
  }
);

// TO (without parameter - uses default 12 months):
const { data: result, error: rpcError } = await supabase.rpc(
  actionType === 'approve'
    ? 'approve_rental_application'
    : 'reject_rental_application',
  {
    application_id: selectedApplication.id,
    ...(actionType === 'reject' ? { rejection_reason: actionNote } : {})
  }
);
```

**This will make it work but always use 12 months.** ⚠️

---

## ✅ **Recommended: Update Database Function**

**Why?**
- ✅ Owner can choose lease duration
- ✅ Flexible (6, 12, 24 months, etc.)
- ✅ Auto-generates correct # of payments
- ✅ Better user experience

**Time needed:** 2 minutes

---

## 🎯 **Summary:**

**Problem:** Database function missing `lease_duration_months` parameter

**Solution:** Run `UPDATE_APPROVE_FUNCTION.sql` in Supabase

**Result:** Owner can choose lease duration, system generates correct payments

---

**Go to Supabase → SQL Editor → Run the SQL → Done!** 🚀

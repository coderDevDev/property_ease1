# Utility Payment Sync Fix

**Date**: October 26, 2025  
**Issue**: Utility bill shows PENDING even after tenant paid  
**Status**: ✅ Fixed with Migration 020

---

## 🔴 Problem

**Scenario**:
```
1. Owner creates utility bill → utility_bills.payment_status = 'pending'
2. System creates payment record → payments.payment_status = 'pending'
3. Tenant pays via Xendit → payments.payment_status = 'paid' ✅
4. Utility bill NOT updated → utility_bills.payment_status = 'pending' ❌
```

**Result**: 
- Tenant sees "Paid" in `/tenant/dashboard/payments` ✅
- Owner sees "PENDING" in `/owner/dashboard/utility-bills` ❌

---

## ✅ Solution: Bidirectional Sync Triggers

### Migration 020: `020_sync_utility_payment_status.sql`

Creates **two triggers** for automatic syncing:

#### 1. Payment → Utility Bill Sync
When tenant pays:
```sql
payments.payment_status = 'paid'
  ↓
Trigger updates utility_bills:
  - payment_status = 'paid'
  - paid_date = payment.paid_date
  - payment_id = payment.id
  - payment_method = payment.payment_method
```

#### 2. Utility Bill → Payment Sync (Reverse)
When owner manually marks bill as paid:
```sql
utility_bills.payment_status = 'paid'
  ↓
Trigger updates payments:
  - payment_status = 'paid'
  - paid_date = bill.paid_date
  - payment_method = bill.payment_method
```

---

## 🚀 How to Apply

### Step 1: Run Migration in Supabase SQL Editor

```sql
-- Copy and paste the entire content of:
-- supabase/migrations/020_sync_utility_payment_status.sql
```

### Step 2: Verify Triggers Created

```sql
-- Check if triggers exist
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%utility%';

-- Expected results:
-- trigger_sync_utility_bill_payment (payments table)
-- trigger_sync_payment_from_utility_bill (utility_bills table)
```

### Step 3: Check Existing Records Synced

```sql
-- Check if existing paid payments were synced
SELECT 
  ub.id,
  ub.bill_type,
  ub.payment_status as bill_status,
  p.payment_status as payment_status,
  ub.total_amount,
  p.amount
FROM utility_bills ub
JOIN payments p ON 
  p.tenant_id = ub.tenant_id 
  AND p.property_id = ub.property_id
  AND p.due_date = ub.due_date
  AND p.payment_type = 'utility'
WHERE p.payment_status = 'paid';

-- Both should show 'paid' now ✅
```

---

## 🧪 Testing

### Test 1: New Payment

```
1. Owner creates utility bill
   - utility_bills.payment_status = 'pending'
   - payments.payment_status = 'pending'

2. Tenant pays bill
   - payments.payment_status = 'paid' ✅

3. Check utility bill (should auto-update)
   - utility_bills.payment_status = 'paid' ✅
   - utility_bills.paid_date = set ✅
   - utility_bills.payment_id = set ✅
```

### Test 2: Existing Paid Payment

```
1. Check existing paid payment in /tenant/dashboard/payments
2. Go to /owner/dashboard/utility-bills
3. Should now show as "PAID" ✅
```

### Test 3: Manual Payment

```
1. Owner manually marks bill as paid in ViewBillDialog
2. Check /tenant/dashboard/payments
3. Payment should show as "paid" ✅
```

---

## 📊 How Matching Works

The trigger matches records by:
```sql
WHERE 
  tenant_id = same
  AND property_id = same
  AND due_date = same
  AND payment_type = 'utility'
  AND ABS(amount - total_amount) < 1  -- Allow ₱1 difference
  AND payment_status = 'pending'
```

---

## 🔄 Workflow After Fix

### Owner Creates Bill:
```
1. Owner → /owner/dashboard/utility-bills
2. Click "Create Bill"
3. Fill details (₱500 electricity bill)
4. System creates:
   ✅ utility_bills record (pending)
   ✅ payments record (pending)
```

### Tenant Pays:
```
1. Tenant → /tenant/dashboard/payments
2. Sees utility bill (₱500, pending)
3. Clicks "Pay Now"
4. Pays via Xendit
5. Webhook/Auto-confirm updates:
   ✅ payments.payment_status = 'paid'
6. Trigger automatically updates:
   ✅ utility_bills.payment_status = 'paid'
   ✅ utility_bills.paid_date = now
   ✅ utility_bills.payment_id = payment.id
```

### Owner Checks:
```
1. Owner → /owner/dashboard/utility-bills
2. Bill now shows "PAID" ✅
3. Can see paid_date ✅
4. Both sides synced! ✅
```

---

## 🛡️ Safety Features

### Prevents Duplicates:
- Only updates if `payment_status = 'pending'`
- Won't overwrite already paid bills

### Handles Edge Cases:
- Allows ₱1 difference in amounts (rounding)
- Matches by date, tenant, property
- Logs all sync operations

### Bidirectional:
- Payment → Bill sync
- Bill → Payment sync
- Always stays in sync

---

## 📝 Migration Details

### What It Does:

1. **Drops old triggers** (if any)
2. **Creates sync functions**:
   - `sync_utility_bill_payment_status()`
   - `sync_payment_from_utility_bill()`
3. **Creates triggers**:
   - On `payments` INSERT/UPDATE
   - On `utility_bills` UPDATE
4. **Syncs existing records**:
   - Finds all paid payments
   - Updates matching utility bills
   - Reports count

### Safe to Run:
- ✅ Non-breaking
- ✅ Idempotent (can run multiple times)
- ✅ Doesn't delete data
- ✅ Only updates pending → paid

---

## 🎯 Summary

**Before Migration**:
- ❌ Manual sync required
- ❌ Owner sees wrong status
- ❌ Confusing for both parties

**After Migration**:
- ✅ Automatic sync
- ✅ Both sides always match
- ✅ Real-time updates
- ✅ No manual work needed

---

**Status**: ✅ Ready to Deploy  
**Breaking Changes**: None  
**Required**: Yes - Critical for utility bills  
**Priority**: High

Run this migration now to fix the sync issue! 🚀

# Fix: Invalid Enum Value 'advance_rent' Error

**Error**: `invalid input value for enum payment_type: "advance_rent"`  
**Date**: October 26, 2025  
**Status**: 🔴 Critical - Blocks Application Approval

---

## Problem

When trying to approve an application, the system fails with:
```
Failed to process application: Error: Error: 
invalid input value for enum payment_type: "advance_rent"
```

**Root Cause**: The database enum type `payment_type` doesn't include `'advance_rent'` as a valid value.

---

## Solution

We need to add `'advance_rent'` to the `payment_type` enum **BEFORE** running the updated approve function.

---

## Quick Fix (Run in Supabase SQL Editor)

### Step 1: Add 'advance_rent' to Enum

**Run this FIRST:**

```sql
-- Add 'advance_rent' to the payment_type enum
ALTER TYPE payment_type ADD VALUE IF NOT EXISTS 'advance_rent';
```

### Step 2: Verify It Was Added

```sql
-- Check all enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_type')
ORDER BY enumsortorder;
```

**Expected Output:**
```
enumlabel
--------------
rent
deposit
security_deposit
utility
penalty
other
advance_rent    ← Should see this now
```

### Step 3: Now Run the Approve Function Update

After adding the enum value, run:
```sql
-- File: database/HOTFIX_APPROVE_FUNCTION.sql
-- (The full approve_rental_application function)
```

---

## Correct Order of Execution

```
1. HOTFIX_ADD_ADVANCE_RENT_ENUM.sql     ← Run FIRST
   ↓
2. HOTFIX_APPROVE_FUNCTION.sql          ← Run SECOND
   ↓
3. 017_auto_sync_deposit_balances.sql   ← Run THIRD
```

---

## Why This Happened

PostgreSQL uses **enum types** for the `payment_type` column. The enum was defined with these values:
- `rent`
- `deposit`
- `security_deposit`
- `utility`
- `penalty`
- `other`

When we tried to insert `'advance_rent'`, PostgreSQL rejected it because it wasn't in the enum definition.

---

## Alternative: Use 'deposit' Instead (Not Recommended)

If you want to avoid changing the enum, you can keep using `'deposit'`:

```sql
-- In HOTFIX_APPROVE_FUNCTION.sql, change back to:
payment_type: 'deposit'  -- Instead of 'advance_rent'
```

**Why Not Recommended:**
- Less clear terminology
- Confusing with "security deposit"
- Not aligned with RA 9653 documentation

---

## Files Created

| File | Purpose | Run Order |
|------|---------|-----------|
| `database/HOTFIX_ADD_ADVANCE_RENT_ENUM.sql` | Add enum value | 1st |
| `supabase/migrations/018_add_advance_rent_payment_type.sql` | Migration version | 1st |
| `database/HOTFIX_APPROVE_FUNCTION.sql` | Update function | 2nd |
| `supabase/migrations/017_auto_sync_deposit_balances.sql` | Auto-sync trigger | 3rd |

---

## Testing After Fix

### Test 1: Verify Enum Value
```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_type')
  AND enumlabel = 'advance_rent';
```

**Expected**: Should return 1 row with `'advance_rent'`

### Test 2: Approve Application
```
1. Go to /owner/dashboard/applications
2. Click on pending application
3. Click "Approve"
4. Set lease duration
5. Click "Approve & Create Lease"
```

**Expected**: ✅ Success - Application approved

### Test 3: Check Payment Records
```sql
SELECT payment_type, amount, due_date, notes
FROM payments
WHERE tenant_id = 'YOUR_NEW_TENANT_ID'
ORDER BY due_date;
```

**Expected Output:**
```
payment_type      | amount | due_date   | notes
------------------+--------+------------+---------------------------
advance_rent      | 10000  | 2025-01-01 | Advance rent (1 month)...
security_deposit  | 20000  | 2025-01-01 | Security deposit (2 months)...
rent              | 10000  | 2025-02-05 | Monthly rent payment...
```

---

## If You Still Get Errors

### Error: "enum value already exists"
```
This means the enum value was already added. 
You can proceed to run the approve function update.
```

### Error: "cannot add enum value in transaction block"
```sql
-- Run this outside of a transaction:
ALTER TYPE payment_type ADD VALUE 'advance_rent';

-- Don't wrap it in BEGIN/COMMIT
```

### Error: "type payment_type does not exist"
```sql
-- The enum might not exist yet. Check with:
SELECT typname FROM pg_type WHERE typname = 'payment_type';

-- If it doesn't exist, you need to create it first:
CREATE TYPE payment_type AS ENUM (
  'rent',
  'deposit',
  'security_deposit',
  'utility',
  'penalty',
  'other',
  'advance_rent'
);
```

---

## Rollback (If Needed)

You **cannot** remove an enum value in PostgreSQL once it's added. However, you can:

### Option 1: Just don't use it
```sql
-- Change back to using 'deposit' in the function
-- The enum value will remain but unused
```

### Option 2: Recreate the enum (Complex)
```sql
-- 1. Create new enum
CREATE TYPE payment_type_new AS ENUM (
  'rent',
  'deposit',
  'security_deposit',
  'utility',
  'penalty',
  'other'
);

-- 2. Update column to use new enum
ALTER TABLE payments 
  ALTER COLUMN payment_type TYPE payment_type_new 
  USING payment_type::text::payment_type_new;

-- 3. Drop old enum
DROP TYPE payment_type;

-- 4. Rename new enum
ALTER TYPE payment_type_new RENAME TO payment_type;
```

**Warning**: This is complex and risky. Not recommended for production.

---

## Summary

**Problem**: Enum doesn't include 'advance_rent'  
**Solution**: Add it with `ALTER TYPE payment_type ADD VALUE 'advance_rent'`  
**Order**: Add enum → Update function → Add trigger  

---

**Status**: ✅ Fix Ready  
**Files**: 2 SQL scripts created  
**Priority**: 🔴 Critical - Must run before approving applications

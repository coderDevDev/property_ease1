# Database Setup Verification

**Date**: October 26, 2025  
**Issue**: Error fetching owner bills - Table may not exist  
**Status**: ⚠️ Needs Migration

---

## 🔴 Current Error

```
Error fetching owner bills: {}
```

**Cause**: The `utility_bills` table doesn't exist in your database yet.

---

## ✅ Solution: Run Migrations

### Step 1: Check Which Migrations Have Been Run

**In Supabase SQL Editor**, run:

```sql
-- Check if utility_bills table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'utility_bills'
);

-- Check if deposit_balances table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'deposit_balances'
);

-- Check payment_type enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (
  SELECT oid FROM pg_type WHERE typname = 'payment_type'
)
ORDER BY enumlabel;
```

---

### Step 2: Run Missing Migrations

#### Migration 013: Utility Bills (REQUIRED)

**File**: `supabase/migrations/013_utility_bills.sql`

**Run this in Supabase SQL Editor**:
```sql
-- Copy and paste the entire content of:
-- supabase/migrations/013_utility_bills.sql
```

**This creates**:
- ✅ `utility_bills` table
- ✅ `utility_rates` table
- ✅ `utility_meter_readings` table
- ✅ RLS policies
- ✅ Triggers for auto-calculation

---

#### Migration 017: Auto-Sync Deposit Balances (REQUIRED)

**File**: `supabase/migrations/017_auto_sync_deposit_balances.sql`

**Run this in Supabase SQL Editor**:
```sql
-- Copy and paste the entire content of:
-- supabase/migrations/017_auto_sync_deposit_balances.sql
```

**This creates**:
- ✅ `deposit_balances` table
- ✅ Auto-sync trigger for security deposits

---

#### Migration 018: Add advance_rent Payment Type (REQUIRED)

**File**: `supabase/migrations/018_add_advance_rent_payment_type.sql`

**Run this in Supabase SQL Editor**:
```sql
-- Add 'advance_rent' to payment_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'advance_rent' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'payment_type'
        )
    ) THEN
        ALTER TYPE payment_type ADD VALUE 'advance_rent';
        RAISE NOTICE 'Added advance_rent to payment_type enum';
    ELSE
        RAISE NOTICE 'advance_rent already exists in payment_type enum';
    END IF;
END $$;
```

---

#### Migration 019: Remove payment_method Enum (REQUIRED)

**File**: `supabase/migrations/019_remove_payment_method_enum.sql`

**Run this in Supabase SQL Editor**:
```sql
-- Change payment_method from enum to TEXT
ALTER TABLE payments 
  ALTER COLUMN payment_method TYPE TEXT;

-- Drop the enum type if it exists
DROP TYPE IF EXISTS payment_method CASCADE;
```

---

### Step 3: Verify Migrations

**Run this verification script**:

```sql
-- Check all required tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'utility_bills') 
    THEN '✅ utility_bills exists'
    ELSE '❌ utility_bills missing'
  END as utility_bills_status,
  
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deposit_balances') 
    THEN '✅ deposit_balances exists'
    ELSE '❌ deposit_balances missing'
  END as deposit_balances_status,
  
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_enum 
      WHERE enumlabel = 'advance_rent' 
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_type')
    )
    THEN '✅ advance_rent enum exists'
    ELSE '❌ advance_rent enum missing'
  END as advance_rent_status,
  
  CASE 
    WHEN (
      SELECT data_type FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'payment_method'
    ) = 'text'
    THEN '✅ payment_method is TEXT'
    ELSE '❌ payment_method is still enum'
  END as payment_method_status;
```

**Expected Result**:
```
✅ utility_bills exists
✅ deposit_balances exists
✅ advance_rent enum exists
✅ payment_method is TEXT
```

---

## 📋 Complete Migration Checklist

### Core Tables:
- [ ] `properties` table exists
- [ ] `tenants` table exists
- [ ] `payments` table exists
- [ ] `rental_applications` table exists

### New Tables (Need Migration):
- [ ] `utility_bills` table (Migration 013)
- [ ] `utility_rates` table (Migration 013)
- [ ] `utility_meter_readings` table (Migration 013)
- [ ] `deposit_balances` table (Migration 017)

### Enums:
- [ ] `payment_type` has 'advance_rent' (Migration 018)
- [ ] `payment_method` is TEXT not enum (Migration 019)

### Triggers:
- [ ] `calculate_utility_consumption` trigger (Migration 013)
- [ ] `auto_create_deposit_balance` trigger (Migration 017)

---

## 🚀 Quick Setup Script

**Run this complete setup in Supabase SQL Editor**:

```sql
-- =====================================================
-- COMPLETE DATABASE SETUP
-- Run this if starting fresh or missing tables
-- =====================================================

-- 1. Check current state
DO $$
BEGIN
  RAISE NOTICE '=== Checking Database State ===';
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'utility_bills') THEN
    RAISE NOTICE '✅ utility_bills exists';
  ELSE
    RAISE NOTICE '❌ utility_bills missing - Run Migration 013';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'deposit_balances') THEN
    RAISE NOTICE '✅ deposit_balances exists';
  ELSE
    RAISE NOTICE '❌ deposit_balances missing - Run Migration 017';
  END IF;
END $$;

-- 2. If tables are missing, run the migrations in order:
-- - Migration 013: Utility Bills
-- - Migration 017: Deposit Balances
-- - Migration 018: Add advance_rent enum
-- - Migration 019: Remove payment_method enum
```

---

## 🧪 Test After Migration

### Test 1: Utility Bills

```sql
-- Try to create a test bill
INSERT INTO utility_bills (
  property_id,
  created_by,
  bill_type,
  billing_period_start,
  billing_period_end,
  due_date,
  total_amount
) VALUES (
  (SELECT id FROM properties LIMIT 1),
  (SELECT id FROM users WHERE role = 'owner' LIMIT 1),
  'electricity',
  CURRENT_DATE - INTERVAL '30 days',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days',
  1000
);

-- Check if it was created
SELECT * FROM utility_bills ORDER BY created_at DESC LIMIT 1;

-- Clean up test data
DELETE FROM utility_bills WHERE bill_type = 'electricity' AND total_amount = 1000;
```

---

### Test 2: Deposit Balances

```sql
-- Check if trigger exists
SELECT EXISTS (
  SELECT 1 FROM pg_trigger 
  WHERE tgname = 'auto_create_deposit_balance'
);

-- Should return: true
```

---

### Test 3: Payment Types

```sql
-- Check all payment types
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_type')
ORDER BY enumlabel;

-- Should include:
-- advance_rent
-- deposit
-- penalty
-- rent
-- security_deposit
-- utility
```

---

## 📞 If Migrations Fail

### Common Issues:

#### Issue 1: "relation already exists"
**Solution**: Table already created, skip that migration

#### Issue 2: "enum value already exists"
**Solution**: Enum already added, skip that migration

#### Issue 3: "permission denied"
**Solution**: Make sure you're using the Supabase SQL Editor with admin privileges

#### Issue 4: "foreign key constraint"
**Solution**: Run migrations in order (013 → 017 → 018 → 019)

---

## 🎯 After Migrations Complete

### Verify Everything Works:

1. **Utility Bills Page**:
   ```
   Go to: /owner/dashboard/utility-bills
   Should load without errors ✅
   ```

2. **Create Bill**:
   ```
   Click "Create Bill"
   Select property and tenant
   Should work ✅
   ```

3. **Tenant Payments**:
   ```
   Go to: /tenant/dashboard/payments
   Should show all payment types ✅
   ```

---

## 📝 Summary

**Problem**: Database tables don't exist yet  
**Solution**: Run migrations 013, 017, 018, 019  
**Time**: ~5 minutes  
**Difficulty**: Easy (copy-paste SQL)

**After migrations**:
- ✅ Utility bills will work
- ✅ Deposit balances will work
- ✅ Payment types will work
- ✅ All features functional

---

**Status**: ⚠️ Awaiting Migration  
**Next Step**: Run migrations in Supabase SQL Editor  
**Priority**: High - Required for utility bills to work

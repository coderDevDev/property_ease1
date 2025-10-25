# 🚀 Deployment Guide - Payment Features
## Quick Deployment Instructions

> **Features**: Security Deposits, Utility Bills, Advance Payments  
> **Status**: Ready to Deploy  
> **Date**: October 25, 2025

---

## ✅ **PRE-DEPLOYMENT CHECKLIST**

- [ ] Backup current database
- [ ] Review all migration files
- [ ] Test in development environment
- [ ] Verify no breaking changes
- [ ] Check all dependencies installed

---

## 📋 **STEP-BY-STEP DEPLOYMENT**

### **Step 1: Run Database Migrations**

Run these migrations **in order** in your Supabase SQL Editor:

```sql
-- 1. Security Deposits (Run first)
-- File: supabase/migrations/012_security_deposits.sql
-- Creates: deposit_balances, move_out_inspections, deposit_deductions

-- 2. Utility Bills (Run second)
-- File: supabase/migrations/013_utility_bills.sql
-- Creates: utility_bills, utility_rates, utility_meter_readings

-- 3. Advance Payments (Run third)
-- File: supabase/migrations/014_advance_payments.sql
-- Creates: advance_payments, advance_payment_allocations, payment_schedules
```

### **Step 2: Verify Tables Created**

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'deposit_balances', 
  'move_out_inspections', 
  'deposit_deductions',
  'utility_bills', 
  'utility_rates', 
  'utility_meter_readings',
  'advance_payments', 
  'advance_payment_allocations', 
  'payment_schedules'
);
-- Should return 9 rows
```

### **Step 3: Verify RLS Policies**

```sql
-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN (
  'deposit_balances', 
  'move_out_inspections', 
  'deposit_deductions',
  'utility_bills', 
  'utility_rates', 
  'utility_meter_readings',
  'advance_payments', 
  'advance_payment_allocations', 
  'payment_schedules'
);
-- Should return multiple policies
```

### **Step 4: Deploy Code**

```bash
# Build the application
npm run build

# Deploy to your hosting platform
# (Vercel, Netlify, etc.)
```

### **Step 5: Test Routes**

Visit these URLs to verify deployment:

**Owner Routes**:
- `/owner/dashboard/deposits`
- `/owner/dashboard/utility-bills`
- `/owner/dashboard/advance-payments`

**Tenant Routes**:
- `/tenant/dashboard/payments` (enhanced with new features)

---

## 🧪 **POST-DEPLOYMENT TESTING**

### **Test 1: Security Deposits**
1. Login as owner
2. Go to `/owner/dashboard/deposits`
3. Verify page loads
4. Check stats display correctly

### **Test 2: Utility Bills**
1. Login as owner
2. Go to `/owner/dashboard/utility-bills`
3. Verify page loads
4. Check stats display correctly

### **Test 3: Advance Payments**
1. Login as owner
2. Go to `/owner/dashboard/advance-payments`
3. Verify page loads
4. Check stats display correctly

### **Test 4: Tenant View**
1. Login as tenant
2. Go to `/tenant/dashboard/payments`
3. Verify all new cards display (if data exists)
4. Check existing payments still work

---

## 🔍 **VERIFICATION QUERIES**

```sql
-- Check data integrity
SELECT COUNT(*) FROM deposit_balances;
SELECT COUNT(*) FROM utility_bills;
SELECT COUNT(*) FROM advance_payments;

-- Check triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN (
  'deposit_balances', 
  'utility_bills', 
  'advance_payments'
);
```

---

## 🚨 **ROLLBACK PLAN**

If issues occur, rollback in reverse order:

```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS payment_schedules CASCADE;
DROP TABLE IF EXISTS advance_payment_allocations CASCADE;
DROP TABLE IF EXISTS advance_payments CASCADE;

DROP TABLE IF EXISTS utility_meter_readings CASCADE;
DROP TABLE IF EXISTS utility_rates CASCADE;
DROP TABLE IF EXISTS utility_bills CASCADE;

DROP TABLE IF EXISTS deposit_deductions CASCADE;
DROP TABLE IF EXISTS move_out_inspections CASCADE;
DROP TABLE IF EXISTS deposit_balances CASCADE;

-- Restore from backup
```

---

## ✅ **SUCCESS CRITERIA**

- [ ] All migrations run successfully
- [ ] All 9 tables created
- [ ] RLS policies active
- [ ] All routes accessible
- [ ] No console errors
- [ ] Existing features still work

---

## 📞 **SUPPORT**

If you encounter issues:
1. Check migration logs
2. Verify RLS policies
3. Check browser console
4. Review documentation files

---

**Deployment Time**: ~15 minutes  
**Downtime**: None (non-breaking changes)  
**Risk Level**: Low

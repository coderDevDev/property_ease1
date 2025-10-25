# 🚀 Security Deposits - Setup & Testing Guide
## Quick Start Guide

> **Date**: October 25, 2025  
> **Feature**: Security Deposits Management  
> **Status**: Ready to Test

---

## ✅ **PRE-FLIGHT CHECKLIST**

Before testing, ensure:
- [x] Migration `012_security_deposits.sql` has been run
- [x] All files created (8 new files)
- [x] Dev server is running
- [ ] Test users exist (tenant & owner)
- [ ] Test property exists
- [ ] Test lease exists

---

## 🗄️ **DATABASE SETUP**

### **Step 1: Verify Migration**

Run in Supabase SQL Editor:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('deposit_balances', 'move_out_inspections', 'deposit_deductions');

-- Should return 3 rows
```

### **Step 2: Check RLS Policies**

```sql
-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('deposit_balances', 'move_out_inspections', 'deposit_deductions');

-- Should return multiple policies
```

### **Step 3: Create Test Data** (Optional)

```sql
-- Create a test deposit balance
INSERT INTO deposit_balances (
  tenant_id,
  property_id,
  deposit_amount,
  refundable_amount,
  status
) VALUES (
  'YOUR_TENANT_ID',
  'YOUR_PROPERTY_ID',
  10000,
  10000,
  'held'
);

-- Verify
SELECT * FROM deposit_balances;
```

---

## 🧪 **TESTING WORKFLOW**

### **Test 1: Tenant View Deposit**

**Steps**:
1. Login as tenant
2. Navigate to `/tenant/dashboard/payments`
3. Scroll down - should see "Security Deposit" card
4. Verify displays:
   - ✅ Deposit amount
   - ✅ Status badge
   - ✅ Refundable amount

**Expected Result**: Deposit card visible with correct amounts

**If No Deposit Shows**:
- Check tenant has a deposit in database
- Check RLS policies allow tenant to view
- Check console for errors

---

### **Test 2: Owner View Deposits List**

**Steps**:
1. Login as owner
2. Navigate to `/owner/dashboard/deposits`
3. Should see deposits management page

**Expected Result**:
- ✅ Statistics cards (Total, Held, Refunded)
- ✅ Search bar
- ✅ List of deposits for owner's properties
- ✅ Action buttons (Inspection, View, Process Refund)

**If Page Not Found**:
- Verify file exists: `app/owner/dashboard/deposits/page.tsx`
- Check Next.js routing
- Restart dev server

---

### **Test 3: Create Move-Out Inspection**

**Steps**:
1. On deposits page, click "Inspection" button
2. Should open 3-step wizard dialog

**Step 1 - Checklist**:
- Select condition for each item (walls, flooring, etc.)
- Add inspection notes
- Click "Next: Add Deductions"

**Step 2 - Deductions**:
- Fill in item description (e.g., "Broken window")
- Enter cost (e.g., 2000)
- Select category (e.g., "Damage")
- Add notes (optional)
- Click "Add Deduction"
- Repeat for multiple deductions
- Click "Next: Review"

**Step 3 - Review**:
- Verify summary shows:
  - Original deposit amount
  - Total deductions
  - Refundable amount
- Click "Complete Inspection"

**Expected Result**:
- ✅ Success toast message
- ✅ Dialog closes
- ✅ Deposit list refreshes
- ✅ Deposit shows updated deductions

**Check Database**:
```sql
-- Check inspection created
SELECT * FROM move_out_inspections 
ORDER BY created_at DESC LIMIT 1;

-- Check deductions added
SELECT * FROM deposit_deductions 
WHERE inspection_id = 'INSPECTION_ID';

-- Check deposit balance updated
SELECT * FROM deposit_balances 
WHERE id = 'DEPOSIT_ID';
```

---

### **Test 4: Tenant View Inspection Results**

**Steps**:
1. Login as tenant (same tenant from inspection)
2. Go to `/tenant/dashboard/payments`
3. Scroll to deposit card

**Expected Result**:
- ✅ Shows "Move-Out Inspection" section
- ✅ Shows inspection date
- ✅ Shows "Deductions Applied" section
- ✅ Lists each deduction with:
  - Item description
  - Cost
  - Category
  - Notes
  - Photo count (if any)
- ✅ Shows updated refundable amount

---

### **Test 5: Tenant Dispute Deduction**

**Steps**:
1. On deposit card, find a deduction
2. Click "Dispute This Deduction" button
3. Dialog opens

**In Dialog**:
- Read the warning message
- Enter dispute reason (min 20 characters)
- Click "Submit Dispute"

**Expected Result**:
- ✅ Success toast message
- ✅ Dialog closes
- ✅ Deduction shows "Disputed" badge
- ✅ Shows dispute reason

**Check Database**:
```sql
SELECT * FROM deposit_deductions 
WHERE disputed = true;
```

---

### **Test 6: Owner Process Refund**

**Steps**:
1. Login as owner
2. Go to `/owner/dashboard/deposits`
3. Find deposit with refundable amount > 0
4. Click "Process Refund" button
5. Confirm in dialog

**Expected Result**:
- ✅ Success toast with refund amount
- ✅ Deposit status changes to "Fully Refunded"
- ✅ Deposit card updates

**Check Database**:
```sql
-- Check deposit status updated
SELECT * FROM deposit_balances 
WHERE status = 'fully_refunded';

-- Check refund payment created
SELECT * FROM payments 
WHERE payment_type = 'deposit_refund'
ORDER BY created_at DESC LIMIT 1;
```

---

### **Test 7: Owner View Inspection Details**

**Steps**:
1. On deposits page, click "View" button
2. Dialog opens showing inspection details

**Expected Result**:
- ✅ Shows inspection date and status
- ✅ Shows property condition checklist
- ✅ Shows inspection notes
- ✅ Shows all deductions with details
- ✅ Shows disputed deductions (if any)
- ✅ Shows financial summary

---

## 🔍 **TROUBLESHOOTING**

### **Issue: Deposit Card Not Showing**

**Possible Causes**:
1. No deposit exists in database
2. RLS policy blocking access
3. Tenant ID mismatch

**Solution**:
```sql
-- Check if deposit exists for tenant
SELECT * FROM deposit_balances 
WHERE tenant_id IN (
  SELECT id FROM tenants WHERE user_id = 'USER_ID'
);

-- Check RLS policy
SET ROLE authenticated;
SELECT * FROM deposit_balances;
```

---

### **Issue: "Cannot find module" Errors**

**Cause**: TypeScript can't resolve imports

**Solution**:
1. Restart TypeScript server in VS Code
2. Run `npm install` (if needed)
3. Check file paths are correct
4. Restart dev server

---

### **Issue: Inspection Not Saving**

**Possible Causes**:
1. User not authenticated
2. RLS policy blocking insert
3. Missing required fields

**Solution**:
- Check browser console for errors
- Check Supabase logs
- Verify user has owner role
- Check all required fields filled

---

### **Issue: Triggers Not Working**

**Symptom**: Deductions added but totals not updating

**Solution**:
```sql
-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table 
FROM information_schema.triggers 
WHERE event_object_table IN ('deposit_deductions', 'move_out_inspections');

-- Manually trigger update
UPDATE move_out_inspections 
SET updated_at = NOW() 
WHERE id = 'INSPECTION_ID';
```

---

## 📊 **TEST DATA GENERATOR**

Use this to create test data:

```sql
-- Create test deposit
INSERT INTO deposit_balances (
  tenant_id,
  property_id,
  deposit_amount,
  deductions,
  refundable_amount,
  status
) VALUES (
  (SELECT id FROM tenants LIMIT 1),
  (SELECT id FROM properties LIMIT 1),
  15000,
  0,
  15000,
  'held'
) RETURNING *;

-- Create test inspection
INSERT INTO move_out_inspections (
  tenant_id,
  property_id,
  inspector_id,
  inspection_date,
  checklist,
  total_deductions,
  refundable_amount,
  status
) VALUES (
  (SELECT id FROM tenants LIMIT 1),
  (SELECT id FROM properties LIMIT 1),
  (SELECT id FROM users WHERE role = 'owner' LIMIT 1),
  NOW(),
  '{"walls": "good", "flooring": "fair", "appliances": "good"}'::jsonb,
  0,
  15000,
  'pending'
) RETURNING *;

-- Create test deduction
INSERT INTO deposit_deductions (
  inspection_id,
  item_description,
  cost,
  category,
  notes
) VALUES (
  (SELECT id FROM move_out_inspections ORDER BY created_at DESC LIMIT 1),
  'Wall damage - hole in bedroom',
  2500,
  'Damage',
  'Repair required before new tenant moves in'
) RETURNING *;
```

---

## 🎯 **ACCEPTANCE CRITERIA**

### **Must Pass**:
- [ ] Tenant can view deposit balance
- [ ] Owner can create inspection
- [ ] Owner can add deductions
- [ ] System calculates totals correctly
- [ ] Tenant can dispute deductions
- [ ] Owner can process refunds
- [ ] No errors in console
- [ ] Existing payments still work

### **Nice to Have**:
- [ ] Smooth animations
- [ ] Fast load times (<1s)
- [ ] Mobile responsive
- [ ] Clear error messages

---

## 📝 **TESTING CHECKLIST**

Copy this checklist for testing:

```
TENANT TESTS:
[ ] Login as tenant
[ ] View payments page
[ ] See deposit card
[ ] View deposit details
[ ] View inspection results
[ ] View deductions
[ ] Dispute a deduction
[ ] See dispute confirmation

OWNER TESTS:
[ ] Login as owner
[ ] Navigate to deposits page
[ ] View deposits list
[ ] Search deposits
[ ] Create inspection - Step 1 (Checklist)
[ ] Create inspection - Step 2 (Deductions)
[ ] Create inspection - Step 3 (Review)
[ ] Complete inspection
[ ] View inspection details
[ ] Process refund
[ ] Confirm refund processed

DATABASE TESTS:
[ ] Run migration successfully
[ ] Verify tables created
[ ] Check RLS policies work
[ ] Test triggers update totals
[ ] Verify data integrity

REGRESSION TESTS:
[ ] Existing payments still work
[ ] Tenant payments page loads
[ ] Owner dashboard loads
[ ] No breaking changes
```

---

## 🚀 **DEPLOYMENT CHECKLIST**

Before deploying to production:

```
PRE-DEPLOYMENT:
[ ] All tests pass
[ ] No console errors
[ ] Database migration tested
[ ] RLS policies verified
[ ] Performance acceptable
[ ] Mobile responsive
[ ] Documentation complete

DEPLOYMENT:
[ ] Backup database
[ ] Run migration on production
[ ] Deploy code
[ ] Verify deployment
[ ] Test critical paths
[ ] Monitor for errors

POST-DEPLOYMENT:
[ ] Smoke test all features
[ ] Check error logs
[ ] Monitor performance
[ ] Gather user feedback
[ ] Document any issues
```

---

## 📞 **SUPPORT**

### **If You Need Help**:

1. **Check Documentation**:
   - `2025-10-25_SECURITY_DEPOSITS_COMPLETE.md`
   - `2025-10-25_CHANGES_LOG.md`
   - `PAYMENT_FEATURES_ROADMAP.md`

2. **Check Database**:
   - Run verification queries
   - Check RLS policies
   - Review error logs

3. **Check Code**:
   - Review `lib/api/deposits.ts`
   - Check component imports
   - Verify file paths

4. **Common Issues**:
   - Restart dev server
   - Clear browser cache
   - Check authentication
   - Verify user roles

---

## ✅ **QUICK START (TL;DR)**

```bash
# 1. Verify migration ran
# Check Supabase dashboard

# 2. Start dev server
npm run dev

# 3. Test as tenant
# Login → /tenant/dashboard/payments → See deposit card

# 4. Test as owner
# Login → /owner/dashboard/deposits → Create inspection

# 5. Done! 🎉
```

---

**Happy Testing! 🚀**

**Questions? Check the complete documentation in:**
- `2025-10-25_SECURITY_DEPOSITS_COMPLETE.md`

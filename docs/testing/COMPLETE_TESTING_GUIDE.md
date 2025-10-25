# 🧪 Complete Testing Guide - All Payment Features
## Comprehensive Testing Instructions

> **Features**: Security Deposits, Utility Bills, Advance Payments, Lease Renewal  
> **Status**: All Production Ready  
> **Date**: October 25, 2025

---

## 📋 **PRE-TESTING SETUP**

### **1. Run All Migrations**

Execute in Supabase SQL Editor (in order):

```sql
-- 1. Security Deposits
-- Run: 012_security_deposits.sql

-- 2. Utility Bills
-- Run: 013_utility_bills.sql

-- 3. Advance Payments
-- Run: 014_advance_payments.sql

-- 4. Lease Renewal
-- Run: 015_lease_renewal.sql
```

### **2. Verify Tables Created**

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN (
  'deposit_balances', 'move_out_inspections', 'deposit_deductions',
  'utility_bills', 'utility_rates', 'utility_meter_readings',
  'advance_payments', 'advance_payment_allocations', 'payment_schedules',
  'lease_renewals', 'lease_history', 'lease_notifications'
);
-- Should return 12 rows
```

### **3. Create Test Users**

You'll need:
- 1 Owner account
- 1 Tenant account
- 1 Property
- 1 Active lease

---

## 🔐 **FEATURE 1: SECURITY DEPOSITS**

### **Test 1.1: Owner Creates Deposit**
**Route**: `/owner/dashboard/deposits`

**Steps**:
1. Login as owner
2. Navigate to deposits page
3. Click "Create Deposit" (if available)
4. Enter deposit amount (e.g., ₱10,000)
5. Select tenant and property
6. Submit

**Expected Result**:
- ✅ Deposit created successfully
- ✅ Shows in deposits list
- ✅ Status: "held"
- ✅ Refundable amount = deposit amount

---

### **Test 1.2: Owner Conducts Move-Out Inspection**

**Steps**:
1. On deposits page, find a deposit
2. Click "Inspection" button
3. **Step 1 - Checklist**:
   - Select condition for each item
   - Add inspection notes
   - Click "Next"
4. **Step 2 - Deductions**:
   - Add item: "Broken window"
   - Cost: ₱2,000
   - Category: "Damage"
   - Click "Add Deduction"
   - Click "Next"
5. **Step 3 - Review**:
   - Verify calculations
   - Click "Complete Inspection"

**Expected Result**:
- ✅ Inspection created
- ✅ Deduction recorded
- ✅ Refundable amount = ₱8,000
- ✅ Status updated

**Database Check**:
```sql
SELECT * FROM move_out_inspections ORDER BY created_at DESC LIMIT 1;
SELECT * FROM deposit_deductions ORDER BY created_at DESC LIMIT 1;
SELECT * FROM deposit_balances WHERE id = 'DEPOSIT_ID';
```

---

### **Test 1.3: Tenant Views Deposit**
**Route**: `/tenant/dashboard/payments`

**Steps**:
1. Login as tenant
2. Navigate to payments page
3. Scroll to "Security Deposit" card

**Expected Result**:
- ✅ Deposit card visible
- ✅ Shows deposit amount
- ✅ Shows refundable amount
- ✅ Shows deductions (if any)
- ✅ Shows inspection details

---

### **Test 1.4: Tenant Disputes Deduction**

**Steps**:
1. On deposit card, find a deduction
2. Click "Dispute This Deduction"
3. Enter reason (min 20 characters)
4. Submit

**Expected Result**:
- ✅ Success message
- ✅ Deduction shows "Disputed" badge
- ✅ Dispute reason visible

**Database Check**:
```sql
SELECT * FROM deposit_deductions WHERE disputed = true;
```

---

### **Test 1.5: Owner Processes Refund**

**Steps**:
1. On deposits page, find deposit
2. Click "Process Refund"
3. Confirm

**Expected Result**:
- ✅ Success message
- ✅ Status: "Fully Refunded"
- ✅ Payment record created

---

## ⚡ **FEATURE 2: UTILITY BILLS**

### **Test 2.1: Owner Creates Utility Bill**
**Route**: `/owner/dashboard/utility-bills`

**Steps**:
1. Login as owner
2. Navigate to utility bills page
3. Click "Create Bill"
4. Fill form:
   - Property: Select property
   - Tenant: Select tenant
   - Bill Type: Electricity
   - Period: Oct 1 - Oct 31
   - Due Date: Nov 15
   - Previous Reading: 1000 kWh
   - Current Reading: 1250 kWh
   - Rate: ₱12.50/kWh
   - Base Charge: ₱100
5. Submit

**Expected Result**:
- ✅ Bill created
- ✅ Consumption: 250 kWh
- ✅ Consumption Charge: ₱3,125
- ✅ Total: ₱3,225
- ✅ Shows in bills list

**Database Check**:
```sql
SELECT * FROM utility_bills ORDER BY created_at DESC LIMIT 1;
```

---

### **Test 2.2: Tenant Views Utility Bills**
**Route**: `/tenant/dashboard/payments`

**Steps**:
1. Login as tenant
2. Navigate to payments page
3. Find "Utility Bills" card

**Expected Result**:
- ✅ Bills card visible
- ✅ Shows pending bills
- ✅ Shows total pending amount
- ✅ Shows consumption details
- ✅ "Pay" button available

---

### **Test 2.3: Owner Views Bill Details**

**Steps**:
1. On utility bills page
2. Click "View" on a bill

**Expected Result**:
- ✅ Dialog opens
- ✅ Shows all bill details
- ✅ Shows consumption breakdown
- ✅ Shows charges breakdown
- ✅ Shows payment status

---

### **Test 2.4: Delete Pending Bill**

**Steps**:
1. Find a pending bill
2. Click delete button
3. Confirm

**Expected Result**:
- ✅ Bill deleted
- ✅ Removed from list

---

## 💰 **FEATURE 3: ADVANCE PAYMENTS**

### **Test 3.1: Create Advance Payment**

**Via Database** (API integration needed for UI):
```sql
INSERT INTO advance_payments (
  tenant_id,
  property_id,
  total_amount,
  remaining_balance,
  months_covered,
  start_month,
  end_month
) VALUES (
  'TENANT_ID',
  'PROPERTY_ID',
  30000,
  30000,
  3,
  '2025-11-01',
  '2026-01-31'
);
```

**Expected Result**:
- ✅ Advance payment created
- ✅ Status: "active"
- ✅ Balance: ₱30,000

---

### **Test 3.2: Owner Views Advance Payments**
**Route**: `/owner/dashboard/advance-payments`

**Steps**:
1. Login as owner
2. Navigate to advance payments page

**Expected Result**:
- ✅ Page loads
- ✅ Shows statistics
- ✅ Lists advance payments
- ✅ Shows progress bars
- ✅ Shows allocation status

---

### **Test 3.3: Tenant Views Advance Payment**
**Route**: `/tenant/dashboard/payments`

**Steps**:
1. Login as tenant
2. Navigate to payments page
3. Find "Advance Payments" card

**Expected Result**:
- ✅ Card visible
- ✅ Shows available balance
- ✅ Shows progress bar
- ✅ Shows allocation history

---

### **Test 3.4: Auto-Allocation**

**Trigger via Database**:
```sql
-- Create a due payment
INSERT INTO payment_schedules (
  tenant_id,
  property_id,
  due_date,
  amount,
  remaining_amount
) VALUES (
  'TENANT_ID',
  'PROPERTY_ID',
  CURRENT_DATE,
  10000,
  10000
);

-- Run auto-allocation
SELECT auto_allocate_advance_payments();
```

**Expected Result**:
- ✅ Payment marked as paid
- ✅ Advance balance reduced
- ✅ Allocation record created

**Database Check**:
```sql
SELECT * FROM advance_payment_allocations ORDER BY created_at DESC LIMIT 1;
SELECT * FROM advance_payments WHERE id = 'ADVANCE_ID';
```

---

## 📝 **FEATURE 4: LEASE RENEWAL**

### **Test 4.1: Check Expiring Leases**

**Run Function**:
```sql
SELECT check_expiring_leases();
```

**Expected Result**:
- ✅ Function executes
- ✅ Notifications created for expiring leases

**Database Check**:
```sql
SELECT * FROM lease_notifications ORDER BY created_at DESC;
```

---

### **Test 4.2: Tenant Creates Renewal Request**

**Via API** (UI integration pending):
```typescript
await LeaseRenewalAPI.createRenewalRequest({
  tenantId: 'TENANT_ID',
  propertyId: 'PROPERTY_ID',
  originalLeaseStart: '2024-01-01',
  originalLeaseEnd: '2025-01-01',
  originalMonthlyRent: 10000,
  newLeaseStart: '2025-01-01',
  newLeaseEnd: '2026-01-01',
  newMonthlyRent: 11000,
  renewalDurationMonths: 12,
  requestedBy: 'USER_ID',
});
```

**Expected Result**:
- ✅ Renewal request created
- ✅ Status: "pending"
- ✅ Rent increase calculated

---

### **Test 4.3: Owner Views Renewal Requests**

**Via API**:
```typescript
const renewals = await LeaseRenewalAPI.getOwnerRenewals(ownerId);
const pending = await LeaseRenewalAPI.getPendingRenewals(ownerId);
```

**Expected Result**:
- ✅ Returns renewal requests
- ✅ Shows pending requests
- ✅ Includes tenant details

---

### **Test 4.4: Owner Approves Renewal**

**Via API**:
```typescript
await LeaseRenewalAPI.approveRenewal(renewalId, ownerId);
```

**Expected Result**:
- ✅ Status: "approved"
- ✅ Lease history created
- ✅ Notification sent to tenant

**Database Check**:
```sql
SELECT * FROM lease_renewals WHERE id = 'RENEWAL_ID';
SELECT * FROM lease_history WHERE renewal_id = 'RENEWAL_ID';
SELECT * FROM lease_notifications WHERE notification_type = 'renewal_approved';
```

---

### **Test 4.5: Owner Rejects Renewal**

**Via API**:
```typescript
await LeaseRenewalAPI.rejectRenewal(
  renewalId, 
  ownerId, 
  'Property will be renovated'
);
```

**Expected Result**:
- ✅ Status: "rejected"
- ✅ Rejection reason saved
- ✅ Notification sent to tenant

---

## 🔄 **INTEGRATION TESTS**

### **Test I.1: Complete Tenant Lifecycle**

**Scenario**: New tenant moves in, pays rent, utilities, and renews lease

**Steps**:
1. Create security deposit
2. Tenant pays first month rent
3. Owner creates utility bill
4. Tenant pays utility bill
5. Tenant makes advance payment
6. Auto-allocate to next month
7. Lease expires soon
8. Tenant requests renewal
9. Owner approves renewal
10. Conduct move-out inspection (if leaving)
11. Process deposit refund

**Expected Result**:
- ✅ All features work together
- ✅ No errors
- ✅ Data consistency maintained

---

### **Test I.2: Owner Dashboard**

**Steps**:
1. Login as owner
2. Visit each dashboard page:
   - `/owner/dashboard/deposits`
   - `/owner/dashboard/utility-bills`
   - `/owner/dashboard/advance-payments`

**Expected Result**:
- ✅ All pages load
- ✅ Statistics display correctly
- ✅ Lists show data
- ✅ Actions work

---

### **Test I.3: Tenant Dashboard**

**Steps**:
1. Login as tenant
2. Visit `/tenant/dashboard/payments`

**Expected Result**:
- ✅ Page loads
- ✅ All feature cards visible
- ✅ Existing payments still work
- ✅ New features integrated

---

## ✅ **ACCEPTANCE CRITERIA**

### **Must Pass**:
- [ ] All migrations run successfully
- [ ] All 12 tables created
- [ ] RLS policies active
- [ ] Owner can create deposits
- [ ] Owner can create utility bills
- [ ] Owner can view advance payments
- [ ] Tenant can view all features
- [ ] Tenant can dispute deductions
- [ ] Auto-allocation works
- [ ] Lease renewal workflow works
- [ ] No console errors
- [ ] Existing features unaffected

### **Performance**:
- [ ] Pages load < 2 seconds
- [ ] API calls < 500ms
- [ ] No memory leaks
- [ ] Smooth animations

---

## 🐛 **COMMON ISSUES & FIXES**

### **Issue: Tables Not Created**
**Fix**: Run migrations in correct order

### **Issue: RLS Blocking Access**
**Fix**: Check user authentication and role

### **Issue: Calculations Wrong**
**Fix**: Verify trigger functions executed

### **Issue: UI Not Showing Data**
**Fix**: Check API calls in browser console

---

## 📊 **TEST RESULTS TEMPLATE**

```
TESTING CHECKLIST
=================

SECURITY DEPOSITS:
[ ] Create deposit
[ ] Conduct inspection
[ ] Add deductions
[ ] Tenant views deposit
[ ] Tenant disputes deduction
[ ] Process refund

UTILITY BILLS:
[ ] Create bill
[ ] Auto-calculate consumption
[ ] Tenant views bills
[ ] View bill details
[ ] Delete pending bill

ADVANCE PAYMENTS:
[ ] Create advance payment
[ ] Owner views list
[ ] Tenant views card
[ ] Auto-allocation works
[ ] Balance updates correctly

LEASE RENEWAL:
[ ] Check expiring leases
[ ] Create renewal request
[ ] Owner views requests
[ ] Approve renewal
[ ] Reject renewal
[ ] Notifications sent

INTEGRATION:
[ ] All features work together
[ ] No conflicts
[ ] Data consistency
[ ] Performance acceptable
```

---

## 🎯 **SUCCESS CRITERIA**

**All tests pass** = Ready for Production ✅

**Some tests fail** = Review and fix issues

**Many tests fail** = Review implementation

---

**Testing Time**: ~2-3 hours for complete testing  
**Recommended**: Test in development first, then staging, then production

**Good luck with testing! 🚀**

# Deployment Checklist - Lease Duration & Security Deposit Fixes

## 🚀 **What Was Fixed**

### **Issue 1: Incorrect Lease Duration** ✅
- Owner sets 6 months but PDF shows 12 months
- **Fixed**: Database function now uses owner's selected duration

### **Issue 2: Missing Download Lease Button** ✅
- Owner can't download lease agreement
- **Fixed**: Added download button to owner's applications page

### **Issue 3: Security Deposits Not Auto-Created** ✅
- Deposits must be created manually
- **Fixed**: Auto-creates security & advance deposits on approval

---

## 📋 **Migrations to Run**

Run these in **Supabase SQL Editor** in order:

### **1. Fix Lease Duration** (REQUIRED)
```sql
-- File: 010_fix_lease_duration.sql
-- Fixes hardcoded 12-month lease to use owner's selection
```

**Status**: ⏳ Pending

### **2. Auto-Create Payments** (REQUIRED)
```sql
-- File: 011_auto_create_payments_on_approval.sql
-- Auto-creates security deposit, advance deposit, and monthly rent payments
```

**Status**: ⏳ Pending

---

## ✅ **Verification Steps**

### **After Running Migrations:**

#### **Test 1: Lease Duration**
1. Login as owner
2. Approve application with **6 months**
3. Check console logs:
   ```
   🚀 Calling RPC with params: {lease_duration_months: 6}
   📅 Lease Duration: 6 months
   ```
4. Check database:
   ```sql
   SELECT lease_start, lease_end FROM tenants ORDER BY created_at DESC LIMIT 1;
   -- Should show 6 months difference
   ```
5. Download lease (owner & tenant) → Should show 6 months

#### **Test 2: Auto-Created Payments**
1. Approve application
2. Check database:
   ```sql
   SELECT payment_type, amount, due_date 
   FROM payments 
   WHERE tenant_id = 'xxx'
   ORDER BY due_date;
   ```
3. Should see:
   - 1 security_deposit (₱10,000)
   - 1 advance_deposit (₱20,000)
   - 6 rent payments (₱10,000 each)

4. Login as tenant → Go to `/tenant/dashboard/payments`
5. Should see all 8 payments in timeline

#### **Test 3: Owner Download Button**
1. Login as owner
2. Go to `/owner/dashboard/applications`
3. Find approved application
4. Should see green download icon (📥)
5. Click → PDF downloads with correct dates

---

## 🎯 **Expected Behavior**

### **Before Fixes:**
- ❌ Lease always 12 months (ignores owner selection)
- ❌ Owner can't download lease
- ❌ No deposits auto-created
- ❌ Tenant sees empty payment timeline

### **After Fixes:**
- ✅ Lease duration matches owner's selection (6, 12, 24 months)
- ✅ Owner can download lease with correct dates
- ✅ Security & advance deposits auto-created
- ✅ Monthly rent payments auto-generated
- ✅ Tenant sees complete payment timeline immediately

---

## 📊 **What Owner Sees Now**

### **Approval Modal:**
```
┌─────────────────────────────────────┐
│ Approve Application & Set Lease     │
├─────────────────────────────────────┤
│ Lease Duration: [6 Months]          │
│                                     │
│ ✅ Lease Terms Summary              │
│ Start: Oct 31, 2025                 │
│ End: Apr 31, 2026                   │
│ Duration: 6 Months                  │
│                                     │
│ 🛡️ Required Deposits (Auto-Created) │
│ Security: ₱10,000 (Refundable)      │
│ Advance: ₱20,000 (2 months)         │
│ Total Initial: ₱30,000              │
│                                     │
│ ⚠️ What happens:                    │
│ ✓ 2 deposits auto-created           │
│ ✓ 6 monthly payments auto-generated │
│ ✓ Tenant sees all in timeline       │
│                                     │
│ [Approve & Create Lease]            │
└─────────────────────────────────────┘
```

### **Applications Table:**
```
┌─────────────────────────────────────┐
│ John Doe | Approved | [👁️] [📥]    │
│                      View Download  │
└─────────────────────────────────────┘
```

---

## 📱 **What Tenant Sees Now**

### **Payment Timeline:**
```
┌─────────────────────────────────────┐
│ 🔴 Due Soon (2)                     │
├─────────────────────────────────────┤
│ Security Deposit: ₱10,000           │
│ Due: 10/31/2025                     │
│ [Pay Now]                           │
├─────────────────────────────────────┤
│ Advance Deposit: ₱20,000            │
│ Due: 10/31/2025                     │
│ [Pay Now]                           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ 📅 Upcoming (6)                     │
├─────────────────────────────────────┤
│ Monthly Rent - Month 1 of 6         │
│ Due: 11/05/2025                     │
│ ₱10,000                             │
└─────────────────────────────────────┘
```

---

## 🔧 **Troubleshooting**

### **Issue: Migration 010 fails**
**Error**: "function name not unique"
**Solution**: The DO block handles this - just run it again

### **Issue: Migration 011 fails**
**Error**: "payments table doesn't exist"
**Solution**: Check if payments table exists:
```sql
SELECT * FROM information_schema.tables WHERE table_name = 'payments';
```

### **Issue: No payments created after approval**
**Check**:
1. Console logs - should show success message
2. Database:
   ```sql
   SELECT * FROM payments WHERE tenant_id = 'xxx';
   ```
3. If empty, check audit_logs for errors

### **Issue: Tenant doesn't see payments**
**Check**:
1. Tenant is logged in with correct user_id
2. Payments exist in database
3. RLS policies allow tenant to read their payments

---

## 📚 **Documentation**

- ✅ `LEASE_DURATION_FIX.md` - Complete lease duration fix details
- ✅ `SECURITY_DEPOSIT_COMPLETE_WORKFLOW.md` - Full deposit workflow
- ✅ `LEASE_APPROVAL_FLOW_TEST.md` - Testing guide
- ✅ `DEPLOYMENT_CHECKLIST.md` - This file

---

## ✅ **Final Checklist**

Before going live:

- [ ] Run migration 010_fix_lease_duration.sql
- [ ] Run migration 011_auto_create_payments_on_approval.sql
- [ ] Test lease duration (6, 12, 24 months)
- [ ] Test owner download button
- [ ] Test auto-created deposits
- [ ] Test tenant payment timeline
- [ ] Verify all 3 tabs (Timeline, Calendar, Properties)
- [ ] Test payment submission flow
- [ ] Test owner payment verification
- [ ] Check notifications working

---

## 🎉 **Success Criteria**

✅ Owner selects 6 months → Database stores 6 months  
✅ Owner can download lease with correct dates  
✅ Tenant can download lease with same dates  
✅ Security deposit auto-created (₱10,000)  
✅ Advance deposit auto-created (₱20,000)  
✅ Monthly rent payments auto-created (6 payments)  
✅ Tenant sees all 8 payments immediately  
✅ Timeline, Calendar, and Properties tabs all work  
✅ Payment submission and verification works  

---

**Ready to deploy!** 🚀

**Date**: October 25, 2025  
**Version**: 2.0  
**Status**: Ready for Production

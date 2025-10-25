# 🏠 Complete Workflow Guide - Tenant & Owner Journey

## Overview
This guide explains the **complete lifecycle** of a tenant-owner relationship in PropertyEase, from property search to move-out.

---

## 📍 **THE COMPLETE JOURNEY**

```
1. TENANT SEARCHES → 2. APPLIES → 3. OWNER APPROVES → 4. LEASE STARTS
                                                              ↓
                                                    5. DEPOSIT CREATED
                                                              ↓
                                                    6. MONTHLY PAYMENTS
                                                              ↓
                                                    7. UTILITIES & BILLS
                                                              ↓
                                                    8. LEASE RENEWAL (Optional)
                                                              ↓
                                                    9. MOVE-OUT INSPECTION
                                                              ↓
                                                    10. DEPOSIT REFUND
```

---

## 🎯 **PHASE 1: PROPERTY SEARCH & APPLICATION**

### **TENANT Side:**

#### Step 1: Browse Properties
**Route**: `/tenant/dashboard/properties`

**What Tenant Sees:**
- List of available properties
- Property details (name, address, rent, amenities)
- Property images
- "Apply" button

**Actions:**
1. Browse available properties
2. Click on a property to view details
3. Click "Apply" button

#### Step 2: Submit Application
**What Happens:**
- Application form opens
- Tenant fills in:
  - Personal information
  - Employment details
  - References
  - Move-in date preference
- Submit application

**Status**: Application now **PENDING**

---

### **OWNER Side:**

#### Step 3: Review Applications
**Route**: `/owner/dashboard/tenants` or `/owner/dashboard/applications`

**What Owner Sees:**
- List of pending applications
- Applicant details
- Property applied for

**Actions:**
1. Review application details
2. Check references
3. **Decision Time:**
   - ✅ **APPROVE** → Creates tenant record
   - ❌ **REJECT** → Sends rejection notification

---

## 🏁 **PHASE 2: LEASE ACTIVATION**

### **OWNER Side:**

#### Step 4: Create Tenant Record (After Approval)
**Route**: `/owner/dashboard/tenants`

**What Owner Does:**
1. Click "Add Tenant" (or auto-created from approval)
2. Fill in lease details:
   - Property & Unit Number
   - Lease Start Date
   - Lease End Date
   - Monthly Rent Amount
   - Security Deposit Amount
3. Upload lease agreement
4. Submit

**Result**: Tenant record created with status **ACTIVE**

---

#### Step 5: Create Security Deposit
**Route**: `/owner/dashboard/deposits`

**What Owner Does:**
1. Click "Create Deposit"
2. Select tenant
3. Enter deposit amount (e.g., ₱10,000)
4. Submit

**Result**: 
- Deposit record created
- Status: **HELD**
- Refundable amount = Deposit amount

**Connection**: This is **Test 1.1** in the testing guide!

---

## 💰 **PHASE 3: ONGOING PAYMENTS**

### **TENANT Side:**

#### Step 6: View Dashboard
**Route**: `/tenant/dashboard/payments`

**What Tenant Sees:**
- **Rent Payments Card**
  - Due payments
  - Payment history
  - "Pay Now" button
  
- **Security Deposit Card** ← NEW FEATURE!
  - Deposit amount
  - Refundable amount
  - Deductions (if any)
  
- **Utility Bills Card** ← NEW FEATURE!
  - Pending bills
  - Consumption details
  - "Pay" button
  
- **Advance Payments Card** ← NEW FEATURE!
  - Available balance
  - Allocation history

**Actions:**
1. Pay monthly rent
2. View deposit status
3. Pay utility bills
4. Track advance payments

---

### **OWNER Side:**

#### Step 7: Create Utility Bills
**Route**: `/owner/dashboard/utility-bills`

**What Owner Does:**
1. Click "Create Bill"
2. Select property & tenant
3. Enter meter readings:
   - Previous reading: 1000 kWh
   - Current reading: 1250 kWh
4. System auto-calculates:
   - Consumption: 250 kWh
   - Amount: ₱3,125 (at ₱12.50/kWh)
5. Submit

**Result**: Bill created and visible to tenant

**Connection**: This is **Test 2.1** in the testing guide!

---

## 🔄 **PHASE 4: LEASE RENEWAL (Optional)**

### **TENANT Side:**

#### Step 8: Request Renewal
**Route**: `/tenant/dashboard/lease` (if implemented)

**When**: 30-60 days before lease expires

**What Tenant Does:**
1. Receives notification about expiring lease
2. Clicks "Request Renewal"
3. Proposes new terms:
   - New lease duration
   - Rent negotiation (if any)
4. Submit request

**Result**: Renewal request created with status **PENDING**

---

### **OWNER Side:**

#### Step 9: Review Renewal Request
**Route**: `/owner/dashboard/renewals` (if implemented)

**What Owner Does:**
1. Reviews renewal request
2. **Decision Time:**
   - ✅ **APPROVE** → Lease extended
   - ❌ **REJECT** → Tenant must move out

**Connection**: This is **Test 4.4 & 4.5** in the testing guide!

---

## 📦 **PHASE 5: MOVE-OUT PROCESS**

### **OWNER Side:**

#### Step 10: Conduct Move-Out Inspection
**Route**: `/owner/dashboard/deposits`

**When**: Tenant is moving out

**What Owner Does:**
1. Find tenant's deposit
2. Click "Inspection" button
3. **Step 1 - Checklist:**
   - Inspect walls, floors, appliances, etc.
   - Rate condition (Good/Fair/Poor/Damaged)
   - Add notes
   - Click "Next"

4. **Step 2 - Add Deductions:**
   - Add item: "Broken window"
   - Cost: ₱2,000
   - Category: "Damage"
   - Upload photos (optional)
   - Click "Add Deduction"
   - Repeat for other damages
   - Click "Next"

5. **Step 3 - Review:**
   - Original deposit: ₱10,000
   - Total deductions: ₱2,000
   - Refundable amount: ₱8,000
   - Click "Complete Inspection"

**Result**:
- Inspection completed
- Deposit refundable amount updated
- Deductions recorded

**Connection**: This is **Test 1.2** in the testing guide!

---

### **TENANT Side:**

#### Step 11: View Inspection Results
**Route**: `/tenant/dashboard/payments`

**What Tenant Sees:**
- Security Deposit Card updated:
  - Original deposit: ₱10,000
  - Deductions: ₱2,000
  - Refundable: ₱8,000
- List of deductions with details
- Option to dispute

**Actions (Optional):**
1. Click "Dispute This Deduction"
2. Enter reason (min 20 characters)
3. Submit dispute

**Result**: Deduction marked as **DISPUTED**

**Connection**: This is **Test 1.3 & 1.4** in the testing guide!

---

### **OWNER Side:**

#### Step 12: Process Refund
**Route**: `/owner/dashboard/deposits`

**What Owner Does:**
1. Find tenant's deposit
2. Click "Process Refund"
3. Confirm refund amount (₱8,000)
4. Submit

**Result**:
- Payment record created (type: security_deposit, status: refunded)
- Deposit status: **FULLY_REFUNDED**
- Tenant receives refund

**Connection**: This is **Test 1.5** in the testing guide!

---

## 🔗 **HOW FEATURES CONNECT**

### **Existing Features (Before)**:
1. ✅ Property Management
2. ✅ Tenant Management
3. ✅ Basic Rent Payments
4. ✅ Maintenance Requests
5. ✅ Messages/Notifications

### **NEW Features (Added)**:
6. 🆕 **Security Deposits** ← Connects to move-out process
7. 🆕 **Utility Bills** ← Connects to monthly payments
8. 🆕 **Advance Payments** ← Auto-allocates to rent
9. 🆕 **Lease Renewal** ← Extends tenant relationship
10. 🆕 **Move-Out Inspection** ← Part of deposit workflow

---

## 📊 **FEATURE INTEGRATION MAP**

```
TENANT RECORD (Core)
    ├─ LEASE AGREEMENT
    │   ├─ Lease Start/End Dates
    │   ├─ Monthly Rent Amount
    │   └─ Lease Renewal Requests ← NEW!
    │
    ├─ SECURITY DEPOSIT ← NEW!
    │   ├─ Deposit Balance
    │   ├─ Move-Out Inspection ← NEW!
    │   ├─ Deductions ← NEW!
    │   └─ Refund Process ← NEW!
    │
    ├─ PAYMENTS
    │   ├─ Rent Payments (Existing)
    │   ├─ Utility Bills ← NEW!
    │   ├─ Advance Payments ← NEW!
    │   └─ Late Fees (Existing)
    │
    └─ MAINTENANCE
        └─ Maintenance Requests (Existing)
```

---

## 🎬 **COMPLETE SCENARIO EXAMPLE**

### **Meet John (Tenant) & Maria (Owner)**

#### **Month 1: Move-In**
1. **John** browses properties on `/tenant/dashboard/properties`
2. **John** applies for Maria's apartment
3. **Maria** reviews application on `/owner/dashboard/tenants`
4. **Maria** approves John's application
5. **Maria** creates tenant record (Lease: Jan 1 - Dec 31, Rent: ₱10,000/month)
6. **Maria** creates security deposit on `/owner/dashboard/deposits` (₱10,000)
7. **John** pays first month rent + deposit

#### **Month 2-11: Ongoing**
8. **Maria** creates monthly utility bills on `/owner/dashboard/utility-bills`
9. **John** pays rent + utilities on `/tenant/dashboard/payments`
10. **John** views deposit status (still ₱10,000 refundable)

#### **Month 10: Renewal Decision**
11. System notifies **John** about expiring lease
12. **John** requests renewal (extend 1 year)
13. **Maria** reviews on `/owner/dashboard/renewals`
14. **Maria** approves renewal

#### **Month 12 (Alternative): Move-Out**
15. **John** decides to move out
16. **Maria** conducts inspection on `/owner/dashboard/deposits`
17. **Maria** finds broken window, adds ₱2,000 deduction
18. **John** views deduction on `/tenant/dashboard/payments`
19. **John** disputes deduction (explains it was already broken)
20. **Maria** reviews dispute, removes deduction
21. **Maria** processes refund (₱10,000)
22. **John** receives full deposit back

---

## 🧪 **TESTING GUIDE CONNECTION**

### **The Testing Guide Tests These Workflows:**

**Test 1.1-1.5**: Security Deposit Lifecycle
- Covers: Steps 6, 16-21 above

**Test 2.1-2.4**: Utility Bills
- Covers: Steps 8-9 above

**Test 3.1-3.4**: Advance Payments
- Covers: Prepayment scenarios

**Test 4.1-4.5**: Lease Renewal
- Covers: Steps 11-14 above

**Integration Tests**: Complete lifecycle
- Covers: All steps 1-22 above

---

## 🎯 **KEY TAKEAWAYS**

### **For Tenants:**
1. Search & apply for properties
2. Pay rent & utilities monthly
3. View deposit status anytime
4. Dispute unfair deductions
5. Request lease renewal
6. Get deposit refund when moving out

### **For Owners:**
1. Review & approve applications
2. Create tenant records & deposits
3. Generate utility bills
4. Conduct move-out inspections
5. Process deposit refunds
6. Manage lease renewals

### **The Flow:**
```
Application → Approval → Deposit → Payments → Utilities → 
Renewal (Optional) → Inspection → Refund
```

---

## 📝 **WHAT'S MISSING (To Implement)**

### **High Priority:**
1. ❌ Property application form (tenant side)
2. ❌ Application approval workflow (owner side)
3. ❌ Lease renewal UI (both sides)
4. ❌ Advance payment creation UI (tenant side)

### **Already Implemented:**
1. ✅ Security deposits (full workflow)
2. ✅ Utility bills (owner can create)
3. ✅ Move-out inspections (full workflow)
4. ✅ Deposit refunds (full workflow)
5. ✅ Delete deposits (owner side)

---

## 🚀 **NEXT STEPS FOR TESTING**

1. **Start with existing features:**
   - Create property (owner)
   - Manually create tenant record (owner)

2. **Test new deposit workflow:**
   - Follow Test 1.1-1.5 in testing guide

3. **Test utility bills:**
   - Follow Test 2.1-2.4 in testing guide

4. **Test complete lifecycle:**
   - Follow Integration Test I.1 in testing guide

---

**Date**: October 25, 2025  
**Status**: Workflow documented and ready for testing  
**Next**: Complete testing using COMPLETE_TESTING_GUIDE.md

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

**📊 Four View Modes:**
1. **List View** (Default) - Table with all payments
2. **Calendar View** - Visual calendar with payment dates
3. **Timeline View** - Upcoming payments timeline
4. **Properties View** - Grouped by property

**💳 Payment Cards:**
- **Rent Payments**
  - Monthly rent (₱5,000-₱10,000)
  - Due date and status
  - "Pay Now" button
  - Late fees (if overdue)
  
- **Advance Rent** ← RA 9653 Compliant!
  - One-time upfront payment
  - Auto-created on approval
  - Clearly labeled as "Advance Rent"
  
- **Security Deposit** ← Auto-Synced!
  - Deposit amount
  - Refundable amount
  - Deductions (if any)
  - Real-time status
  
- **Utility Bills** ← Auto-Synced!
  - Water, electricity, etc.
  - Consumption details
  - "Pay" button
  - Status syncs with owner dashboard
  
**🔍 Search & Filters:**
- Search by payment type, property name
- Filter by status (All, Paid, Pending, Overdue)
- Filter by type (Rent, Advance Rent, Security, Utility, Penalty)
- Works across all 4 views!

**💳 Payment Methods:**
- GCash (via Xendit)
- PayMaya (via Xendit)
- Bank Transfer
- Credit Card
- Cash (manual)

**Actions:**
1. Switch between views (List/Calendar/Timeline/Properties)
2. Search and filter payments
3. Click "Pay Now" on any pending payment
4. Complete payment via Xendit
5. Auto-confirm in development mode
6. View payment history and receipts

---

### **OWNER Side:**

#### Step 7: Create Utility Bills
**Route**: `/owner/dashboard/utility-bills`

**🎨 Enhanced UI:**
- Beautiful gradient background (blue-slate)
- Gradient header with icons
- Stats cards with hover effects
- Responsive design

**📊 Dashboard Stats:**
- Total Bills (with Zap icon)
- Pending (with Clock icon)
- Paid (with CheckCircle icon)
- Overdue (with AlertCircle icon)
- Pending Amount (with DollarSign icon)

**What Owner Does:**
1. Click "Create Bill" (gradient button)
2. **Select Property** (loads from database)
   - Shows all active properties
   - Real-time data
3. **Select Tenant** (loads from database)
   - Shows active tenants for property
   - Option: "No tenant (Property bill)"
4. **Enter Bill Details:**
   - Bill type: electricity, water, gas, etc.
   - Billing period (start/end dates)
   - Due date
5. **Enter Meter Readings:**
   - Previous reading: 1000 kWh
   - Current reading: 1250 kWh
   - Rate per unit: ₱12.50/kWh
   - Base charge: ₱100
6. **System Auto-Calculates:**
   - Consumption: 250 kWh ✅
   - Consumption charge: ₱3,125 ✅
   - Total: ₱3,225 ✅
7. Submit

**Result**: 
- ✅ Utility bill created
- ✅ Payment record created automatically
- ✅ Tenant can see and pay immediately
- ✅ Status syncs bidirectionally

**🔄 Auto-Sync Feature:**
- When tenant pays → Bill status updates to "PAID"
- When owner marks paid → Payment status updates
- Real-time sync via database triggers

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
   - Auto-sync with payments
   - Move-out inspection workflow
   - Deduction tracking
   - Refund processing

7. 🆕 **Utility Bills** ← Connects to monthly payments
   - Auto-calculation of consumption
   - Real-time payment sync
   - Multiple utility types
   - Owner and tenant dashboards

8. 🆕 **Advance Payments (RA 9653)** ← Philippine law compliant
   - Advance rent tracking
   - Separate from security deposit
   - Auto-created on approval
   - Clear labeling

9. 🆕 **Xendit Payment Integration** ← Secure online payments
   - GCash, PayMaya support
   - Webhook handling
   - Auto-confirm in development
   - Receipt generation

10. 🆕 **Enhanced Payment Dashboard** ← Multiple views
    - List, Calendar, Timeline, Properties views
    - Search and filters
    - Payment history
    - Late fee calculation

11. 🆕 **Lease Renewal** ← Extends tenant relationship
12. 🆕 **Move-Out Inspection** ← Part of deposit workflow

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
3. **Maria** reviews application on `/owner/dashboard/applications`
4. **Maria** approves John's application
5. **System Auto-Creates:**
   - ✅ Tenant record (Lease: Jan 1 - Dec 31, Rent: ₱5,000/month)
   - ✅ Advance Rent payment (₱5,000) - RA 9653 compliant
   - ✅ Security Deposit payment (₱10,000)
   - ✅ 12 Monthly Rent payments (₱5,000 each)
6. **John** goes to `/tenant/dashboard/payments`
7. **John** sees in "Properties" view:
   - 🛡️ Upfront Payments section:
     - 💰 Advance Rent: ₱5,000
     - 🛡️ Security Deposit: ₱10,000
     - Total Upfront: ₱15,000
8. **John** clicks "Pay Now" on Advance Rent
9. **John** selects GCash, completes payment via Xendit
10. **System auto-confirms** payment (4 seconds in dev)
11. **John** pays Security Deposit the same way
12. **Security deposit auto-syncs** to deposit_balances table

#### **Month 2-11: Ongoing**
13. **Maria** creates utility bill on `/owner/dashboard/utility-bills`:
    - Selects John's property
    - Selects John as tenant
    - Enters electricity readings (1000 → 1250 kWh)
    - System calculates: ₱3,225 total
    - Clicks "Create Bill"
14. **System Auto-Creates:**
    - ✅ Utility bill record
    - ✅ Payment record (type: utility)
15. **John** sees new utility bill in `/tenant/dashboard/payments`:
    - ⚡ Utility: ₱3,225 (Pending)
    - Can switch to Calendar view to see on due date
    - Can filter by "Utility" type
16. **John** pays utility bill via GCash
17. **System Auto-Syncs:**
    - ✅ Payment status → "Paid"
    - ✅ Utility bill status → "Paid" (via trigger)
18. **Maria** sees "PAID" status in `/owner/dashboard/utility-bills`
19. **John** pays monthly rent (₱5,000)
20. **John** views deposit status (still ₱10,000 refundable)

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
1. ✅ **Security deposits** (full workflow)
   - Auto-sync with payments
   - Move-out inspection
   - Deduction tracking
   - Refund processing

2. ✅ **Utility bills** (complete system)
   - Owner creates bills
   - Auto-calculation
   - Tenant pays online
   - Bidirectional sync
   - Real-time status updates

3. ✅ **Advance rent payments** (RA 9653)
   - Auto-created on approval
   - Separate from security deposit
   - Proper labeling
   - Payment tracking

4. ✅ **Xendit payment integration**
   - GCash, PayMaya, Bank Transfer
   - Webhook handling
   - Auto-confirm (development)
   - Receipt generation

5. ✅ **Enhanced payment dashboard**
   - 4 view modes (List/Calendar/Timeline/Properties)
   - Search and filters (work in all views)
   - Payment details dialog
   - Late fee calculation

6. ✅ **Owner dashboard UI enhancement**
   - Gradient backgrounds
   - Icon-based stats cards
   - Hover effects
   - Responsive design
   - Consistent across pages

7. ✅ **Move-out inspections** (full workflow)
8. ✅ **Deposit refunds** (full workflow)
9. ✅ **Delete deposits** (owner side)

---

## 🚀 **NEXT STEPS FOR TESTING**

### **1. Database Setup (REQUIRED FIRST)**
```sql
-- Run these migrations in Supabase SQL Editor:
1. Migration 013: Utility Bills tables
2. Migration 017: Deposit balances auto-sync
3. Migration 018: Add advance_rent payment type
4. Migration 019: Remove payment_method enum
5. Migration 020: Utility payment sync triggers
```

### **2. Test Payment System**
1. **Create property** (owner)
2. **Approve application** (creates all payments automatically)
3. **Tenant pays** advance rent via Xendit
4. **Verify** payment shows as "Paid"
5. **Test** all 4 view modes (List/Calendar/Timeline/Properties)
6. **Test** search and filters
7. **Click** calendar day to see payment details

### **3. Test Utility Bills**
1. **Owner creates bill** with real property/tenant data
2. **System calculates** consumption automatically
3. **Tenant sees bill** in payments page
4. **Tenant pays** via Xendit
5. **Verify sync** - both sides show "Paid"

### **4. Test Complete Lifecycle**
1. Follow the John & Maria scenario above
2. Test all payment types
3. Test utility bill creation and payment
4. Test deposit inspection and refund
5. Verify all auto-sync features work

### **5. Verify UI Enhancements**
1. Check gradient backgrounds on all owner pages
2. Verify stats cards have icons and hover effects
3. Test responsive design on mobile
4. Verify consistent design across:
   - `/owner/dashboard/utility-bills`
   - `/owner/dashboard/deposits`
   - `/owner/dashboard/advance-payments`

---

**Date**: October 26, 2025  
**Status**: ✅ Fully Updated with Latest Features  
**Last Updated**: 8:45 AM UTC+08:00  
**Next**: Complete testing using COMPLETE_TESTING_GUIDE.md

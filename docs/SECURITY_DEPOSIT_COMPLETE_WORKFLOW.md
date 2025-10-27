# Security Deposit - Complete Workflow & Implementation

## 📋 Overview

This document explains the **complete security deposit system** including automatic creation, manual deposits, tenant notifications, and the complete workflow for both owner and tenant roles.

---

## 🎯 **What Gets Auto-Created When Owner Approves Application**

### **Automatic Payment Records:**

When owner clicks **"Approve & Create Lease"**, the system automatically creates:

1. ✅ **Security Deposit** - ₱10,000 (1 month rent) - Refundable
2. ✅ **Advance Deposit** - ₱20,000 (2 months rent) 
3. ✅ **Monthly Rent Payments** - 6 payments (based on lease duration)

**Total: 8 payment records created automatically**

---

## 💰 **Deposit Breakdown**

### **Security Deposit:**
- **Amount**: 1 month rent (e.g., ₱10,000)
- **Type**: `security_deposit`
- **Due Date**: Move-in date
- **Status**: `pending`
- **Refundable**: ✅ Yes (at lease end, minus damages)
- **Description**: "Security Deposit - Refundable at lease end"

### **Advance Deposit:**
- **Amount**: 2 months rent (e.g., ₱20,000)
- **Type**: `advance_deposit`
- **Due Date**: Move-in date
- **Status**: `pending`
- **Refundable**: ❌ No (covers first 2 months)
- **Description**: "Advance Deposit - 2 months rent"

### **Monthly Rent:**
- **Amount**: 1 month rent (e.g., ₱10,000)
- **Type**: `rent`
- **Due Date**: 5th of each month
- **Status**: `pending`
- **Recurring**: ✅ Yes
- **Description**: "Monthly Rent - Month X of Y"

---

## 🔄 **Complete Approval Flow**

### **Step 1: Owner Reviews Application**

**Location**: `/owner/dashboard/applications`

**Owner sees:**
```
┌─────────────────────────────────────┐
│ Pending Applications (1)            │
│                                     │
│ John Doe - Naga Land                │
│ Unit: A-101                         │
│ Rent: ₱10,000/month                 │
│ [View Details]                      │
└─────────────────────────────────────┘
```

### **Step 2: Owner Opens Approval Modal**

**Owner clicks "Approve"** → Modal opens:

```
┌─────────────────────────────────────────────────┐
│ Approve Application & Set Lease Terms           │
├─────────────────────────────────────────────────┤
│                                                 │
│ 📋 Applicant Information                        │
│ Tenant: John Doe                                │
│ Property: Naga Land                             │
│ Unit: A-101                                     │
│ Monthly Rent: ₱10,000                           │
│                                                 │
│ 📅 Lease Start Date: 2025-10-31                 │
│                                                 │
│ ⏱️ Lease Duration *                             │
│ [6 Months] [12 Months] [24 Months]             │
│                                                 │
│ ✅ Lease Terms Summary                          │
│ Start: October 31, 2025                         │
│ End: April 31, 2026                             │
│ Duration: 6 Months                              │
│ Monthly Payments: 6 payments                    │
│ Total Rent: ₱60,000                             │
│                                                 │
│ 🛡️ Required Deposits (Auto-Created)             │
│ Security Deposit: ₱10,000 (Refundable)          │
│ Advance Deposit: ₱20,000 (2 months)             │
│ ─────────────────────────────────────           │
│ Total Initial Payment: ₱30,000                  │
│ 💡 Auto-added to tenant's payment timeline      │
│                                                 │
│ ⚠️ What happens next:                           │
│ ✓ Tenant record will be created                │
│ ✓ 2 deposit payments auto-created              │
│ ✓ 6 monthly rent payments auto-generated       │
│ ✓ Unit marked as occupied                      │
│ ✓ Tenant sees all payments in timeline         │
│                                                 │
│ [Cancel] [Approve & Create Lease]              │
└─────────────────────────────────────────────────┘
```

### **Step 3: System Creates Records**

**When owner clicks "Approve & Create Lease":**

```sql
-- 1. Update application status
UPDATE rental_applications 
SET status = 'approved' 
WHERE id = 'xxx';

-- 2. Create tenant record
INSERT INTO tenants (
  user_id, property_id, unit_number,
  lease_start, lease_end,
  monthly_rent, deposit, security_deposit
) VALUES (
  'user_id', 'property_id', 'A-101',
  '2025-10-31', '2026-04-31',
  10000, 20000, 10000
);

-- 3. Create Security Deposit Payment
INSERT INTO payments (
  tenant_id, property_id,
  payment_type, amount, due_date,
  payment_status, description
) VALUES (
  'tenant_id', 'property_id',
  'security_deposit', 10000, '2025-10-31',
  'pending', 'Security Deposit - Refundable at lease end'
);

-- 4. Create Advance Deposit Payment
INSERT INTO payments (
  tenant_id, property_id,
  payment_type, amount, due_date,
  payment_status, description
) VALUES (
  'tenant_id', 'property_id',
  'advance_deposit', 20000, '2025-10-31',
  'pending', 'Advance Deposit - 2 months rent'
);

-- 5. Create 6 Monthly Rent Payments
INSERT INTO payments (
  tenant_id, property_id,
  payment_type, amount, due_date,
  payment_status, description,
  period_start, period_end
) VALUES 
  -- Month 1
  ('tenant_id', 'property_id', 'rent', 10000, '2025-11-05', 'pending', 'Monthly Rent - Month 1 of 6', '2025-10-31', '2025-11-30'),
  -- Month 2
  ('tenant_id', 'property_id', 'rent', 10000, '2025-12-05', 'pending', 'Monthly Rent - Month 2 of 6', '2025-12-01', '2025-12-31'),
  -- ... and so on for 6 months
;
```

**Console Output:**
```
🚀 Calling RPC with params: {
  application_id: "xxx",
  lease_duration_months: 6
}
📅 Lease Duration: 6 months
📆 Expected End Date: 4/31/2026
✅ RPC Result: [{
  success: true,
  tenant_id: "yyy",
  message: "Application approved successfully. Created 8 payment records."
}]
```

---

## 👤 **Tenant Side - What Tenant Sees**

### **Step 1: Tenant Gets Notification**

**Notification:**
```
🎉 Application Approved!
Your application for Naga Land (Unit A-101) has been approved.
View your payment timeline →
```

### **Step 2: Tenant Goes to Payments Page**

**Location**: `/tenant/dashboard/payments`

**Tenant sees 3 tabs:**

#### **Tab 1: Timeline** (Default View)

```
┌─────────────────────────────────────────────────┐
│ 📊 Payment Overview                             │
│ Total Due: ₱30,000                              │
│ Paid: ₱0                                        │
│ Pending: ₱30,000                                │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🔴 Due Soon (2)                                 │
├─────────────────────────────────────────────────┤
│ Security Deposit - Naga Land                    │
│ Due: 10/31/2025 (Today)                         │
│ ₱10,000                                         │
│ [Pay Now]                                       │
├─────────────────────────────────────────────────┤
│ Advance Deposit - Naga Land                     │
│ Due: 10/31/2025 (Today)                         │
│ ₱20,000                                         │
│ [Pay Now]                                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 📅 Upcoming (6)                                 │
├─────────────────────────────────────────────────┤
│ Monthly Rent - Month 1 of 6                     │
│ Due: 11/05/2025 (in 5 days)                     │
│ ₱10,000                                         │
│ [View Details]                                  │
├─────────────────────────────────────────────────┤
│ Monthly Rent - Month 2 of 6                     │
│ Due: 12/05/2025 (in 35 days)                    │
│ ₱10,000                                         │
│ [View Details]                                  │
├─────────────────────────────────────────────────┤
│ ... (4 more monthly payments)                   │
└─────────────────────────────────────────────────┘
```

#### **Tab 2: Calendar**

```
┌─────────────────────────────────────────────────┐
│        October 2025                             │
├─────────────────────────────────────────────────┤
│ Sun Mon Tue Wed Thu Fri Sat                     │
│                         31  🔴                  │
│                         ₱30,000                 │
│                                                 │
│        November 2025                            │
│                          5  🟡                  │
│                         ₱10,000                 │
│                                                 │
│        December 2025                            │
│                          5  🟡                  │
│                         ₱10,000                 │
└─────────────────────────────────────────────────┘
```

#### **Tab 3: Properties**

```
┌─────────────────────────────────────────────────┐
│ Naga Land - Unit A-101                          │
├─────────────────────────────────────────────────┤
│ Monthly Rent: ₱10,000                           │
│ Lease: 10/31/2025 - 04/31/2026                  │
│                                                 │
│ Payment Summary:                                │
│ Total Payments: 8                               │
│ Paid: 0                                         │
│ Pending: 8                                      │
│ Total Amount: ₱90,000                           │
│                                                 │
│ [View All Payments]                             │
└─────────────────────────────────────────────────┘
```

### **Step 3: Tenant Pays Deposits**

**Tenant clicks "Pay Now" on Security Deposit:**

```
┌─────────────────────────────────────────────────┐
│ Make Payment                                    │
├─────────────────────────────────────────────────┤
│ Payment Details:                                │
│ Type: Security Deposit                          │
│ Amount: ₱10,000                                 │
│ Due Date: 10/31/2025                            │
│ Property: Naga Land - Unit A-101                │
│                                                 │
│ Payment Method:                                 │
│ ○ Bank Transfer                                 │
│ ○ GCash                                         │
│ ○ Cash                                          │
│                                                 │
│ Upload Proof of Payment:                        │
│ [Choose File] screenshot.png                    │
│                                                 │
│ Notes (Optional):                               │
│ [Paid via GCash - Ref: 123456]                  │
│                                                 │
│ [Cancel] [Submit Payment]                       │
└─────────────────────────────────────────────────┘
```

**After submission:**
```
✅ Payment submitted successfully!
Your payment is pending owner verification.
```

**Payment status changes to:**
```
┌─────────────────────────────────────────────────┐
│ ⏳ Pending Verification (1)                     │
├─────────────────────────────────────────────────┤
│ Security Deposit - Naga Land                    │
│ Paid: 10/31/2025                                │
│ ₱10,000                                         │
│ Status: Pending Verification                    │
│ [View Receipt]                                  │
└─────────────────────────────────────────────────┘
```

---

## 🏠 **Owner Side - Payment Verification**

### **Step 1: Owner Gets Notification**

**Notification:**
```
💰 New Payment Received
John Doe submitted payment for Security Deposit (₱10,000)
Review payment →
```

### **Step 2: Owner Reviews Payment**

**Location**: `/owner/dashboard/payments`

```
┌─────────────────────────────────────────────────┐
│ ⏳ Pending Verification (1)                     │
├─────────────────────────────────────────────────┤
│ John Doe - Naga Land (A-101)                    │
│ Security Deposit                                │
│ Amount: ₱10,000                                 │
│ Submitted: 10/31/2025 2:30 PM                   │
│ [Review Payment]                                │
└─────────────────────────────────────────────────┘
```

**Owner clicks "Review Payment":**

```
┌─────────────────────────────────────────────────┐
│ Review Payment                                  │
├─────────────────────────────────────────────────┤
│ Tenant: John Doe                                │
│ Property: Naga Land - Unit A-101                │
│ Type: Security Deposit                          │
│ Amount: ₱10,000                                 │
│ Due Date: 10/31/2025                            │
│ Paid Date: 10/31/2025 2:30 PM                   │
│                                                 │
│ Payment Method: GCash                           │
│ Reference: 123456                               │
│                                                 │
│ Proof of Payment:                               │
│ [📷 View Screenshot]                            │
│                                                 │
│ Tenant Notes:                                   │
│ "Paid via GCash - Ref: 123456"                  │
│                                                 │
│ [Reject] [Approve Payment]                      │
└─────────────────────────────────────────────────┘
```

### **Step 3: Owner Approves Payment**

**Owner clicks "Approve Payment":**

```
✅ Payment approved!
Tenant has been notified.
```

**Payment status updates to:**
```
┌─────────────────────────────────────────────────┐
│ ✅ Paid (1)                                     │
├─────────────────────────────────────────────────┤
│ John Doe - Naga Land (A-101)                    │
│ Security Deposit                                │
│ Amount: ₱10,000                                 │
│ Paid: 10/31/2025                                │
│ Verified: 10/31/2025 3:00 PM                    │
│ [View Details]                                  │
└─────────────────────────────────────────────────┘
```

---

## 🚫 **Manual Deposit Creation - Validation**

### **Problem**: Owner tries to create duplicate deposit

**Scenario**: Owner goes to `/owner/dashboard/deposits` and tries to create a security deposit manually.

**System Check:**
```javascript
// Before creating manual deposit
const existingDeposits = await supabase
  .from('payments')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('payment_type', 'security_deposit')
  .eq('payment_status', 'pending');

if (existingDeposits.length > 0) {
  toast.error('Security deposit already exists!', {
    description: 'This tenant already has a pending security deposit payment.'
  });
  return;
}
```

**Owner sees:**
```
❌ Security deposit already exists!
This tenant already has a pending security deposit payment.
```

**Allowed Manual Deposits:**
- ✅ Pet Deposit
- ✅ Parking Deposit
- ✅ Key Deposit
- ✅ Damage Repair Deposit
- ❌ Security Deposit (auto-created)
- ❌ Advance Deposit (auto-created)

---

## 📊 **Payment Timeline Effect**

### **Before Approval:**
```
Tenant Dashboard: Empty
No payments to show
```

### **After Approval (Immediate):**
```
┌─────────────────────────────────────────────────┐
│ Payment Timeline - 8 Total Payments             │
├─────────────────────────────────────────────────┤
│ Due Today (2):                                  │
│ • Security Deposit: ₱10,000                     │
│ • Advance Deposit: ₱20,000                      │
│                                                 │
│ Upcoming (6):                                   │
│ • Nov 5: Monthly Rent ₱10,000                   │
│ • Dec 5: Monthly Rent ₱10,000                   │
│ • Jan 5: Monthly Rent ₱10,000                   │
│ • Feb 5: Monthly Rent ₱10,000                   │
│ • Mar 5: Monthly Rent ₱10,000                   │
│ • Apr 5: Monthly Rent ₱10,000                   │
└─────────────────────────────────────────────────┘
```

### **After Paying Deposits:**
```
┌─────────────────────────────────────────────────┐
│ Payment Timeline - 8 Total Payments             │
├─────────────────────────────────────────────────┤
│ Paid (2):                                       │
│ ✅ Security Deposit: ₱10,000                    │
│ ✅ Advance Deposit: ₱20,000                     │
│                                                 │
│ Upcoming (6):                                   │
│ • Nov 5: Monthly Rent ₱10,000                   │
│ • Dec 5: Monthly Rent ₱10,000                   │
│ • Jan 5: Monthly Rent ₱10,000                   │
│ • Feb 5: Monthly Rent ₱10,000                   │
│ • Mar 5: Monthly Rent ₱10,000                   │
│ • Apr 5: Monthly Rent ₱10,000                   │
└─────────────────────────────────────────────────┘
```

---

## 📱 **UI Updates Across All Tabs**

### **Timeline Tab:**
- ✅ Shows deposits in "Due Soon" section
- ✅ Shows monthly rent in "Upcoming" section
- ✅ Updates status when paid
- ✅ Moves to "Paid" section after verification

### **Calendar Tab:**
- ✅ Shows deposit due dates with red dot (🔴)
- ✅ Shows rent due dates with yellow dot (🟡)
- ✅ Displays total amount due on each date
- ✅ Updates color when paid (🟢)

### **Properties Tab:**
- ✅ Shows total payment count (8)
- ✅ Shows paid vs pending breakdown
- ✅ Shows total amount (₱90,000)
- ✅ Updates in real-time

---

## 🔔 **Notification Flow**

### **Tenant Notifications:**
1. ✅ Application approved
2. ✅ Payment timeline created
3. ✅ Deposits due reminder (1 day before)
4. ✅ Rent due reminder (3 days before)
5. ✅ Payment verified by owner
6. ✅ Payment overdue warning

### **Owner Notifications:**
1. ✅ Payment received from tenant
2. ✅ Payment pending verification
3. ✅ Payment overdue alert
4. ✅ All deposits paid confirmation

---

## 🎯 **Summary - Complete Flow**

```
Owner Approves Application
  ↓
System Creates:
  • 1 Tenant Record
  • 1 Security Deposit Payment (₱10,000)
  • 1 Advance Deposit Payment (₱20,000)
  • 6 Monthly Rent Payments (₱10,000 each)
  ↓
Tenant Sees in Timeline:
  • 2 Due Today (Deposits)
  • 6 Upcoming (Monthly Rent)
  ↓
Tenant Pays Deposits
  ↓
Owner Verifies Payments
  ↓
Timeline Updates:
  • 2 Paid (Deposits)
  • 6 Upcoming (Monthly Rent)
  ↓
Monthly Cycle Begins:
  • Tenant pays rent by 5th
  • Owner verifies payment
  • Repeat for 6 months
```

---

## ✅ **Migration Required**

**Run this migration:**
```sql
-- File: 011_auto_create_payments_on_approval.sql
-- This updates the approve_rental_application function
-- to automatically create deposit and rent payment records
```

**After migration:**
- ✅ Deposits auto-created on approval
- ✅ Monthly payments auto-generated
- ✅ Tenant sees complete timeline
- ✅ Owner can track all payments
- ✅ No manual deposit creation needed

---

## 📝 **Files Modified**

1. ✅ `scripts/migrations/011_auto_create_payments_on_approval.sql` (NEW)
2. ✅ `app/owner/dashboard/applications/page.tsx` (Updated modal)
3. ✅ Tenant payment pages (No changes needed - auto-works)

---

**Date**: October 25, 2025  
**Status**: Ready to Deploy  
**Next Step**: Run migration 011 in Supabase SQL Editor

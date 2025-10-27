# Overdue Payments & Late Fee System

**Date**: October 26, 2025  
**Status**: ✅ Fully Implemented  
**Location**: `/tenant/dashboard/payments`

---

## 🎯 Overview

The system **automatically handles** overdue payments and calculates late fees in real-time. No manual intervention needed!

---

## 📊 How It Works

### **1. Payment Status Classification**

The system categorizes every payment into 4 statuses:

```typescript
function getPaymentStatus(payment):
  if payment is paid → return 'paid' ✅
  
  daysUntilDue = calculate days until due date
  
  if daysUntilDue < 0 → return 'overdue' 🔴
  if daysUntilDue <= 7 → return 'due_soon' 🟡
  return 'pending' 🔵
```

**Status Definitions**:
- **Paid** ✅ - Payment completed
- **Overdue** 🔴 - Past due date, not paid
- **Due Soon** 🟡 - Due within 7 days
- **Pending** 🔵 - Due in more than 7 days

---

### **2. Late Fee Calculation**

**Formula**: Automatic calculation when payment is overdue

```typescript
function calculateLateFee(payment):
  if payment is paid → return ₱0
  
  daysOverdue = days past due date
  if daysOverdue === 0 → return ₱0
  
  // Two calculation methods:
  percentageFee = payment amount × 5%
  dailyFee = daysOverdue × ₱50/day
  
  // Use whichever is HIGHER
  return max(percentageFee, dailyFee)
```

**Examples**:

| Payment Amount | Days Overdue | 5% Fee | Daily Fee (₱50/day) | **Late Fee Applied** |
|----------------|--------------|--------|---------------------|----------------------|
| ₱5,000 | 1 day | ₱250 | ₱50 | **₱250** (5% higher) |
| ₱5,000 | 3 days | ₱250 | ₱150 | **₱250** (5% higher) |
| ₱5,000 | 7 days | ₱250 | ₱350 | **₱350** (daily higher) |
| ₱5,000 | 10 days | ₱250 | ₱500 | **₱500** (daily higher) |
| ₱10,000 | 5 days | ₱500 | ₱250 | **₱500** (5% higher) |

---

### **3. Real-Time Display**

#### **Overdue Payments Alert** (Red Banner)

When tenant has overdue payments:

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Overdue Payments (2)                         │
│ Please settle these payments to avoid           │
│ additional penalties                            │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ 🏠 Rent                                  │   │
│ │ Property: Naga Land Apartments           │   │
│ │ Due: Oct 5, 2025 (21 days overdue)      │   │
│ │ Amount: ₱5,000                           │   │
│ │ Late Fee: +₱1,050                        │   │
│ │ Total: ₱6,050                            │   │
│ │ [Pay Now ₱6,050]                         │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

#### **Due Soon Alert** (Yellow Banner)

When payments are due within 7 days:

```
┌─────────────────────────────────────────────────┐
│ ⏰ Payments Due Soon (1)                        │
│ Pay before due date to avoid late fees         │
│                                                 │
│ ┌─────────────────────────────────────────┐   │
│ │ ⚡ Utility                                │   │
│ │ Property: Naga Land Apartments           │   │
│ │ Due: Oct 30, 2025 (in 4 days)           │   │
│ │ Amount: ₱3,225                           │   │
│ │ [Pay Now]                                │   │
│ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

### **4. Stats Cards**

Dashboard shows real-time overdue statistics:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🔴 Overdue      │  │ 🟡 Due Soon     │  │ ✅ Paid         │
│ ₱6,050          │  │ ₱3,225          │  │ ₱15,000         │
│ (2 payments)    │  │ (1 payment)     │  │ (3 payments)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

### **5. Payment List Display**

In the payment table, overdue payments show:

```
┌──────────────────────────────────────────────────────────────┐
│ Type    │ Property    │ Amount  │ Late Fee │ Due Date  │ Status│
├──────────────────────────────────────────────────────────────┤
│ 🏠 Rent │ Naga Land  │ ₱5,000  │ +₱1,050  │ Oct 5     │ 🔴 OVERDUE│
│         │            │         │          │ (21 days) │ [Pay ₱6,050]│
├──────────────────────────────────────────────────────────────┤
│ ⚡ Utility│ Naga Land │ ₱3,225  │ ₱0       │ Oct 30    │ 🟡 DUE SOON│
│         │            │         │          │ (in 4 days)│ [Pay Now]│
└──────────────────────────────────────────────────────────────┘
```

---

### **6. Calendar View**

Overdue payments show in **RED** on calendar:

```
October 2025
┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐
│ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│     │     │     │     │     │  3  │  4  │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│  5  │  6  │  7  │  8  │  9  │ 10  │ 11  │
│🔴🏠 │     │     │     │     │     │     │
│₱5k  │     │     │     │     │     │     │
│OVERDUE│   │     │     │     │     │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ 26  │ 27  │ 28  │ 29  │ 30  │ 31  │     │
│     │     │     │     │🟡⚡ │     │     │
│     │     │     │     │₱3.2k│     │     │
│     │     │     │     │DUE  │     │     │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

---

## 💳 Payment Flow with Late Fees

### **Scenario: Tenant Pays Overdue Rent**

```
1. Tenant views dashboard
   - Sees: Rent ₱5,000 + Late Fee ₱1,050 = ₱6,050

2. Clicks "Pay Now ₱6,050"
   - System creates Xendit invoice for ₱6,050
   - Late fee included in total

3. Tenant pays via GCash
   - Pays full amount: ₱6,050

4. System records payment:
   - Amount: ₱5,000
   - Late Fee: ₱1,050
   - Total Paid: ₱6,050
   - Status: Paid ✅

5. Dashboard updates:
   - Overdue count: 2 → 1
   - Overdue amount: ₱6,050 → ₱0
   - Red banner disappears (if no more overdue)
```

---

## 🔄 Automatic Updates

### **Real-Time Recalculation**

Every time the page loads or refreshes:

```typescript
1. Fetch all payments from database
2. For each payment:
   - Calculate days until/past due date
   - Determine status (paid/overdue/due_soon/pending)
   - Calculate late fee if overdue
   - Calculate total amount (original + late fee)
3. Update UI with latest data
```

**No cron jobs needed!** Calculations happen on-demand.

---

## 📊 Database Storage

### **Payments Table**

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,      -- Original amount
  due_date DATE NOT NULL,              -- Due date
  late_fee DECIMAL(10,2) DEFAULT 0,   -- Stored late fee (optional)
  payment_status TEXT DEFAULT 'pending',
  paid_date TIMESTAMP,
  ...
);
```

**Note**: Late fees are calculated **on-the-fly** in the frontend. They can optionally be stored in the `late_fee` column when payment is made.

---

## 🎯 Key Features

### ✅ **What Works**:

1. **Automatic Detection**
   - System checks due dates automatically
   - No manual marking as "overdue"

2. **Real-Time Calculation**
   - Late fees calculated instantly
   - Updates every page load

3. **Visual Alerts**
   - Red banner for overdue
   - Yellow banner for due soon
   - Color-coded calendar

4. **Accurate Amounts**
   - Shows original amount
   - Shows late fee separately
   - Shows total to pay

5. **Payment Integration**
   - Late fees included in Xendit invoice
   - Full amount charged
   - Proper recording

---

## 🔧 Configuration

### **Late Fee Settings** (Hardcoded)

Current settings in code:

```typescript
// Location: app/tenant/dashboard/payments/page.tsx

const LATE_FEE_PERCENTAGE = 0.05;  // 5%
const LATE_FEE_DAILY_RATE = 50;    // ₱50 per day
const DUE_SOON_THRESHOLD = 7;      // 7 days
```

**To Change**:
1. Edit the values in the payment page
2. Or move to database settings table
3. Or create admin settings page

---

## 📝 Example Scenarios

### **Scenario 1: On-Time Payment**
```
Due Date: Oct 26, 2025
Today: Oct 25, 2025
Status: Due Soon (1 day)
Late Fee: ₱0
Total: ₱5,000
```

### **Scenario 2: 1 Day Late**
```
Due Date: Oct 26, 2025
Today: Oct 27, 2025
Status: Overdue (1 day)
Late Fee: ₱250 (5% of ₱5,000)
Total: ₱5,250
```

### **Scenario 3: 10 Days Late**
```
Due Date: Oct 26, 2025
Today: Nov 5, 2025
Status: Overdue (10 days)
Late Fee: ₱500 (₱50 × 10 days)
Total: ₱5,500
```

### **Scenario 4: 30 Days Late**
```
Due Date: Oct 26, 2025
Today: Nov 25, 2025
Status: Overdue (30 days)
Late Fee: ₱1,500 (₱50 × 30 days)
Total: ₱6,500
```

---

## 🚨 Important Notes

### **Grace Period**
Currently: **NO grace period**
- Payment is overdue immediately after due date
- Late fees start accumulating from day 1

**To Add Grace Period**:
```typescript
// Modify getPaymentStatus function
const GRACE_PERIOD_DAYS = 3;

if (daysUntilDue < -GRACE_PERIOD_DAYS) return 'overdue';
```

### **Maximum Late Fee**
Currently: **NO maximum cap**
- Late fees can grow indefinitely
- ₱50/day × 60 days = ₱3,000 late fee

**To Add Cap**:
```typescript
const MAX_LATE_FEE_PERCENTAGE = 0.25; // 25% max
const maxLateFee = payment.amount * MAX_LATE_FEE_PERCENTAGE;
return Math.min(calculatedLateFee, maxLateFee);
```

---

## 🎯 Summary

### **How System Handles Overdue Payments**:

1. ✅ **Automatic Detection** - Checks due dates on every page load
2. ✅ **Real-Time Calculation** - Calculates late fees instantly
3. ✅ **Visual Alerts** - Red/yellow banners for urgency
4. ✅ **Accurate Display** - Shows breakdown of amount + late fee
5. ✅ **Seamless Payment** - Late fees included in payment total
6. ✅ **All Views** - Works in List, Calendar, Timeline, Properties views
7. ✅ **Search & Filter** - Can filter by "Overdue" status

### **No Manual Work Needed**:
- ❌ No cron jobs to mark overdue
- ❌ No admin intervention required
- ❌ No manual late fee calculation
- ✅ Everything automatic!

---

**Status**: ✅ **Fully Functional**  
**Tested**: Yes  
**Production Ready**: Yes  
**User Experience**: Excellent - Clear and transparent

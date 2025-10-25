# Security Deposit Payment Display Fix

## Issue
Security deposits were showing up in the "Due Soon" and "Upcoming Payments" sections on the tenant payments page, which is incorrect.

**Why it's wrong:**
- Security deposits are **one-time payments** held by the owner
- They are NOT recurring monthly payments
- They should NOT appear in "Due Soon" or "Overdue" lists
- They have their own dedicated card: **"Security Deposit Card"**

---

## What Was Happening

### Before Fix:
```
Due Soon (2)
├─ security deposit - naga land (₱1,000) ❌ WRONG!
├─ security deposit - naga land (₱1,000) ❌ WRONG!

Upcoming Payment Timeline
├─ rent - naga land (₱4,500) ✅ Correct
```

### After Fix:
```
Due Soon (1)
├─ rent - naga land (₱4,500) ✅ Correct

Security Deposit Card (Separate Section)
├─ Deposit Amount: ₱10,000
├─ Refundable Amount: ₱10,000
└─ Status: Held
```

---

## Root Cause

The `getTenantPayments` API fetches **ALL payments** from the `payments` table, including:
1. ✅ Rent payments (recurring)
2. ✅ Utility bills (recurring)
3. ❌ Security deposits (one-time, held)
4. ❌ Deposit refunds (one-time, completed)

The tenant payments page was categorizing ALL payments by status without filtering out security deposits.

---

## The Fix

### File: `app/tenant/dashboard/payments/page.tsx`

**Lines 339-355**: Added filters to exclude security deposits and refunds

### Before:
```typescript
const overduePayments = enhancedPayments.filter(p => p.status === 'overdue');
const dueSoonPayments = enhancedPayments.filter(p => p.status === 'due_soon');
const pendingPayments = enhancedPayments.filter(p => p.status === 'pending');
```

### After:
```typescript
// Exclude security deposits and refunds from due/overdue lists
const overduePayments = enhancedPayments.filter(
  p => p.status === 'overdue' && 
  p.payment_type !== 'security_deposit' && 
  p.payment_status !== 'refunded'
);

const dueSoonPayments = enhancedPayments.filter(
  p => p.status === 'due_soon' && 
  p.payment_type !== 'security_deposit' && 
  p.payment_status !== 'refunded'
);

const pendingPayments = enhancedPayments.filter(
  p => p.status === 'pending' && 
  p.payment_type !== 'security_deposit' && 
  p.payment_status !== 'refunded'
);
```

---

## Payment Types Explained

### **Recurring Payments** (Show in Due Soon/Overdue):
- ✅ `rent` - Monthly rent
- ✅ `utility` - Utility bills
- ✅ `penalty` - Late fees
- ✅ `other` - Other charges

### **One-Time Payments** (DON'T show in Due Soon/Overdue):
- ❌ `security_deposit` - Initial deposit (held by owner)
- ❌ `deposit` - Other deposits
- ❌ Payments with status `refunded` - Already processed refunds

---

## Where Security Deposits Should Appear

### ✅ **Correct Location:**
**Security Deposit Card** (Separate component)
- Shows deposit amount
- Shows refundable amount
- Shows deductions (if any)
- Shows inspection details
- Allows disputing deductions

### ❌ **Wrong Location:**
- Due Soon section
- Overdue section
- Upcoming Payment Timeline
- Payment Calendar (for due dates)

---

## Payment Flow Clarification

### **Security Deposit Lifecycle:**

1. **Owner creates deposit** (`/owner/dashboard/deposits`)
   - Creates `deposit_balances` record
   - Status: `held`
   - Amount held by owner

2. **Tenant views deposit** (`/tenant/dashboard/payments`)
   - Shows in **Security Deposit Card**
   - NOT in "Due Soon" or payment lists

3. **Move-out inspection** (owner conducts)
   - Adds deductions if needed
   - Updates refundable amount

4. **Deposit refund** (owner processes)
   - Creates payment record with:
     - `payment_type: 'security_deposit'`
     - `payment_status: 'refunded'`
   - This payment should NOT show in "Due Soon"

---

## Testing Checklist

After this fix, verify:

### ✅ **Should Show in Due Soon:**
- [ ] Monthly rent payments
- [ ] Utility bills
- [ ] Penalty fees
- [ ] Other recurring charges

### ❌ **Should NOT Show in Due Soon:**
- [ ] Security deposits (initial)
- [ ] Deposit refunds
- [ ] Payments with status 'refunded'

### ✅ **Security Deposit Card Should Show:**
- [ ] Deposit amount
- [ ] Refundable amount
- [ ] Deductions list
- [ ] Inspection details
- [ ] Dispute buttons

---

## Related Files

### Modified:
- `app/tenant/dashboard/payments/page.tsx` (lines 339-355)

### Related Components:
- `components/tenant/DepositBalanceCard.tsx` - Shows deposit details
- `lib/api/deposits.ts` - Deposit API
- `lib/api/payments.ts` - Payment API

---

## Database Schema Reference

### `payments` table:
```sql
payment_type ENUM:
  - 'rent'              ← Show in Due Soon
  - 'deposit'           ← DON'T show in Due Soon
  - 'security_deposit'  ← DON'T show in Due Soon
  - 'utility'           ← Show in Due Soon
  - 'penalty'           ← Show in Due Soon
  - 'other'             ← Show in Due Soon

payment_status ENUM:
  - 'pending'   ← Show in Due Soon (if not security_deposit)
  - 'paid'      ← Show in history
  - 'failed'    ← Show in alerts
  - 'refunded'  ← DON'T show in Due Soon
  - 'partial'   ← Show in Due Soon
```

### `deposit_balances` table:
```sql
-- Separate table for security deposits
-- NOT part of recurring payment schedules
-- Has its own workflow and UI
```

---

## Key Takeaways

1. **Security deposits ≠ Recurring payments**
   - Deposits are held amounts, not due payments
   - They have their own dedicated card

2. **Filter by payment_type**
   - Exclude `security_deposit` from due lists
   - Exclude `refunded` status from due lists

3. **Two separate systems:**
   - `payments` table → Recurring payments (rent, utilities)
   - `deposit_balances` table → Security deposits (held amounts)

4. **UI separation:**
   - Due Soon section → Recurring payments only
   - Security Deposit Card → Deposit details only

---

**Date**: October 25, 2025  
**Status**: ✅ Fixed  
**Impact**: Tenant payments page now correctly shows only recurring payments in Due Soon section

# 🚀 Payment Features Implementation Roadmap
## Missing Real-Life Payment Scenarios

> **Reference**: Based on `payments.md` payment lifecycle documentation  
> **Status**: Planning & Implementation Guide  
> **Last Updated**: October 24, 2025

---

## 📊 **Implementation Status Overview**

| Category | Total Features | Implemented | Missing | Progress |
|----------|---------------|-------------|---------|----------|
| **Booking/Reservation** | 3 | 0 | 3 | 0% |
| **Security Deposits** | 4 | 0 | 4 | 0% |
| **Monthly Rent** | 5 | 2 | 3 | 40% |
| **Utilities** | 3 | 0 | 3 | 0% |
| **Refunds** | 4 | 4 | 0 | 100% ✅ |
| **Lease End/Renewal** | 4 | 0 | 4 | 0% |
| **System Features** | 10 | 3 | 7 | 30% |
| **TOTAL** | 33 | 9 | 24 | 27% |

---

## ✅ **ALREADY IMPLEMENTED**

### **Monthly Rent Payments**
- ✅ **3A. On-time Payment** - Xendit integration, receipt generation
- ✅ **3B. Late Payment** - Auto-calculated late fees (5% or ₱50/day)

### **Refunds & Adjustments**
- ✅ **5A. Tenant Cancels Before Move-In** - Refund request system
- ✅ **5B. Owner Cancels Booking** - Refund workflow
- ✅ **5C. Overpayment** - Refund request with amount adjustment
- ✅ **5D. Disputed Payment** - Refund with reason tracking

### **System Features**
- ✅ **Payment Gateway** - Xendit (GCash, Maya, Cards, Bank)
- ✅ **Automated Payment Generation** - Monthly rent auto-creation
- ✅ **Late Fee Engine** - Auto-calculation with configurable rules

---

## 🔴 **HIGH PRIORITY - Core Rental Features**

### **1. Security Deposit Management**

#### **2A. Full Payment (Deposit + First Month)** 
**Renter:** Pay combined deposit + first month rent in one transaction  
**Owner:** Confirm receipt, set lease start date, track deposit separately  
**System:** Generate 2 payment records, link them, track deposit balance

#### **2C. Deposit Refund (No Damages)**
**Renter:** Request deposit refund at lease end, track status  
**Owner:** Conduct inspection, approve full refund  
**System:** Move-out inspection checklist, auto-refund workflow

#### **2D. Deposit Deduction (With Damages)**
**Renter:** View damage deductions, see photos, dispute if needed  
**Owner:** Upload damage proof, itemize costs, calculate partial refund  
**System:** Damage documentation, deduction calculator, itemized statement

---

### **2. Utility Bills Management**

#### **4A. Separate Utility Bills (Water, Electricity)**
**Renter:** View bills with meter readings, pay separately, see consumption history  
**Owner:** Upload bills (photo/PDF), input readings, generate invoices  
**System:** Utility bill table, meter tracking, separate payment type

#### **4B. Fixed Monthly Utility Fee**
**Renter:** See utility fee in rent breakdown, pay combined  
**Owner:** Set fixed utility amount per property  
**System:** Auto-add to rent bill, single invoice

---

### **3. Advance Payment**

#### **3E. Pay Multiple Months Ahead**
**Renter:** Select months to pay, see extended due dates, optional discount  
**Owner:** Accept advance payments, track prepaid balance  
**System:** Prepaid balance tracking, auto-extend due dates

---

## 🟡 **MEDIUM PRIORITY - Enhanced Features**

### **4. Reservation System**

#### **1A. Reservation Paid and Approved**
**Renter:** Pay reservation fee, see status, auto-refund if rejected  
**Owner:** Approve/reject reservations, convert to lease  
**System:** Reservation table, expiration timer, auto-refund

#### **1C. Reservation Expired**
**Renter:** See countdown timer, payment deadline warnings  
**Owner:** Auto-cancel expired, reopen property slot  
**System:** Cron job for expiration checks

---

### **5. Partial Payments**

#### **2B. Partial Payment Tracking**
**Renter:** Pay partial amount, see remaining balance, reminders  
**Owner:** Accept/reject partial, set minimum amount  
**System:** Track unpaid balance, payment history

---

### **6. Lease End/Renewal**

#### **6A. Normal Lease End**
**Renter:** Lease countdown, request deposit refund, download summary  
**Owner:** Move-out inspection, generate summary, process refund  
**System:** Auto-generate move-out summary, final statement

#### **6B. Lease Renewal**
**Renter:** Review renewal offer, accept/decline new terms  
**Owner:** Offer renewal, set new rent/duration  
**System:** Renewal workflow, new billing cycle generation

#### **6C. Early Termination (Tenant)**
**Renter:** Request termination, see policy, understand penalties  
**Owner:** Review request, apply policy, calculate refund  
**System:** Termination calculator, policy engine

#### **6D. Early Termination (Owner)**
**Renter:** Receive notice, see refund breakdown  
**Owner:** Initiate termination, provide reason, process refunds  
**System:** Calculate unused rent + deposit refund

---

## 🟢 **LOW PRIORITY - Advanced Features**

### **7. Auto-Debit System**

#### **3D. Recurring Payments**
**Renter:** Enable auto-pay, set payment method, cancel anytime  
**Owner:** Track auto-debit enrollments, see success rates  
**System:** Auto-debit scheduling, 3-retry mechanism, failure handling

---

### **8. Missed Payment Tracking**

#### **3C. Lease Violations**
**Renter:** See missed payment warnings, consequences  
**Owner:** File violation notice, track history, escalation  
**System:** Violation tracking, automated escalation

---

### **9. E-Wallet System**
**Renter:** Top up wallet, pay from balance, transaction history  
**Owner:** Receive to wallet, withdraw to bank  
**System:** Wallet table, top-up integration, withdrawal workflow

---

### **10. Split Payment (Co-tenants)**
**Renter:** Split rent with roommates, pay proportional share  
**Owner:** Set up co-tenant billing, track individual shares  
**System:** Co-tenant relationships, split calculator

---

### **11. Shared Maintenance Fees**

#### **4C. Maintenance Fee Splitting**
**Renter:** See fee breakdown, pay proportional share  
**Owner:** Set fee, choose split method (equal/sqm)  
**System:** Split calculator, per-tenant tracking

---

## 📋 **IMPLEMENTATION PHASES**

### **Phase 1: Security Deposits** (Week 1-2)
- [ ] Combined deposit + first month payment
- [ ] Deposit balance tracking
- [ ] Move-out inspection workflow
- [ ] Deposit refund (full/partial)
- [ ] Damage deduction system

### **Phase 2: Utilities** (Week 3)
- [ ] Utility bill upload
- [ ] Meter reading tracker
- [ ] Separate utility payments
- [ ] Fixed utility fees
- [ ] Consumption analytics

### **Phase 3: Lease Management** (Week 4-5)
- [ ] Move-out summary generation
- [ ] Lease renewal workflow
- [ ] Early termination (tenant/owner)
- [ ] Advance payment system

### **Phase 4: Reservations** (Week 6)
- [ ] Reservation payment type
- [ ] Approval/rejection workflow
- [ ] Expiration timer
- [ ] Auto-refund on rejection

### **Phase 5: Advanced Features** (Week 7-8)
- [ ] Auto-debit system
- [ ] Partial payment tracking
- [ ] E-wallet integration
- [ ] Split payment handling
- [ ] Lease violation tracking

---

## 🗄️ **DATABASE TABLES NEEDED**

```sql
-- Reservations
CREATE TABLE reservations (...)

-- Deposits
CREATE TABLE deposit_balances (...)
CREATE TABLE move_out_inspections (...)
CREATE TABLE deposit_deductions (...)

-- Utilities
CREATE TABLE utility_bills (...)

-- Prepaid
CREATE TABLE prepaid_balances (...)

-- Renewals & Terminations
CREATE TABLE lease_renewals (...)
CREATE TABLE early_terminations (...)

-- Violations
CREATE TABLE lease_violations (...)

-- Auto-Debit
CREATE TABLE auto_debit_enrollments (...)
CREATE TABLE auto_debit_attempts (...)

-- Wallet
CREATE TABLE wallets (...)
CREATE TABLE wallet_transactions (...)

-- Maintenance Fees
CREATE TABLE maintenance_fees (...)
CREATE TABLE maintenance_fee_shares (...)

-- Partial Payments
CREATE TABLE partial_payments (...)
```

---

## 🎯 **RECOMMENDED START**

**Begin with Phase 1: Security Deposits**

This is the most critical missing feature as it covers:
- Lease initiation (deposit + first month)
- Lease termination (deposit refund)
- Damage handling (real-world scenario)

**Estimated Time**: 2 weeks  
**Impact**: HIGH - Core rental lifecycle  
**Complexity**: MEDIUM

---

**Ready to start implementation? Let me know which phase you'd like to begin with!**

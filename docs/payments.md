# 💰 PropertyEase Payment Module

## Overview
The **Payment Module** in PropertyEase handles all monetary transactions between **Owners (Lessors)** and **Tenants (Lessees)** — from reservation to recurring rent, utilities, and refunds.  
It ensures transparency, automated billing, and compliance with rental agreements.

---

## 🏠 Roles
- **Owner (Lessor)** — lists properties, receives payments, and manages deposits or refunds.  
- **Tenant (Lessee)** — books, pays rent, utilities, and requests refunds or disputes.  

---

## 💳 Payment Lifecycle

### 1. Booking / Reservation Stage
| Case | Description | Owner / Tenant Action | System Handling |
|------|--------------|-----------------------|----------------|
| **1A. Reservation Paid and Approved** | Tenant pays reservation fee; owner confirms | Owner approves; tenant notified | Property marked as “Reserved”; funds held until move-in |
| **1B. Reservation Paid but Rejected** | Owner declines request after payment | Owner rejects; tenant expects refund | Automatic refund to tenant’s wallet or payment method |
| **1C. Reservation Not Paid (Expired)** | Tenant books but does not pay before deadline | Tenant inactive | Auto-cancel after expiration; slot reopened |

---

### 2. Security Deposit Stage
| Case | Description | Owner / Tenant Action | System Handling |
|------|--------------|-----------------------|----------------|
| **2A. Full Payment (Deposit + First Month)** | Tenant pays both | Owner confirms receipt | System sets lease start date |
| **2B. Partial Payment** | Tenant pays less than required | Owner may accept or reject | System records unpaid balance; reminder sent |
| **2C. Deposit Refund (No Damages)** | Upon lease end | Owner initiates refund | Full refund minus any agreed deductions |
| **2D. Deposit Deduction (With Damages)** | Damages or unpaid bills | Owner uploads proof | System calculates remaining refundable amount; tenant notified |

---

### 3. Monthly Rent Payments
| Case | Description | Owner / Tenant Action | System Handling |
|------|--------------|-----------------------|----------------|
| **3A. On-time Payment** | Tenant pays before or on due date | Owner notified | Mark rent as “Paid”; generate receipt |
| **3B. Late Payment** | Tenant pays after due date | Tenant pays with penalty | System auto-adds late fee (configurable by owner/admin) |
| **3C. Missed Payment** | No payment received | Owner may file notice | Automated reminders and possible lease violation record |
| **3D. Auto-Debit Failed** | Gateway failure or insufficient funds | Tenant notified | Retry mechanism (up to 3 times) then marked “Failed” |
| **3E. Advance Payment** | Tenant pays several months ahead | Owner confirms | Prepaid months logged; due date auto-extended |

---

### 4. Utility / Maintenance Charges
| Case | Description | Owner / Tenant Action | System Handling |
|------|--------------|-----------------------|----------------|
| **4A. Separate Bills (Water, Electricity)** | Based on actual meter | Owner uploads bills | Tenant receives detailed invoice |
| **4B. Fixed Monthly Utility Fee** | Standard charge per property | Auto-added to rent bill | Billed together with rent |
| **4C. Shared Maintenance Fee** | For apartments or condos | Both share proportionally | System splits cost equally or by sqm ratio |

---

### 5. Refunds & Adjustments
| Case | Description | Owner / Tenant Action | System Handling |
|------|--------------|-----------------------|----------------|
| **5A. Tenant Cancels Before Move-In** | Early cancellation | Tenant requests refund | Refund minus booking or admin fee |
| **5B. Owner Cancels Booking** | Owner unavailable or property withdrawn | Owner triggers cancellation | Full refund to tenant; flag owner for monitoring |
| **5C. Overpayment** | Tenant pays extra | Owner reports or auto-detected | Credit applied to next billing cycle |
| **5D. Disputed Payment** | Disagreement on amount | Tenant files dispute | Payment held; admin review initiated |

---

### 6. Lease End / Renewal
| Case | Description | Owner / Tenant Action | System Handling |
|------|--------------|-----------------------|----------------|
| **6A. Normal Lease End** | Contract expires | Owner inspects, returns deposit | Auto-generate move-out summary and refund |
| **6B. Lease Renewal** | Tenant extends stay | Owner confirms new terms | New billing cycle created |
| **6C. Early Termination (Tenant)** | Tenant leaves before term | Tenant requests termination | Apply policy (e.g., deposit forfeiture or partial refund) |
| **6D. Early Termination (Owner)** | Owner reclaims unit early | Owner ends contract | Refund unused rent and deposit; log reason |

---

## 🧩 Required System Features

### 1. **Payment Gateway Integration**
Support for local and international platforms:
- GCash, Maya, GrabPay, Credit/Debit, Stripe
- Auto-conversion for different currencies
- Transaction webhook support for payment confirmation

### 2. **E-Wallet System**
- Tenants can top up balance and pay directly
- Owners can withdraw funds to linked bank accounts
- Built-in ledger for audit and transparency

### 3. **Automated Invoicing**
- Monthly rent + utilities auto-generated
- Due date reminders via email/SMS
- Supports prorated billing (partial month occupancy)

### 4. **Penalty and Fee Engine**
- Configurable penalty percentage or flat fee
- Grace period logic
- Fee auto-applied on late or failed payments

### 5. **Refund and Dispute Handling**
- Refund queue with approval workflow
- Dispute tracking with document uploads (proofs, receipts)
- Escalation path to admin or arbitration module

### 6. **Recurring Payments**
- Option for auto-debit scheduling
- Smart retry mechanism for failed charges
- Tenants can cancel auto-pay anytime

### 7. **Transaction Logs and Receipts**
- PDF and digital receipts generated per transaction
- Immutable audit trail for owner and tenant transparency
- Exportable reports for accounting

### 8. **Split Payment Handling**
- Rent and utilities can be paid separately
- Support for co-tenants splitting bills proportionally

### 9. **Reminders and Notifications**
- Due date, payment confirmation, and refund alerts
- SMS/email/in-app notifications
- Configurable frequency (daily, weekly, monthly)

### 10. **Admin Dashboard**
- Real-time transaction overview
- Dispute and refund management
- Analytics (total rent collected, unpaid accounts, penalties, etc.)

---

## ⚙️ Recommended Database Entities

| Table | Description | Key Fields |
|--------|-------------|------------|
| **payments** | Stores all payment transactions | id, tenant_id, owner_id, amount, status, type, invoice_id |
| **invoices** | Rent + utility billing | id, lease_id, amount_due, due_date, status |
| **wallets** | E-wallet balance per user | user_id, balance, last_updated |
| **refunds** | Refund requests and approvals | id, payment_id, amount, reason, status |
| **penalties** | Late fees and adjustments | id, payment_id, rate, total_fee |
| **disputes** | Conflict records | id, tenant_id, owner_id, description, resolution_status |

---

## ✅ Key Goals
- **Transparency** between tenant and owner  
- **Automation** to minimize manual intervention  
- **Flexibility** for various lease types  
- **Security & Compliance** with payment regulations  

---

*Last updated: October 2025*  
*Module Owner: PropertyEase Core Payments Team*

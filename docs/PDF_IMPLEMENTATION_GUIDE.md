# 📄 PDF Download Implementation Guide

## ✅ **Files Created:**

1. ✅ `lib/pdf/leaseAgreementPDF.ts` - Lease agreement generator
2. ✅ `lib/pdf/paymentSchedulePDF.ts` - Payment schedule generator

---

## 🚀 **Step 1: Install Dependencies**

```bash
cd client
npm install jspdf jspdf-autotable
```

---

## 📋 **Step 2: How to Use in Your Pages**

### **For Tenant Lease Page:**

Add to `/app/tenant/dashboard/lease/page.tsx`:

```typescript
import { generateLeaseAgreementPDF } from '@/lib/pdf/leaseAgreementPDF';
import { generatePaymentSchedulePDF } from '@/lib/pdf/paymentSchedulePDF';
import { FileText, Download } from 'lucide-react';

// Inside your component, add buttons:
<div className="flex gap-3 mt-4">
  <Button
    onClick={() => handleDownloadLease()}
    className="bg-blue-600 hover:bg-blue-700">
    <FileText className="w-4 h-4 mr-2" />
    Download Lease Agreement
  </Button>
  
  <Button
    onClick={() => handleDownloadPaymentSchedule()}
    variant="outline"
    className="border-blue-600 text-blue-600">
    <Download className="w-4 h-4 mr-2" />
    Download Payment Schedule
  </Button>
</div>

// Handler functions:
const handleDownloadLease = () => {
  if (!lease) return;
  
  const leaseData = {
    // Tenant Info
    tenantName: authState.user?.firstName + ' ' + authState.user?.lastName,
    tenantEmail: authState.user?.email || '',
    tenantPhone: authState.user?.phone || '',
    
    // Owner Info  
    ownerName: lease.property_details.owner_name,
    ownerEmail: lease.property_details.owner_email || '',
    ownerPhone: lease.property_details.owner_contact,
    
    // Property Info
    propertyName: lease.property_name,
    propertyAddress: lease.property_details.address,
    propertyCity: lease.property_details.city || '',
    propertyType: lease.property_details.type,
    unitNumber: lease.unit_number,
    
    // Lease Terms
    leaseStart: lease.lease_start,
    leaseEnd: lease.lease_end,
    leaseDuration: Math.ceil((new Date(lease.lease_end).getTime() - new Date(lease.lease_start).getTime()) / (1000 * 60 * 60 * 24 * 30)),
    monthlyRent: lease.monthly_rent,
    securityDeposit: lease.security_deposit,
    paymentDueDay: 5,
    
    // Terms
    terms: lease.terms_and_conditions,
    amenities: lease.property_details.amenities
  };
  
  generateLeaseAgreementPDF(leaseData);
  toast.success('Lease agreement downloaded!');
};

const handleDownloadPaymentSchedule = () => {
  if (!lease) return;
  
  const scheduleData = {
    tenantName: authState.user?.firstName + ' ' + authState.user?.lastName || '',
    propertyName: lease.property_name,
    unitNumber: lease.unit_number,
    leaseStart: lease.lease_start,
    leaseEnd: lease.lease_end,
    monthlyRent: lease.monthly_rent,
    payments: lease.payments
  };
  
  generatePaymentSchedulePDF(scheduleData);
  toast.success('Payment schedule downloaded!');
};
```

---

### **For Tenant Payments Page:**

Add to `/app/tenant/dashboard/payments/page.tsx`:

```typescript
import { generatePaymentSchedulePDF } from '@/lib/pdf/paymentSchedulePDF';
import { Download } from 'lucide-react';

// Add button near the filters:
<Button
  onClick={() => handleExportPayments()}
  variant="outline"
  className="gap-2">
  <Download className="w-4 h-4" />
  Export as PDF
</Button>

// Handler:
const handleExportPayments = () => {
  if (payments.length === 0) {
    toast.error('No payments to export');
    return;
  }
  
  // Get tenant info
  const firstPayment = payments[0];
  
  const scheduleData = {
    tenantName: authState.user?.firstName + ' ' + authState.user?.lastName || 'Tenant',
    propertyName: firstPayment.property.name,
    unitNumber: firstPayment.tenant?.unit_number || 'N/A',
    leaseStart: firstPayment.tenant?.lease_start || '',
    leaseEnd: firstPayment.tenant?.lease_end || '',
    monthlyRent: Number(firstPayment.amount),
    payments: payments
  };
  
  generatePaymentSchedulePDF(scheduleData);
  toast.success('Payment schedule exported!');
};
```

---

### **For Owner Tenant Details Page:**

Add to `/app/owner/dashboard/tenants/[id]/page.tsx`:

```typescript
import { generateLeaseAgreementPDF } from '@/lib/pdf/leaseAgreementPDF';
import { generatePaymentSchedulePDF } from '@/lib/pdf/paymentSchedulePDF';

// Add buttons in the tenant details view:
<div className="flex gap-3">
  <Button onClick={() => handleDownloadLease()}>
    <FileText className="w-4 h-4 mr-2" />
    Download Lease
  </Button>
  
  <Button onClick={() => handleDownloadPaymentSchedule()} variant="outline">
    <Download className="w-4 h-4 mr-2" />
    Download Payment Schedule
  </Button>
</div>

// Use same handlers as tenant side, just with owner's view of the data
```

---

## 🎨 **What the PDFs Look Like:**

### **Lease Agreement PDF:**
```
RESIDENTIAL LEASE AGREEMENT

PARTIES TO THE AGREEMENT
├─ LANDLORD: John Smith
├─ TENANT: Jane Doe
└─ Contact details

PROPERTY DETAILS
├─ Property: Sunset Apartment
├─ Unit: 201
└─ Address, City, Type

LEASE TERMS
├─ Start: Oct 30, 2025
├─ End: Oct 30, 2026
├─ Duration: 12 months
├─ Monthly Rent: ₱5,000
├─ Security Deposit: ₱10,000
└─ Total: ₱60,000

AMENITIES INCLUDED
WiFi, Parking, Pool, Security

TERMS AND CONDITIONS
1. Rent payment due on 5th...
2. Late fee applies...
(all terms listed)

SIGNATURES
Landlord: _________  Tenant: _________
Date: _________      Date: _________
```

### **Payment Schedule PDF:**
```
PAYMENT SCHEDULE

TENANT INFORMATION
Tenant: Jane Doe
Property: Sunset Apartment - Unit 201
Lease: Oct 30, 2025 - Oct 30, 2026

Payment Summary
Total: 12 | Paid: 0/12 | Amount: ₱60,000

┌───┬────────┬──────────┬────────┬─────────┬────────┬────────┬──────────┐
│ # │ Month  │ Due Date │ Amount │Late Fee │ Total  │ Status │Paid Date │
├───┼────────┼──────────┼────────┼─────────┼────────┼────────┼──────────┤
│ 1 │Nov 2025│Nov 5, 25 │ ₱5,000 │    -    │ ₱5,000 │Pending │    -     │
│ 2 │Dec 2025│Dec 5, 25 │ ₱5,000 │    -    │ ₱5,000 │Pending │    -     │
...
└───┴────────┴──────────┴────────┴─────────┴────────┴────────┴──────────┘

PAYMENT INSTRUCTIONS
• Due on 5th of each month
• Late fee applies after 3 days
• Payment methods: Xendit, Bank, Cash
```

---

## 🎯 **Where to Add Buttons:**

### **Tenant Side:**
1. `/tenant/dashboard/lease` - Main lease page header
2. `/tenant/dashboard/payments` - Near filters/search

### **Owner Side:**
1. `/owner/dashboard/tenants/[id]` - Tenant details page
2. `/owner/dashboard/applications` - After approval

---

## ✅ **Quick Implementation (Copy-Paste Ready):**

I'll create the exact code snippets you need to add to each page in the next step!

---

## 📝 **Installation & Testing:**

```bash
# 1. Install packages
npm install jspdf jspdf-autotable

# 2. Add buttons to pages (see examples above)

# 3. Test downloads
- Go to lease page
- Click "Download Lease Agreement"
- Click "Download Payment Schedule"
- Check PDFs open correctly
- Verify all data is present

# 4. Share with stakeholders!
```

---

## 🎉 **Result:**

After implementation:
- ✅ Tenants can download their lease agreement
- ✅ Tenants can download payment schedules
- ✅ Owners can download tenant leases
- ✅ Professional PDF format
- ✅ Ready to print/email/share
- ✅ All data accurate and formatted

---

**Ready to integrate! Shall I show you the exact code to add to each page?** 📄✨

# 📄 Lease Agreement & Payment Schedule PDF - Implementation Plan

## ✅ **What You Already Have:**

### **Tenant Side:**
- ✅ `/tenant/dashboard/lease` - Complete lease details page
- ✅ `/tenant/dashboard/payments` - Payment schedule with all details
- ✅ 4 tabs: Details, Payments, Documents, Terms

### **Owner Side:**
- ✅ `/owner/dashboard/tenants` - List of all tenants
- ⏳ `/owner/dashboard/tenants/[id]` - Individual tenant view (needs enhancement)

---

## 🎯 **Best Places for PDF Downloads:**

### **For Tenant:**
```
1. /tenant/dashboard/lease
   └─ Add button: [📄 Download Lease Agreement PDF]
   └─ Add button: [📊 Download Payment Schedule PDF]

2. /tenant/dashboard/payments  
   └─ Add button: [📊 Export Payment Schedule]
```

### **For Owner:**
```
1. /owner/dashboard/tenants/[id]
   └─ Add: Complete tenant lease view
   └─ Add button: [📄 Download Lease Agreement]
   └─ Add button: [📊 Download Payment Schedule]

2. /owner/dashboard/applications
   └─ After approval: Show [View Lease Agreement] button
```

---

## 📋 **What to Include in PDFs:**

### **Lease Agreement PDF:**
```
RESIDENTIAL LEASE AGREEMENT

Parties:
├─ Landlord: John Smith
├─ Tenant: Jane Doe
└─ Property: Sunset Apartment, Unit 201

Lease Terms:
├─ Start Date: October 30, 2025
├─ End Date: October 30, 2026
├─ Duration: 12 months
├─ Monthly Rent: ₱5,000
└─ Security Deposit: ₱10,000

Payment Schedule:
├─ Due Date: 5th of each month
├─ Late Fee: ₱500 (after 3 days)
└─ Total Payments: 12

Property Details:
├─ Address: [Full address]
├─ Type: Apartment
├─ Amenities: WiFi, Parking, Pool
└─ Condition: [Move-in condition]

Terms & Conditions:
├─ 1. Rent payment due on 5th of month
├─ 2. Late fee applies after 3 days
├─ 3. Security deposit refundable
├─ ... (all terms)

Signatures:
├─ Landlord: _____________ Date: _______
└─ Tenant: _____________ Date: _______
```

### **Payment Schedule PDF:**
```
PAYMENT SCHEDULE

Tenant: Jane Doe
Property: Sunset Apartment - Unit 201
Lease Period: Oct 30, 2025 - Oct 30, 2026

Summary:
├─ Total Payments: 12
├─ Monthly Rent: ₱5,000
├─ Total Amount: ₱60,000
└─ Payment Due: 5th of each month

Schedule:
┌──────┬────────────┬────────┬──────────┐
│ No.  │ Due Date   │ Amount │ Status   │
├──────┼────────────┼────────┼──────────┤
│ 1    │ Nov 5, 25  │ ₱5,000 │ Pending  │
│ 2    │ Dec 5, 25  │ ₱5,000 │ Pending  │
│ 3    │ Jan 5, 26  │ ₱5,000 │ Pending  │
│ ...  │ ...        │ ...    │ ...      │
│ 12   │ Oct 5, 26  │ ₱5,000 │ Pending  │
└──────┴────────────┴────────┴──────────┘

Payment Instructions:
├─ Xendit Online Payment
├─ Cash Payment at Office
└─ Bank Transfer Details
```

---

## 🚀 **Implementation Options:**

### **Option 1: Simple HTML to PDF (Quick - 1-2 hours)**
**Recommended for MVP!**

```bash
npm install jspdf jspdf-autotable
```

**Pros:**
- ✅ Quick to implement
- ✅ Simple code
- ✅ Good for text-heavy documents

**Cons:**
- ⚠️ Limited styling
- ⚠️ Basic layout

### **Option 2: React-PDF (Professional - 3-4 hours)**

```bash
npm install @react-pdf/renderer
```

**Pros:**
- ✅ Beautiful layouts
- ✅ React components
- ✅ Professional look

**Cons:**
- ⚠️ More complex
- ⚠️ Learning curve

### **Option 3: HTML Template + Puppeteer (Advanced - 4-5 hours)**

**Pros:**
- ✅ Pixel-perfect rendering
- ✅ Full CSS support
- ✅ Complex layouts

**Cons:**
- ⚠️ Requires server-side
- ⚠️ More resources

---

## 💡 **Recommended Approach (Quick Win):**

### **Phase 1: Add Download Buttons (10 min)**
Add buttons to existing pages - they prepare data and trigger download.

### **Phase 2: Simple PDF with jsPDF (1 hour)**
Create basic but functional PDFs with proper formatting.

### **Phase 3: Enhance Later (Optional)**
Switch to React-PDF or better styling when needed.

---

## 📁 **File Structure:**

```
lib/
├─ pdf/
│  ├─ leaseAgreement.ts          ← Generate lease PDF
│  ├─ paymentSchedule.ts         ← Generate payment schedule PDF
│  └─ pdfTemplates.ts            ← Common styles/templates
│
components/
├─ pdf/
│  ├─ DownloadLeaseButton.tsx    ← Reusable button
│  └─ DownloadScheduleButton.tsx ← Reusable button
│
app/
├─ tenant/dashboard/
│  ├─ lease/page.tsx              ← Add download buttons
│  └─ payments/page.tsx           ← Add export button
│
└─ owner/dashboard/
   └─ tenants/[id]/page.tsx       ← Add lease view + download
```

---

## 🎨 **UI Placement:**

### **Tenant Lease Page:**
```
┌─────────────────────────────────────────┐
│ 🏠 Lease Agreement                       │
│ Sunset Apartment - Unit 201             │
│                                          │
│ [📄 Download Lease PDF]                 │
│ [📊 Download Payment Schedule]          │
│                                          │
│ [Details] [Payments] [Documents] [Terms]│
└─────────────────────────────────────────┘
```

### **Owner Tenant Details Page:**
```
┌─────────────────────────────────────────┐
│ 👤 Tenant: Jane Doe                     │
│ 🏠 Property: Sunset Apartment - Unit 201│
│                                          │
│ Quick Actions:                           │
│ [📄 View Lease Agreement]               │
│ [📊 View Payment History]               │
│ [📄 Download Lease PDF]                 │
│ [📊 Download Payment Schedule]          │
│                                          │
│ Lease Information:                       │
│ ├─ Start: Oct 30, 2025                  │
│ ├─ End: Oct 30, 2026                    │
│ ├─ Rent: ₱5,000/month                   │
│ └─ Deposit: ₱10,000                      │
└─────────────────────────────────────────┘
```

---

## 🛠️ **Implementation Steps:**

### **Step 1: Install Library (1 min)**
```bash
npm install jspdf jspdf-autotable
```

### **Step 2: Create PDF Generator (30 min)**
```typescript
// lib/pdf/leaseAgreement.ts
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateLeaseAgreementPDF = (leaseData) => {
  const doc = new jsPDF();
  
  // Add content
  doc.setFontSize(20);
  doc.text('RESIDENTIAL LEASE AGREEMENT', 105, 20, { align: 'center' });
  
  // Add lease details
  // Add payment schedule table
  // Add terms
  
  // Download
  doc.save('Lease-Agreement.pdf');
};
```

### **Step 3: Add Buttons to Pages (30 min)**
```typescript
// In tenant/dashboard/lease/page.tsx
<Button onClick={() => generateLeaseAgreementPDF(lease)}>
  <FileText className="w-4 h-4 mr-2" />
  Download Lease PDF
</Button>
```

### **Step 4: Test & Refine (20 min)**
- Test PDF generation
- Check formatting
- Adjust layout
- Test on different devices

---

## ✅ **Quick Start (Next Steps):**

### **1. Do This Now (5 min):**
```bash
# Install PDF library
cd client
npm install jspdf jspdf-autotable
```

### **2. Then I'll Create (20 min):**
- PDF generator functions
- Download buttons
- Integrate into existing pages

### **3. You Test (10 min):**
- Download lease PDF
- Download payment schedule
- Verify content correct
- Share with stakeholders

---

## 🎯 **Deliverables:**

After implementation:
- ✅ Tenant can download lease agreement
- ✅ Tenant can download payment schedule
- ✅ Owner can download tenant's lease
- ✅ Owner can download payment schedules
- ✅ PDFs include all important info
- ✅ Professional formatting
- ✅ Ready to print/email

---

## 💼 **Business Value:**

**For Tenants:**
- ✅ Keep copy of lease agreement
- ✅ Print payment schedule
- ✅ Share with family/banks
- ✅ Track payment obligations

**For Owners:**
- ✅ Send lease to tenants via email
- ✅ Keep records organized
- ✅ Print for filing
- ✅ Legal documentation

---

## 🚀 **Ready to Implement?**

**I can:**
1. ✅ Install jsPDF (you do this: `npm install jspdf jspdf-autotable`)
2. ✅ Create PDF generator functions
3. ✅ Add download buttons to existing pages
4. ✅ Make it work for both tenant and owner

**This will take about 1-2 hours total.**

**Want me to start implementing the PDF download feature?** 📄✨

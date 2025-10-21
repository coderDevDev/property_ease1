# 🏠 Complete Lease & Payment Workflow - With Duration Selector

## ✅ **What's New:**

- ✅ **Lease Duration Selector** - Owner chooses 1, 3, 6, 12, 18, 24, or 36 months
- ✅ **Real-time Preview** - See lease end date and total payments
- ✅ **Auto-calculate** - Total rent, number of payments
- ✅ **Better UX** - Clear summary before approval

---

## 🎯 **Complete Workflow (Step-by-Step)**

### **Phase 1: Tenant Application** 📝

#### **Step 1: Tenant Applies**
**Page:** `/tenant/dashboard/applications/new?propertyId=xxx`

```
Tenant Fills Out:
├─ Select Property
├─ Select Unit Type
├─ Enter Unit Number (e.g., "201")
├─ Choose Move-in Date: Oct 30, 2025 ✅
├─ Optional message
└─ Upload Documents (ID, proof of income, etc.)

[Submit Application]
```

**Result:**
- ✅ Application saved
- ✅ Status: Pending
- ✅ Owner notified

**Key Point:** Tenant **ONLY sets move-in date**, NOT lease duration!

---

### **Phase 2: Owner Reviews & Approves** 👨‍💼

#### **Step 2: Owner Reviews Application**
**Page:** `/owner/dashboard/applications`

```
Owner sees:
┌─────────────────────────────────────┐
│ Applications                         │
├─────────────────────────────────────┤
│ Jane Doe                             │
│ Sunset Apartment - Unit 201          │
│ ₱5,000/mo                            │
│ Move-in: Oct 30, 2025                │
│ Status: ⏳ Pending                   │
│                                      │
│ [View Details] [Approve] [Reject]    │
└─────────────────────────────────────┘
```

---

#### **Step 3: Owner Clicks "Approve"**

**NEW DIALOG OPENS:**

```
┌──────────────────────────────────────────────┐
│ Approve Application & Set Lease Terms        │
├──────────────────────────────────────────────┤
│                                               │
│ 📋 Applicant Information                     │
│ ┌────────────────────────────────────────┐   │
│ │ Tenant: Jane Doe                        │   │
│ │ Property: Sunset Apartment              │   │
│ │ Unit: 201                               │   │
│ │ Monthly Rent: ₱5,000                    │   │
│ └────────────────────────────────────────┘   │
│                                               │
│ 📅 Lease Start Date                          │
│ ┌────────────────────────────────────────┐   │
│ │ October 30, 2025 [disabled]             │   │
│ │ Based on tenant's preferred move-in date│   │
│ └────────────────────────────────────────┘   │
│                                               │
│ ⏱️ Lease Duration *                          │
│ ┌─────────┬───────────┬─────────┐            │
│ │ 6 Months│ 12 Months │24 Months│ ← Quick    │
│ └─────────┴───────────┴─────────┘   Select   │
│                                               │
│ Or select custom:                             │
│ ┌─────────────────────────────────┐           │
│ │ ▼ 12 Months (Standard)          │ ← Dropdown│
│ │   1 Month (Short-term)          │           │
│ │   3 Months (Quarterly)          │           │
│ │   6 Months                      │           │
│ │   9 Months                      │           │
│ │   12 Months (Standard)          │           │
│ │   18 Months                     │           │
│ │   24 Months (Long-term)         │           │
│ │   36 Months (3 Years)           │           │
│ └─────────────────────────────────┘           │
│                                               │
│ ✅ Lease Terms Summary                        │
│ ┌────────────────────────────────────────┐   │
│ │ Start Date: October 30, 2025            │   │
│ │ End Date: October 30, 2026              │   │
│ │ ─────────────────────────────────────   │   │
│ │ Total Duration: 12 Months               │   │
│ │ Monthly Payments: 12 payments           │   │
│ │ Total Rent: ₱60,000                     │   │
│ └────────────────────────────────────────┘   │
│                                               │
│ 📝 Additional Notes (Optional)                │
│ ┌────────────────────────────────────────┐   │
│ │ Any special terms...                    │   │
│ └────────────────────────────────────────┘   │
│                                               │
│ ⚠️ What happens next:                         │
│ ┌────────────────────────────────────────┐   │
│ │ ✓ Tenant record will be created         │   │
│ │ ✓ 12 monthly payments auto-generated    │   │
│ │ ✓ Unit marked as occupied               │   │
│ │ ✓ Tenant notified of approval           │   │
│ └────────────────────────────────────────┘   │
│                                               │
│ [Cancel] [✓ Approve & Create Lease]           │
└──────────────────────────────────────────────┘
```

---

#### **Step 4: Owner Confirms Approval**

**System Actions:**
```
1. Calls Database RPC Function:
   approve_rental_application(
     application_id: 'xxx',
     lease_duration_months: 12  ← Owner's choice
   )

2. Database Creates:
   ├─ Tenant Record
   │  ├─ lease_start: Oct 30, 2025
   │  ├─ lease_end: Oct 30, 2026 (calculated)
   │  └─ status: 'active'
   │
   └─ Payment Records (12 months)
      ├─ Month 1: Nov 5, 2025 - ₱5,000
      ├─ Month 2: Dec 5, 2025 - ₱5,000
      ├─ Month 3: Jan 5, 2026 - ₱5,000
      ├─ ... (9 more payments)
      └─ Month 12: Oct 5, 2026 - ₱5,000

3. Updates:
   ├─ Application status: 'approved'
   ├─ Unit status: 'occupied'
   └─ Property occupied_units: +1

4. Notifications:
   ├─ ✉️ Tenant: "Congratulations! Application approved"
   └─ ✉️ Owner: "New tenant added successfully"
```

---

### **Phase 3: Tenant Sees Approval** 🎉

#### **Step 5: Tenant Views Approved Application**
**Page:** `/tenant/dashboard/applications`

```
My Applications

✅ APPROVED (1)

┌──────────────────────────────────────┐
│ Sunset Apartment - Unit 201           │
│ Status: ✅ Approved                   │
│ Monthly Rent: ₱5,000                  │
│ Move-in: Oct 30, 2025                 │
│ Approved: Oct 21, 2025                │
│                                        │
│ [View Lease Agreement] [View Payments]│
└──────────────────────────────────────┘
```

---

### **Phase 4: Lease Agreement (Future Enhancement)** 📜

#### **Step 6: View/Sign Lease Agreement**
**Page:** `/tenant/dashboard/lease/[id]` (To be built)

```
┌───────────────────────────────────────────┐
│ RESIDENTIAL LEASE AGREEMENT                │
├───────────────────────────────────────────┤
│                                            │
│ This Lease Agreement is entered into on   │
│ October 21, 2025                           │
│                                            │
│ BETWEEN:                                   │
│ Landlord: John Smith (Owner)              │
│ Tenant: Jane Doe                          │
│                                            │
│ PROPERTY DETAILS:                          │
│ Address: Sunset Apartment, Unit 201       │
│ City: Naga City                           │
│                                            │
│ LEASE TERMS:                               │
│ Start Date: October 30, 2025              │
│ End Date: October 30, 2026                │
│ Duration: 12 Months                       │
│                                            │
│ RENTAL AMOUNT:                             │
│ Monthly Rent: ₱5,000                      │
│ Due Date: 5th of each month               │
│ Security Deposit: ₱10,000                 │
│                                            │
│ PAYMENT SCHEDULE:                          │
│ Total Payments: 12                        │
│ Total Rent: ₱60,000                       │
│                                            │
│ TERMS AND CONDITIONS:                      │
│ 1. Rent payment due on 5th of month      │
│ 2. Late fee: ₱500 after 3 days           │
│ 3. Security deposit refundable            │
│ ... (additional terms)                    │
│                                            │
│ SIGNATURES:                                │
│ ┌────────────────┬──────────────────┐     │
│ │ Landlord       │ Tenant            │     │
│ │ ____________   │ ____________      │     │
│ │ John Smith     │ [Sign Here]       │     │
│ │ Oct 21, 2025   │                   │     │
│ └────────────────┴──────────────────┘     │
│                                            │
│ [Download PDF] [✓ Sign & Accept]          │
└───────────────────────────────────────────┘
```

---

### **Phase 5: Payment Management** 💰

#### **Step 7: Tenant Views Payment Schedule**
**Page:** `/tenant/dashboard/payments`

```
💰 My Payments

📊 Payment Summary
Total Due: ₱60,000
Paid: ₱0
Upcoming: ₱60,000
Due Payments: 12

📅 UPCOMING PAYMENTS (12)

┌──────────────────────────────────────┐
│ November 2025 Rent                    │
│ Due: November 5, 2025                 │
│ Amount: ₱5,000                        │
│ Status: ⏳ Pending                    │
│ [Pay Now with Xendit] 💳              │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ December 2025 Rent                    │
│ Due: December 5, 2025                 │
│ Amount: ₱5,000                        │
│ Status: ⏳ Pending                    │
│ [Pay Early]                           │
└──────────────────────────────────────┘

... (10 more payments)
```

---

## 🔄 **Different Lease Duration Examples:**

### **Example 1: 6-Month Lease**
```
Owner selects: 6 Months

Result:
├─ Start: Oct 30, 2025
├─ End: April 30, 2026
├─ Payments: 6 (Nov 5 - Apr 5)
└─ Total: ₱30,000
```

### **Example 2: 24-Month Lease (2 Years)**
```
Owner selects: 24 Months

Result:
├─ Start: Oct 30, 2025
├─ End: October 30, 2027
├─ Payments: 24 (Nov 5, 2025 - Oct 5, 2027)
└─ Total: ₱120,000
```

### **Example 3: Custom 9-Month Lease**
```
Owner selects: 9 Months (from dropdown)

Result:
├─ Start: Oct 30, 2025
├─ End: July 30, 2026
├─ Payments: 9 (Nov 5 - Jul 5)
└─ Total: ₱45,000
```

---

## 📋 **Complete Feature Checklist:**

### **✅ Implemented:**
1. ✅ Tenant application form
2. ✅ Owner review & approval
3. ✅ **Lease duration selector** (NEW!)
4. ✅ **Real-time preview** (NEW!)
5. ✅ **Auto-calculate end date** (NEW!)
6. ✅ Auto-generate payments
7. ✅ Xendit payment integration
8. ✅ Payment dashboard

### **⏳ To Be Built:**
9. ⏳ Lease agreement template
10. ⏳ PDF generation
11. ⏳ E-signature functionality
12. ⏳ Lease document storage
13. ⏳ Email notifications
14. ⏳ Lease renewal process

---

## 🎯 **Best Workflow for Lease Agreement:**

### **Option 1: Simple Text-Based (Quick)**
```
1. Owner approves → System shows lease terms
2. Tenant views lease summary in dashboard
3. Tenant clicks "Accept Terms"
4. System records acceptance
```

### **Option 2: PDF Generation (Professional)**
```
1. Owner approves → System generates PDF lease
2. PDF includes all terms & signatures
3. Tenant downloads & reviews
4. Tenant signs digitally (e-signature)
5. System stores signed PDF
6. Both parties get copy
```

### **Option 3: Full Document Management (Enterprise)**
```
1. Owner customizes lease template
2. System pre-fills with application data
3. Owner reviews & finalizes
4. Generates PDF with legal binding
5. Tenant receives notification
6. Tenant signs via DocuSign/Adobe Sign
7. System stores in document vault
8. Automatic reminders for renewals
```

---

## 💡 **Recommended Approach (MVP):**

### **Phase 1 (Now - Already Done):**
✅ Lease duration selector
✅ Auto-generate payments
✅ Basic approval flow

### **Phase 2 (Next - Simple Lease):**
```
Add to tenant dashboard:
└─ /tenant/dashboard/lease/[tenantId]
   └─ Show lease summary:
      ├─ Property details
      ├─ Lease dates
      ├─ Payment schedule
      ├─ Terms & conditions
      └─ [Accept Terms] button
```

### **Phase 3 (Later - PDF & E-sign):**
```
1. Install PDF library: npm install @react-pdf/renderer
2. Create lease template
3. Generate PDF on approval
4. Store in Supabase Storage
5. Add e-signature library
```

---

## 🚀 **Your System Now Has:**

```
Complete Workflow:
✅ Tenant applies with move-in date
✅ Owner reviews application
✅ Owner sets lease duration (6-36 months) ← NEW!
✅ Real-time preview of lease terms ← NEW!
✅ System calculates end date ← NEW!
✅ Auto-generates correct # of payments ← NEW!
✅ Tenant sees payments
✅ Tenant pays via Xendit
✅ Owner tracks payments
```

---

## 📝 **Summary:**

**What Changed:**
- ✅ Added lease duration selector (6, 12, 24 months + custom)
- ✅ Added real-time preview
- ✅ Shows calculated end date
- ✅ Shows total payments & rent
- ✅ Better UX with clear summary

**How It Works:**
1. **Tenant:** Sets move-in date only
2. **Owner:** Chooses lease duration during approval
3. **System:** Calculates everything automatically

**Result:**
- ✅ Flexible lease terms
- ✅ No more hardcoded 1-year leases
- ✅ Owner has full control
- ✅ Clear preview before approval

---

**Your lease approval workflow is now complete and production-ready!** 🎉

**Want to add the lease agreement PDF next?** 📄

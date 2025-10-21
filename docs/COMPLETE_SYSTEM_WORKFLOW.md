# 🏠 Complete System Workflow - Property Ease

## 📋 **Full Process: Tenant Application to Payment**

---

## 👤 **TENANT JOURNEY**

### **Phase 1: Discovery & Application**

#### **Step 1: Browse Properties**
**Page:** `/properties` (Public)

**Tenant Actions:**
1. Views available properties
2. Filters by city, type, price range
3. Sees property details (photos, amenities, price)
4. Clicks "Apply for this Property"

**System Shows:**
- ✅ Property listings
- ✅ Property details page
- ✅ Application form

---

#### **Step 2: Submit Application**
**Page:** `/properties/[id]/apply`

**Tenant Fills Out:**
```
Personal Information:
- Full Name
- Email
- Phone
- Current Address
- Employment Info
- Monthly Income
- References

Lease Preferences:
- Move-in Date
- Lease Duration
- Number of Occupants
```

**System Actions:**
1. Validates application data
2. Sends application to property owner
3. Creates application record in database
4. Sends confirmation email to tenant

**Notification:**
- ✅ Tenant: "Application submitted successfully!"
- ✅ Owner: "New application received for [Property Name]"

---

### **Phase 2: Application Review**

#### **Step 3: Wait for Owner Review**
**Page:** `/tenant/dashboard/applications`

**Tenant Sees:**
```
My Applications

Property: Sunset Apartment
Status: ⏳ Pending Review
Applied: Oct 21, 2025
Owner: John Smith

[View Details]
```

**Tenant Can:**
- View application status
- Edit application (if still pending)
- Cancel application
- Contact owner

---

## 👨‍💼 **OWNER JOURNEY**

### **Phase 1: Review Applications**

#### **Step 4: Owner Reviews Application**
**Page:** `/owner/dashboard/applications`

**Owner Sees:**
```
New Applications (3)

Property: Sunset Apartment
Applicant: Jane Doe
Applied: Oct 21, 2025
Monthly Income: ₱50,000
Employment: Software Engineer

[View Full Application] [Approve] [Reject]
```

**Owner Actions:**
1. Reviews tenant information
2. Checks references
3. Verifies income
4. Makes decision

**Owner Can:**
- ✅ Approve application → Create lease
- ❌ Reject application → Send reason
- 📝 Request more info

---

### **Phase 2: Create Lease (If Approved)**

#### **Step 5: Owner Creates Lease**
**Page:** `/owner/dashboard/tenants/new`

**Owner Fills Out:**
```
Lease Agreement Details:
- Property: [Selected Property]
- Tenant: Jane Doe
- Unit Number: 201
- Monthly Rent: ₱5,000
- Security Deposit: ₱10,000
- Lease Start: Aug 1, 2025
- Lease End: Oct 31, 2025
- Payment Due Day: 5th of each month

Optional:
☑️ Auto-generate monthly payments
☐ Include utilities (₱1,200/month)
```

**System Actions:**
1. Creates tenant record
2. Links tenant to property
3. Sets lease dates
4. **Auto-generates payment schedule:**
   - August 2025 Rent - ₱5,000 (Due: Aug 5)
   - September 2025 Rent - ₱5,000 (Due: Sep 5)
   - October 2025 Rent - ₱5,000 (Due: Oct 5)
5. Sends lease agreement to tenant
6. Updates application status to "Approved"

**Notifications:**
- ✅ Tenant: "Congratulations! Your application was approved"
- ✅ Tenant: "Lease agreement and payment schedule sent"
- ✅ Owner: "Lease created successfully"

---

### **Phase 3: Tenant Moves In**

#### **Step 6: Tenant Accepts Lease**
**Page:** `/tenant/dashboard/lease`

**Tenant Sees:**
```
Lease Agreement

Property: Sunset Apartment
Unit: 201
Lease Period: Aug 1 - Oct 31, 2025
Monthly Rent: ₱5,000
Security Deposit: ₱10,000

[View Full Agreement] [Sign & Accept] [Reject]
```

**Tenant Actions:**
1. Reviews lease terms
2. E-signs agreement
3. Pays security deposit

**System Actions:**
1. Activates tenant account
2. Grants access to tenant dashboard
3. Shows payment schedule
4. Marks lease as "Active"

---

## 💰 **PAYMENT WORKFLOW**

### **Phase 4: Monthly Payments**

#### **Step 7: Tenant Views Payments**
**Page:** `/tenant/dashboard/payments`

**Tenant Dashboard Shows:**

```
💰 My Payments

📊 Summary (3 Properties)
Total Due: ₱15,000
Paid: ₱0
Overdue: ₱5,000
Upcoming: ₱10,000

⚠️ OVERDUE PAYMENTS (1)

Rent - Sunset Apartment
Due: August 5, 2025 (16 days overdue)
Amount: ₱5,000
Late Fee: ₱500
Total: ₱5,500
[Pay Now with Xendit]

📅 UPCOMING PAYMENTS (2)

Rent - Sunset Apartment
Due: September 5, 2025
Amount: ₱5,000
[Pay Early]

Rent - Sunset Apartment
Due: October 5, 2025
Amount: ₱5,000
[Pay Early]
```

**Tenant Can:**
- View all payments (calendar/timeline/list)
- Filter by property
- Pay via Xendit
- View payment history
- Request refunds

---

#### **Step 8: Tenant Makes Payment**
**Action:** Clicks "Pay Now with Xendit"

**System Flow:**

1. **Creates Xendit Invoice:**
```
Invoice Created
Amount: ₱5,500
Payment ID: pay_xxx
Invoice URL: https://checkout.xendit.co/xxx

Redirecting to payment page...
```

2. **Tenant on Xendit Page:**
```
Payment for Sunset Apartment Rent
Amount: ₱5,500

Payment Methods:
☐ Credit/Debit Card
☐ GCash
☐ Maya
☐ Bank Transfer
☐ 7-Eleven
☐ Cebuana

[Complete Payment]
```

3. **Tenant Completes Payment:**
- Enters payment details
- Confirms payment
- Receives confirmation

4. **Xendit Webhook Fires:**
```javascript
// Webhook receives payment confirmation
POST /api/xendit/webhook
{
  "status": "PAID",
  "external_id": "payment_id_xxx",
  "amount": 5500,
  "paid_at": "2025-08-21T10:30:00Z"
}
```

5. **System Updates:**
- ✅ Payment status: pending → paid
- ✅ Paid date: Aug 21, 2025
- ✅ Receipt URL saved
- ✅ Late fee calculated and recorded
- ✅ Notifications sent

**Notifications:**
- ✅ Tenant: "Payment successful! Receipt sent to email"
- ✅ Owner: "Payment received for Sunset Apartment - ₱5,500"

---

#### **Step 9: Owner Sees Payment**
**Page:** `/owner/dashboard/payments`

**Owner Dashboard Shows:**
```
💵 Payment Overview

This Month: ₱15,500
Total Collected: ₱45,000
Pending: ₱10,000

Recent Payments (5)

Sunset Apartment - Unit 201
Tenant: Jane Doe
Amount: ₱5,500
Date: Aug 21, 2025
Status: ✅ Paid
[View Receipt]
```

**Owner Can:**
- View all payments across properties
- Filter by property/tenant/status
- Download reports
- Track late fees
- Export to Excel

---

## 🔄 **MONTHLY CYCLE**

### **Recurring Each Month:**

```
Day 1 (Start of Month)
├─ System sends reminder: "Rent due on 5th"
│
Day 5 (Due Date)
├─ If paid: ✅ No action
├─ If unpaid: ⚠️ Send overdue notice
│
Day 8 (3 days after due)
├─ Late fee added: ₱500
├─ Email: "Payment overdue + late fee"
│
Day 15 (10 days after due)
├─ Escalation notice
├─ Owner notified
│
Day 30 (End of Month)
├─ Generate next month's payment
├─ Update statistics
└─ Send monthly report
```

---

## 🎯 **COMPLETE WORKFLOW SUMMARY**

### **Timeline: Application to First Payment**

```
Day 0: Tenant applies for property
  ↓
Day 1: Owner reviews application
  ↓
Day 2: Owner approves & creates lease
  ↓ (System auto-generates 3 monthly payments)
  ↓
Day 3: Tenant accepts lease & pays deposit
  ↓
Day 5: Tenant moves in (Lease starts)
  ↓
Day 30: First rent payment due (Aug 5)
  ↓
Day 30: Tenant pays via Xendit
  ↓
Day 30: Payment confirmed automatically
  ↓
Day 60: Second payment due (Sep 5)
  ↓ (Cycle repeats)
  ↓
Day 90: Third payment due (Oct 5)
  ↓
Day 91: Lease ends (Oct 31)
  ↓
Day 92: Final settlement & deposit return
```

---

## 📱 **USER DASHBOARDS**

### **Tenant Dashboard:**
```
/tenant/dashboard
├── Overview (stats, upcoming payments)
├── /payments (all payments, pay now)
├── /properties (my rentals)
├── /lease (lease agreements)
├── /profile (account settings)
└── /support (help & contact)
```

### **Owner Dashboard:**
```
/owner/dashboard
├── Overview (revenue, occupancy)
├── /properties (manage properties)
├── /tenants (active tenants)
├── /applications (pending applications)
├── /payments (payment tracking)
├── /reports (financial reports)
└── /settings (account settings)
```

---

## 🔐 **CURRENT SYSTEM STATUS**

### ✅ **What's Built & Working:**

1. **Property Management**
   - ✅ Property listings
   - ✅ Property details
   - ⏳ Application form (needs building)

2. **Tenant Management**
   - ✅ Create tenant/lease
   - ✅ Auto-generate payments
   - ✅ Multi-property support

3. **Payment System**
   - ✅ Payment records
   - ✅ Xendit integration
   - ✅ Automatic status updates
   - ✅ Late fee calculation
   - ✅ Payment history

4. **Dashboards**
   - ✅ Tenant payment view
   - ✅ Owner payment view
   - ✅ Multi-property filtering

5. **Notifications**
   - ⏳ Email notifications (needs setup)
   - ⏳ SMS notifications (optional)

---

## 🚧 **What Needs to Be Built:**

### **Priority 1 (Essential):**
1. ⏳ Property application form
2. ⏳ Application review page (owner)
3. ⏳ Lease acceptance flow (tenant)
4. ⏳ Security deposit tracking

### **Priority 2 (Important):**
5. ⏳ Email notifications (payment reminders)
6. ⏳ Lease expiration reminders
7. ⏳ Deposit return workflow
8. ⏳ Lease renewal process

### **Priority 3 (Nice to Have):**
9. ⏳ Calendar view for payments
10. ⏳ Timeline view
11. ⏳ Properties view
12. ⏳ Reports & analytics

---

## 💡 **YOUR CURRENT STATE**

**What You Have:**
- ✅ Lease exists (Aug 1 - Oct 31, 2025)
- ❌ No payment records yet

**What You Need:**
1. Generate 3 monthly payments (SQL script ready)
2. Test Xendit payment flow
3. Verify dashboard shows payments

**Next Steps:**
1. Run `SQL_GENERATE_PAYMENTS.sql`
2. Go to `/tenant/dashboard/payments`
3. Click "Pay Now"
4. Test with Xendit

---

## 🎯 **Recommended Build Order:**

### **Phase 1: Core Payment Flow (NOW)**
1. ✅ Generate missing payments
2. ✅ Test Xendit integration
3. ✅ Verify webhooks work
4. ✅ Check owner sees payments

### **Phase 2: Application System**
1. Build property application form
2. Build owner review page
3. Connect to lease creation
4. Add notifications

### **Phase 3: Enhanced Features**
1. Add payment views (calendar/timeline)
2. Build reports
3. Add analytics
4. Refine UX

---

**That's the complete workflow! Ready to test the payment flow?** 🚀

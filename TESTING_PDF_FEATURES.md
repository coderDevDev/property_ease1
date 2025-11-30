# 🧪 Testing Guide: PDF Lease Date & Dynamic Title Features

## 📋 What Was Fixed

1. **Lease Date Display** - Shows "Contract Valid Until" with proper date formatting
2. **Dynamic PDF Title** - Title changes based on what you're exporting
3. **Proper Date Formatting** - Dates show as "January 15, 2025" instead of invalid dates

---

## 🧪 Test Scenarios

### **Test 1: Export All Payments (Default)**

**Steps:**
1. Login as **Tenant**
2. Navigate to: `/tenant/dashboard/payments`
3. Click **"Export as PDF"** button
4. In the dialog:
   - **Status**: Leave as "All"
   - **Type**: Leave as "All"
5. Click **"Generate PDF"**

**Expected Results:**
- ✅ PDF title: **"PAYMENT SCHEDULE"**
- ✅ Shows "Contract Valid Until: [Date]" (e.g., "January 15, 2025")
- ✅ Shows "Lease Period: [Start Date] - [End Date]"
- ✅ Dates are properly formatted (not "Invalid Date")
- ✅ Filename: `payment-schedule-[PropertyName]-[UnitNumber].pdf`

---

### **Test 2: Export Paid Payments Only**

**Steps:**
1. Go to `/tenant/dashboard/payments`
2. Click **"Export as PDF"**
3. In the dialog:
   - **Status**: Select **"Paid"**
   - **Type**: Leave as "All"
4. Click **"Generate PDF"**

**Expected Results:**
- ✅ PDF title: **"PAID PAYMENTS REPORT"** ⭐ (NEW - Dynamic title)
- ✅ Shows "Contract Valid Until: [Date]"
- ✅ Only paid payments are included in the table
- ✅ Filename: `paid-payments-report-[PropertyName]-[UnitNumber].pdf`

---

### **Test 3: Export Pending Payments Only**

**Steps:**
1. Go to `/tenant/dashboard/payments`
2. Click **"Export as PDF"**
3. In the dialog:
   - **Status**: Select **"Pending"**
   - **Type**: Leave as "All"
4. Click **"Generate PDF"**

**Expected Results:**
- ✅ PDF title: **"PENDING PAYMENTS REPORT"** ⭐ (NEW)
- ✅ Shows "Contract Valid Until: [Date]"
- ✅ Only pending payments are included
- ✅ Filename: `pending-payments-report-[PropertyName]-[UnitNumber].pdf`

---

### **Test 4: Export Overdue Payments Only**

**Steps:**
1. Go to `/tenant/dashboard/payments`
2. Click **"Export as PDF"**
3. In the dialog:
   - **Status**: Select **"Overdue"**
   - **Type**: Leave as "All"
4. Click **"Generate PDF"**

**Expected Results:**
- ✅ PDF title: **"OVERDUE PAYMENTS REPORT"** ⭐ (NEW)
- ✅ Shows "Contract Valid Until: [Date]"
- ✅ Only overdue payments are included
- ✅ Filename: `overdue-payments-report-[PropertyName]-[UnitNumber].pdf`

---

### **Test 5: Export Rent Payments Only**

**Steps:**
1. Go to `/tenant/dashboard/payments`
2. Click **"Export as PDF"**
3. In the dialog:
   - **Status**: Leave as "All"
   - **Type**: Select **"Rent"**
4. Click **"Generate PDF"**

**Expected Results:**
- ✅ PDF title: **"RENT PAYMENTS REPORT"** ⭐ (NEW)
- ✅ Shows "Contract Valid Until: [Date]"
- ✅ Only rent payments are included
- ✅ Filename: `rent-payments-report-[PropertyName]-[UnitNumber].pdf`

---

### **Test 6: Export Paid Rent Payments (Combined Filters)**

**Steps:**
1. Go to `/tenant/dashboard/payments`
2. Click **"Export as PDF"**
3. In the dialog:
   - **Status**: Select **"Paid"**
   - **Type**: Select **"Rent"**
4. Click **"Generate PDF"**

**Expected Results:**
- ✅ PDF title: **"RENT PAID PAYMENTS REPORT"** ⭐ (NEW - Combined)
- ✅ Shows "Contract Valid Until: [Date]"
- ✅ Only paid rent payments are included
- ✅ Filename: `rent-paid-payments-report-[PropertyName]-[UnitNumber].pdf`

---

### **Test 7: Export Other Payment Types**

**Test with different types:**
- **Type: Deposit** → Title: "DEPOSIT PAYMENTS REPORT"
- **Type: Security Deposit** → Title: "SECURITY DEPOSIT PAYMENTS REPORT"
- **Type: Utility** → Title: "UTILITY PAYMENTS REPORT"
- **Type: Penalty** → Title: "PENALTY PAYMENTS REPORT"

**Expected Results:**
- ✅ Each type shows appropriate title
- ✅ "Contract Valid Until" date is always shown
- ✅ Only payments of that type are included

---

### **Test 8: Verify Lease Date Display**

**Steps:**
1. Export any PDF (use Test 1)
2. Open the PDF
3. Check the "TENANT INFORMATION" section

**Expected Results:**
- ✅ **"Contract Valid Until: [Date]"** is shown ⭐ (NEW)
  - Format: "January 15, 2025" (not "1/15/2025" or "Invalid Date")
- ✅ **"Lease Period: [Start] - [End]"** is also shown
  - Format: "January 1, 2024 - January 15, 2025"
- ✅ Dates are readable and properly formatted
- ✅ No "Invalid Date" or "NaN" errors

---

### **Test 9: Test with Missing Lease Dates**

**Edge Case Test:**
1. If a tenant has no `lease_end` date in database
2. Export PDF

**Expected Results:**
- ✅ Shows: "Contract Valid Until: Not specified"
- ✅ PDF still generates successfully
- ✅ No errors in console

---

### **Test 10: Test from Rental Details Page**

**Steps:**
1. Login as **Tenant**
2. Navigate to: `/tenant/dashboard/rental/[id]`
3. Find an approved rental application
4. Click **"Download Payment Schedule"** button

**Expected Results:**
- ✅ PDF title: **"PAYMENT SCHEDULE"** (default, no filters)
- ✅ Shows "Contract Valid Until: [Date]"
- ✅ Uses rental's `move_in_date` + 12 months for lease end
- ✅ All payments for that rental are included

---

### **Test 11: Test from Lease Page**

**Steps:**
1. Login as **Tenant**
2. Navigate to: `/tenant/dashboard/lease`
3. Click **"Download Payment Schedule"** button

**Expected Results:**
- ✅ PDF title: **"PAYMENT SCHEDULE"**
- ✅ Shows "Contract Valid Until: [Date]" from lease_end
- ✅ All lease payments are included

---

## ✅ Checklist

### Lease Date Display
- [ ] "Contract Valid Until" is shown in PDF
- [ ] Date format is readable (e.g., "January 15, 2025")
- [ ] "Lease Period" is also shown
- [ ] No "Invalid Date" errors
- [ ] Handles missing dates gracefully

### Dynamic PDF Title
- [ ] "PAYMENT SCHEDULE" when exporting all
- [ ] "PAID PAYMENTS REPORT" when filtering by paid status
- [ ] "PENDING PAYMENTS REPORT" when filtering by pending status
- [ ] "OVERDUE PAYMENTS REPORT" when filtering by overdue status
- [ ] "RENT PAYMENTS REPORT" when filtering by rent type
- [ ] Combined titles work (e.g., "RENT PAID PAYMENTS REPORT")
- [ ] All payment types show correct titles

### PDF Generation
- [ ] PDF generates without errors
- [ ] Filename matches the title
- [ ] All expected data is included
- [ ] Dates are properly formatted throughout

---

## 🐛 Troubleshooting

### Issue: PDF shows "Invalid Date"
**Solution:**
- Check that `lease_end` date exists in database
- Verify date format in database (should be ISO string or timestamp)
- Check browser console for date parsing errors

### Issue: PDF title is always "PAYMENT SCHEDULE"
**Solution:**
- Verify you're selecting filters in the export dialog
- Check that `exportType` and `exportStatus` are being passed to PDF generator
- Check browser console for errors

### Issue: "Contract Valid Until" not showing
**Solution:**
- Verify `leaseEnd` is passed to `generatePaymentSchedulePDF()`
- Check that date is valid (not null/undefined)
- Check browser console for errors

### Issue: Dates show as numbers (e.g., "1735689600000")
**Solution:**
- This means dates are being passed as timestamps
- The code should handle this, but verify dates are ISO strings or Date objects

---

## 📊 Quick Test Script

**Fastest way to test all features:**

1. **Export All Payments**
   - Title: "PAYMENT SCHEDULE" ✅
   - Check "Contract Valid Until" date ✅

2. **Export Paid Only**
   - Title: "PAID PAYMENTS REPORT" ✅

3. **Export Rent Only**
   - Title: "RENT PAYMENTS REPORT" ✅

4. **Export Paid Rent**
   - Title: "RENT PAID PAYMENTS REPORT" ✅

5. **Check Date Format**
   - Open any PDF
   - Verify "Contract Valid Until: January 15, 2025" format ✅

**Total time: ~3 minutes** ⏱️

---

## 📝 Expected PDF Structure

```
┌─────────────────────────────────────┐
│     [DYNAMIC TITLE]                 │
│     Generated on: [Date]            │
├─────────────────────────────────────┤
│ TENANT INFORMATION                  │
│ Tenant: [Name]                      │
│ Property: [Property Name]           │
│ Unit: [Unit Number]                 │
│ Contract Valid Until: [Date] ⭐     │
│ Lease Period: [Start] - [End]      │
├─────────────────────────────────────┤
│ Payment Summary                     │
│ ...                                 │
├─────────────────────────────────────┤
│ Payment Table                       │
│ ...                                 │
└─────────────────────────────────────┘
```

---

## 🎯 Key Points

1. **Title is Dynamic** - Changes based on what you export
2. **Contract Valid Until** - Always shows when lease_end exists
3. **Date Formatting** - Uses readable format (e.g., "January 15, 2025")
4. **Error Handling** - Shows "Not specified" if date is missing
5. **Combined Filters** - Title combines type and status when both are selected

---

Happy Testing! 🚀


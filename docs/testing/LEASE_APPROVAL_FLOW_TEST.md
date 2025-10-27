# Lease Approval Flow - Testing Guide

## Complete Flow Verification

### **Step 1: Run Migration**
First, ensure the database function is updated:

```sql
-- Run in Supabase SQL Editor
-- File: 010_fix_lease_duration.sql
```

✅ Migration should complete without errors

---

### **Step 2: Owner Approves Application**

#### **Actions:**
1. Login as owner
2. Go to `/owner/dashboard/applications`
3. Click on a **pending** application
4. Click **"Approve Application"**
5. Modal opens: **"Approve Application & Set Lease Terms"**

#### **In the Modal:**

**Lease Duration Section:**
```
┌─────────────────────────────────────┐
│ Lease Duration *                    │
│ [6 Months] [12 Months] [24 Months] │
│                                     │
│ Or select custom duration:          │
│ [Dropdown: 1, 3, 6, 9, 12, 18, 24, 36 months]
└─────────────────────────────────────┘
```

**Lease Terms Summary:**
```
┌─────────────────────────────────────┐
│ ✓ Lease Terms Summary               │
│                                     │
│ Start Date: October 31, 2025       │
│ End Date: April 31, 2026           │ ← Should update based on duration
│ Total Duration: 6 Months            │ ← Should match selection
│ Monthly Payments: 6 payments        │
│ Total Rent: ₱60,000                 │
└─────────────────────────────────────┘
```

#### **Test Different Durations:**

**6 Months:**
- Select: 6 Months
- End Date should be: **6 months from start**
- Click "Approve and Create Lease"

**12 Months:**
- Select: 12 Months
- End Date should be: **12 months from start**
- Click "Approve and Create Lease"

**24 Months:**
- Select: 24 Months
- End Date should be: **24 months from start**
- Click "Approve and Create Lease"

---

### **Step 3: Check Console Logs**

When you click "Approve and Create Lease", check browser console:

```
🚀 Calling RPC with params: {
  application_id: "...",
  lease_duration_months: 6
}
📅 Lease Duration: 6 months
📆 Expected End Date: 4/31/2026
✅ RPC Result: [{success: true, tenant_id: "...", message: "..."}]
```

**Verify:**
- ✅ `lease_duration_months` is correct (6, 12, 24, etc.)
- ✅ Expected End Date matches your selection
- ✅ RPC Result shows `success: true`

---

### **Step 4: Verify Database**

After approval, check the database:

```sql
-- Check tenant record
SELECT 
  user_id,
  property_id,
  lease_start,
  lease_end,
  EXTRACT(YEAR FROM AGE(lease_end, lease_start)) * 12 + 
  EXTRACT(MONTH FROM AGE(lease_end, lease_start)) as months_duration
FROM tenants
WHERE user_id = 'USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Results:**

**For 6 Months:**
```
lease_start: 2025-10-31
lease_end: 2026-04-31
months_duration: 6
```

**For 12 Months:**
```
lease_start: 2025-10-31
lease_end: 2026-10-31
months_duration: 12
```

**For 24 Months:**
```
lease_start: 2025-10-31
lease_end: 2027-10-31
months_duration: 24
```

---

### **Step 5: Owner Downloads Lease**

1. Stay on `/owner/dashboard/applications`
2. Find the **approved** application
3. Click the **green download icon** (📥)
4. PDF should download

**Check PDF:**
- ✅ Lease Start Date: October 31, 2025
- ✅ Lease End Date: April 31, 2026 (for 6 months)
- ✅ Lease Duration: 6 Months
- ✅ Monthly Rent: ₱10,000
- ✅ Total Rent: ₱60,000

---

### **Step 6: Tenant Downloads Lease**

1. Login as tenant
2. Go to `/tenant/dashboard/applications`
3. Find the **approved** application
4. Click **"Download Lease"** button
5. PDF should download

**Check PDF:**
- ✅ Same dates as owner's PDF
- ✅ Same duration as owner selected
- ✅ All information matches

---

## What Gets Created

### **When Owner Approves with 6 Months:**

```
rental_applications
├─ status: 'approved' ✅
└─ updated_at: NOW()

tenants (NEW RECORD)
├─ user_id: [tenant's user_id]
├─ property_id: [property_id]
├─ lease_start: 2025-10-31
├─ lease_end: 2026-04-31  ← 6 months later ✅
├─ monthly_rent: 10000
├─ deposit: 20000
├─ security_deposit: 10000
└─ status: 'active'

properties
└─ occupied_units: +1 ✅

audit_logs (NEW RECORD)
└─ new_values: {
    tenant_id: "...",
    lease_duration_months: 6,  ← Logged ✅
    lease_end_date: "2026-04-31"
  }
```

---

## Troubleshooting

### **Issue: End Date Not Updating in Modal**
**Check:**
- Is `leaseDuration` state changing?
- Open React DevTools → Check component state

### **Issue: Wrong Duration in Database**
**Check Console:**
```
🚀 Calling RPC with params: {...}
```
- Verify `lease_duration_months` value
- Should match what you selected

### **Issue: PDF Shows Wrong Dates**
**Check:**
1. Database tenant record (query above)
2. Console logs when downloading
3. Tenant record exists and has correct dates

### **Issue: Migration Failed**
**Error:** Function already exists
**Solution:** Run the DO block version that drops all function signatures

---

## Expected Behavior Summary

### **✅ Correct Flow:**

```
1. Owner selects 6 months
   ↓
2. Modal shows: "End Date: April 31, 2026"
   ↓
3. Owner clicks "Approve and Create Lease"
   ↓
4. Console shows: lease_duration_months: 6
   ↓
5. Database creates tenant with lease_end = 6 months later
   ↓
6. Owner downloads PDF → Shows 6 months
   ↓
7. Tenant downloads PDF → Shows 6 months
```

### **❌ Wrong Flow (Old Behavior):**

```
1. Owner selects 6 months
   ↓
2. Modal shows: "End Date: April 31, 2026"
   ↓
3. Owner clicks "Approve and Create Lease"
   ↓
4. Database ignores duration, uses 12 months ❌
   ↓
5. Database creates tenant with lease_end = 12 months later ❌
   ↓
6. Owner downloads PDF → Shows 12 months ❌
   ↓
7. Tenant downloads PDF → Shows 12 months ❌
```

---

## Quick Test Checklist

- [ ] Migration ran successfully
- [ ] Modal shows correct end date when selecting duration
- [ ] Console logs show correct `lease_duration_months`
- [ ] Database tenant record has correct `lease_end`
- [ ] Owner can download lease with correct dates
- [ ] Tenant can download lease with correct dates
- [ ] PDF shows correct duration (6, 12, 24 months)
- [ ] All dates match across owner, tenant, and database

---

**Date**: October 25, 2025  
**Status**: Ready for Testing  
**Files Changed**: 4  
**Migration Required**: Yes (010_fix_lease_duration.sql)

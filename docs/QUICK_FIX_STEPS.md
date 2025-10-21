# 🚀 Quick Fix - Run This Now!

## ✅ **Step-by-Step:**

### **1. Open Supabase SQL Editor**
```
https://supabase.com/dashboard
→ Your Project
→ SQL Editor (left sidebar)
→ New Query
```

### **2. Copy & Run This SQL**

Open file: `database/UPDATE_APPROVE_FUNCTION.sql`

**Copy everything** and paste into Supabase SQL Editor

**Click "Run"** (or press Ctrl+Enter)

### **3. You Should See:**
```
✅ Success
Rows returned: 0
```

---

## 🎯 **What Was Fixed:**

### **Error 1:** Missing `lease_duration_months` parameter
**Solution:** ✅ Added parameter to function

### **Error 2:** Missing `deposit` field
**Solution:** ✅ Added deposit = monthly_rent × 2

---

## 📋 **What the Function Now Does:**

```sql
CREATE FUNCTION approve_rental_application(
  application_id UUID,
  lease_duration_months INTEGER DEFAULT 12  ← NEW!
)

-- Creates tenant with:
├─ monthly_rent (from property)
├─ deposit = monthly_rent × 2  ← FIXED!
├─ lease_start = move_in_date
├─ lease_end = move_in_date + duration  ← DYNAMIC!
└─ status = 'active'

-- Generates payments:
└─ X monthly payments (X = lease_duration_months)
```

---

## 🧪 **Test It:**

After running SQL:

1. Go to: `/owner/dashboard/applications`
2. Click **Approve** on pending application
3. Select lease duration (6, 12, or 24 months)
4. Click **Approve & Create Lease**

**Should work now!** ✅

---

## 💡 **What Happens:**

```
Owner approves with 12 months
        ↓
Function creates:
├─ Tenant record
│  ├─ Rent: ₱5,000/month
│  ├─ Deposit: ₱10,000 (2 months)
│  ├─ Start: Oct 30, 2025
│  └─ End: Oct 30, 2026
└─ 12 Payment records
   ├─ Nov 5, 2025 - ₱5,000
   ├─ Dec 5, 2025 - ₱5,000
   └─ ... (10 more)
```

---

## 🔧 **Deposit Calculation:**

Default: **2 months rent**

Examples:
- Rent ₱5,000 → Deposit ₱10,000
- Rent ₱8,000 → Deposit ₱16,000
- Rent ₱3,500 → Deposit ₱7,000

---

## ✅ **After Running SQL:**

Your system will have:
- ✅ Flexible lease duration (6-36 months)
- ✅ Auto-calculated deposit (2× rent)
- ✅ Auto-generated payments
- ✅ Dynamic lease end date
- ✅ No more errors!

---

**Go run the SQL now! Takes 30 seconds!** 🚀

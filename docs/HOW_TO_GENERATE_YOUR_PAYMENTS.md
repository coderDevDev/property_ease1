# 🎯 Generate Your Missing Payments - Step by Step

## 📋 **What You Need:**

Your lease exists but has no payment records. Let's fix that!

**Lease:** August 1 - October 31, 2025  
**Missing:** 3 monthly rent payments

---

## 🔍 **Step 1: Get Your IDs from Database**

### **Open Supabase:**

1. Go to https://supabase.com/dashboard
2. Select your project: `pracvktfoiilhobuzxel`
3. Click **SQL Editor**

### **Run this query:**

```sql
-- Get your tenant record
SELECT
  id as tenant_id,
  user_id,
  property_id,
  monthly_rent,
  lease_start,
  lease_end
FROM tenants
WHERE user_id = '68ef2303-86b5-433a-993d-ee391d436461'
  AND status = 'active';
```

**Copy these values:**

- `tenant_id` (from `id` column)
- `property_id`
- `monthly_rent`

---

## 🚀 **Step 2: Generate Payments**

### **Option A: Using SQL (Easiest)**

Run this in Supabase SQL Editor:

```sql
-- First, get your tenant_id and property_id from Step 1
-- Then replace the values below

INSERT INTO payments (
  tenant_id,
  property_id,
  payment_type,
  amount,
  due_date,
  payment_status,
  created_by,
  notes
)
VALUES
  -- August 2025
  (
    'YOUR_TENANT_ID_HERE',
    'YOUR_PROPERTY_ID_HERE',
    'rent',
    5000,
    '2025-08-05',
    'pending',
    'OWNER_USER_ID_HERE',
    'Auto-generated rent payment for August 2025'
  ),
  -- September 2025
  (
    'YOUR_TENANT_ID_HERE',
    'YOUR_PROPERTY_ID_HERE',
    'rent',
    5000,
    '2025-09-05',
    'pending',
    'OWNER_USER_ID_HERE',
    'Auto-generated rent payment for September 2025'
  ),
  -- October 2025
  (
    'YOUR_TENANT_ID_HERE',
    'YOUR_PROPERTY_ID_HERE',
    'rent',
    5000,
    '2025-10-05',
    'pending',
    'OWNER_USER_ID_HERE',
    'Auto-generated rent payment for October 2025'
  );
```

**Replace:**

- `YOUR_TENANT_ID_HERE` → Your tenant_id from Step 1
- `YOUR_PROPERTY_ID_HERE` → Your property_id from Step 1
- `OWNER_USER_ID_HERE` → Property owner's user_id
- `5000` → Your actual monthly rent amount

---

### **Option B: Using the Script (Advanced)**

1. **Edit the script:**

Open: `client/scripts/generateMissingPayments.ts`

Replace these values:

```typescript
const TENANT_ID = 'your-tenant-id-from-step-1';
const PROPERTY_ID = 'your-property-id-from-step-1';
const OWNER_USER_ID = 'owner-user-id-from-database';
```

2. **Run it:**

```bash
cd client
npx ts-node scripts/generateMissingPayments.ts
```

---

## ✅ **Step 3: Verify Payments Created**

### **Check in Supabase:**

```sql
-- See your newly created payments
SELECT
  payment_type,
  amount,
  due_date,
  payment_status,
  notes
FROM payments
WHERE tenant_id = 'YOUR_TENANT_ID_HERE'
ORDER BY due_date;
```

**You should see:**

```
rent | 5000 | 2025-08-05 | pending | Auto-generated rent payment for August 2025
rent | 5000 | 2025-09-05 | pending | Auto-generated rent payment for September 2025
rent | 5000 | 2025-10-05 | pending | Auto-generated rent payment for October 2025
```

---

## 🎉 **Step 4: Check Tenant Dashboard**

1. Login as tenant
2. Go to `/tenant/dashboard/payments`
3. **You should now see:**

```
💰 My Payments

⚠️ OVERDUE PAYMENTS (3)

Rent - [Property Name]
Due: August 5, 2025 (X days overdue)
₱5,000 (+ late fee)
[Pay Now]

Rent - [Property Name]
Due: September 5, 2025 (X days overdue)
₱5,000 (+ late fee)
[Pay Now]

Rent - [Property Name]
Due: October 5, 2025 (X days overdue)
₱5,000 (+ late fee)
[Pay Now]
```

4. **Click "Pay Now"** to pay via Xendit! 💳

---

## 🎨 **View in Different Modes:**

Once payments are created, try:

- **[Calendar]** → See payments on calendar
- **[Timeline]** → See upcoming 30 days
- **[Properties]** → See by property

---

## 📝 **What Gets Created:**

```
Payment 1:
- Type: Rent
- Amount: ₱5,000
- Due: August 5, 2025
- Status: Pending

Payment 2:
- Type: Rent
- Amount: ₱5,000
- Due: September 5, 2025
- Status: Pending

Payment 3:
- Type: Rent
- Amount: ₱5,000
- Due: October 5, 2025
- Status: Pending

Total: ₱15,000 over 3 months
```

---

## 🚨 **Troubleshooting:**

### **Error: Tenant ID not found**

→ Check your user_id in the SQL query from Step 1

### **Error: Missing created_by**

→ Add owner's user_id to the SQL INSERT

### **Payments don't show in dashboard**

→ Refresh the page, check tenant_id matches your user

### **Wrong amount**

→ Update `amount` in the SQL INSERT

---

## 💡 **Tips:**

**Adjust Due Date:**
Change `'2025-08-05'` to any day you want (e.g., `'2025-08-01'` for 1st of month)

**Add Utilities:**
Add more rows with `payment_type = 'utility'`

**Different Amount Each Month:**
Change the `amount` value for each INSERT

---

## ✅ **Summary:**

**Quick Steps:**

1. Get tenant_id and property_id from database
2. Run SQL INSERT with your IDs
3. Check payments created
4. View in tenant dashboard
5. Pay via Xendit!

**Time:** 2-3 minutes  
**Result:** 3 payments ready to pay

---

**That's it! Your missing payments will be created and you can start using the system!** 🎉

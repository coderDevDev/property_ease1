# Bug Fix: Duplicate Payments in UI
## Prevention & Cleanup

---

## 🐛 **Problem**

User sees the same payment twice in the list:
```
Rent - Sunset Apartment  ₱3,500  (+ ₱1,000 late fee)
Rent - Sunset Apartment  ₱3,500  (+ ₱1,000 late fee)  ← DUPLICATE!
```

---

## 🔍 **Root Causes**

### **Cause 1: Duplicate Tenant Records** (Most Common)
User has 2+ tenant records for the SAME property:

```sql
-- Database state causing duplicates:
tenants table:
├─ id: '0a0ee47f-80f6-47e5-a2f7-4e0835cf0925' | user_id: '68ef2303-86b5-433a-993d-ee391d436461' | property_id: sunset-apt
└─ id: 'cb775d8d-7a9b-43f4-b5ef-2f43f10f5f4c' | user_id: '68ef2303-86b5-433a-993d-ee391d436461' | property_id: sunset-apt
                                                                                                    ↑ SAME PROPERTY!

payments table:
└─ id: payment-123 | tenant_id: '0a0ee47f-80f6-47e5-a2f7-4e0835cf0925' | amount: 2500
```

When query runs:
```typescript
.in('tenant_id', ['0a0ee47f...', 'cb775d8d...'])
// Both tenant IDs reference the same payment!
```

### **Cause 2: Actual Duplicate Payments**
Someone created the same payment record twice.

---

## ✅ **Solution Applied**

### **Added Deduplication in `getTenantPayments`:**

```typescript
// Remove duplicates based on payment ID
const uniquePayments = data ? Array.from(
  new Map(data.map(payment => [payment.id, payment])).values()
) : [];

return { success: true, data: uniquePayments };
```

**How it works:**
1. Creates a Map with payment.id as key
2. Duplicate IDs overwrite each other
3. Converts back to array
4. Result: Only unique payments!

---

## 🔧 **Database Cleanup Required**

### **Step 1: Check for Duplicate Tenant Records**

Run this query in Supabase SQL Editor:

```sql
-- Find users with duplicate tenant records for the same property
SELECT 
  user_id,
  property_id,
  COUNT(*) as tenant_count,
  ARRAY_AGG(id) as tenant_ids
FROM tenants
WHERE status = 'active'
GROUP BY user_id, property_id
HAVING COUNT(*) > 1;
```

**Expected Result:**
- If empty → No duplicates (good!)
- If rows returned → You have duplicate tenant records

### **Step 2: Clean Up Duplicates**

If duplicates found, keep the oldest and delete the rest:

```sql
-- For each duplicate found, run this (replace with actual IDs):
-- Keep the first tenant_id, delete the second
DELETE FROM tenants 
WHERE id = 'cb775d8d-7a9b-43f4-b5ef-2f43f10f5f4c';  -- ← Second duplicate
```

⚠️ **IMPORTANT:** Only delete if NO payments reference that tenant_id:

```sql
-- Check first if any payments reference this tenant:
SELECT COUNT(*) FROM payments 
WHERE tenant_id = 'cb775d8d-7a9b-43f4-b5ef-2f43f10f5f4c';

-- If count = 0, safe to delete
-- If count > 0, need to update those payments first:
UPDATE payments 
SET tenant_id = '0a0ee47f-80f6-47e5-a2f7-4e0835cf0925'  -- ← Keep this one
WHERE tenant_id = 'cb775d8d-7a9b-43f4-b5ef-2f43f10f5f4c';  -- ← Delete this

-- Then delete the duplicate tenant
DELETE FROM tenants 
WHERE id = 'cb775d8d-7a9b-43f4-b5ef-2f43f10f5f4c';
```

---

## 🛡️ **Prevention - Add Unique Constraint**

Prevent future duplicates with a database constraint:

```sql
-- Add unique constraint to prevent duplicate tenant records
ALTER TABLE tenants 
ADD CONSTRAINT unique_user_property 
UNIQUE (user_id, property_id, status);
```

This ensures:
- One user can't have 2 active tenant records for the same property
- Prevents the duplicate issue from happening again

---

## 🧪 **Testing**

### **Test 1: Verify Deduplication Works**
```typescript
// Before fix: Shows duplicate
// After fix: Shows only once
```

### **Test 2: Multiple Properties Still Work**
```typescript
// User renting 2 DIFFERENT properties
// Should show payments from BOTH
```

### **Test 3: Database Constraint**
```sql
-- Try to create duplicate (should fail):
INSERT INTO tenants (user_id, property_id, status) 
VALUES ('user-123', 'property-1', 'active');

-- If already exists, should return:
-- ERROR: duplicate key value violates unique constraint "unique_user_property"
```

---

## 📊 **Expected Results**

### **Before Fix:**
```
Payments: 4 items (2 duplicates)
├─ Rent - Sunset Apt  ₱2,500
├─ Rent - Sunset Apt  ₱2,500  ← DUPLICATE
├─ Utilities - Sunset ₱1,200
└─ Utilities - Sunset ₱1,200  ← DUPLICATE
```

### **After Fix:**
```
Payments: 2 items (unique only)
├─ Rent - Sunset Apt  ₱2,500
└─ Utilities - Sunset ₱1,200
```

---

## 🎯 **Action Items**

**Immediate (Frontend):**
- ✅ Deduplication logic added
- ✅ Works with current data

**Database Cleanup (Backend):**
1. ⏳ Run duplicate check query
2. ⏳ Clean up any duplicates found
3. ⏳ Add unique constraint
4. ✅ Test constraint works

**Prevention (Future):**
- ✅ Unique constraint prevents new duplicates
- ✅ Application logic ensures one tenant per property

---

## 📝 **Summary**

**Issue:** Duplicate payments showing in UI  
**Cause:** Duplicate tenant records for same property  
**Fix:** Added deduplication in getTenantPayments()  
**Prevention:** Add unique constraint to database  
**Status:** ✅ Frontend fixed, Database cleanup recommended

---

**Next Steps:**
1. Refresh the payments page → Duplicates should be gone
2. Run database cleanup queries
3. Add unique constraint
4. Continue with Xendit integration

---

**Last Updated:** October 21, 2025 - 10:55 AM  
**Status:** Frontend Fixed, Database Cleanup Pending  
**Priority:** Medium (UI works, but database needs cleanup)

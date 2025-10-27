# Maintenance Tenant Query Fix

**Date**: October 26, 2025  
**Error**: `PGRST116: Cannot coerce the result to a single JSON object`  
**Issue**: User has 7 active tenant records but query expects only 1

---

## 🔴 Problem

**Error Message**:
```
Cannot coerce the result to a single JSON object
The result contains 7 rows
```

**Query**:
```
GET /tenants?select=id&user_id=eq.68ef2303-86b5-433a-993d-ee391d436461&status=eq.active
```

**Root Cause**:
- User is tenant in 7 different properties
- Query uses `.single()` expecting 1 result
- Gets 7 results → Error

---

## ✅ Solution

The query needs to be more specific. Instead of:
```typescript
// ❌ Wrong - Gets all tenant records for user
.from('tenants')
.select('id')
.eq('user_id', userId)
.eq('status', 'active')
.single()  // Fails if user has multiple properties
```

Use one of these:
```typescript
// ✅ Option 1: Get all tenant records (no .single())
.from('tenants')
.select('id')
.eq('user_id', userId)
.eq('status', 'active')
// Returns array of tenant records

// ✅ Option 2: Get specific tenant for a property
.from('tenants')
.select('id')
.eq('user_id', userId)
.eq('property_id', propertyId)  // Add property filter
.eq('status', 'active')
.single()  // Now safe - one tenant per property

// ✅ Option 3: Get first tenant
.from('tenants')
.select('id')
.eq('user_id', userId)
.eq('status', 'active')
.limit(1)
.maybeSingle()  // Returns first or null
```

---

## 🔍 Where to Find the Issue

The error is happening somewhere that's fetching tenant_id. Search for:

```bash
# Search for the problematic pattern
grep -r "from('tenants')" --include="*.ts" --include="*.tsx"
grep -r ".single()" lib/api/
grep -r "select('id')" lib/api/
```

**Likely locations**:
1. Maintenance requests fetching
2. Notifications system
3. Dashboard data loading
4. Auth/user context

---

## 🛠️ Quick Fix

If you find code like this:
```typescript
const { data: tenant } = await supabase
  .from('tenants')
  .select('id')
  .eq('user_id', userId)
  .eq('status', 'active')
  .single();  // ❌ Remove this
```

Change to:
```typescript
const { data: tenants } = await supabase
  .from('tenants')
  .select('id')
  .eq('user_id', userId)
  .eq('status', 'active');  // ✅ Returns array

// Then use first tenant or filter by property
const tenantId = tenants?.[0]?.id;
```

---

## 📝 Recommendation

**Best Practice**: Always include `property_id` when querying tenants if you need a specific tenant:

```typescript
// ✅ Correct way
const { data: tenant } = await supabase
  .from('tenants')
  .select('id')
  .eq('user_id', userId)
  .eq('property_id', propertyId)  // Specific property
  .eq('status', 'active')
  .single();  // Safe now
```

---

## 🧪 To Debug

1. **Find the exact location**:
   - Check browser console for full stack trace
   - Look at Network tab for the failing request
   - Check which page/component is making the call

2. **Verify the fix**:
   - User should be able to access maintenance requests
   - No more PGRST116 errors
   - All 7 tenant records handled correctly

---

**Status**: ⚠️ Needs Investigation  
**Priority**: High - Blocking maintenance requests  
**Impact**: Users with multiple properties affected

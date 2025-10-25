# Query Fixes - Deposits & Tenants API

## Issues Fixed

### 1. **Supabase Import Path Error**
**Problem**: Four API files were importing from wrong path causing "Cannot read properties of undefined (reading 'from')"

**Files Fixed**:
- ✅ `lib/api/deposits.ts`
- ✅ `lib/api/utilities.ts`
- ✅ `lib/api/lease-renewal.ts`
- ✅ `lib/api/advance-payments.ts`

**Change**: 
```typescript
// Before (WRONG)
import { supabase } from '@/lib/supabase/client';

// After (CORRECT)
import { supabase } from '@/lib/supabase';
```

---

### 2. **getOwnerDeposits Query Error**
**Problem**: Cannot filter on joined table columns directly with `.eq('properties.owner_id', ownerId)`

**File**: `lib/api/deposits.ts`

**Solution**: Two-step query
```typescript
// Step 1: Get owner's property IDs
const { data: properties } = await supabase
  .from('properties')
  .select('id')
  .eq('owner_id', ownerId);

const propertyIds = properties.map(p => p.id);

// Step 2: Get deposits for those properties
const { data } = await supabase
  .from('deposit_balances')
  .select(`
    *,
    tenants(...),
    properties(...)
  `)
  .in('property_id', propertyIds);
```

---

### 3. **getTenants Query Error**
**Problem**: Same issue - cannot filter on joined table columns

**File**: `lib/api/tenants.ts`

**Solution**: Two-step query (same pattern as deposits)
```typescript
// Step 1: Get owner's property IDs
const { data: properties } = await supabase
  .from('properties')
  .select('id')
  .eq('owner_id', ownerId);

// Step 2: Get tenants for those properties
const { data } = await supabase
  .from('tenants')
  .select(`
    *,
    user:users(*),
    property:properties(*)
  `)
  .in('property_id', propertyIds);
```

---

### 4. **CreateDepositDialog Interface Mismatch**
**Problem**: TypeScript interface didn't match actual API response structure

**File**: `components/owner/CreateDepositDialog.tsx`

**Fixed**:
```typescript
// Updated interface to match API response
interface Tenant {
  id: string;
  user_id: string;
  property_id: string;
  user: {              // Changed from 'users'
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
  };
  property: {          // Changed from 'properties'
    id: string;
    name: string;
    address: string;
  };
}
```

**Display Updated**:
```tsx
{tenant.user?.first_name} {tenant.user?.last_name} - {tenant.property?.name}
```

---

## Root Cause Analysis

### Why the queries failed:
Supabase/PostgREST doesn't support filtering on joined table columns directly. You cannot do:
```typescript
.eq('joined_table.column', value)  // ❌ This doesn't work
```

### Correct Approach:
1. Query the parent table first to get IDs
2. Use `.in()` to filter the child table by those IDs

---

## Testing Checklist

After these fixes, verify:
- [ ] Deposits page loads without errors
- [ ] Owner can see existing deposits (if any)
- [ ] "Create Deposit" button works
- [ ] Tenant dropdown shows correct tenant names
- [ ] Property auto-fills correctly
- [ ] Deposit creation succeeds
- [ ] New deposit appears in the list

---

## Files Modified

### API Files:
1. `lib/api/deposits.ts` - Fixed import + getOwnerDeposits query
2. `lib/api/utilities.ts` - Fixed import
3. `lib/api/lease-renewal.ts` - Fixed import
4. `lib/api/advance-payments.ts` - Fixed import
5. `lib/api/tenants.ts` - Fixed getTenants query

### Component Files:
6. `components/owner/CreateDepositDialog.tsx` - Fixed interface + display

---

**Date**: October 25, 2025  
**Status**: ✅ All Fixes Applied  
**Ready for Testing**: Yes

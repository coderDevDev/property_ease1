# Full Name Column Fix

## Issue
Error: `column users_2.full_name does not exist`

The deposits API was trying to query a `full_name` column that doesn't exist in the `users` table.

## Root Cause
The `users` table schema (from `create-tables-fixed.sql`) has:
- ✅ `first_name` TEXT
- ✅ `last_name` TEXT  
- ❌ **NO** `full_name` column

But the code was trying to select `full_name` in queries.

## Files Fixed

### 1. **lib/api/deposits.ts**
**Function**: `getOwnerDeposits()`

**Before**:
```typescript
users (
  full_name,  // ❌ Column doesn't exist
  email
)
```

**After**:
```typescript
users (
  first_name,  // ✅ Correct
  last_name,   // ✅ Correct
  email
)
```

---

### 2. **app/owner/dashboard/deposits/page.tsx**

#### Display Name (Line ~240):
**Before**:
```typescript
{deposit.tenants?.users?.full_name || 'Unknown Tenant'}
```

**After**:
```typescript
{deposit.tenants?.users?.first_name && deposit.tenants?.users?.last_name
  ? `${deposit.tenants.users.first_name} ${deposit.tenants.users.last_name}`
  : 'Unknown Tenant'}
```

#### Search Filter (Line ~110):
**Before**:
```typescript
const tenantName = deposit.tenants?.users?.full_name?.toLowerCase() || '';
```

**After**:
```typescript
const firstName = deposit.tenants?.users?.first_name?.toLowerCase() || '';
const lastName = deposit.tenants?.users?.last_name?.toLowerCase() || '';
const tenantName = `${firstName} ${lastName}`.trim();
```

#### Refund Confirmation (Line ~74):
**Before**:
```typescript
confirm(`Process refund... for ${deposit.tenants?.users?.full_name}?`)
```

**After**:
```typescript
const tenantName = deposit.tenants?.users?.first_name && deposit.tenants?.users?.last_name
  ? `${deposit.tenants.users.first_name} ${deposit.tenants.users.last_name}`
  : 'this tenant';
confirm(`Process refund... for ${tenantName}?`)
```

---

## Database Schema Reference

From `create-tables-fixed.sql` (lines 29-51):
```sql
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,      -- ✅ Exists
  last_name TEXT NOT NULL,       -- ✅ Exists
  phone TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'tenant',
  avatar_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  -- ... other fields
);
```

**Note**: There is NO `full_name` column. Names must be constructed from `first_name` + `last_name`.

---

## Pattern for Future Reference

When displaying user names, always use:
```typescript
const fullName = user.first_name && user.last_name
  ? `${user.first_name} ${user.last_name}`
  : 'Unknown User';
```

When querying users, always select:
```typescript
users (
  first_name,
  last_name,
  email
)
```

---

## Testing Checklist

After these fixes:
- [ ] Deposits page loads without errors
- [ ] Tenant names display correctly in deposit list
- [ ] Search by tenant name works
- [ ] Refund confirmation shows correct tenant name
- [ ] Create deposit dialog shows tenant names correctly

---

**Date**: October 25, 2025  
**Status**: ✅ Fixed  
**Files Modified**: 2 files (1 API + 1 component)

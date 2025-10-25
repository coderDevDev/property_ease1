# Refund Payment Fix

## Issue
Error when processing deposit refund: `Could not find the 'description' column of 'payments' in the schema cache`

## Root Cause
The `processDepositRefund` function was trying to insert invalid columns into the `payments` table:
- ❌ `description` (doesn't exist - should be `notes`)
- ❌ `owner_id` (doesn't exist in payments table)
- ❌ `is_deposit` (doesn't exist in payments table)
- ❌ `payment_type: 'deposit_refund'` (not in enum - should be `security_deposit`)
- ❌ Missing required `created_by` field

## Payments Table Schema

From `create-tables-fixed.sql`:
```sql
CREATE TABLE public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  payment_type payment_type NOT NULL,
  payment_method payment_method NOT NULL,
  payment_status payment_status DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_date TIMESTAMP WITH TIME ZONE,
  late_fee DECIMAL(10,2) DEFAULT 0 CHECK (late_fee >= 0),
  reference_number TEXT,
  receipt_url TEXT,
  notes TEXT,                    -- ✅ Use this, NOT 'description'
  created_by UUID REFERENCES public.users(id) NOT NULL,  -- ✅ Required
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Enum Types

```sql
CREATE TYPE payment_type AS ENUM (
  'rent', 
  'deposit', 
  'security_deposit',  -- ✅ Use this for refunds
  'utility', 
  'penalty', 
  'other'
);

CREATE TYPE payment_method AS ENUM (
  'gcash', 
  'maya', 
  'bank_transfer',  -- ✅ Default for refunds
  'cash', 
  'check'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 
  'paid', 
  'failed', 
  'refunded',  -- ✅ Use this for refunds
  'partial'
);
```

## Fix Applied

**File**: `lib/api/deposits.ts`  
**Function**: `processDepositRefund()`

### Before (WRONG):
```typescript
const { error: paymentError } = await supabase
  .from('payments')
  .insert({
    tenant_id: tenantId,
    property_id: propertyId,
    owner_id: tenant.properties.owner_id,        // ❌ Column doesn't exist
    amount: deposit.refundable_amount,
    payment_type: 'deposit_refund',              // ❌ Not in enum
    is_deposit: true,                            // ❌ Column doesn't exist
    payment_status: 'pending',
    due_date: new Date().toISOString(),
    description: `Security deposit refund - ${tenant.properties.name}`  // ❌ Wrong column name
  });
```

### After (CORRECT):
```typescript
// Get current user ID for created_by
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return { 
    success: false, 
    message: 'User not authenticated' 
  };
}

// Create refund payment record
const { error: paymentError } = await supabase
  .from('payments')
  .insert({
    tenant_id: tenantId,
    property_id: propertyId,
    amount: deposit.refundable_amount,
    payment_type: 'security_deposit',            // ✅ Valid enum value
    payment_method: 'bank_transfer',             // ✅ Valid enum value
    payment_status: 'refunded',                  // ✅ Valid enum value
    due_date: new Date().toISOString().split('T')[0],  // ✅ DATE format
    paid_date: new Date().toISOString(),         // ✅ Timestamp for refund
    notes: `Security deposit refund - ${tenant.properties.name}`,  // ✅ Correct column
    created_by: user.id                          // ✅ Required field
  });
```

## Key Changes

1. ✅ Changed `description` → `notes`
2. ✅ Removed `owner_id` (doesn't exist)
3. ✅ Removed `is_deposit` (doesn't exist)
4. ✅ Changed `payment_type` from `'deposit_refund'` → `'security_deposit'`
5. ✅ Changed `payment_status` from `'pending'` → `'refunded'`
6. ✅ Added `created_by: user.id` (required field)
7. ✅ Added `paid_date` (to mark refund as processed)
8. ✅ Fixed `due_date` format to DATE (YYYY-MM-DD)

## Testing

After this fix, test:
1. ✅ Owner conducts move-out inspection
2. ✅ Owner adds deductions
3. ✅ Owner completes inspection
4. ✅ **Owner processes refund** ← Should work now!
5. ✅ Verify refund appears in payments table
6. ✅ Verify deposit status changes to `fully_refunded`

---

**Date**: October 25, 2025  
**Status**: ✅ Fixed  
**Test**: Test 1.2 - Process Refund should now work

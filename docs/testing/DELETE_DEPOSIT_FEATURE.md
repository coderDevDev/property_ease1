# Delete Deposit Feature

## Overview
Added functionality to delete security deposits from the owner dashboard with proper safety checks and cascade deletion.

---

## Delete Process Flow

### 1. **Safety Checks**
Before deletion, the system checks:
- ✅ Deposit exists
- ✅ Deposit has NOT been refunded (fully or partially)
- ❌ Cannot delete refunded deposits (for audit purposes)

### 2. **Cascade Deletion Order**
If checks pass, deletes in this order:
1. **Deposit Deductions** - All deductions from related inspections
2. **Move-Out Inspections** - All inspections for the tenant
3. **Deposit Balance** - The main deposit record

### 3. **What Gets Deleted**
```
Deposit Balance (1 record)
    ↓
Move-Out Inspections (0 or more)
    ↓
Deposit Deductions (0 or more)
```

---

## When Can You Delete?

### ✅ **CAN Delete:**
- Status: `held` (no refund processed)
- Even if inspections and deductions exist
- Even if deductions have been disputed

### ❌ **CANNOT Delete:**
- Status: `fully_refunded`
- Status: `partially_refunded`
- **Reason**: Audit trail - need to keep refund history

---

## Implementation Details

### API Function
**File**: `lib/api/deposits.ts`  
**Function**: `DepositsAPI.deleteDeposit(depositId: string)`

```typescript
static async deleteDeposit(depositId: string): Promise<ApiResponse> {
  // 1. Check deposit exists and status
  // 2. Prevent deletion if refunded
  // 3. Delete deductions (cascade)
  // 4. Delete inspections (cascade)
  // 5. Delete deposit balance
}
```

### UI Component
**File**: `app/owner/dashboard/deposits/page.tsx`

**Delete Button Visibility**:
```typescript
{deposit.status !== 'fully_refunded' && 
 deposit.status !== 'partially_refunded' && (
  <Button variant="destructive" onClick={handleDeleteDeposit}>
    <Trash2 /> Delete
  </Button>
)}
```

**Confirmation Dialog**:
```
Are you sure you want to delete the deposit for [Tenant Name]?

This will also delete:
- All move-out inspections
- All deductions

This action cannot be undone!
```

---

## Error Messages

### Success:
✅ "Deposit and all related records deleted successfully"

### Errors:
- ❌ "Deposit not found"
- ❌ "Cannot delete a deposit that has been refunded. This is for audit purposes."
- ❌ Database error message (if deletion fails)

---

## Database Impact

### Tables Affected:
1. `deposit_balances` - Main record deleted
2. `move_out_inspections` - All related records deleted
3. `deposit_deductions` - All related records deleted

### Foreign Key Constraints:
The deletion respects foreign key relationships:
- Deductions reference inspections (deleted first)
- Inspections reference deposits (deleted second)
- Deposit is deleted last

---

## Testing Checklist

### Test 1: Delete Held Deposit (No Inspection)
1. Create a deposit
2. Click "Delete" button
3. Confirm deletion
4. ✅ Deposit removed from list
5. ✅ Success message shown

### Test 2: Delete Held Deposit (With Inspection)
1. Create deposit
2. Conduct move-out inspection
3. Add deductions
4. Click "Delete" button
5. Confirm deletion
6. ✅ Deposit, inspection, and deductions all deleted
7. ✅ Success message shown

### Test 3: Try to Delete Refunded Deposit
1. Create deposit
2. Conduct inspection
3. Process refund
4. ✅ Delete button NOT visible (or disabled)
5. If somehow triggered: ❌ Error message shown

### Test 4: Cancel Deletion
1. Click "Delete" button
2. Click "Cancel" in confirmation
3. ✅ Deposit remains unchanged
4. ✅ No deletion occurs

---

## Alternative Approaches Considered

### Option 1: Soft Delete (Not Implemented)
- Add `deleted_at` timestamp
- Keep records but mark as deleted
- **Pros**: Full audit trail
- **Cons**: More complex queries

### Option 2: Status Change (Not Implemented)
- Add `cancelled` status
- Keep record but mark inactive
- **Pros**: Simple, keeps data
- **Cons**: Clutters database

### Option 3: Hard Delete with Safety (✅ Implemented)
- Permanently delete non-refunded deposits
- Prevent deletion of refunded deposits
- **Pros**: Clean database, simple logic
- **Cons**: No recovery after deletion

---

## Security Considerations

### Row Level Security (RLS)
The deletion respects Supabase RLS policies:
- Only property owners can delete deposits for their properties
- Tenants cannot delete deposits
- Admins can delete any deposit

### Audit Trail
- Refunded deposits CANNOT be deleted
- This preserves financial audit trail
- Payment records remain intact

---

## UI/UX Details

### Button Styling:
- **Variant**: `destructive` (red color)
- **Icon**: Trash2 (lucide-react)
- **Size**: `sm` (small)
- **Position**: Right side with other action buttons

### Button Visibility Logic:
```typescript
Show Delete Button IF:
  - status !== 'fully_refunded' AND
  - status !== 'partially_refunded'

Hide Delete Button IF:
  - status === 'fully_refunded' OR
  - status === 'partially_refunded'
```

---

## Code Locations

### API:
- `client/lib/api/deposits.ts` (lines 772-850)
  - `deleteDeposit()` function

### UI:
- `client/app/owner/dashboard/deposits/page.tsx`
  - Import Trash2 icon (line 18)
  - `handleDeleteDeposit()` function (lines 99-120)
  - Delete button UI (lines 354-364)

---

## Future Enhancements

### Possible Improvements:
1. **Soft Delete**: Add `deleted_at` column for recovery
2. **Bulk Delete**: Select multiple deposits to delete
3. **Restore Function**: Undo deletion within time window
4. **Admin Override**: Allow admins to delete refunded deposits
5. **Detailed Audit Log**: Track who deleted what and when

---

**Date**: October 25, 2025  
**Status**: ✅ Implemented and Ready for Testing  
**Feature**: Delete Deposit with Cascade and Safety Checks

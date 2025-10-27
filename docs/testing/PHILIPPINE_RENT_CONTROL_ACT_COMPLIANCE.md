# Philippine Rent Control Act (RA 9653) Compliance

## Legal Requirements

Under the **Philippine Rent Control Act (Republic Act No. 9653)**, landlords are legally restricted in the amounts they can demand from tenants:

### Maximum Allowed Payments

1. **Advance Rent**: Maximum of **ONE (1) month** advance rent
   - This covers the first month of tenancy
   - Cannot exceed one month's rent

2. **Security Deposit**: Maximum of **TWO (2) months** security deposit
   - Used to cover unpaid bills or damages at the end of the lease
   - Must be refundable (minus legitimate deductions)

### Total Upfront Payment
**Maximum: 3 months' rent equivalent**
- 1 month advance rent
- 2 months security deposit

---

## Current System Issues Found

### ❌ Issue 1: Application Approval Function
**File**: `scripts/migrations/004_rental_applications.sql`
**Lines**: 140-152

```sql
INSERT INTO public.tenants (
    ...
    deposit,
    security_deposit,
    ...
) VALUES (
    ...
    app_record.monthly_rent * 2, -- 2 months deposit ❌ WRONG
    app_record.monthly_rent, -- 1 month security deposit ❌ WRONG
    ...
);
```

**Problem**: 
- Sets `deposit` to 2 months rent (should be 1 month advance)
- Sets `security_deposit` to 1 month rent (should be 2 months)
- **Total**: 3 months, but incorrectly allocated

**Legal Requirement**:
- `deposit` (advance rent) = 1 month maximum
- `security_deposit` = 2 months maximum

---

### ⚠️ Issue 2: No Validation in Deposit Creation
**File**: `components/owner/CreateDepositDialog.tsx`
**Lines**: 229-246

```tsx
<div className="space-y-2">
  <Label htmlFor="amount">
    Deposit Amount (₱) <span className="text-red-500">*</span>
  </Label>
  <Input
    id="amount"
    type="number"
    step="0.01"
    min="0"
    placeholder="10000.00"
    value={formData.depositAmount}
    onChange={e =>
      setFormData({ ...formData, depositAmount: e.target.value })
    }
    required
  />
</div>
```

**Problem**: 
- No maximum validation
- Owner can enter any amount
- No warning about legal limits

**Required**:
- Add validation: deposit ≤ 2 × monthly_rent
- Show legal limit warning
- Prevent submission if exceeds limit

---

### ⚠️ Issue 3: No Guidance in Tenant Forms
**Files**: 
- `app/owner/dashboard/tenants/new/page.tsx`
- `app/owner/dashboard/tenants/[id]/edit/page.tsx`

**Problem**:
- No information about legal limits
- No validation on deposit amounts
- Owners might unknowingly violate the law

---

## Required Changes

### 1. Fix Application Approval Function ✅

Update `scripts/migrations/004_rental_applications.sql`:

```sql
INSERT INTO public.tenants (
    user_id,
    property_id,
    unit_number,
    lease_start,
    lease_end,
    monthly_rent,
    deposit,              -- Advance rent (1 month max)
    security_deposit,     -- Security deposit (2 months max)
    status,
    move_in_date
) VALUES (
    app_record.user_id,
    app_record.property_id,
    unit_number,
    app_record.move_in_date,
    app_record.move_in_date + INTERVAL '1 year',
    app_record.monthly_rent,
    app_record.monthly_rent,      -- ✅ 1 month advance rent
    app_record.monthly_rent * 2,  -- ✅ 2 months security deposit
    'pending',
    app_record.move_in_date
);
```

### 2. Add Validation to CreateDepositDialog ✅

Add these validations:
- Check tenant's monthly rent
- Enforce maximum: 2 × monthly_rent
- Show warning message about RA 9653
- Display calculated maximum allowed

### 3. Update Tenant Creation Forms ✅

Add to new/edit tenant forms:
- Information banner about RA 9653
- Auto-calculate suggested amounts
- Validation on deposit fields
- Helper text showing legal limits

---

## Database Schema

### Tenants Table
```sql
CREATE TABLE tenants (
    ...
    monthly_rent DECIMAL(10,2) NOT NULL,
    deposit DECIMAL(10,2) NOT NULL,           -- Advance rent (1 month max)
    security_deposit DECIMAL(10,2) DEFAULT 0, -- Security deposit (2 months max)
    ...
);
```

### Constraints to Add
```sql
-- Add check constraint for advance rent (deposit field)
ALTER TABLE tenants 
ADD CONSTRAINT check_advance_rent_limit 
CHECK (deposit <= monthly_rent);

-- Add check constraint for security deposit
ALTER TABLE tenants 
ADD CONSTRAINT check_security_deposit_limit 
CHECK (security_deposit <= monthly_rent * 2);
```

---

## Implementation Checklist

### Database Level
- [x] Fix `approve_rental_application` function
- [ ] Add database constraints for deposit limits
- [ ] Create migration script for existing data

### Application Level
- [ ] Update `CreateDepositDialog` with validation
- [ ] Add RA 9653 info banner to tenant forms
- [ ] Update tenant creation form validation
- [ ] Update tenant edit form validation
- [ ] Add helper text to all deposit input fields

### Documentation
- [x] Create this compliance document
- [ ] Update API documentation
- [ ] Add legal disclaimer to owner dashboard
- [ ] Create user guide for owners

---

## Legal Disclaimer

**Important**: This system enforces the Philippine Rent Control Act (RA 9653) limits to ensure legal compliance. Violations can result in:
- Legal penalties for landlords
- Tenant complaints to DHSUD (Department of Human Settlements and Urban Development)
- Potential refund obligations

**Reference**: Republic Act No. 9653 - An Act Establishing Reforms in the Rental of Certain Residential Units

---

## Testing Scenarios

### Scenario 1: Application Approval
- **Given**: Application with monthly rent ₱10,000
- **When**: Owner approves application
- **Then**: 
  - Advance rent = ₱10,000 (1 month)
  - Security deposit = ₱20,000 (2 months)
  - Total upfront = ₱30,000

### Scenario 2: Manual Deposit Creation
- **Given**: Tenant with monthly rent ₱15,000
- **When**: Owner tries to create deposit of ₱40,000
- **Then**: System shows error "Maximum allowed: ₱30,000 (2 months rent)"

### Scenario 3: Tenant Creation
- **Given**: New tenant form with monthly rent ₱8,000
- **When**: Owner enters advance rent ₱16,000
- **Then**: System shows error "Advance rent cannot exceed ₱8,000 (1 month)"

---

**Date**: October 26, 2025  
**Status**: 🔄 In Progress  
**Priority**: 🔴 High - Legal Compliance Required

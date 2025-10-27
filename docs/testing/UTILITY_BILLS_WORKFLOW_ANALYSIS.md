# Utility Bills Workflow Analysis

**Date**: October 26, 2025  
**Status**: ⚠️ Needs Fixes  
**Page**: `/owner/dashboard/utility-bills`

---

## 🔍 Current Issues Found

### 1. ❌ CreateBillDialog - Hardcoded Data
**File**: `components/owner/CreateBillDialog.tsx`

**Problem**:
```typescript
// Lines 87-95: Empty functions, no actual data loading
const loadProperties = async () => {
  // This would fetch owner's properties - simplified for now
  // In real implementation, fetch from properties API
};

const loadTenants = async (propertyId: string) => {
  // This would fetch tenants for selected property
  // In real implementation, fetch from tenants API
};

// Lines 191-194: Hardcoded properties
<SelectContent>
  <SelectItem value="prop1">Property 1</SelectItem>
  <SelectItem value="prop2">Property 2</SelectItem>
</SelectContent>

// Lines 209-212: Hardcoded tenants
<SelectContent>
  <SelectItem value="tenant1">Tenant 1</SelectItem>
  <SelectItem value="tenant2">Tenant 2</SelectItem>
</SelectContent>
```

**Impact**: ❌ Cannot create bills for real properties/tenants

---

### 2. ⚠️ Missing Payment Integration
**Problem**: Utility bills are created but not linked to payments table

**Current Flow**:
```
Owner creates bill → utility_bills table
❌ No payment record created
❌ Tenant cannot see bill in payments page
❌ Tenant cannot pay via Xendit
```

**Expected Flow**:
```
Owner creates bill → utility_bills table
✅ Create payment record (payment_type='utility')
✅ Tenant sees in /tenant/dashboard/payments
✅ Tenant can pay via Xendit
✅ Payment updates utility_bills.payment_status
```

---

### 3. ⚠️ No Automatic Calculation
**Problem**: Bill calculations not stored in database

**Current**: Manual calculation in createBill API
```typescript
// API only stores what's passed, no auto-calculation
consumption_charge: undefined  // Not calculated
total_amount: undefined        // Not calculated
```

**Expected**: Auto-calculate and store
```typescript
consumption = currentReading - previousReading
consumption_charge = consumption * ratePerUnit
total_amount = baseCharge + consumption_charge + additionalCharges
```

---

## 🔧 Required Fixes

### Fix 1: Load Real Properties & Tenants

**Update CreateBillDialog.tsx**:

```typescript
const [properties, setProperties] = useState<any[]>([]);
const [tenants, setTenants] = useState<any[]>([]);

useEffect(() => {
  loadProperties();
}, [authState.user?.id]);

const loadProperties = async () => {
  if (!authState.user?.id) return;
  
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, address, city')
      .eq('owner_id', authState.user.id)
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    setProperties(data || []);
  } catch (error) {
    console.error('Error loading properties:', error);
    toast.error('Failed to load properties');
  }
};

const loadTenants = async (propertyId: string) => {
  try {
    const { data, error } = await supabase
      .from('tenants')
      .select(`
        id,
        user:users(id, first_name, last_name, email)
      `)
      .eq('property_id', propertyId)
      .eq('status', 'active');

    if (error) throw error;
    setTenants(data || []);
  } catch (error) {
    console.error('Error loading tenants:', error);
    toast.error('Failed to load tenants');
  }
};
```

**Update Select Components**:
```typescript
{/* Properties */}
<SelectContent>
  {properties.length === 0 ? (
    <SelectItem value="" disabled>No properties found</SelectItem>
  ) : (
    properties.map((property) => (
      <SelectItem key={property.id} value={property.id}>
        {property.name} - {property.city}
      </SelectItem>
    ))
  )}
</SelectContent>

{/* Tenants */}
<SelectContent>
  <SelectItem value="">No tenant (Property bill)</SelectItem>
  {tenants.map((tenant) => (
    <SelectItem key={tenant.id} value={tenant.id}>
      {tenant.user.first_name} {tenant.user.last_name}
    </SelectItem>
  ))}
</SelectContent>
```

---

### Fix 2: Auto-Calculate Bill Amounts

**Update UtilitiesAPI.createBill**:

```typescript
static async createBill(params: CreateBillParams): Promise<ApiResponse<UtilityBill>> {
  try {
    // Validate required fields
    if (!params.propertyId || !params.createdBy || !params.billType) {
      return {
        success: false,
        message: 'Missing required fields',
      };
    }

    // Calculate consumption and charges
    const consumption = params.currentReading && params.previousReading
      ? params.currentReading - params.previousReading
      : null;

    const consumptionCharge = consumption && params.ratePerUnit
      ? consumption * params.ratePerUnit
      : 0;

    const totalAmount = 
      (params.baseCharge || 0) + 
      consumptionCharge + 
      (params.additionalCharges || 0);

    const { data, error } = await supabase
      .from('utility_bills')
      .insert({
        property_id: params.propertyId,
        tenant_id: params.tenantId,
        created_by: params.createdBy,
        bill_type: params.billType,
        billing_period_start: params.billingPeriodStart,
        billing_period_end: params.billingPeriodEnd,
        due_date: params.dueDate,
        previous_reading: params.previousReading,
        current_reading: params.currentReading,
        consumption: consumption,  // ✅ Calculate
        unit: params.unit,
        rate_per_unit: params.ratePerUnit,
        base_charge: params.baseCharge || 0,
        consumption_charge: consumptionCharge,  // ✅ Calculate
        additional_charges: params.additionalCharges || 0,
        total_amount: totalAmount,  // ✅ Calculate
        payment_status: 'pending',
        bill_image_url: params.billImageUrl,
        notes: params.notes,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
      message: 'Utility bill created successfully',
    };
  } catch (error: any) {
    console.error('Error creating bill:', error);
    return {
      success: false,
      message: error.message || 'Failed to create utility bill',
    };
  }
}
```

---

### Fix 3: Create Payment Record When Bill is Created

**Add to UtilitiesAPI.createBill** (after bill creation):

```typescript
// After creating utility_bills record
if (data && params.tenantId) {
  // Create corresponding payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: params.tenantId,
      property_id: params.propertyId,
      payment_type: 'utility',
      amount: totalAmount,
      due_date: params.dueDate,
      payment_status: 'pending',
      created_by: params.createdBy,
      notes: `${params.billType} utility bill - ${params.billingPeriodStart} to ${params.billingPeriodEnd}`,
    });

  if (paymentError) {
    console.error('Error creating payment record:', paymentError);
    // Don't fail the whole operation, just log
  }
}
```

---

### Fix 4: Sync Payment Status

**Create trigger or update function**:

```sql
-- When utility bill is paid, update payment record
CREATE OR REPLACE FUNCTION sync_utility_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'paid' AND OLD.payment_status != 'paid' THEN
    -- Update corresponding payment record
    UPDATE payments
    SET 
      payment_status = 'paid',
      paid_date = NEW.paid_date,
      payment_method = 'manual',  -- or from bill
      notes = COALESCE(notes, '') || ' | Paid via utility bill'
    WHERE tenant_id = NEW.tenant_id
      AND property_id = NEW.property_id
      AND payment_type = 'utility'
      AND due_date = NEW.due_date
      AND payment_status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_utility_payment
  AFTER UPDATE ON utility_bills
  FOR EACH ROW
  EXECUTE FUNCTION sync_utility_payment_status();
```

---

## 📊 Complete Workflow (Fixed)

### 1. Owner Creates Bill

```
Owner → /owner/dashboard/utility-bills
  ↓
Click "Create Bill"
  ↓
Select Property (loaded from database) ✅
  ↓
Select Tenant (loaded from database) ✅
  ↓
Enter bill details:
  - Bill type (electricity, water, etc.)
  - Billing period
  - Meter readings
  - Rates and charges
  ↓
System auto-calculates:
  - Consumption ✅
  - Consumption charge ✅
  - Total amount ✅
  ↓
Click "Create Bill"
  ↓
System creates:
  1. utility_bills record ✅
  2. payments record (if tenant assigned) ✅
  ↓
Success! Bill created
```

---

### 2. Tenant Views & Pays Bill

```
Tenant → /tenant/dashboard/payments
  ↓
Sees utility bill in list ✅
  - Type: Utility
  - Amount: ₱500
  - Due date: Oct 31, 2025
  - Status: Pending
  ↓
Click "Pay Now"
  ↓
Redirected to Xendit ✅
  ↓
Complete payment ✅
  ↓
Webhook updates:
  1. payments.payment_status = 'paid' ✅
  2. utility_bills.payment_status = 'paid' ✅ (via trigger)
  ↓
Both records synced! ✅
```

---

### 3. Owner Tracks Payment

```
Owner → /owner/dashboard/utility-bills
  ↓
Sees bill status updated:
  - Status: Paid ✅
  - Paid date: Oct 26, 2025 ✅
  ↓
Owner → /owner/dashboard/payments
  ↓
Sees payment record:
  - Type: Utility ✅
  - Status: Paid ✅
  - Amount: ₱500 ✅
```

---

## 🗄️ Database Schema

### utility_bills Table:
```sql
CREATE TABLE utility_bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES tenants(id),
  created_by UUID REFERENCES users(id),
  bill_type TEXT NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  previous_reading DECIMAL(10,2),
  current_reading DECIMAL(10,2),
  consumption DECIMAL(10,2),  -- Auto-calculated
  unit TEXT,
  rate_per_unit DECIMAL(10,2),
  base_charge DECIMAL(10,2) DEFAULT 0,
  consumption_charge DECIMAL(10,2) DEFAULT 0,  -- Auto-calculated
  additional_charges DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,  -- Auto-calculated
  payment_status TEXT DEFAULT 'pending',
  payment_id UUID REFERENCES payments(id),
  paid_date TIMESTAMP,
  bill_image_url TEXT,
  receipt_image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### payments Table (utility type):
```sql
-- Created automatically when utility bill is created
INSERT INTO payments (
  tenant_id,
  property_id,
  payment_type,  -- 'utility'
  amount,
  due_date,
  payment_status,
  created_by,
  notes
) VALUES (...);
```

---

## 🧪 Testing Checklist

### Test 1: Create Bill
- [ ] Load real properties from database
- [ ] Load real tenants for selected property
- [ ] Calculate consumption correctly
- [ ] Calculate total amount correctly
- [ ] Create utility_bills record
- [ ] Create payments record (if tenant assigned)
- [ ] Show success message

### Test 2: Tenant Payment
- [ ] Tenant sees bill in /tenant/dashboard/payments
- [ ] Bill shows correct amount
- [ ] Tenant can pay via Xendit
- [ ] Payment updates payments table
- [ ] Trigger updates utility_bills table
- [ ] Both records show as "paid"

### Test 3: Owner Tracking
- [ ] Owner sees bill in /owner/dashboard/utility-bills
- [ ] Bill shows correct status
- [ ] Owner sees payment in /owner/dashboard/payments
- [ ] Stats update correctly
- [ ] Filters work correctly

---

## 📝 Implementation Priority

### Priority 1: Critical (Must Fix)
1. ✅ Load real properties in CreateBillDialog
2. ✅ Load real tenants in CreateBillDialog
3. ✅ Auto-calculate bill amounts
4. ✅ Create payment record when bill is created

### Priority 2: Important
5. ✅ Create sync trigger for payment status
6. ✅ Add payment link in ViewBillDialog
7. ✅ Show payment status in bill list

### Priority 3: Nice to Have
8. ⏳ Add bill templates
9. ⏳ Add recurring bills
10. ⏳ Add meter reading photos
11. ⏳ Add bill PDF generation

---

## 🚀 Next Steps

1. **Update CreateBillDialog.tsx**
   - Implement loadProperties()
   - Implement loadTenants()
   - Update Select components

2. **Update UtilitiesAPI.createBill()**
   - Add auto-calculation
   - Create payment record
   - Return both records

3. **Create Database Trigger**
   - Sync payment status
   - Update both tables

4. **Test Complete Workflow**
   - Create bill as owner
   - Pay bill as tenant
   - Verify sync works

---

**Status**: ⚠️ Needs Implementation  
**Estimated Time**: 2-3 hours  
**Complexity**: Medium  
**Impact**: High - Required for utility bills to work properly

# 🏠 Lease Duration Issue & Solution

## 🐛 **Current Problem:**

When owner approves an application:
- **Tenant's Move-in Date:** October 30, 2025
- **System Auto-Sets:**
  - Lease Start: October 30, 2025 ✅
  - Lease End: October 30, 2026 ⚠️ (Hardcoded to 1 year)

**Issue:** The system automatically sets lease duration to **exactly 1 year** without asking the owner.

---

## 🔍 **Where This Happens:**

### **Current Flow:**

```
1. Tenant applies → Sets move-in date
        ↓
2. Owner approves application
        ↓
3. Database RPC function: approve_rental_application()
        ↓
   Creates tenant record with:
   - lease_start = move_in_date
   - lease_end = move_in_date + 1 YEAR (hardcoded)
        ↓
4. Auto-generates payments based on lease dates
```

**The RPC function in database has:**
```sql
-- Hardcoded 1 year duration
lease_end = move_in_date + INTERVAL '1 year'
```

---

## ✅ **Proper Solution: Let Owner Choose Duration**

### **Option 1: Add Lease Duration Dialog (Recommended)**

**When owner clicks "Approve":**

```tsx
// Before approval dialog
<Dialog> {/* Approval Confirmation */}
  <DialogContent>
    <DialogTitle>Approve Application</DialogTitle>
    
    {/* Add Lease Duration Fields */}
    <div className="space-y-4">
      <div>
        <Label>Lease Start Date</Label>
        <Input 
          type="date" 
          defaultValue={application.move_in_date}
        />
        <p className="text-sm text-gray-500">
          Based on tenant's preferred move-in date
        </p>
      </div>
      
      <div>
        <Label>Lease Duration</Label>
        <Select defaultValue="12">
          <SelectItem value="1">1 Month</SelectItem>
          <SelectItem value="3">3 Months</SelectItem>
          <SelectItem value="6">6 Months</SelectItem>
          <SelectItem value="12">12 Months (1 Year)</SelectItem>
          <SelectItem value="24">24 Months (2 Years)</SelectItem>
          <SelectItem value="custom">Custom Duration</SelectItem>
        </Select>
      </div>
      
      {/* Show calculated end date */}
      <div className="p-3 bg-blue-50 rounded">
        <p className="text-sm">
          Lease Period: Oct 30, 2025 - Oct 30, 2026 (12 months)
        </p>
        <p className="text-sm text-gray-600">
          Total payments to generate: 12
        </p>
      </div>
    </div>
    
    <DialogFooter>
      <Button onClick={handleApprove}>
        Confirm Approval
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### **Option 2: Fixed Common Durations (Simpler)**

**Add quick selection during approval:**

```tsx
const [leaseDuration, setLeaseDuration] = useState(12); // Default 12 months

<Dialog open={showApprovalDialog}>
  <DialogContent>
    <DialogTitle>Approve Application</DialogTitle>
    
    <div>
      <Label>Lease Duration</Label>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <Button
          variant={leaseDuration === 6 ? 'default' : 'outline'}
          onClick={() => setLeaseDuration(6)}>
          6 Months
        </Button>
        <Button
          variant={leaseDuration === 12 ? 'default' : 'outline'}
          onClick={() => setLeaseDuration(12)}>
          12 Months
        </Button>
        <Button
          variant={leaseDuration === 24 ? 'default' : 'outline'}
          onClick={() => setLeaseDuration(24)}>
          24 Months
        </Button>
      </div>
      <p className="text-sm text-gray-500 mt-2">
        Lease ends: {calculateEndDate(move_in_date, leaseDuration)}
      </p>
    </div>
    
    <Button onClick={() => handleApprove(leaseDuration)}>
      Approve Application
    </Button>
  </DialogContent>
</Dialog>
```

---

## 🎯 **Complete Workflow (Proper Way):**

### **Tenant Side:**

```
1. Browse Properties
2. Apply for Property
3. Select Move-in Date: Oct 30, 2025
4. Upload Documents
5. Submit Application
   ↓
   Status: Pending (waiting for owner)
```

**Tenant does NOT choose lease duration** - That's the owner's decision!

---

### **Owner Side:**

```
1. View Application
2. Review Documents
3. Click "Approve"
   ↓
4. Dialog Opens: "Set Lease Terms"
   ├─ Lease Start: Oct 30, 2025 (from tenant's move-in date)
   ├─ Lease Duration: [6 months] [12 months] [24 months]
   └─ Calculated End: Based on selected duration
   
5. Confirm Approval
   ↓
   System Creates:
   ├─ Tenant record
   ├─ Lease dates (start + end)
   └─ Auto-generate payments (based on lease duration)
```

---

## 💡 **Why Owner Should Choose Duration:**

### **Business Reasons:**
1. **Flexibility** - Different tenants, different terms
2. **Property Type** - Studio vs Family home = different durations
3. **Market Conditions** - Short-term vs long-term rentals
4. **Tenant Preference** - Some want shorter commitments
5. **Seasonal Rates** - Adjust for peak/off-peak seasons

### **Common Durations:**
- **1 Month** - Short-term/test period
- **3 Months** - Quarterly leases
- **6 Months** - Common for students
- **12 Months** - Most common (standard)
- **24 Months** - Long-term stable tenants

---

## 🔧 **Implementation Steps:**

### **Step 1: Update Approval Dialog**

File: `app/owner/dashboard/applications/page.tsx`

```tsx
// Add state for lease duration
const [leaseDuration, setLeaseDuration] = useState(12); // Default 12 months

// In approval dialog (around line 964)
<Dialog open={showActionDialog}>
  <DialogContent>
    <DialogTitle>
      {actionType === 'approve' 
        ? 'Approve Application & Set Lease Terms'
        : 'Reject Application'}
    </DialogTitle>
    
    {actionType === 'approve' && (
      <div className="space-y-4 py-4">
        {/* Show tenant's move-in date */}
        <div>
          <Label>Lease Start Date</Label>
          <Input 
            type="date" 
            value={selectedApplication.move_in_date}
            disabled
          />
          <p className="text-xs text-gray-500">
            Based on tenant's preferred move-in date
          </p>
        </div>
        
        {/* Lease duration selector */}
        <div>
          <Label>Lease Duration</Label>
          <Select 
            value={leaseDuration.toString()} 
            onValueChange={val => setLeaseDuration(Number(val))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Month</SelectItem>
              <SelectItem value="3">3 Months</SelectItem>
              <SelectItem value="6">6 Months</SelectItem>
              <SelectItem value="12">12 Months (Recommended)</SelectItem>
              <SelectItem value="24">24 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Show calculated end date */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-900">
            Lease Period Summary
          </p>
          <div className="mt-2 space-y-1 text-sm text-blue-700">
            <p>Start: {format(new Date(selectedApplication.move_in_date), 'PPP')}</p>
            <p>End: {format(
              addMonths(new Date(selectedApplication.move_in_date), leaseDuration),
              'PPP'
            )}</p>
            <p className="font-medium">Duration: {leaseDuration} months</p>
            <p>Payments to generate: {leaseDuration}</p>
          </div>
        </div>
      </div>
    )}
    
    {/* Reject reason textarea (existing) */}
    {actionType === 'reject' && (
      // ... existing reject code
    )}
    
    <DialogFooter>
      <Button variant="outline" onClick={closeDialog}>
        Cancel
      </Button>
      <Button onClick={() => handleAction(leaseDuration)}>
        {actionType === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### **Step 2: Update Database RPC Function**

You'll need to modify the database function to accept lease duration:

```sql
-- File: database/functions/approve_rental_application.sql

CREATE OR REPLACE FUNCTION approve_rental_application(
  application_id UUID,
  lease_duration_months INTEGER DEFAULT 12  -- Add this parameter
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  tenant_id UUID
) AS $$
DECLARE
  v_application rental_applications%ROWTYPE;
  v_tenant_id UUID;
  v_lease_end DATE;
BEGIN
  -- Get application
  SELECT * INTO v_application
  FROM rental_applications
  WHERE id = application_id;
  
  -- Calculate lease end based on provided duration
  v_lease_end := v_application.move_in_date + (lease_duration_months || ' months')::INTERVAL;
  
  -- Create tenant
  INSERT INTO tenants (
    user_id,
    property_id,
    unit_number,
    monthly_rent,
    lease_start,
    lease_end,        -- Use calculated end date
    status
  ) VALUES (
    v_application.user_id,
    v_application.property_id,
    v_application.unit_number,
    v_application.monthly_rent,
    v_application.move_in_date,
    v_lease_end,     -- Use calculated end date
    'active'
  )
  RETURNING id INTO v_tenant_id;
  
  -- Update application status
  UPDATE rental_applications
  SET status = 'approved'
  WHERE id = application_id;
  
  -- Auto-generate payments
  -- (Your payment generation logic here)
  
  RETURN QUERY SELECT TRUE, 'Application approved', v_tenant_id;
END;
$$ LANGUAGE plpgsql;
```

### **Step 3: Update API Call**

```tsx
// In handleAction function
const handleAction = async (leaseDuration: number) => {
  if (actionType === 'approve') {
    const { data: result, error: rpcError } = await supabase.rpc(
      'approve_rental_application',
      {
        application_id: selectedApplication.id,
        lease_duration_months: leaseDuration  // Pass duration
      }
    );
    
    // ... rest of code
  }
};
```

---

## 📋 **Quick Fix (Temporary):**

If you don't want to modify the code right now, you can:

1. **Manual Adjustment:**
   - Owner approves (creates 1-year lease)
   - Owner goes to Tenants page
   - Edit tenant record
   - Change lease_end date manually
   - Regenerate payments if needed

2. **Database Quick Fix:**
   ```sql
   -- Update existing lease
   UPDATE tenants
   SET lease_end = '2025-12-31'  -- Your desired end date
   WHERE id = 'tenant-id';
   ```

---

## ✅ **Recommended Approach:**

**Implement Option 2 (Fixed Durations)** - Simpler, faster, covers 90% of use cases:

1. Add 3 buttons: 6 months, 12 months, 24 months
2. Default to 12 months
3. Show calculated end date
4. Pass duration to RPC function
5. Auto-generate correct number of payments

**Time to implement:** 30-60 minutes

---

## 🎯 **Summary:**

**Current:** System hardcodes 1-year lease ❌

**Proper Way:**
- **Tenant:** Chooses move-in date only
- **Owner:** Chooses lease duration during approval
- **System:** Calculates end date + generates payments

**Next Step:** Would you like me to implement the lease duration selector in the approval dialog?

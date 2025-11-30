# Safe Implementation Guide: Room Availability Features

## Overview

This guide shows how to add room availability features to existing owner pages **WITHOUT breaking** current functionality.

---

## STEP 1: New Property Page

**File:** `/app/owner/dashboard/properties/new/page.tsx`

### Current State:

- Total Units input exists (line 845-866)
- Validation exists for `total_units >= 1`
- Form submission works with `total_units`

### What to ADD (Non-Breaking):

#### A. Add Info Helper Section After Total Units Input

**Location:** After line 870 (after the total_units error message)

**What to add:**

```tsx
{
  /* Add this AFTER the total_units error message block */
}
<div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
  <div className="flex items-start gap-2">
    <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
    <div>
      <p className="font-semibold text-blue-900 text-sm">
        Room Availability System
      </p>
      <p className="text-xs text-blue-700 mt-1">
        Each unit will be automatically assigned as "Unit 1", "Unit 2", etc.
        Tenants will see and select from available units during application.
      </p>
    </div>
  </div>
</div>;
```

**Why Safe:**

- Only adds informational UI
- No validation changes
- No form logic changes
- No state management changes

---

## STEP 2: Property Details Page

**File:** `/app/owner/dashboard/properties/[id]/page.tsx`

### Current State:

- Shows total units (line 540-548)
- Shows occupied units (line 555-572)
- Shows available units calculation (line 725-730)
- Has tenant list under "Unit Details" (line 734+)

### What to ADD (Non-Breaking):

#### A. Add "Rooms" Tab

**Location:** After existing "Details" tab trigger (around line 648-652)

**Code to add:**

```tsx
{
  /* Add this NEW tab after "Details" TabsTrigger */
}
<TabsTrigger
  value="rooms"
  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
  <Building className="w-4 h-4 mr-2" />
  Rooms
</TabsTrigger>;
```

#### B. Add New "Rooms" Tab Content

**Location:** After the "Details" TabsContent (after line ~1400+)

**Code to add:**

```tsx
{
  /* Add this NEW TabsContent after "details" content */
}
<TabsContent value="rooms" className="mt-6">
  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Building className="w-5 h-5 text-blue-600" />
        Room Availability Grid
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="font-semibold mb-2">
            Total Units: {property.total_units}
          </p>
          <p className="text-xs">🟢 Green = Available | ⚫ Gray = Occupied</p>
        </div>

        {/* Room Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: property.total_units }).map((_, index) => {
            const unitNumber = `Unit ${index + 1}`;
            const isOccupied = tenants.some(t => t.unit_number === unitNumber);

            return (
              <div
                key={unitNumber}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all
                  ${
                    isOccupied
                      ? 'bg-gray-100 border-gray-300 opacity-60'
                      : 'bg-green-50 border-green-300'
                  }
                `}>
                <p className="font-semibold text-sm">{unitNumber}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOccupied ? 'text-gray-600' : 'text-green-600'
                  }`}>
                  {isOccupied ? '⚫ Occupied' : '🟢 Available'}
                </p>
              </div>
            );
          })}
        </div>

        {/* Occupied Units Details */}
        {tenants.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">
              Occupied Units ({tenants.length})
            </h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {tenants.map(tenant => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-sm">
                      {tenant.unit_number}
                    </p>
                    <p className="text-xs text-gray-600">
                      {tenant.user.first_name} {tenant.user.last_name}
                    </p>
                  </div>
                  <Badge className="bg-blue-600 text-white text-xs">
                    {tenant.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
</TabsContent>;
```

**Why Safe:**

- New tab added alongside existing tabs
- Uses existing `tenants` state/data
- Reuses existing components (Card, Badge, etc.)
- No changes to existing tab logic
- No changes to existing data fetching
- Purely additive UI

---

## STEP 3: Add Missing Imports (If Needed)

**File:** `/app/owner/dashboard/properties/[id]/page.tsx`

**Check line 8-30 for imports. If `Info` icon is missing, add it:**

```tsx
import {
  Building,
  MapPin,
  Users,
  Edit,
  // ... existing imports
  Info // <- Add this if not present
  // ... rest of imports
} from 'lucide-react';
```

**File:** `/app/owner/dashboard/properties/new/page.tsx`

**Check line 20-30 for imports. If `Info` icon is missing, add it:**

```tsx
import {
  Building,
  MapPin,
  Users,
  // ... existing imports
  Info // <- Add this if not present
  // ... rest of imports
} from 'lucide-react';
```

---

## STEP 4: Verify No Breaking Changes

### Checklist Before Deployment:

- ✅ New property creation still works (no changes to form logic)
- ✅ Property details page still displays (just adding new tab)
- ✅ Existing tabs still work (Overview, Analytics, Details)
- ✅ Tenant list still displays in existing section
- ✅ Occupancy statistics still show
- ✅ Edit button still works
- ✅ Delete button still works

### Testing Steps:

1. **Create New Property**

   ```
   Go to: Owner Dashboard → Properties → New Property
   - Enter property details
   - Enter Total Units: 5
   - See info box explaining room system
   - Submit → Should create successfully
   ```

2. **View Property Details**

   ```
   Go to: Owner Dashboard → Properties → [Property Name]
   - Click "Rooms" tab → Should show room grid
   - Green rooms = Available
   - Gray rooms = Occupied (if any tenants)
   - Existing tabs should still work
   ```

3. **Verify Existing Functionality**
   ```
   - Overview tab still shows images and stats ✓
   - Analytics tab still works ✓
   - Details tab still shows property info ✓
   - Edit button still works ✓
   - Delete button still works ✓
   ```

---

## Architecture Overview

### Data Flow (Non-Breaking):

```
Property Creation:
├─ User enters total_units: 5
├─ Form validates (existing code)
├─ Database saves total_units (existing code)
├─ Info box shows what happens next (NEW - non-breaking)
└─ Property created ✓

Property Details View:
├─ Load property data (existing code)
├─ Load tenants list (existing code)
├─ Render existing tabs (existing code)
├─ NEW: Rooms tab uses existing data
│  ├─ Generate "Unit 1" to "Unit N" from total_units (NEW)
│  ├─ Match against tenants.unit_number (existing data)
│  └─ Display grid with status (NEW UI, existing data)
└─ All features intact ✓
```

### State Management (Non-Breaking):

- **NEW Data**: None added to state
- **EXISTING Data Used**: `property.total_units`, `tenants[]`
- **State Changes**: None
- **Props Changes**: None
- **API Calls**: None (uses existing data)

---

## Future Enhancements (Optional)

These can be added later without affecting current implementation:

1. **Custom Unit Names**

   - Allow owner to rename "Unit 1" → "Suite 101"
   - Store in new `unit_custom_names` table
   - Display in rooms grid

2. **Unit Management Interface**

   - Click room to view tenant details
   - Quick actions (email tenant, view lease, etc.)

3. **Occupancy History**

   - Show when unit became occupied
   - Show previous tenants
   - Monthly occupancy trends

4. **Room Configuration**
   - Set room types (bedroom, studio, etc.)
   - Set capacity (2, 4, 6 people)
   - Set amenities per unit

---

## Summary

**Added Features:**
✅ Info box on new property page (educates user)
✅ Rooms tab on property details (shows availability grid)
✅ Real-time occupancy display (green/gray status)
✅ Occupied units list (tenant details)

**No Changes To:**
✅ Property creation logic
✅ Form validation
✅ Data storage
✅ Existing tabs
✅ Tenant management
✅ Delete/Edit functionality
✅ API calls

**Safe Implementation:** 100% additive, zero breaking changes ✓

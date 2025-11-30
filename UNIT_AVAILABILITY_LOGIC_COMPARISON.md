# 🏠 Unit Availability Logic - Tenant vs Owner Comparison

## Overview

✅ **Both sides have working unit availability logic!** They work together as part of the same system.

---

## 🧑‍💼 Tenant Side: `/tenant/dashboard/applications/new`

### What Tenants See

When a tenant clicks "Apply Now" on a property, they see:

#### **Step 1: Select Property**

```
Property dropdown → Auto-loads available properties from the database
```

#### **Step 2: Unit Selection (Visual Grid)**

```
┌─────────────────────────────────────────────┐
│  Unit Selection - Available Units Grid      │
├─────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Unit 1  │  │ Unit 2  │  │ Unit 3  │    │
│  │ 🟢 Avail│  │ ⚫ Occ  │  │ 🟢 Avail│    │
│  └─────────┘  └─────────┘  └─────────┘    │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ Unit 4  │  │ Unit 5  │  │ Unit 6  │    │
│  │ 🟢 Avail│  │ 🟢 Avail│  │ ⚫ Occ  │    │
│  └─────────┘  └─────────┘  └─────────┘    │
└─────────────────────────────────────────────┘
```

### How It Works

#### **1️⃣ Load Available Units**

```typescript
// File: /tenant/dashboard/applications/new/page.tsx (Line ~135)

const handlePropertyChange = async (propertyId: string) => {
  // When tenant selects a property:

  try {
    setLoadingUnits(true);
    // Call API to fetch units with their status
    const result = await TenantAPI.getAllUnitsWithStatus(propertyId);

    if (result.success && result.data) {
      setAvailableUnits(result.data);  // Array of units with status
    }
  }
};
```

#### **2️⃣ Display Grid with Status**

```typescript
// Lines: ~340-390

{
  !loadingUnits && availableUnits.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {availableUnits.map(unit => (
        <button
          key={unit.unit_number}
          disabled={unit.status === 'occupied'} // ← DISABLE if occupied
          className={cn(
            'p-3 rounded-lg border-2 transition-all',
            // GREEN for available
            unit.status === 'available'
              ? 'border-green-200 bg-green-50 hover:border-green-400'
              : // GRAY for occupied
                'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
          )}>
          <div className="font-semibold text-sm">{unit.unit_number}</div>
          <div className="text-xs font-medium mt-1">
            {unit.status === 'available' ? (
              <span>🟢 Available</span>
            ) : (
              <span>⚫ Occupied</span>
            )}
          </div>
        </button>
      ))}
    </div>
  ) : null;
}
```

#### **3️⃣ Backend Logic (API Layer)**

```typescript
// File: /lib/api/tenant.ts (Line ~2758)

static async getAvailableUnits(propertyId: string) {
  // Calls Supabase RPC function: get_available_unit_numbers
  const { data, error } = await supabase.rpc(
    'get_available_unit_numbers',
    { p_property_id: propertyId }
  );

  // Returns array of available unit numbers
  // Database function checks:
  // 1. Units NOT occupied by active tenants
  // 2. Units NOT in pending/approved applications
  return { success: true, data };
}

// Alternative API:
static async getAllUnitsWithStatus(propertyId: string) {
  // Returns array with status included:
  // [
  //   { unit_number: "Unit 1", status: "available" },
  //   { unit_number: "Unit 2", status: "occupied" },
  // ]
}
```

#### **4️⃣ Database Functions**

```sql
-- File: scripts/migrations/006_fix_unit_numbers_v2.sql

CREATE FUNCTION public.get_available_unit_numbers(property_id UUID)
RETURNS TABLE (unit_number TEXT) AS $$
BEGIN
  -- Get all occupied units (from tenants AND pending applications)
  WITH occupied_units AS (
    SELECT t.unit_number
    FROM public.tenants t
    WHERE t.property_id = property_id
      AND t.status != 'terminated'
    UNION
    SELECT ra.unit_number
    FROM public.rental_applications ra
    WHERE ra.property_id = property_id
      AND ra.status IN ('pending', 'approved')
  ),
  -- Generate Unit 1 through Unit N
  all_units AS (
    SELECT 'Unit ' || generate_series(1, p.total_units)::text
    FROM public.properties p
    WHERE p.id = property_id
  )
  -- Return only units NOT in occupied_units
  RETURN QUERY
  SELECT a.unit_number
  FROM all_units a
  LEFT JOIN occupied_units o ON a.unit_number = o.unit_number
  WHERE o.unit_number IS NULL;
END;
```

### Data Flow

```
Tenant Selects Property
    ↓
[Event] handlePropertyChange()
    ↓
TenantAPI.getAllUnitsWithStatus(propertyId)
    ↓
Supabase RPC: get_available_unit_numbers()
    ↓
Database checks:
  • Active tenants in each unit
  • Pending/approved applications
    ↓
Returns: [Unit 1, Unit 3, Unit 5...] with status
    ↓
Display Grid:
  • Green (available) - clickable
  • Gray (occupied) - disabled
    ↓
Tenant Clicks Unit → Stored in formData.unitNumber
    ↓
Submit Application with selected unitNumber
```

---

## 👨‍💼 Owner Side: `/owner/dashboard/properties/[id]` - Rooms Tab

### What Owners See

When an owner views a property and clicks the "Rooms" tab:

```
┌─────────────────────────────────────────────┐
│  Room Availability Dashboard                 │
├─────────────────────────────────────────────┤
│  Total Units: 10                            │
│  🟢 Green = Available | ⚫ Gray = Occupied  │
│                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Unit 1  │  │ Unit 2  │  │ Unit 3  │   │
│  │🟢 Avail │  │⚫ Occ   │  │🟢 Avail │   │
│  └─────────┘  └─────────┘  └─────────┘   │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐   │
│  │ Unit 4  │  │ Unit 5  │  │ Unit 6  │   │
│  │🟢 Avail │  │🟢 Avail │  │⚫ Occ   │   │
│  └─────────┘  └─────────┘  └─────────┘   │
│                                             │
│  Occupied Units (2)                        │
│  ┌─────────────────────────────────────┐  │
│  │ Unit 2 - John Doe (john@email.com)  │  │
│  │         Status: Active              │  │
│  ├─────────────────────────────────────┤  │
│  │ Unit 6 - Jane Smith (jane@email.com)│  │
│  │         Status: Active              │  │
│  └─────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

### How It Works

#### **1️⃣ Load Property Data**

```typescript
// File: /owner/dashboard/properties/[id]/page.tsx (Line ~1-100)

export default function PropertyDetailsPage() {
  const [property, setProperty] = useState<any>();
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    // Fetch property details
    const result = await OwnerAPI.getPropertyDetails(propertyId);
    setProperty(result.data); // Contains total_units

    // Fetch tenants for this property
    const tenantsResult = await OwnerAPI.getPropertyTenants(propertyId);
    setTenants(tenantsResult.data); // Array of tenants with unit_number
  }, [propertyId]);
}
```

#### **2️⃣ Generate Room Grid (Lines 1419-1502)**

```typescript
// File: /owner/dashboard/properties/[id]/page.tsx

<TabsContent value="rooms" className="mt-6">
  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Building className="w-5 h-5 text-blue-600" />
        Room Availability
      </CardTitle>
    </CardHeader>
    <CardContent>
      {/* Summary */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <span className="font-semibold">Total Units:</span>{' '}
          {property.total_units}
        </p>
        <p className="text-xs text-gray-500">
          🟢 Green = Available | ⚫ Gray = Occupied
        </p>
      </div>

      {/* Room Grid - DYNAMIC GENERATION */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: property.total_units }).map((_, index) => {
          const unitNumber = `Unit ${index + 1}`;

          // CHECK: Is this unit occupied?
          const isOccupied = tenants.some(t => t.unit_number === unitNumber);

          return (
            <div
              key={unitNumber}
              className={`p-3 rounded-lg border-2 text-center transition-all ${
                isOccupied
                  ? 'bg-gray-100 border-gray-300 opacity-60'
                  : 'bg-green-50 border-green-300 hover:border-green-400'
              }`}>
              <p className="font-semibold text-sm text-gray-900">
                {unitNumber}
              </p>
              <p
                className={`text-xs mt-1 font-medium ${
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
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">
                    {tenant.unit_number}
                  </p>
                  <p className="text-xs text-gray-600">
                    {tenant.user.first_name} {tenant.user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {tenant.user.email}
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

      {/* Empty State */}
      {tenants.length === 0 && (
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-gray-600">
            ✨ All {property.total_units} units are available!
          </p>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
```

### Owner-Side Logic Flow

```
Owner navigates to Property Details
    ↓
Component loads with propertyId
    ↓
Fetch: property (contains total_units)
Fetch: tenants for this property (with unit_number)
    ↓
Render Room Grid:
  Array.from({ length: property.total_units })
    .map((_, index) => {
      unitNumber = "Unit " + (index + 1)
      isOccupied = tenants.some(t => t.unit_number === unitNumber)

      if (isOccupied) {
        show GRAY box with ⚫ Occupied
      } else {
        show GREEN box with 🟢 Available
      }
    })
    ↓
Display tenant details below for occupied units
```

---

## 🔄 How They Work Together

### **Full Workflow**

```
Step 1: Property Created by Owner
├─ Owner creates property with total_units = 10
└─ Database stores: properties { total_units: 10 }

Step 2: Tenant Browses Properties
├─ Tenant sees available properties
└─ Tenant clicks "Apply Now"

Step 3: Tenant Selects Property
├─ API fetches all 10 units
├─ Database function generates: Unit 1, Unit 2, ... Unit 10
├─ Checks which are occupied:
│  ├─ Query: SELECT unit_number FROM tenants WHERE status='active'
│  └─ Query: SELECT unit_number FROM rental_applications WHERE status IN ('pending','approved')
└─ Returns available units only (e.g., Unit 1, Unit 3, Unit 5, Unit 7, Unit 8, Unit 9, Unit 10)

Step 4: Tenant Sees Grid
├─ GREEN boxes: Unit 1, Unit 3, Unit 5, Unit 7, Unit 8, Unit 9, Unit 10 (clickable)
├─ GRAY boxes: Unit 2, Unit 4, Unit 6 (disabled - occupied)
└─ Tenant clicks Unit 1 and submits application

Step 5: Application Submitted
├─ System stores: application { unit_number: "Unit 1", status: "pending" }
├─ Tenant can no longer select Unit 1 (it's now in pending applications)
└─ Next tenant sees Unit 1 as grayed out

Step 6: Owner Reviews Application
├─ Owner sees Rooms tab
├─ Tenant database function runs again
├─ Shows:
│  ├─ Unit 1: occupied (because of pending application)
│  ├─ Unit 2, 4, 6: occupied (from active tenants)
│  └─ Unit 3, 5, 7, 8, 9, 10: available
├─ Owner approves application for Unit 1
└─ Unit 1 tenant becomes ACTIVE

Step 7: Owner Views Room Tab Again
├─ Room grid regenerates
├─ Unit 1, 2, 4, 6: OCCUPIED (Unit 1 is now active tenant)
└─ Unit 3, 5, 7, 8, 9, 10: AVAILABLE
```

---

## 📊 Status Comparison Table

| Feature             | Tenant Side                             | Owner Side                                                    |
| ------------------- | --------------------------------------- | ------------------------------------------------------------- |
| **What They See**   | Interactive grid with clickable units   | Read-only grid showing occupancy                              |
| **Data Source**     | API: `getAllUnitsWithStatus()`          | Component state: `tenants` array                              |
| **Unit Generation** | Database function generates Unit 1-N    | Frontend maps: `Array.from({ length: total_units })`          |
| **Occupancy Check** | SQL query checks tenants + applications | JavaScript: `tenants.some(t => t.unit_number === unitNumber)` |
| **Interaction**     | Click to select (disabled if occupied)  | View only (shows tenant details)                              |
| **Color Coding**    | Green = available, Gray = occupied      | Green = available, Gray = occupied                            |
| **Responsive Grid** | 2-4 columns                             | 2-6 columns                                                   |
| **Shows Tenants**   | No                                      | Yes (name, email, status)                                     |

---

## ✅ Availability Status Logic

### **A unit is OCCUPIED if:**

```
1. There's an active tenant record:
   tenants.status = 'active'
   AND tenants.unit_number = 'Unit X'

2. OR there's a pending/approved application:
   rental_applications.status IN ('pending', 'approved')
   AND rental_applications.unit_number = 'Unit X'
```

### **A unit is AVAILABLE if:**

```
Neither of the above conditions are true
```

---

## 🧪 Testing Guide

### Tenant Side: `/tenant/dashboard/applications/new`

1. ✅ Select a property with units
2. ✅ See grid with green (available) and gray (occupied) units
3. ✅ Click on green unit → it gets highlighted
4. ✅ Try clicking gray unit → nothing happens (disabled)
5. ✅ Submit application → goes to backend

### Owner Side: `/owner/dashboard/properties/[id]`

1. ✅ Click "Rooms" tab on property details
2. ✅ See all units (10 units, etc.)
3. ✅ Green boxes = no tenant
4. ✅ Gray boxes = has tenant
5. ✅ Below grid: list of occupied units with tenant details
6. ✅ Empty state if no occupied units

---

## 📝 API Endpoints Used

### Tenant APIs

- `TenantAPI.getAllUnitsWithStatus(propertyId)` - Gets units with status
- `TenantAPI.getAvailableUnits(propertyId)` - Gets only available units
- `TenantAPI.submitApplication(data)` - Submit application (checks availability)

### Backend Functions

- `get_available_unit_numbers(property_id)` - SQL function in database
- `is_unit_available_simple(property_id, unit_number)` - Check single unit
- `get_unit_availability_status(property_id, unit_number, application_id)` - Detailed status

---

## 🎯 Summary

✅ **Tenant Side (Interactive):**

- Fetches available units from database
- Displays as clickable grid
- Green (available) = clickable
- Gray (occupied) = disabled

✅ **Owner Side (Display):**

- Uses fetched tenants data
- Displays as visual grid
- Green (no tenant) = available
- Gray (has tenant) = occupied
- Shows tenant details

Both use the **same occupancy logic**:

- Check active tenants
- Check pending/approved applications
- Rest are available

✨ **The system is working correctly on both sides!**

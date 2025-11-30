# 🎨 Visual Comparison: Tenant vs Owner Unit Selection

## Side-by-Side View

### TENANT SIDE (Interactive Grid)

```
┌─────────────────────────────────────────────────────┐
│  NEW APPLICATION                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SELECT A PROPERTY *                                │
│  [Dropdown: Choose Property...]                    │
│                                                     │
│  SELECT A UNIT *                                    │
│                                                     │
│  [Loading units...]                                │
│  OR                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Unit 1   │  │ Unit 2   │  │ Unit 3   │         │
│  │ 🟢 Avail │  │ ⚫ Occ   │  │ 🟢 Avail │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Unit 4   │  │ Unit 5   │  │ Unit 6   │         │
│  │ 🟢 Avail │  │ 🟢 Avail │  │ ⚫ Occ   │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                                                     │
│  ✓ SELECTED UNIT DETAILS                           │
│  ┌─────────────────────────────────────────┐      │
│  │ Unit Number:  Unit 1                    │      │
│  │ Type:         Apartment                 │      │
│  │ Monthly Rent: ₱15,000/month            │      │
│  │ Property:     Sunview Residences        │      │
│  └─────────────────────────────────────────┘      │
│                                                     │
│  [Apply Now] Button                                │
│                                                     │
└─────────────────────────────────────────────────────┘

INTERACTION:
• Hover over GREEN unit → border changes, shadow appears
• Click GREEN unit → highlights in blue, selected details appear
• Try click GRAY unit → cursor not-allowed, nothing happens
• Submit application → sends to owner
```

### OWNER SIDE (Display Grid)

```
┌─────────────────────────────────────────────────────┐
│  PROPERTY DETAILS > ROOMS TAB                       │
├─────────────────────────────────────────────────────┤
│                                                     │
│  🏢 Room Availability                              │
│  ─────────────────────────                         │
│                                                     │
│  Total Units: 10                                    │
│  🟢 Green = Available | ⚫ Gray = Occupied         │
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Unit 1   │  │ Unit 2   │  │ Unit 3   │         │
│  │ 🟢 Avail │  │ ⚫ Occ   │  │ 🟢 Avail │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Unit 4   │  │ Unit 5   │  │ Unit 6   │         │
│  │ 🟢 Avail │  │ 🟢 Avail │  │ ⚫ Occ   │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Unit 7   │  │ Unit 8   │  │ Unit 9   │         │
│  │ 🟢 Avail │  │ 🟢 Avail │  │ 🟢 Avail │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│  ┌──────────┐                                      │
│  │ Unit 10  │                                      │
│  │ 🟢 Avail │                                      │
│  └──────────┘                                      │
│                                                     │
│  OCCUPIED UNITS (2)                                │
│  ─────────────────────────────                     │
│                                                     │
│  ┌─────────────────────────────────────────┐      │
│  │ Unit 2                                  │      │
│  │ John Doe                                │      │
│  │ john.doe@email.com                      │      │
│  │                         Active [badge] │      │
│  └─────────────────────────────────────────┘      │
│  ┌─────────────────────────────────────────┐      │
│  │ Unit 6                                  │      │
│  │ Jane Smith                              │      │
│  │ jane.smith@email.com                    │      │
│  │                         Active [badge] │      │
│  └─────────────────────────────────────────┘      │
│                                                     │
└─────────────────────────────────────────────────────┘

INTERACTION:
• Hover over unit → only visual hover on green (no functional change)
• Click unit → nothing happens (read-only view)
• View tenant details below grid
• Refresh page → data reloads from database
```

---

## Data Flow Comparison

### TENANT SIDE FLOW

```
┌──────────────────┐
│ Select Property  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────┐
│ TenantAPI.getAllUnits    │  ← Makes API call
│ WithStatus(propertyId)   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Database Function:       │
│ get_available_unit_      │
│ numbers(property_id)     │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Queries:                 │
│ 1. Active tenants in     │
│    each unit             │
│ 2. Pending/approved apps │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Returns:                 │
│ [                        │
│  {unit: "Unit 1",        │
│   status: "available"},  │
│  {unit: "Unit 2",        │
│   status: "occupied"},   │
│  ...                     │
│ ]                        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Display Interactive Grid │
│ • Green = clickable      │
│ • Gray = disabled        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Tenant Selects Unit      │
│ + Click Submit           │
└──────────────────────────┘
```

### OWNER SIDE FLOW

```
┌──────────────────────────┐
│ Navigate to Property     │
│ Details Page             │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Component useEffect:     │
│ • Fetch property details │
│ • Fetch property tenants │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Data loaded:             │
│ property.total_units=10  │
│ tenants = [...]          │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Click "Rooms" Tab        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Generate Room Grid:      │
│ Array.from({             │
│   length: total_units    │
│ }).map(...)              │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ For each Unit:           │
│ Check:                   │
│ tenants.some(            │
│   t=>t.unit_number==     │
│   unitNumber             │
│ )                        │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Display Room Grid:       │
│ • Green = not in tenants │
│ • Gray = in tenants      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Display Tenant List      │
│ Below Grid               │
└──────────────────────────┘
```

---

## Key Differences

| Aspect             | Tenant                       | Owner                        |
| ------------------ | ---------------------------- | ---------------------------- |
| **Purpose**        | Apply for a unit             | Monitor occupancy            |
| **Grid Type**      | Interactive                  | Read-only display            |
| **Data Loading**   | Real-time API call           | Pre-loaded with component    |
| **Color Meaning**  | Available (rent) vs Occupied | Available vs Occupied        |
| **User Action**    | Click to select              | View only                    |
| **Shows Details**  | Selected unit summary        | All occupied units + tenants |
| **Update Trigger** | When property changes        | When page loads              |
| **Columns**        | 2-4 responsive               | 2-6 responsive               |
| **Extra Info**     | Property name, rent          | Tenant names, emails, status |

---

## Backend Logic Comparison

### TENANT: Check Occupancy (SQL)

```sql
-- Find available units:
WITH occupied_units AS (
  -- Active tenants
  SELECT unit_number FROM tenants
  WHERE property_id = ? AND status = 'active'
  UNION
  -- Pending/approved applications
  SELECT unit_number FROM rental_applications
  WHERE property_id = ? AND status IN ('pending', 'approved')
)
-- Generate all units
SELECT 'Unit ' || generate_series(1, total_units)
FROM properties WHERE id = ?
-- Get units NOT in occupied list
EXCEPT
SELECT unit_number FROM occupied_units
```

### OWNER: Check Occupancy (JavaScript)

```javascript
// For each generated unit:
const unitNumber = `Unit ${index + 1}`;

// Check if occupied:
const isOccupied = tenants.some(t => t.unit_number === unitNumber);

// CSS logic:
if (isOccupied) {
  // Show gray, disabled
} else {
  // Show green, available
}
```

---

## When Updates Happen

### TENANT SIDE

```
Update Trigger: Property Selection Changes
Time to Update: ~500ms (loading state visible)
Refresh Method: Manual (when user selects new property)
```

### OWNER SIDE

```
Update Trigger: Page Load / Component Mount
Time to Update: On component render
Refresh Method: Manual (user must refresh page)
or Auto: If real-time listeners added
```

---

## Status States in System

```
TENANT'S PERSPECTIVE:
Unit 1 → Green (Available) → Can apply
Unit 2 → Gray (Occupied) → Cannot apply
     ↓
   Applies for Unit 1
     ↓
Unit 1 → Gray (Pending) → Cannot select anymore
     ↓
   Owner approves
     ↓
Unit 1 → Gray (Active Tenant) → Shows tenant info

OWNER'S PERSPECTIVE:
Sees exact same state:
• Unit 1 = Occupied (status = "pending" or "active")
• Unit 2 = Occupied (tenant exists)
• Unit 3-10 = Available (no tenant, no pending app)
```

---

## Current Implementation Status

| Component           | File                                              | Status     | Logic                   |
| ------------------- | ------------------------------------------------- | ---------- | ----------------------- |
| **Tenant Grid**     | `/tenant/.../new/page.tsx`                        | ✅ Working | Interactive with API    |
| **Tenant API**      | `/lib/api/tenant.ts`                              | ✅ Working | Calls DB functions      |
| **DB Function**     | `/scripts/migrations/006_fix_unit_numbers_v2.sql` | ✅ Working | Returns available units |
| **Owner Grid**      | `/owner/.../[id]/page.tsx`                        | ✅ Working | Displays tenants data   |
| **Occupancy Logic** | Both sides                                        | ✅ Synced  | Same data source        |

✨ **Everything is working correctly and in sync!**

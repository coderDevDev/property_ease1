# System Architecture Diagram

## Complete Room Availability System

```
╔════════════════════════════════════════════════════════════════════════╗
║           PROPERTY EASE - ROOM AVAILABILITY SYSTEM                    ║
╚════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────┐
│                         OWNER SIDE                                   │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. CREATE PROPERTY PAGE                                            │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Property Name: "Residential Complex"                       │   │
│  │ Address: "123 Main St"                                     │   │
│  │ ...                                                        │   │
│  │ Total Units: 20 ← Input field                             │   │
│  │ Error message (if invalid)                                │   │
│  │ ╔═══════════════════════════════════════════════════════╗ │   │
│  │ ║ ℹ️  Room System (NEW)                                ║ │   │
│  │ ║ Each unit will be labeled "Unit 1", "Unit 2", etc. ║ │   │
│  │ ║ Tenants select from available rooms.               ║ │   │
│  │ ╚═══════════════════════════════════════════════════════╝ │   │
│  │ [Create Button]                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  2. PROPERTY DETAILS PAGE                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Tabs: [Overview] [Analytics] [Details] [🏢 Rooms] (NEW)    │   │
│  │                                                            │   │
│  │ When "Rooms" tab clicked:                                 │   │
│  │ ┌──────────────────────────────────────────────────────┐ │   │
│  │ │ 🏢 Room Availability                                │ │   │
│  │ │                                                      │ │   │
│  │ │ Total Units: 20                                     │ │   │
│  │ │ 🟢 Green = Available | ⚫ Gray = Occupied          │ │   │
│  │ │                                                      │ │   │
│  │ │ ROOM GRID (Responsive):                            │ │   │
│  │ │ ┌─────┬─────┬─────┬─────┬─────┬─────┐             │ │   │
│  │ │ │U1   │U2   │U3   │U4   │U5   │U6   │             │ │   │
│  │ │ │🟢   │🟢   │⚫   │🟢   │⚫   │🟢   │             │ │   │
│  │ │ │Avai │Avai │Occu │Avai │Occu │Avai │             │ │   │
│  │ │ └─────┴─────┴─────┴─────┴─────┴─────┘             │ │   │
│  │ │ ┌─────┬─────┬─────┬─────┬─────┬─────┐             │ │   │
│  │ │ │U7   │U8   │U9   │U10  │U11  │U12  │             │ │   │
│  │ │ │⚫   │🟢   │🟢   │⚫   │⚫   │🟢   │             │ │   │
│  │ │ │Occu │Avai │Avai │Occu │Occu │Avai │             │ │   │
│  │ │ └─────┴─────┴─────┴─────┴─────┴─────┘             │ │   │
│  │ │ ... (more rows)                                     │ │   │
│  │ │                                                      │ │   │
│  │ │ Occupied Units (8)                                 │ │   │
│  │ │ ┌──────────────────────────────────────────────┐   │ │   │
│  │ │ │ Unit 3        [Active]                      │   │ │   │
│  │ │ │ John Doe                                    │   │ │   │
│  │ │ │ john.doe@email.com                          │   │ │   │
│  │ │ └──────────────────────────────────────────────┘   │ │   │
│  │ │ ┌──────────────────────────────────────────────┐   │ │   │
│  │ │ │ Unit 5        [Active]                      │   │ │   │
│  │ │ │ Jane Smith                                  │   │ │   │
│  │ │ │ jane.smith@email.com                        │   │ │   │
│  │ │ └──────────────────────────────────────────────┘   │ │   │
│  │ │ ... (more occupied units)                          │ │   │
│  │ └──────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                              ⬇️ API/DATABASE
┌──────────────────────────────────────────────────────────────────────┐
│                       BACKEND SYSTEM                                 │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  PROPERTIES TABLE                                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ id: xyz                                                    │  │
│  │ name: "Residential Complex"                               │  │
│  │ total_units: 20  ← Determines how many units exist       │  │
│  │ occupied_units: 8  ← Auto-calculated                     │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  UNITS GENERATED FROM total_units:                                 │
│  Unit 1, Unit 2, Unit 3, ... Unit 20                              │
│  (Generated programmatically, not stored)                          │
│                                                                      │
│  TENANTS TABLE                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ [Active Tenant] → Unit 3                                 │  │
│  │ [Active Tenant] → Unit 5                                 │  │
│  │ [Pending Tenant] → Unit 8                                │  │
│  │ ... (etc)                                                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  RENTAL_APPLICATIONS TABLE                                         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ [Pending App] → Unit 12                                  │  │
│  │ [Approved App] → Unit 15                                 │  │
│  │ ... (etc)                                                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  OCCUPANCY LOGIC:                                                  │
│  Room Status = "OCCUPIED" IF:                                      │
│    - Tenant exists with unit_number, OR                           │
│    - Pending/Approved application for unit_number                 │
│  OTHERWISE: "AVAILABLE"                                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
                              ⬇️ API/DATABASE
┌──────────────────────────────────────────────────────────────────────┐
│                       TENANT SIDE                                    │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. BROWSE PROPERTIES                                              │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ [Property List]                                            │  │
│  │ Residential Complex - 12/20 Available - [Apply]           │  │
│  │ Downtown Apartments - 5/10 Available - [Apply]            │  │
│  │ ... (more properties)                                      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  2. SELECT PROPERTY & VIEW ROOM GRID                               │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ Apply for: Residential Complex                            │  │
│  │ Available Units: 12/20                                    │  │
│  │                                                            │  │
│  │ SELECT YOUR UNIT:                                         │  │
│  │ ┌─────┬─────┬─────┬─────┬─────┬─────┐                  │  │
│  │ │U1   │U2   │U3   │U4   │U5   │U6   │                  │  │
│  │ │🟢   │🟢   │⚫   │🟢   │⚫   │🟢   │                  │  │
│  │ │Avai │Avai │Occ  │Avai │Occ  │Avai │                  │  │
│  │ └─────┴─────┴─────┴─────┴─────┴─────┘                  │  │
│  │ ┌─────┬─────┬─────┬─────┬─────┬─────┐                  │  │
│  │ │U7   │U8   │U9   │U10  │U11  │U12  │                  │  │
│  │ │⚫   │🟢   │🟢   │⚫   │⚫   │🟢   │                  │  │
│  │ │Occ  │Avai │Avai │Occ  │Occ  │Avai │                  │  │
│  │ └─────┴─────┴─────┴─────┴─────┴─────┘                  │  │
│  │                                                            │  │
│  │ Click GREEN room to select → turns BLUE                 │  │
│  │ Disabled: Only GREEN rooms clickable                    │  │
│  │ Gray rooms: Cannot select (occupied)                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  3. SELECTED ROOM CONFIRMATION                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ ✓ Selected Unit Details                                  │  │
│  │ Unit Number: Unit 5                                      │  │
│  │ Type: Residential                                        │  │
│  │ Monthly Rent: ₱15,000                                    │  │
│  │ [Continue with Application]                              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  4. SUBMIT APPLICATION                                             │
│  → Unit 5 marked as "OCCUPIED" (pending status)                  │
│  → Other tenants see Unit 5 as GRAY                              │
│  → Unit 5 shows tenant details to owner                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
OWNER CREATES PROPERTY
    │
    ├─ Enters: name, address, total_units: 20
    ├─ Sees: Info box explaining room system
    └─ Clicks: [Create]
         │
         ⬇️ DATABASE
         │
    ├─ Properties table: saves with total_units: 20
    └─ System generates: Unit 1, Unit 2, ... Unit 20
         │
         ⬇️
    OWNER CAN NOW:
    └─ View Property Details
         │
         ├─ Click "Rooms" tab
         ├─ See room grid: Unit 1-20
         └─ All rooms GREEN initially (all available)

TENANT APPLIES
    │
    ├─ Browse properties
    ├─ Click "Apply"
    ├─ See room grid (same as owner sees)
    ├─ Click AVAILABLE (GREEN) room: Unit 5
    ├─ Submit application
    └─ Database updated: rental_applications table
         │
         ⬇️ OCCUPANCY RECALCULATED
         │
    ├─ Unit 5: Now marked as "OCCUPIED" (pending)
    ├─ Tenant sees: Unit 5 shows their name/email
    └─ Other tenants see: Unit 5 is GRAY (can't select)

OWNER MONITORS
    │
    ├─ View Property Details
    ├─ Click "Rooms" tab
    └─ Sees:
         ├─ Room grid with Unit 5 now GRAY
         ├─ Occupied Units section
         └─ Unit 5: Jane Smith (jane@email.com) [Pending]
```

---

## Component Hierarchy

```
New Property Page
├─ Form
│  ├─ Property Details
│  ├─ Property Settings
│  ├─ Unit Configuration
│  │  ├─ Total Units Input
│  │  ├─ Error Message
│  │  └─ 🆕 Info Box (NEW)
│  │     ├─ Icon: Info
│  │     ├─ Title: "Room System"
│  │     └─ Description: Explains room labeling
│  ├─ Upload Images
│  ├─ Amenities
│  └─ [Create Button]
└─ Success/Error Messages

Property Details Page
├─ Header
│  ├─ Property Name
│  ├─ Address
│  ├─ Edit/Delete Buttons
│  └─ Property Code
│
├─ Quick Stats Cards
│  ├─ Total Units
│  ├─ Occupied Units
│  ├─ Monthly Rent
│  └─ Occupancy Rate
│
├─ Tabs
│  ├─ Overview Tab
│  │  ├─ Images Gallery
│  │  └─ Unit Statistics
│  ├─ Analytics Tab
│  │  └─ (Analytics content)
│  ├─ Details Tab
│  │  └─ (Property details)
│  └─ 🆕 Rooms Tab (NEW)
│     ├─ Summary Stats Box
│     │  ├─ Total Units Count
│     │  └─ Color Legend
│     ├─ Room Grid (Responsive)
│     │  └─ Units 1-N with status
│     └─ Occupied Units Details
│        └─ List of tenants
│           ├─ Unit Number
│           ├─ Tenant Name/Email
│           └─ Status Badge
│
└─ Documents Section
```

---

## State Flow

```
Property State
├─ property {
│  ├─ id: string
│  ├─ name: string
│  ├─ total_units: number  ← Key for room generation
│  ├─ occupied_units: number
│  └─ ... other fields
│  }
│
└─ tenants: Array {
   ├─ id: string
   ├─ unit_number: string  ← Determines occupancy
   ├─ user: {
   │  ├─ first_name: string
   │  ├─ last_name: string
   │  ├─ email: string
   │  └─ phone: string
   │  }
   ├─ lease_start: string
   ├─ lease_end: string
   ├─ monthly_rent: number
   └─ status: string
   }

Room Grid Generation
├─ for (let i = 0; i < property.total_units; i++) {
│  ├─ unitNumber = `Unit ${i + 1}`
│  ├─ isOccupied = tenants.some(t => t.unit_number === unitNumber)
│  └─ render({
│     ├─ label: unitNumber
│     ├─ status: isOccupied ? "occupied" : "available"
│     └─ style: isOccupied ? gray : green
│     })
│  }
└─ end
```

---

## Color Coding

```
🟢 GREEN = AVAILABLE
   └─ No tenant assigned
   └─ No pending/approved application
   └─ Can select (tenants)
   └─ Border: Green 300
   └─ Background: Green 50
   └─ Text: "🟢 Available"

⚫ GRAY = OCCUPIED
   └─ Active/pending tenant, OR
   └─ Pending/approved application
   └─ Cannot select (tenants)
   └─ Border: Gray 300
   └─ Background: Gray 100
   └─ Opacity: 60%
   └─ Text: "⚫ Occupied"

🔵 BLUE = SELECTED (Tenant Side)
   └─ User clicked this room
   └─ Shows selection highlight
   └─ Border: Blue 500
   └─ Background: Blue 50
   └─ Shadow: Medium
```

---

## API Calls Used

```
Already Implemented:
├─ getProperty(propertyId)
│  └─ Returns: property with total_units
│
├─ getTenants(propertyId)
│  └─ Returns: Array of tenants with unit_number
│
└─ getAllUnitsWithStatus(propertyId)
   └─ Returns: [{unit_number, status}, ...]

New Calls: NONE ✓
(Uses existing data only)
```

---

## Responsive Breakpoints

```
Mobile (< 640px):
└─ Room Grid: 2 columns

Tablet (640px - 1024px):
└─ Room Grid: 3 columns

Desktop (> 1024px):
└─ Room Grid: 4-6 columns

For 20 units:
├─ Mobile: 10 rows of 2
├─ Tablet: 7 rows of 3
└─ Desktop: 5 rows of 4 or 4 rows of 5
```

---

## Timeline

```
PHASE 1: Owner Creates Property
├─ Day 1-X: Property has X units
└─ All X units start as AVAILABLE (green)

PHASE 2: Tenant Applies
├─ Tenant clicks unit
├─ Applies for that specific unit
└─ Unit status → PENDING (still gray)

PHASE 3: Owner Reviews
├─ Owner sees room grid
├─ Sees unit marked as pending
└─ Decides to approve/reject

PHASE 4: Application Approved
├─ Unit status → OCCUPIED
├─ Lease active
├─ Tenant moves in
└─ Remains gray for future applicants

PHASE 5: Application Rejected
├─ Unit status reverts to AVAILABLE
├─ Turns green
└─ Other tenants can now see/select it

PHASE 6: Tenant Moves Out
├─ Lease ends
├─ Tenant status → TERMINATED
├─ Unit status → AVAILABLE
└─ Turns green for new applicants
```

---

## Error Handling

```
No errors expected in normal operation because:

✅ Units generated from total_units (always valid)
✅ Tenants queried from database (always valid)
✅ Matching logic is simple: unit_number comparison
✅ No external API calls
✅ No complex calculations
✅ Type-safe with TypeScript

Edge Cases Handled:
├─ Zero tenants → Shows empty state message
├─ All units occupied → Grid shows all gray
├─ All units available → Grid shows all green
└─ Responsive layout → Adapts to any screen size
```

# Room Availability Configuration & Display Workflow

## Complete Setup Guide for Owner & Tenant

### 1. OWNER SIDE - Configuration (Setup Phase)

#### Step 1: Create New Property

Navigate to: **Owner Dashboard → Properties → New Property**

```
Form Fields:
├─ Property Details
│  ├─ Property Name: "Residential Complex A"
│  ├─ Address: "123 Main Street"
│  ├─ City/Province/Postal
│  └─ Type: (Residential, Commercial, Dormitory)
│
├─ Property Settings
│  ├─ Status: Active
│  ├─ Description: "Modern apartment complex"
│  └─ Monthly Rent: ₱15,000
│
└─ Unit Configuration ⭐ IMPORTANT
   └─ Total Units: 20  ← This determines how many rooms are available
```

**Example:**

- If owner enters `Total Units: 20`
- System generates: `Unit 1`, `Unit 2`, ... `Unit 20`

#### Step 2: Edit Existing Property

Navigate to: **Owner Dashboard → Properties → [Property Name] → Edit**

Can update:

- Total units (if building expanded/reduced)
- Monthly rent
- Property details
- Amenities
- Images

---

### 2. TENANT SIDE - Room Selection (Application Phase)

#### Step 1: Browse Available Properties

Navigate to: **Tenant Dashboard → Applications → New Application**

```
Property Listing:
├─ Property Name
├─ Available Units: X/Y
├─ Monthly Rent
└─ [Apply Now Button]
```

#### Step 2: Select Property

Click on property → Automatically loads **Room Availability Grid**

```
Room Selection Grid:
┌──────────────────────────────────────┐
│  Unit 1      Unit 2      Unit 3      │
│  ● Available ● Occupied  ● Available │
│  (Green)     (Gray)      (Green)     │
├──────────────────────────────────────┤
│  Unit 4      Unit 5      Unit 6      │
│  ● Occupied  ● Available ● Occupied  │
│  (Gray)      (Green)     (Gray)      │
└──────────────────────────────────────┘

Legend:
🟢 Green  = Available (Clickable) - No tenant
⚫ Gray   = Occupied (Disabled)   - Already has tenant or pending application
🔵 Blue   = Selected (Highlighted) - Tenant chose this unit
```

#### Step 3: Select a Room

- Click on any **GREEN** room card
- Room turns **BLUE** with shadow effect
- Shows confirmation summary:

```
✓ Selected Unit Details
────────────────────────────
Unit Number:  Unit 5
Type:         Residential
Monthly Rent: ₱15,000
Property:     Residential Complex A
```

#### Step 4: Complete Application

- Enter move-in date
- Upload documents
- Add message
- Submit application

---

## Database/Backend Logic

### Unit Availability Status Determination

```sql
A unit is marked as "OCCUPIED" if ANY of these are true:

1. Active Tenant Exists
   └─ WHERE tenants.property_id = property_id
     AND tenants.unit_number = unit_number
     AND tenants.status IN ('active', 'pending')
     AND tenants.status != 'terminated'

2. Pending/Approved Application Exists
   └─ WHERE rental_applications.property_id = property_id
     AND rental_applications.unit_number = unit_number
     AND rental_applications.status IN ('pending', 'approved')

Otherwise → "AVAILABLE"
```

### API Flow

**Owner creates property:**

```
POST /api/properties
{
  name: "Residential Complex A",
  total_units: 20,
  ...
}
↓
Creates Units: Unit 1 → Unit 20 in database
```

**Tenant browses units:**

```
GET /api/tenant/units-with-status?propertyId=xyz
↓
Returns:
[
  { unit_number: "Unit 1", status: "available" },
  { unit_number: "Unit 2", status: "occupied" },
  { unit_number: "Unit 3", status: "available" },
  ...
]
```

**Tenant applies for specific unit:**

```
POST /api/tenant/applications
{
  propertyId: "xyz",
  unitNumber: "Unit 5",  ← Specific unit selected
  ...
}
↓
✅ Application created
✅ Unit 5 now shows as "occupied" for other tenants
```

---

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        OWNER SIDE                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Create Property                                         │
│     ├─ Enter: Total Units = 20                             │
│     └─ System Creates: Unit 1, 2, 3, ... 20               │
│                                                              │
│  2. Add Tenants                                            │
│     ├─ Assign: Unit 5 → Tenant A                          │
│     └─ Mark: Unit 5 as "Occupied"                         │
│                                                              │
│  3. View Occupancy Status                                  │
│     ├─ Dashboard: 7/20 units occupied                     │
│     └─ Room List: Shows which are occupied/available      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ⬇️ DATABASE ⬇️
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LOGIC                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Properties Table:                                         │
│  ├─ property_id: xyz                                       │
│  ├─ name: "Residential Complex A"                         │
│  ├─ total_units: 20                                       │
│  └─ occupied_units: 7                                     │
│                                                              │
│  Tenants Table:                                            │
│  ├─ unit_number: "Unit 5"   → status: "active"           │
│  ├─ unit_number: "Unit 8"   → status: "active"           │
│  ├─ unit_number: "Unit 12"  → status: "active"           │
│  └─ ...                                                     │
│                                                              │
│  Rental Applications Table:                                │
│  ├─ unit_number: "Unit 15"  → status: "pending"          │
│  └─ ...                                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ⬇️ API ⬇️
┌─────────────────────────────────────────────────────────────┐
│                      TENANT SIDE                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Browse Properties                                      │
│     └─ See: "Residential Complex A - 13/20 Available"    │
│                                                              │
│  2. Click Apply → View Room Grid                          │
│     ┌──────────┬──────────┬──────────┐                    │
│     │  Unit 1  │  Unit 5  │  Unit 8  │                    │
│     │Available │Occupied  │Occupied  │                    │
│     │  🟢      │    ⚫     │    ⚫     │                    │
│     └──────────┴──────────┴──────────┘                    │
│     ┌──────────┬──────────┬──────────┐                    │
│     │ Unit 12  │ Unit 15  │ Unit 17  │                    │
│     │Occupied  │Occupied  │Available │                    │
│     │    ⚫     │    ⚫     │   🟢     │                    │
│     └──────────┴──────────┴──────────┘                    │
│                                                              │
│  3. Select Available Unit → Click Unit 1                   │
│     └─ Unit 1 turns BLUE ✓ Selected                       │
│                                                              │
│  4. Submit Application                                     │
│     └─ Unit 1 immediately shows as "Occupied"            │
│        for other tenants (status: pending)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Features

### ✅ For Owners:

1. **Simple Setup**: Just enter total units when creating property
2. **Auto-Tracking**: System automatically manages occupancy
3. **Dashboard View**: See which units are occupied at a glance
4. **Easy Management**: Add/remove tenants updates availability in real-time

### ✅ For Tenants:

1. **Clear Visibility**: See exactly which rooms are available
2. **Visual Status**: Green (available) vs Gray (occupied)
3. **Easy Selection**: Click to select, no manual entry errors
4. **Real-time Updates**: Knows immediately if a unit is taken

### ✅ For System:

1. **Data Integrity**: Prevents double-booking
2. **Automatic Updates**: Status changes instantly
3. **Scalable**: Works for any number of units
4. **Audit Trail**: All applications tracked

---

## Example Scenarios

### Scenario 1: New Property Setup

```
Owner creates:
- Property: "Downtown Apartments"
- Total Units: 50
- Monthly Rent: ₱12,000

System generates: Unit 1 to Unit 50 (all available)

Tenant sees:
- 50/50 Available units in grid
- Can click any green room
```

### Scenario 2: Partially Occupied Property

```
Owner adds tenants:
- Unit 1 → Tenant A (active)
- Unit 5 → Tenant B (active)
- Unit 10 → Tenant C (active)
- Unit 15 → Pending Application

Tenant sees:
- 46/50 available
- Grid shows: Units 1, 5, 10, 15 in GRAY
- Other 46 units in GREEN
```

### Scenario 3: Application Submitted

```
Tenant applies for Unit 20:
- Application status: "pending"
- Unit 20 changes to "occupied" status

Other tenants now see:
- Unit 20 in GRAY (disabled)
- Cannot select Unit 20

If application rejected:
- Unit 20 changes back to "available"
- Turns GREEN again
```

---

## Testing Checklist

- [ ] Owner can create property with total units
- [ ] Tenant sees room grid with correct availability
- [ ] Available rooms are GREEN and clickable
- [ ] Occupied rooms are GRAY and disabled
- [ ] Selecting a room shows confirmation
- [ ] Application submission marks room as occupied
- [ ] Rejected applications release rooms back
- [ ] Multiple tenants see consistent availability

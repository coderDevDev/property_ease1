# ⚡ Quick Reference: Unit Availability System

## TL;DR

✅ **YES - The unit availability logic exists on BOTH sides**

**Tenant Side**: Shows interactive grid of available/occupied units

- File: `/app/tenant/dashboard/applications/new/page.tsx`
- User selects from GREEN (available) units
- GRAY (occupied) units are disabled
- Data comes from database API

**Owner Side**: Shows read-only grid of occupancy

- File: `/app/owner/dashboard/properties/[id]/page.tsx`
- Rooms Tab displays all units with status
- Shows tenant details for occupied units
- Data comes from fetched tenants array

---

## One-Page Quick Reference

### STATUS AT A GLANCE

```
┌─────────────────────────────────────────────────────────────┐
│ TENANT: /tenant/dashboard/applications/new                  │
│ ✅ Interactive grid                                         │
│ ✅ Shows available (green) vs occupied (gray)               │
│ ✅ User clicks to select unit                               │
│ ✅ Submits application with selected unit                   │
├─────────────────────────────────────────────────────────────┤
│ OWNER: /owner/dashboard/properties/[id]                     │
│ ✅ Click "Rooms" tab                                        │
│ ✅ Shows all units with status                              │
│ ✅ Lists tenants below grid                                 │
│ ✅ Read-only display                                        │
├─────────────────────────────────────────────────────────────┤
│ BACKEND: Database functions                                 │
│ ✅ get_available_unit_numbers()                             │
│ ✅ is_unit_available_simple()                               │
│ ✅ Determines occupancy from tenants + applications         │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Files

| Component        | File                                              | Lines     | Status             |
| ---------------- | ------------------------------------------------- | --------- | ------------------ |
| **Tenant UI**    | `/app/tenant/dashboard/applications/new/page.tsx` | 1-825     | ✅ Working         |
| **Tenant Logic** | `handlePropertyChange()`                          | 130-170   | ✅ Fetches units   |
| **Tenant Grid**  | `availableUnits.map()`                            | 340-395   | ✅ Displays grid   |
| **Tenant API**   | `/lib/api/tenant.ts`                              | 2758-2850 | ✅ API calls       |
| **Owner UI**     | `/app/owner/dashboard/properties/[id]/page.tsx`   | 1419-1502 | ✅ Rooms tab       |
| **Owner Logic**  | `Array.from().map()`                              | 1435-1470 | ✅ Grid generation |
| **DB Function**  | `/scripts/migrations/006_fix_unit_numbers_v2.sql` | -         | ✅ SQL logic       |

---

## How It Works (Simple Version)

### TENANT FLOW

```
1. Tenant clicks "Apply Now" on property
2. System shows: Select a Property dropdown
3. Tenant selects property
4. System calls API: TenantAPI.getAllUnitsWithStatus(propertyId)
5. Backend queries database: get_available_unit_numbers(propertyId)
6. Database returns: [Unit 1, Unit 3, Unit 5, Unit 7, ...]
7. System displays: Grid with green (Unit 1,3,5,7) & gray (Unit 2,4,6)
8. Tenant clicks Unit 1 (green)
9. System highlights Unit 1
10. Tenant clicks "Submit"
11. System creates application with unitNumber = "Unit 1"
```

### OWNER FLOW

```
1. Owner navigates to property details
2. Owner clicks "Rooms" tab
3. System loads: property (with total_units=10) + tenants array
4. System generates grid: Array.from({ length: 10 })
5. For each unit (1-10):
   - Check if unit in tenants array
   - If yes: show GRAY with tenant info
   - If no: show GREEN (available)
6. Owner sees all units with occupancy status
```

---

## Color Legend

### TENANT SIDE

```
🟢 GREEN (Available)
├─ Not occupied by tenant
├─ No pending application
└─ ✅ Clickable - Tenant can select

⚫ GRAY (Occupied)
├─ Has active tenant OR
├─ Has pending/approved application
└─ ❌ Disabled - Cannot select
```

### OWNER SIDE

```
🟢 GREEN (Available)
├─ No tenant in this unit
└─ Ready to rent

⚫ GRAY (Occupied)
├─ Has active tenant
└─ Shows tenant details below
```

---

## Data Locations

| Data                   | Source                        | Used By                    |
| ---------------------- | ----------------------------- | -------------------------- |
| `property.total_units` | Properties table              | Owner: generates grid      |
| `tenants array`        | Tenants table (owner fetches) | Owner: checks occupancy    |
| `availableUnits array` | API response                  | Tenant: displays grid      |
| `formData.unitNumber`  | User input                    | Tenant: stored & submitted |
| `unit_number` (in DB)  | Tenants/Applications table    | Both: determines occupancy |

---

## Unit Occupancy Rules

A unit is **OCCUPIED** if:

```
1. There's an active tenant record:
   SELECT * FROM tenants
   WHERE property_id = ?
   AND unit_number = 'Unit X'
   AND status = 'active'

2. OR there's a pending/approved application:
   SELECT * FROM rental_applications
   WHERE property_id = ?
   AND unit_number = 'Unit X'
   AND status IN ('pending', 'approved')
```

A unit is **AVAILABLE** if:

```
Neither condition above is true
```

---

## Testing Quick Steps

### Test Tenant Side

```bash
1. Go to: /tenant/dashboard/applications/new
2. Select a property with 10 units
3. See grid load
4. Verify: Green boxes are clickable, gray are not
5. Click green unit
6. See selection highlight
7. Fill rest of form
8. Submit
✅ Done
```

### Test Owner Side

```bash
1. Go to: /owner/dashboard/properties/[property-id]
2. Click "Rooms" tab
3. See all units (1-10)
4. Check: Green = available, Gray = occupied
5. Scroll down to see tenant list
6. Verify: Names and emails match
✅ Done
```

---

## Common Issues & Solutions

| Issue                      | Solution                                           |
| -------------------------- | -------------------------------------------------- |
| **Units not loading**      | Check property.total_units > 0, check API response |
| **All units gray**         | Check tenants data, verify occupancy check logic   |
| **Tenant details missing** | Check tenant.user data loaded, check email field   |
| **Grid not responsive**    | Browser zoom issue, check grid-cols classes        |
| **Unit appears twice**     | Check unique key in map, check database duplicates |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend Components                   │
├──────────────────────┬────────────────────────────────┤
│ Tenant/new/page.tsx  │ Owner/[id]/page.tsx           │
│                      │                                │
│ State:               │ State:                         │
│ • selectedProperty   │ • property                     │
│ • availableUnits     │ • tenants                      │
│ • formData           │                                │
└──────────────────────┴────────────────────────────────┘
         │                        │
         │ API Call               │ Direct State
         │                        │
    ┌────▼─────────────────────────▼──────┐
    │      Supabase Database               │
    ├──────────────────────────────────────┤
    │ Tables:                              │
    │ • properties (total_units)           │
    │ • tenants (unit_number, status)      │
    │ • rental_applications (unit_number)  │
    │                                      │
    │ RPC Functions:                       │
    │ • get_available_unit_numbers()       │
    │ • is_unit_available_simple()         │
    └──────────────────────────────────────┘
```

---

## API Methods

### Tenant API Calls

```typescript
// In: /lib/api/tenant.ts

// Get all units with status
TenantAPI.getAllUnitsWithStatus(propertyId)
→ Returns: [{ unit_number: "Unit 1", status: "available" }, ...]

// Get only available units
TenantAPI.getAvailableUnits(propertyId)
→ Returns: [{ unit_number: "Unit 1" }, ...]

// Submit application (validates unit availability)
TenantAPI.submitApplication({ propertyId, unitNumber, ... })
→ Calls: is_unit_available_simple() to validate
→ If valid: Creates rental_applications record
```

### Owner API Calls

```typescript
// In: OwnerAPI class

// Get property details
OwnerAPI.getPropertyDetails(propertyId)
→ Returns: property object with total_units

// Get property tenants
OwnerAPI.getPropertyTenants(propertyId)
→ Returns: [{ unit_number, user, status }, ...]
```

---

## Database Functions (SQL)

### get_available_unit_numbers()

```sql
-- Returns list of available unit numbers
SELECT unit_number
FROM generated_units (Unit 1 to N)
WHERE unit_number NOT IN (
  SELECT unit_number FROM tenants WHERE active
  UNION
  SELECT unit_number FROM applications WHERE pending/approved
)
```

### is_unit_available_simple()

```sql
-- Returns TRUE if unit is available
RETURN NOT EXISTS (
  SELECT 1 FROM tenants WHERE property=? AND unit=? AND active
) AND NOT EXISTS (
  SELECT 1 FROM applications WHERE property=? AND unit=? AND pending/approved
)
```

---

## File Checklist

- ✅ `/app/tenant/dashboard/applications/new/page.tsx` - Interactive grid
- ✅ `/app/owner/dashboard/properties/[id]/page.tsx` - Rooms tab (lines 1419-1502)
- ✅ `/lib/api/tenant.ts` - TenantAPI class with unit methods
- ✅ `/lib/api/owner.ts` - OwnerAPI class with property/tenant methods
- ✅ `/scripts/migrations/006_fix_unit_numbers_v2.sql` - Database functions
- ✅ Database: `tenants`, `rental_applications`, `properties` tables

---

## Quick Debug Commands

### Check what units exist

```sql
SELECT DISTINCT unit_number FROM tenants WHERE property_id = 'xxx';
SELECT DISTINCT unit_number FROM rental_applications WHERE property_id = 'xxx';
```

### Check occupancy

```sql
SELECT * FROM tenants WHERE property_id = 'xxx' AND status = 'active';
SELECT * FROM rental_applications WHERE property_id = 'xxx' AND status IN ('pending', 'approved');
```

### Verify function

```sql
SELECT * FROM get_available_unit_numbers('xxx');
SELECT is_unit_available_simple('xxx', 'Unit 1');
```

---

## Summary

| Aspect               | Status                       |
| -------------------- | ---------------------------- |
| **Tenant Grid**      | ✅ Implemented & Working     |
| **Owner Grid**       | ✅ Implemented & Working     |
| **Database Logic**   | ✅ Implemented & Working     |
| **API Integration**  | ✅ Implemented & Working     |
| **User Feedback**    | ✅ Color coding works        |
| **Data Validation**  | ✅ Unit availability checked |
| **Production Ready** | ✅ Yes                       |

🎉 **Both tenant and owner sides have working unit availability systems!**

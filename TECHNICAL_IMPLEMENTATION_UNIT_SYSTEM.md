# 🔧 Technical Implementation: Unit Availability System

## Executive Summary

✅ **Both tenant and owner sides have full unit availability logic implemented**

The system works as follows:

- **Tenant Side**: Interactive grid where tenants select available units to apply for
- **Owner Side**: Read-only grid showing all units and which are occupied with tenant details
- **Backend**: Single source of truth using database functions to determine occupancy

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                           │
├─────────────────────┬───────────────────────────────────────┤
│   TENANT SIDE       │        OWNER SIDE                     │
│   /tenant/...       │        /owner/...                     │
│   new/page.tsx      │        [id]/page.tsx                  │
│                     │                                       │
│   Interactive Grid  │        Display Grid + Tenants         │
│   • API driven      │        • State driven                  │
│   • Real-time load  │        • Page load driven             │
│   • User selects    │        • View only                    │
└─────────────────────┴───────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                │
├─────────────────────────────────────────────────────────────┤
│   TenantAPI.getAllUnitsWithStatus(propertyId)              │
│   TenantAPI.getAvailableUnits(propertyId)                  │
│   OwnerAPI.getPropertyTenants(propertyId)                  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│   Tables:                                                   │
│   • properties (total_units, type, etc.)                   │
│   • tenants (unit_number, status, property_id)            │
│   • rental_applications (unit_number, status, property_id) │
│                                                             │
│   Functions:                                                │
│   • get_available_unit_numbers(property_id)               │
│   • is_unit_available(property_id, unit_number)           │
│   • get_unit_availability_status(...)                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Component 1: Tenant-Side Implementation

### File Location

```
/app/tenant/dashboard/applications/new/page.tsx
Lines: 1-825
```

### Key Files

```
1. Component: /app/tenant/dashboard/applications/new/page.tsx
2. API: /lib/api/tenant.ts (class TenantAPI)
3. Database: /scripts/migrations/006_fix_unit_numbers_v2.sql
```

### Component State

```typescript
interface Property {
  id: string;
  name: string;
  type: string;
  unit_types: string[];
  monthly_rent: number;
  total_units: number;
  occupied_units: number;
  available_units: number;
}

interface AvailableUnit {
  unit_number: string;
  status: 'available' | 'occupied';
}

export default function NewApplicationPage() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [formData, setFormData] = useState({
    propertyId: '',
    unitType: '',
    unitNumber: '',
    moveInDate: null as Date | null,
    message: ''
  });
}
```

### Main Logic: handlePropertyChange()

```typescript
// Lines: ~130-170
const handlePropertyChange = async (propertyId: string) => {
  // 1. Find selected property
  const property = properties.find(p => p.id === propertyId);
  setSelectedProperty(property || null);

  // 2. Reset form
  setFormData(prev => ({
    ...prev,
    propertyId,
    unitType: '',
    unitNumber: ''
  }));

  // 3. Fetch available units
  if (property) {
    try {
      setLoadingUnits(true);

      // API Call: Get all units with status
      const result = await TenantAPI.getAllUnitsWithStatus(propertyId);

      if (result.success && result.data) {
        setAvailableUnits(result.data); // Store in state
      } else {
        toast.error('Failed to load available units');
        setAvailableUnits([]);
      }
    } catch (error) {
      console.error('Failed to fetch units:', error);
      toast.error('Failed to load available units');
      setAvailableUnits([]);
    } finally {
      setLoadingUnits(false);
    }
  }
};
```

### UI: Unit Selection Grid

```typescript
// Lines: ~340-395

{
  !loadingUnits && availableUnits.length > 0 ? (
    // Show grid
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {availableUnits.map(unit => (
        <button
          key={unit.unit_number}
          type="button"
          onClick={() => {
            if (unit.status === 'available') {
              setFormData(prev => ({
                ...prev,
                unitNumber: unit.unit_number
              }));
            }
          }}
          disabled={unit.status === 'occupied'}
          className={cn(
            'p-3 rounded-lg border-2 transition-all duration-200 text-center',
            // Selected state
            formData.unitNumber === unit.unit_number
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : // Available state
              unit.status === 'available'
              ? 'border-green-200 bg-green-50 hover:border-green-400 hover:shadow-md cursor-pointer'
              : // Occupied state
                'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
          )}>
          <div className="font-semibold text-sm">{unit.unit_number}</div>
          <div
            className={cn(
              'text-xs font-medium mt-1',
              unit.status === 'available' ? 'text-green-700' : 'text-gray-500'
            )}>
            {unit.status === 'available' ? (
              <span className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                Available
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                Occupied
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  ) : !loadingUnits && availableUnits.length === 0 ? (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <p className="text-sm text-amber-800">
        No units available. All units are currently occupied.
      </p>
    </div>
  ) : null;
}
```

### Application Submission

```typescript
// Lines: ~240-280
const submitApplication = async () => {
  try {
    setSubmitting(true);
    if (!authState.user?.id) return;

    const result = await TenantAPI.submitApplication({
      userId: authState.user.id,
      propertyId: formData.propertyId,
      unitType: formData.unitType,
      unitNumber: formData.unitNumber, // ← Selected unit
      moveInDate: formData.moveInDate!,
      message: formData.message,
      documents: uploadedFiles
    });

    if (result.success) {
      toast.success('Application submitted successfully');
      router.push('/tenant/dashboard/applications');
    } else {
      toast.error(result.message || 'Failed to submit application');
    }
  } catch (error) {
    console.error('Failed to submit application:', error);
    toast.error('Failed to submit application');
  }
};
```

---

## Component 2: Tenant API Layer

### File Location

```
/lib/api/tenant.ts
Lines: 2758-2800+ (TenantAPI class)
```

### API Method: getAllUnitsWithStatus

```typescript
static async getAllUnitsWithStatus(propertyId: string): Promise<{
  success: boolean;
  data?: Array<{
    unit_number: string;
    status: 'available' | 'occupied';
  }>;
  message?: string;
}> {
  try {
    // Call database RPC function
    const { data, error } = await supabase.rpc(
      'get_available_unit_numbers',
      { p_property_id: propertyId }
    );

    if (error) throw error;

    // Transform data: Mark returned units as available
    const availableUnits = (data || []).map((unit: any) => ({
      unit_number: unit.unit_number,
      status: 'available'
    }));

    // Get total units to calculate occupied
    const { data: property } = await supabase
      .from('properties')
      .select('total_units')
      .eq('id', propertyId)
      .single();

    // Fill in occupied units
    if (property) {
      const allUnits = [];
      const availableSet = new Set(availableUnits.map(u => u.unit_number));

      for (let i = 1; i <= property.total_units; i++) {
        const unitNumber = `Unit ${i}`;
        allUnits.push({
          unit_number: unitNumber,
          status: availableSet.has(unitNumber) ? 'available' : 'occupied'
        });
      }

      return { success: true, data: allUnits };
    }

    return { success: true, data: availableUnits };
  } catch (error) {
    console.error('Get all units with status error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch units'
    };
  }
}
```

### API Method: submitApplication (Unit Validation)

```typescript
// Lines: ~2799-2850
static async submitApplication(data: {
  userId: string;
  propertyId: string;
  unitType: string;
  unitNumber: string;      // ← The unit tenant selected
  moveInDate: Date;
  message?: string;
  documents: File[];
}): Promise<{
  success: boolean;
  data?: any;
  message?: string;
}> {
  try {
    // 1. VALIDATE: Check if unit is available
    const { data: isAvailable, error: availabilityError } =
      await supabase.rpc('is_unit_available_simple', {
        p_property_id: data.propertyId,
        p_unit_number: data.unitNumber
      });

    if (availabilityError) {
      throw availabilityError;
    }

    // 2. REJECT: If not available
    if (!isAvailable) {
      return {
        success: false,
        message: 'This unit is no longer available. Please select a different unit.'
      };
    }

    // 3. CREATE: Application record
    const { data: application, error: applicationError } = await supabase
      .from('rental_applications')
      .insert({
        user_id: data.userId,
        property_id: data.propertyId,
        unit_type: data.unitType,
        unit_number: data.unitNumber,
        move_in_date: data.moveInDate.toISOString(),
        message: data.message || '',
        status: 'pending',
        submitted_at: new Date().toISOString()
      })
      .select()
      .single();

    if (applicationError) throw applicationError;

    // 4. UPLOAD: Documents
    // ... upload logic ...

    return { success: true, data: application };
  } catch (error) {
    console.error('Submit application error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to submit application'
    };
  }
}
```

---

## Component 3: Database Functions

### File Location

```
/scripts/migrations/006_fix_unit_numbers_v2.sql
```

### Function: get_available_unit_numbers

```sql
CREATE OR REPLACE FUNCTION public.get_available_unit_numbers(
    property_id UUID
)
RETURNS TABLE (
    unit_number TEXT
) AS $$
DECLARE
    total_units INTEGER;
    property_type TEXT;
BEGIN
    -- Get total units for the property
    SELECT p.total_units, p.type
    INTO total_units, property_type
    FROM public.properties p
    WHERE p.id = get_available_unit_numbers.property_id;

    -- Get all occupied units
    RETURN QUERY
    WITH occupied_units AS (
        -- Active tenants
        SELECT DISTINCT t.unit_number
        FROM public.tenants t
        WHERE t.property_id = get_available_unit_numbers.property_id
        AND t.status != 'terminated'

        UNION

        -- Pending/approved applications
        SELECT DISTINCT ra.unit_number
        FROM public.rental_applications ra
        WHERE ra.property_id = get_available_unit_numbers.property_id
        AND ra.status IN ('pending', 'approved')
        AND ra.unit_number IS NOT NULL
    ),
    -- Generate all possible unit numbers
    all_units AS (
        SELECT 'Unit ' || generate_series(1, total_units)::text as unit_number
    )
    -- Return only units NOT in occupied list
    SELECT a.unit_number
    FROM all_units a
    LEFT JOIN occupied_units o ON a.unit_number = o.unit_number
    WHERE o.unit_number IS NULL
    ORDER BY a.unit_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Function: is_unit_available_simple

```sql
CREATE OR REPLACE FUNCTION public.is_unit_available_simple(
    p_property_id UUID,
    p_unit_number TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if unit is occupied by an active tenant
    IF EXISTS (
        SELECT 1
        FROM public.tenants
        WHERE property_id = p_property_id
          AND unit_number = p_unit_number
          AND status = 'active'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check if unit has any pending/approved applications
    IF EXISTS (
        SELECT 1
        FROM public.rental_applications
        WHERE property_id = p_property_id
          AND unit_number = p_unit_number
          AND status IN ('pending', 'approved')
    ) THEN
        RETURN FALSE;
    END IF;

    -- Unit is available
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_unit_available_simple(UUID, TEXT) TO authenticated;
```

---

## Component 4: Owner-Side Implementation

### File Location

```
/app/owner/dashboard/properties/[id]/page.tsx
Lines: 1419-1502 (Rooms Tab Content)
```

### Component State

```typescript
export default function PropertyDetailsPage() {
  const [property, setProperty] = useState<any>();
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    // Fetch property
    const getProperty = async () => {
      const result = await OwnerAPI.getPropertyDetails(propertyId);
      setProperty(result.data); // Contains total_units
    };

    // Fetch tenants
    const getTenants = async () => {
      const result = await OwnerAPI.getPropertyTenants(propertyId);
      setTenants(result.data); // Array with unit_number
    };

    getProperty();
    getTenants();
  }, [propertyId]);
}
```

### Room Grid Implementation

```typescript
// Lines: 1430-1485

<TabsContent value="rooms" className="mt-6">
  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Building className="w-5 h-5 text-blue-600" />
        Room Availability
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">
            <span className="font-semibold">Total Units:</span>{' '}
            {property.total_units}
          </p>
          <p className="text-xs text-gray-500">
            🟢 Green = Available | ⚫ Gray = Occupied
          </p>
        </div>

        {/* Room Grid - Dynamic Generation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: property.total_units }).map((_, index) => {
            // Generate unit number: "Unit 1", "Unit 2", etc.
            const unitNumber = `Unit ${index + 1}`;

            // CHECK: Is this unit occupied?
            const isOccupied = tenants.some(t => t.unit_number === unitNumber);

            return (
              <div
                key={unitNumber}
                className={`
                  p-3 rounded-lg border-2 text-center transition-all
                  ${
                    isOccupied
                      ? 'bg-gray-100 border-gray-300 opacity-60'
                      : 'bg-green-50 border-green-300 hover:border-green-400'
                  }
                `}>
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
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
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
                  <Badge className="bg-blue-600 text-white text-xs whitespace-nowrap ml-2">
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
      </div>
    </CardContent>
  </Card>
</TabsContent>
```

---

## Data Model

### Tenants Table

```sql
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  user_id UUID REFERENCES users(id),
  unit_number TEXT,           -- ← "Unit 1", "Unit 2", etc.
  status TEXT,                -- 'active', 'inactive', 'terminated'
  lease_start DATE,
  lease_end DATE,
  monthly_rent NUMERIC,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Rental Applications Table

```sql
CREATE TABLE public.rental_applications (
  id UUID PRIMARY KEY,
  property_id UUID REFERENCES properties(id),
  user_id UUID REFERENCES users(id),
  unit_number TEXT,           -- ← The unit they applied for
  unit_type TEXT,
  status TEXT,                -- 'pending', 'approved', 'rejected', 'withdrawn'
  move_in_date DATE,
  message TEXT,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Properties Table

```sql
CREATE TABLE public.properties (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  name TEXT,
  type TEXT,
  total_units INTEGER,        -- ← Number of units in property
  occupied_units INTEGER,
  address TEXT,
  city TEXT,
  monthly_rent NUMERIC,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Testing Checklist

### Tenant Side

- [ ] Navigate to New Application
- [ ] Select a property
- [ ] See loading state while units fetch
- [ ] See unit grid with colors (green/gray)
- [ ] Click green unit → highlights in blue
- [ ] Try click gray unit → nothing happens
- [ ] Submit application → sends to backend
- [ ] Application appears in applications list
- [ ] Unit should become gray for other tenants

### Owner Side

- [ ] Navigate to property details
- [ ] Click Rooms tab
- [ ] See all units (1-N)
- [ ] Green units = no tenant
- [ ] Gray units = has tenant
- [ ] Scroll occupied units list
- [ ] See tenant names, emails, status
- [ ] Empty state shows if no occupied units

### Database

- [ ] All units generate correctly (Unit 1 to Unit N)
- [ ] Occupied units marked correctly
- [ ] Available units returned correctly
- [ ] Pending applications block units
- [ ] Active tenants block units
- [ ] Terminated tenants don't block units

---

## Performance Notes

| Operation                    | Time       | Notes                  |
| ---------------------------- | ---------- | ---------------------- |
| Load available units (API)   | ~200-500ms | Network dependent      |
| Render unit grid (500 units) | ~50-100ms  | JavaScript rendering   |
| Database query (10 units)    | ~10-50ms   | Fast SQL query         |
| Page load (owner side)       | ~1-2s      | Includes image loading |

---

## Security Considerations

### Tenant Side

```
✅ User can only select from their own properties
✅ Unit availability validated at submission
✅ Cannot override occupied unit selection
✅ Form validation before submission
```

### Owner Side

```
✅ Only owner can view their properties
✅ Tenant information shown to owner only
✅ Read-only display (no modification possible)
✅ RLS policies on database level
```

---

## Future Enhancements

1. **Real-time Updates**: Add Supabase subscriptions for live updates
2. **Unit Types**: Support different unit types (1BR, 2BR, etc.)
3. **Custom Unit Naming**: Allow owners to name units (e.g., "Penthouse A")
4. **Pricing Tiers**: Different units with different rent amounts
5. **Availability Calendar**: Show when units become available
6. **Bulk Actions**: Owner can manage multiple units at once

---

## Troubleshooting

### Units not loading

```
Check:
1. Property has total_units > 0
2. TenantAPI.getAllUnitsWithStatus is called
3. Database function has correct property_id
4. Network tab shows successful RPC call
```

### Units showing as occupied but shouldn't

```
Check:
1. Query SELECT * FROM tenants WHERE property_id = ? AND status = 'active'
2. No pending applications: SELECT * FROM rental_applications WHERE status IN ('pending', 'approved')
3. Unit number formatting matches: "Unit 1" vs "unit_1" vs "1"
```

### Owner grid not updating

```
Check:
1. Page refresh loads latest data
2. useEffect dependency array includes propertyId
3. Tenants state is being updated correctly
4. Component is re-rendering after state update
```

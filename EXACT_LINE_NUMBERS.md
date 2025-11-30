# Exact Line Numbers & Implementation Map

Quick reference for where to make each change.

---

## FILE 1: New Property Page

**Full Path:** `/client/app/owner/dashboard/properties/new/page.tsx` (1459 lines total)

### Change 1: Add Info to Imports

**Lines:** 20-36
**What:** Add `Info` to lucide-react imports
**Current:** Has 15 imports ending with `Trash2`
**New:** Add `Info` as 16th import

**Before:**

```tsx
import {
  Building,
  MapPin,
  Users,
  FileText,
  Plus,
  X,
  ArrowLeft,
  Save,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  FileImage,
  Upload,
  CheckCircle,
  Trash2
} from 'lucide-react';
```

**After:**

```tsx
import {
  Building,
  MapPin,
  Users,
  FileText,
  Plus,
  X,
  ArrowLeft,
  Save,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  FileImage,
  Upload,
  CheckCircle,
  Trash2,
  Info
} from 'lucide-react';
```

---

### Change 2: Add Info Box Section

**Lines:** 863-870 (approximately)
**What:** Add informational box about room system after total_units error
**Current:** Error message shows, then monthly_rent field
**New:** Insert info box between them

**Context (Before):**

```tsx
                    {errors.total_units && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.total_units}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_rent">Monthly Rent (₱) *</Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      min="0"
```

**Context (After - INSERT BETWEEN ERROR AND NEXT DIV):**

```tsx
                    {errors.total_units && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.total_units}
                      </p>
                    )}
                    {/* Room Availability Info */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-blue-900 text-xs">
                            Room System
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            Each unit will be labeled "Unit 1", "Unit 2", etc. Tenants select from available rooms.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_rent">Monthly Rent (₱) *</Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      min="0"
```

---

## FILE 2: Property Details Page

**Full Path:** `/client/app/owner/dashboard/properties/[id]/page.tsx` (1450 lines total)

### Change 1: Add Info to Imports

**Lines:** 8-31
**What:** Add `Info` to lucide-react imports
**Current:** Has many imports, check if Info already exists
**New:** Add `Info` to the list if not present

**Before (check around line 8-31):**

```tsx
import {
  Building,
  MapPin,
  Users,
  Edit,
  Trash2,
  ArrowLeft,
  Activity,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  FileText,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Copy,
  MoreVertical,
  Image as ImageIcon,
  ZoomIn,
  Download,
  ExternalLink,
  Navigation,
  Home,
  Maximize2,
  X,
  PhilippinePeso
} from 'lucide-react';
```

**After:**

```tsx
import {
  Building,
  MapPin,
  Users,
  Edit,
  Trash2,
  ArrowLeft,
  Activity,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  FileText,
  Wrench,
  CheckCircle,
  AlertTriangle,
  Copy,
  MoreVertical,
  Image as ImageIcon,
  ZoomIn,
  Download,
  ExternalLink,
  Navigation,
  Home,
  Maximize2,
  X,
  PhilippinePeso,
  Info
} from 'lucide-react';
```

---

### Change 2: Add "Rooms" Tab Trigger

**Lines:** 645-658 (approximately)
**What:** Add new "Rooms" tab alongside "Details" tab
**Current:** Has "Overview", "Analytics", "Details" tabs
**New:** Add "Rooms" tab as 4th option

**Context (Before):**

```tsx
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
```

**Context (After - INSERT NEW TAB BEFORE `</TabsList>`):**

```tsx
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Details
              </TabsTrigger>
              <TabsTrigger
                value="rooms"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                <Building className="w-4 h-4 mr-2" />
                Rooms
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
```

---

### Change 3: Add "Rooms" Tab Content

**Lines:** ~1435-1445 (Look for this exact pattern)
**What:** Add new TabsContent for rooms before closing `</Tabs>`
**Current:** Has TabsContent for "overview", "analytics", "details"
**New:** Add TabsContent for "rooms" at the end

**Find this exact line pattern near the end of file:**

```tsx
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
```

**Replace with (INSERT ROOMS TAB BEFORE `</Tabs>`):**

```tsx
                </Card>
              </div>
            </TabsContent>

            {/* NEW ROOMS TAB */}
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
                        <span className="font-semibold">Total Units:</span> {property.total_units}
                      </p>
                      <p className="text-xs text-gray-500">
                        🟢 Green = Available | ⚫ Gray = Occupied
                      </p>
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
                              ${isOccupied
                                ? 'bg-gray-100 border-gray-300 opacity-60'
                                : 'bg-green-50 border-green-300 hover:border-green-400'
                              }
                            `}>
                            <p className="font-semibold text-sm text-gray-900">{unitNumber}</p>
                            <p className={`text-xs mt-1 font-medium ${
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
          </Tabs>
        </div>
      </div>
```

---

## Summary of Changes

| File          | Change                | Type        | Lines      |
| ------------- | --------------------- | ----------- | ---------- |
| new/page.tsx  | Add Info import       | Import      | ~20-36     |
| new/page.tsx  | Add info box          | UI Addition | ~863-870   |
| [id]/page.tsx | Add Info import       | Import      | ~8-31      |
| [id]/page.tsx | Add Rooms tab trigger | UI Addition | ~645-658   |
| [id]/page.tsx | Add Rooms tab content | UI Addition | ~1435-1445 |

---

## Step-by-Step Application

1. **Open** `/client/app/owner/dashboard/properties/new/page.tsx`
2. **Go to** line 20 → Add `Info` to imports
3. **Go to** line 870 → Add info box code
4. **Open** `/client/app/owner/dashboard/properties/[id]/page.tsx`
5. **Go to** line 8 → Add `Info` to imports
6. **Go to** line 645 → Add Rooms tab trigger
7. **Go to** line 1435 → Add Rooms tab content
8. **Save** both files
9. **Test** in development: `npm run dev`

---

## Expected Results

✅ **New Property Page:**

- Info box appears explaining room system
- Form still works normally
- All existing validation still works

✅ **Property Details Page:**

- New "Rooms" tab visible alongside Overview/Analytics/Details
- Click Rooms tab to see room grid
- Green rooms = available
- Gray rooms = occupied with tenant name/email
- All existing functionality unchanged

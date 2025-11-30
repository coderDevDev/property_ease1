# Ready-to-Use Code Snippets

Copy these exact code blocks to implement room availability features safely.

---

## FILE 1: New Property Page

**Path:** `/app/owner/dashboard/properties/new/page.tsx`

### CODE CHANGE 1: Add Info Import

**Location:** Line ~20, in the lucide-react imports section

**Find:**

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

**Replace with:**

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

### CODE CHANGE 2: Add Info Helper Section

**Location:** After line 866 (after the total_units error message)

**Find:**

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
```

**Replace with:**

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
```

---

## FILE 2: Property Details Page

**Path:** `/app/owner/dashboard/properties/[id]/page.tsx`

### CODE CHANGE 1: Add Info Import

**Location:** Line ~20, in the lucide-react imports section

**Find:**

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

**Replace with:**

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

### CODE CHANGE 2: Add "Rooms" Tab Trigger

**Location:** After line 647-652 (after the "Details" TabsTrigger)

**Find:**

```tsx
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Details
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
```

**Replace with:**

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

### CODE CHANGE 3: Add "Rooms" Tab Content

**Location:** Find the end of all TabsContent blocks (around line 1430+, look for the closing `</Tabs>`)

**Find:** (Look for this pattern - the last TabsContent closing tag)

```tsx
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
```

**Replace with:**

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

## Verification Checklist

After making changes, verify:

✅ **New Property Page:**

- [ ] Can still create properties normally
- [ ] Total Units field works
- [ ] Info box appears below Total Units
- [ ] Form validation still works
- [ ] Can submit property successfully

✅ **Property Details Page:**

- [ ] All existing tabs work (Overview, Analytics, Details)
- [ ] "Rooms" tab is visible
- [ ] Clicking "Rooms" shows room grid
- [ ] Green rooms = Available
- [ ] Gray rooms = Occupied
- [ ] Tenant list shows in occupied section
- [ ] Edit/Delete buttons still work

---

## Testing Commands

If you want to test in the terminal:

```bash
# Build the project
npm run build

# Run development server
npm run dev

# Check for TypeScript errors
npm run type-check
```

---

## Rollback Instructions (If Needed)

If you need to remove these changes:

1. **Remove Info from imports** (delete `Info` from imports)
2. **Remove info box from new property page** (remove the blue info section)
3. **Remove "Rooms" tab trigger** (delete the TabsTrigger with Building icon)
4. **Remove "Rooms" TabsContent** (delete the entire TabsContent for rooms)

All changes are isolated and can be removed without affecting other functionality.

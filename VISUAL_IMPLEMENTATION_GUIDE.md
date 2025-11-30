# Visual Implementation Guide

See exactly what changes and where.

---

## FILE 1: New Property Page - BEFORE & AFTER

### BEFORE - Current State

```
Owner Dashboard → Properties → New Property

Form Fields:
├─ Property Name
├─ Address
├─ City/Province
├─ Type
├─ Status
├─ Description
├─ Monthly Rent
├─ Total Units          ← THIS EXISTS
│   └─ Error message if invalid
│   └─ [Next field immediately after]
├─ Upload Images
├─ Amenities
└─ [Create Button]
```

### AFTER - With Room System Info

```
Owner Dashboard → Properties → New Property

Form Fields:
├─ Property Name
├─ Address
├─ City/Province
├─ Type
├─ Status
├─ Description
├─ Monthly Rent
├─ Total Units          ← THIS STILL EXISTS
│   └─ Error message if invalid
│   └─ ℹ️ INFO BOX (NEW) ← THIS IS ADDED
│       ├─ "Room System"
│       └─ "Each unit will be labeled Unit 1, Unit 2, etc..."
├─ Upload Images
├─ Amenities
└─ [Create Button]
```

### Visual Mockup - Info Box Added

```
┌────────────────────────────────────────┐
│ Total Units                            │
│ ┌──────────────────────────────────┐  │
│ │                                20│  │  ← Input field
│ └──────────────────────────────────┘  │
│                                        │
│ ┌────────────────────────────────────┐│
│ │ ℹ️ Room System                     ││
│ │                                    ││
│ │ Each unit will be labeled "Unit 1",││
│ │ "Unit 2", etc. Tenants select     ││
│ │ from available rooms.             ││
│ └────────────────────────────────────┘│
└────────────────────────────────────────┘
```

---

## FILE 2: Property Details Page - BEFORE & AFTER

### BEFORE - Current Tabs

```
Property Details View

Tabs at Top:
├─ 📊 Overview      (currently shows images, unit stats)
├─ 📈 Analytics     (currently shows property analytics)
└─ ℹ️ Details       (currently shows property information)

Content Below:
├─ Property images
├─ Unit Statistics (total/occupied/available cards)
├─ Property map
├─ Documents section
└─ etc.
```

### AFTER - With Rooms Tab

```
Property Details View

Tabs at Top:
├─ 📊 Overview      (still shows images, unit stats)
├─ 📈 Analytics     (still shows property analytics)
├─ ℹ️ Details       (still shows property information)
└─ 🏢 Rooms        (NEW - shows room availability grid) ← THIS IS ADDED

Content Below:
├─ Depends which tab is selected
└─ Everything else unchanged
```

### Rooms Tab - Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│ 🏢 Room Availability                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Total Units: 5                                         │
│ 🟢 Green = Available | ⚫ Gray = Occupied              │
│                                                         │
│ ┌─────┬─────┬─────┬─────┬─────┐                       │
│ │ Unit│ Unit│ Unit│ Unit│ Unit│                       │
│ │ 1   │ 2   │ 3   │ 4   │ 5   │                       │
│ │     │     │     │     │     │                       │
│ │🟢   │🟢   │⚫   │🟢   │⚫   │ ← Status indicators   │
│ │Ava- │Ava- │Occ- │Ava- │Occ- │                       │
│ │ilb. │ilb. │upied│ilb. │upied│                       │
│ └─────┴─────┴─────┴─────┴─────┘                       │
│                                                         │
│ Occupied Units (2)                                     │
│ ┌─────────────────────────────────────────────────────┐│
│ │ Unit 3                               [Active]      ││
│ │ John Doe                                           ││
│ │ john.doe@email.com                                 ││
│ └─────────────────────────────────────────────────────┘│
│ ┌─────────────────────────────────────────────────────┐│
│ │ Unit 5                               [Pending]     ││
│ │ Jane Smith                                         ││
│ │ jane.smith@email.com                               ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Code Location Map

### File 1: `/client/app/owner/dashboard/properties/new/page.tsx`

```
Line 1-19      │ Imports
  ↓
Line 20-36     │ lucide-react imports ← ADD "Info" HERE
  ↓
Line 37-50     │ Other imports (shadcn, etc)
  ↓
...            │ Component code
  ↓
Line 840-870   │ Form fields section
  │            │ ├─ Total Units input
  │            │ └─ Error message
  │            │
  └─→ ADD INFO BOX HERE (after error, before monthly_rent)
  ↓
Line 880-1000  │ Continue form fields
  ↓
...            │ Rest of component
  ↓
Line 1459      │ End of file
```

### File 2: `/client/app/owner/dashboard/properties/[id]/page.tsx`

```
Line 1-7       │ Imports
  ↓
Line 8-31      │ lucide-react imports ← ADD "Info" HERE
  ↓
Line 32-200    │ Other code
  ↓
...            │ Component code
  ↓
Line 640-660   │ Tabs section
  │            │ ├─ Overview tab trigger
  │            │ ├─ Analytics tab trigger
  │            │ ├─ Details tab trigger
  │            │ └─ END TabsList
  │            │
  └─→ ADD "Rooms" TAB TRIGGER BEFORE </TabsList>
  ↓
Line 660-670   │ Overview TabsContent
  ↓
...            │ More TabsContent sections
  ↓
Line 1400-1445 │ Details TabsContent (last one)
  │            │ └─ END TabsContent
  │            │ └─ END Tabs
  │            │
  └─→ ADD "Rooms" TAB CONTENT BEFORE </Tabs>
  ↓
Line 1450      │ End of file
```

---

## Edit Instructions with Context

### New Property Page - Change 1: Add Info Import

**Go to:** Line 20
**Look for:** `import { Building, MapPin, Users, ...` line with lucide-react
**Find the end:** Where it says `Trash2` followed by `} from 'lucide-react';`
**Add after:** `Trash2,` add `Info,`
**Result:** Now imports `Info` from lucide-react

### New Property Page - Change 2: Add Info Box

**Go to:** Line 863
**Look for:**

```tsx
{errors.total_units && (
  <p className="text-red-500 text-sm flex items-center gap-1">
```

**Then look for the closing:**

```tsx
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="monthly_rent">Monthly Rent (₱) *</Label>
```

**Insert between:** The `)}` that closes the error message AND the `<div className="space-y-2">` that starts the monthly rent field

**Paste:** The info box code block (see CODE_SNIPPETS_READY_TO_USE.md)

### Property Details Page - Change 1: Add Info Import

**Go to:** Line 8
**Look for:** `import { Building, MapPin, Users, ...` line with lucide-react
**Find the end:** Where it says `PhilippinePeso` followed by `} from 'lucide-react';`
**Add after:** `PhilippinePeso,` add `Info,`
**Result:** Now imports `Info` from lucide-react

### Property Details Page - Change 2: Add Rooms Tab Trigger

**Go to:** Line 645-650
**Look for:**

```tsx
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Details
              </TabsTrigger>
            </TabsList>
```

**Insert before:** `</TabsList>` on the line before it

**Paste:**

```tsx
<TabsTrigger
  value="rooms"
  className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
  <Building className="w-4 h-4 mr-2" />
  Rooms
</TabsTrigger>
```

### Property Details Page - Change 3: Add Rooms Tab Content

**Go to:** Line 1430-1450
**Look for:**

```tsx
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
```

**Insert before:** `</Tabs>` tag (but after the `</TabsContent>` that precedes it)

**Paste:** The entire Rooms TabsContent block (see CODE_SNIPPETS_READY_TO_USE.md)

---

## Diff Preview

### File 1: new/page.tsx

```diff
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
+ Info
} from 'lucide-react';
```

```diff
                    {errors.total_units && (
                      <p className="text-red-500 text-sm flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        {errors.total_units}
                      </p>
                    )}
+                   {/* Room Availability Info */}
+                   <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
+                     <div className="flex items-start gap-2">
+                       <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
+                       <div>
+                         <p className="font-semibold text-blue-900 text-xs">
+                           Room System
+                         </p>
+                         <p className="text-xs text-blue-700 mt-1">
+                           Each unit will be labeled "Unit 1", "Unit 2", etc. Tenants select from available rooms.
+                         </p>
+                       </div>
+                     </div>
+                   </div>
                  </div>
```

### File 2: [id]/page.tsx

```diff
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
+ Info
} from 'lucide-react';
```

```diff
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Details
              </TabsTrigger>
+             <TabsTrigger
+               value="rooms"
+               className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
+               <Building className="w-4 h-4 mr-2" />
+               Rooms
+             </TabsTrigger>
            </TabsList>
```

```diff
                </Card>
              </div>
            </TabsContent>
+
+           {/* NEW ROOMS TAB */}
+           <TabsContent value="rooms" className="mt-6">
+             <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
+               ... (see CODE_SNIPPETS_READY_TO_USE.md for full content)
+             </Card>
+           </TabsContent>
          </Tabs>
        </div>
      </div>
```

---

## Testing Verification

After each change:

✅ **File saves without errors**
✅ **No red squiggles in VS Code**
✅ **Run `npm run type-check` passes**
✅ **Development server starts: `npm run dev`**
✅ **Page loads without console errors**
✅ **Functionality works as expected**

---

## Rollback Plan

If something breaks, simply:

1. Delete the Info import addition
2. Delete the info box code (lines ~867-877)
3. Delete the Rooms tab trigger code
4. Delete the Rooms tab content code

Changes are isolated and can be safely removed.

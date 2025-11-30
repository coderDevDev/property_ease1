# Tenant Scheduled Date Display - Complete Reference

## Overview
Tenants can see the **scheduled_date** (maintenance work date) in their maintenance request details page at: `/tenant/dashboard/maintenance/[id]`

---

## Where Tenants See Scheduled Date

### 1. **Request Details Card - Primary Display** ✅
**Location:** Top section under "Request Information"  
**File:** `app/tenant/dashboard/maintenance/[id]/page.tsx` (lines 565-580)  
**Status:** Active and displayed with improved formatting

```tsx
{maintenanceRequest.scheduled_date && (
  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200/50">
    <Label className="text-sm font-medium text-blue-700 mb-1 block">
      Scheduled Date
    </Label>
    <p className="text-blue-900 font-medium">
      {new Date(maintenanceRequest.scheduled_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}
    </p>
  </div>
)}
```

**Display Format:** `Mon, Jan 15, 2025`  
**Styling:** Blue background with border (matches priority/deadline theme)

---

### 2. **Timeline/Progress Bar - Secondary Display** ✅
**Location:** Right sidebar under "Progress Timeline"  
**File:** `app/tenant/dashboard/maintenance/[id]/page.tsx` (lines 197-206)  
**Status:** Automatically included in timeline events

```tsx
if (request.scheduled_date) {
  events.push({
    id: 'scheduled',
    type: 'note',
    title: 'Work Scheduled',
    description: `Scheduled for ${new Date(
      request.scheduled_date
    ).toLocaleDateString()}`,
    timestamp: request.scheduled_date,
    data: {
      scheduledDate: request.scheduled_date
    }
  });
}
```

**Timeline Event:** Shows "Work Scheduled" with the scheduled date  
**User Experience:** Tenant can track when work will be performed in the progress timeline

---

## Display Locations Summary

| Page | Location | Format | Visibility |
|------|----------|--------|------------|
| **Tenant Details** | Request Info Card | Mon, Jan 15, 2025 | Always (if date exists) |
| **Tenant Timeline** | Progress Timeline | In timeline event | Always (if date exists) |
| **Owner Details** | Request Info Card | Mon, Jan 15, 2025 | Always (if date exists) |

---

## Data Flow

```
Owner Creates/Edits Maintenance
    ↓
Sets Priority (Low/Medium/High/Urgent)
    ↓
Sets Scheduled Date (within priority deadline)
    ↓
API Validation validates date against priority
    ↓
Data Saved to Database (scheduled_date field)
    ↓
Tenant Views Details Page
    ↓
Displays in:
  1. Request Information Card (formatted as Mon, Jan 15, 2025)
  2. Timeline Event (Work Scheduled)
```

---

## Key Features for Tenants

✅ **Transparent Scheduling:** Tenants can see exactly when maintenance will occur  
✅ **Timeline Integration:** Scheduled date appears in the request progress timeline  
✅ **Consistent Formatting:** Date format matches across all pages (Mon, Jan 15, 2025)  
✅ **Priority Context:** Tenants understand deadlines align with request priority  
✅ **Read-Only:** Tenants cannot modify scheduled date (owner-controlled)

---

## Example Scenarios

### Scenario 1: Urgent Plumbing Issue
- **Created:** Nov 29, 2025
- **Priority:** Urgent (1-day deadline)
- **Owner Sets:** Nov 30, 2025 (within 1 day)
- **Tenant Sees:** "Scheduled Date: Fri, Nov 30, 2025" + Timeline event "Work Scheduled"

### Scenario 2: Low Priority Maintenance
- **Created:** Nov 29, 2025
- **Priority:** Low (7-day deadline)
- **Owner Sets:** Dec 05, 2025 (within 7 days)
- **Tenant Sees:** "Scheduled Date: Thu, Dec 05, 2025" + Timeline event "Work Scheduled"

---

## Implementation Checklist

- ✅ Interface includes `scheduled_date?: string` field
- ✅ Timeline generation includes scheduled_date event
- ✅ Display card shows formatted scheduled_date
- ✅ Date formatting consistent across owner/tenant views
- ✅ Conditional rendering (only shows if scheduled_date exists)
- ✅ Blue styling for visual emphasis
- ✅ No type errors in compilation
- ✅ Mobile responsive layout

---

## Files Modified

1. **`app/tenant/dashboard/maintenance/[id]/page.tsx`**
   - Line 197-206: Timeline event generation
   - Line 565-580: Display card formatting (improved to toLocaleDateString)
   - Status: ✅ Updated with consistent formatting

---

## Testing Scenarios

### Test 1: View scheduled date as tenant
1. Create maintenance request (owner)
2. Set priority and scheduled date (owner)
3. Login as tenant
4. Navigate to maintenance details
5. ✅ Should see "Scheduled Date: Mon, Jan 15, 2025" in Request Information card
6. ✅ Should see "Work Scheduled" event in timeline

### Test 2: Responsive display
1. View maintenance details on mobile
2. ✅ Scheduled date display should fit in single column
3. ✅ Timeline should display correctly

### Test 3: No scheduled date
1. Create maintenance request without scheduled date (optional field for edit)
2. View as tenant
3. ✅ Scheduled date card should not appear
4. ✅ Timeline should not have "Work Scheduled" event

---

## Consistency Across Views

### Owner View (`app/owner/dashboard/maintenance/[id]/page.tsx`)
- Scheduled date displayed in Request Information card
- Format: `Mon, Jan 15, 2025`
- Can be edited (if request allows)

### Tenant View (`app/tenant/dashboard/maintenance/[id]/page.tsx`)
- Scheduled date displayed in Request Information card
- Format: `Mon, Jan 15, 2025`
- Read-only view (cannot edit)
- Also shown in Timeline as "Work Scheduled" event

---

## Notes for Future Enhancements

1. Could add countdown timer showing "X days until scheduled work"
2. Could send tenant notifications when scheduled date is set
3. Could allow tenant to request date reschedule
4. Could integrate with calendar/reminders
5. Could show owner estimated arrival time (not just date)

---

## Status: ✅ COMPLETE

All tenant views now properly display scheduled_date with:
- Consistent formatting across all pages
- Proper styling and visual hierarchy
- Timeline integration for progress tracking
- Zero breaking changes to existing functionality

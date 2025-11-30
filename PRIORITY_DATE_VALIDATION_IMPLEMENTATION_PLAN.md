# Priority-Based Date Validation Implementation Plan

## Maintenance Request Scheduled Date Validation

**Feature Request:** Owner should set a scheduled date for maintenance that is restricted by the priority level selected. The system will validate that the date doesn't exceed the allowed timeframe for each priority level.

---

## 📋 Requirements Summary

| Priority   | Label  | Max Days | Deadline        | Example                                   |
| ---------- | ------ | -------- | --------------- | ----------------------------------------- |
| **Low**    | Low    | 7 days   | Within 1 week   | Set on Mon, must be done by Mon next week |
| **Medium** | Medium | 5 days   | Within 5 days   | Set on Mon, must be done by Sat same week |
| **High**   | High   | 3 days   | Within 3 days   | Set on Mon, must be done by Wed           |
| **Urgent** | Urgent | 1 day    | Within 24 hours | Set on Mon, must be done by Tue           |

**User Experience:**

- Owner selects priority level first
- When owner sets the scheduled date, the system validates it
- If date exceeds the priority's allowed timeframe, show a red error message
- Error message shows: "Scheduled date must be within [X days] from today ([DATE])"
- Form prevents submission until valid date is set

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│             PHASE 1: Utility Functions (Frontend)           │
├─────────────────────────────────────────────────────────────┤
│ Create: lib/utils/priority-validation.ts                    │
│ - getPriorityDays(priority)                                 │
│ - isValidScheduledDate(priority, scheduledDate)             │
│ - getDateValidationError(priority, scheduledDate)           │
│ - calculateDeadline(priority)                               │
│ - getErrorMessage(priority, deadline)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│        PHASE 2: Owner Maintenance Creation Form             │
├─────────────────────────────────────────────────────────────┤
│ Update: app/owner/dashboard/maintenance/new/page.tsx        │
│ - Add scheduled_date field to form data                     │
│ - Add date picker input field                               │
│ - Integrate validation on date change                       │
│ - Show validation error message                             │
│ - Update form submission validation                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│        PHASE 3: Owner Maintenance Details/Edit Page         │
├─────────────────────────────────────────────────────────────┤
│ Update: app/owner/dashboard/maintenance/[id]/page.tsx       │
│ - Add scheduled_date validation when editing                │
│ - Validate date when priority changes                       │
│ - Update and show error messages                            │
│ - Update form submission validation                         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│           PHASE 4: Backend API Validation                   │
├─────────────────────────────────────────────────────────────┤
│ Update: lib/api/maintenance.ts (Optional for security)      │
│ - Server-side validation (double-check)                     │
│ - API response validation                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 Phase-by-Phase Implementation

### **PHASE 1: Create Priority Validation Utility** ✅ (No Breaking Changes)

**File:** `lib/utils/priority-validation.ts` (NEW)

```typescript
// Priority configuration
const PRIORITY_DAYS = {
  low: 7, // 1 week
  medium: 5, // 5 days
  high: 3, // 3 days
  urgent: 1 // 1 day (24 hours)
};

// Get max days for priority
export function getPriorityDays(priority: string): number {
  return PRIORITY_DAYS[priority as keyof typeof PRIORITY_DAYS] || 7;
}

// Calculate deadline date
export function calculateDeadline(priority: string): Date {
  const days = getPriorityDays(priority);
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + days);
  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

// Validate if scheduled date is within allowed range
export function isValidScheduledDate(
  priority: string,
  scheduledDate: string | Date | null
): boolean {
  if (!scheduledDate) return false;

  const date = new Date(scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Date must be today or later
  if (date < today) return false;

  const maxDays = getPriorityDays(priority);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);
  maxDate.setHours(23, 59, 59, 999);

  return date <= maxDate;
}

// Get detailed error message
export function getDateValidationError(
  priority: string,
  scheduledDate: string | Date | null
): string | null {
  if (!scheduledDate) {
    return 'Scheduled date is required';
  }

  const date = new Date(scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if date is in the past
  if (date < today) {
    return 'Scheduled date cannot be in the past';
  }

  if (!isValidScheduledDate(priority, scheduledDate)) {
    const maxDays = getPriorityDays(priority);
    const deadline = calculateDeadline(priority);
    const formattedDeadline = deadline.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    const dayLabel = maxDays === 1 ? 'day' : 'days';
    return `Scheduled date must be within ${maxDays} ${dayLabel} from today. Deadline: ${formattedDeadline}`;
  }

  return null;
}

// Format deadline for display
export function formatDeadline(priority: string): string {
  const deadline = calculateDeadline(priority);
  return deadline.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
```

**Benefits:**

- ✅ Centralized validation logic
- ✅ Single source of truth for priority days
- ✅ Reusable across components
- ✅ Easy to modify priority rules in future
- ✅ Comprehensive error messages

---

### **PHASE 2: Update Owner Maintenance Creation Form** (Minor Changes)

**File:** `app/owner/dashboard/maintenance/new/page.tsx`

**Changes:**

1. Import validation functions
2. Add `scheduled_date` to form state
3. Add date picker input field
4. Add validation error display
5. Update form validation function
6. Show helpful hints about priority deadline

**Implementation Steps:**

```typescript
// Step 1: Add imports at top
import {
  isValidScheduledDate,
  getDateValidationError,
  calculateDeadline
} from '@/lib/utils/priority-validation';

// Step 2: Add to MaintenanceFormData interface
interface MaintenanceFormData {
  tenant_id: string;
  property_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  estimated_cost?: number;
  tenant_notes?: string;
  scheduled_date?: string; // ← NEW FIELD
  images: string[];
}

// Step 3: Initialize in useState
const [formData, setFormData] = useState<MaintenanceFormData>({
  tenant_id: '',
  property_id: '',
  title: '',
  description: '',
  category: '',
  priority: 'medium',
  estimated_cost: undefined,
  tenant_notes: '',
  scheduled_date: '', // ← NEW
  images: []
});

// Step 4: Update validateForm function
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  // ... existing validations ...

  // NEW: Validate scheduled_date
  if (!formData.scheduled_date) {
    newErrors.scheduled_date = 'Scheduled date is required';
  } else if (
    !isValidScheduledDate(formData.priority, formData.scheduled_date)
  ) {
    newErrors.scheduled_date =
      getDateValidationError(formData.priority, formData.scheduled_date) ||
      'Invalid scheduled date';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Step 5: Add to form JSX (after Priority field)
<div className="space-y-2">
  <Label htmlFor="scheduled_date" className="text-gray-700 font-medium">
    Scheduled Date *
    <span className="text-xs text-gray-500 ml-2">
      (Deadline:{' '}
      {calculateDeadline(formData.priority).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })}
      )
    </span>
  </Label>
  <Input
    id="scheduled_date"
    type="date"
    value={formData.scheduled_date || ''}
    onChange={e => handleInputChange('scheduled_date', e.target.value)}
    min={new Date().toISOString().split('T')[0]}
    max={calculateDeadline(formData.priority).toISOString().split('T')[0]}
    className={cn(
      'bg-white/50 border-blue-200/50 focus:border-blue-400',
      errors.scheduled_date && 'border-red-300 focus:border-red-400'
    )}
  />
  {errors.scheduled_date && (
    <p className="text-red-600 text-sm">{errors.scheduled_date}</p>
  )}
</div>;
```

**UI Positioning:** Add the date picker right after the Priority field in the "Basic Information" card, before the Estimated Cost field.

**Visual Feedback:**

- Show deadline helper text next to the label
- Restrict date picker to valid range (today to deadline)
- Red error message if date is invalid
- Error clears when user fixes the date

---

### **PHASE 3: Update Owner Maintenance Details/Edit Page** (Minor Changes)

**File:** `app/owner/dashboard/maintenance/[id]/page.tsx`

**Changes:**

1. Import validation functions
2. Add `scheduled_date` to form state (if not already present)
3. Add date picker for editing scheduled date
4. Add validation when changing priority
5. Update form validation function
6. Show deadline in read-only view

**Implementation Steps:**

```typescript
// Step 1: Add imports
import {
  isValidScheduledDate,
  getDateValidationError,
  calculateDeadline
} from '@/lib/utils/priority-validation';

// Step 2: When priority changes, revalidate scheduled_date
useEffect(() => {
  if (formData.scheduled_date) {
    if (!isValidScheduledDate(formData.priority, formData.scheduled_date)) {
      // Clear the invalid scheduled_date or show warning
      setErrors(prev => ({
        ...prev,
        scheduled_date:
          getDateValidationError(formData.priority, formData.scheduled_date) ||
          'Invalid scheduled date for selected priority'
      }));
    }
  }
}, [formData.priority]);

// Step 3: Update validation in form
const validateForm = (): boolean => {
  const newErrors: Record<string, string> = {};

  // ... existing validations ...

  // NEW: Validate scheduled_date
  if (
    formData.scheduled_date &&
    !isValidScheduledDate(formData.priority, formData.scheduled_date)
  ) {
    newErrors.scheduled_date =
      getDateValidationError(formData.priority, formData.scheduled_date) ||
      'Invalid scheduled date';
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

// Step 4: Add to JSX form (in edit mode)
{
  editingEnabled && (
    <div className="space-y-2">
      <Label htmlFor="scheduled_date" className="text-gray-700 font-medium">
        Scheduled Date
        <span className="text-xs text-gray-500 ml-2">
          (Deadline:{' '}
          {calculateDeadline(formData.priority).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
          )
        </span>
      </Label>
      <Input
        id="scheduled_date"
        type="date"
        value={formData.scheduled_date || ''}
        onChange={e => handleInputChange('scheduled_date', e.target.value)}
        min={new Date().toISOString().split('T')[0]}
        max={calculateDeadline(formData.priority).toISOString().split('T')[0]}
        className={cn(
          'bg-white/50 border-blue-200/50 focus:border-blue-400',
          errors.scheduled_date && 'border-red-300 focus:border-red-400'
        )}
      />
      {errors.scheduled_date && (
        <p className="text-red-600 text-sm">{errors.scheduled_date}</p>
      )}
    </div>
  );
}

// Step 5: Display in read-only view
{
  maintenanceRequest.scheduled_date && (
    <div className="p-3 bg-gray-50 rounded-lg">
      <Label className="text-sm font-medium text-gray-600 mb-1 block">
        Scheduled Date
      </Label>
      <p className="text-gray-900 font-medium">
        {new Date(maintenanceRequest.scheduled_date).toLocaleDateString(
          'en-US',
          {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }
        )}
      </p>
    </div>
  );
}
```

**Behavior:**

- When priority changes in edit mode, validation runs automatically
- If new priority makes scheduled date invalid, show error message
- User must either change priority back or pick a new valid date
- Date picker min/max changes dynamically with priority selection

---

### **PHASE 4: Optional Backend Validation** (Advanced)

**File:** `lib/api/maintenance.ts`

**Purpose:** Server-side double-check (security layer)

```typescript
// Add to MaintenanceAPI class
static async validateScheduledDate(
  priority: string,
  scheduledDate: string
): Promise<{ valid: boolean; error?: string }> {
  // Import the validation function
  // const { isValidScheduledDate, getDateValidationError } = require('@/lib/utils/priority-validation');

  // This would need to be converted to server-side logic in a API route
  // For now, frontend validation is sufficient
  return { valid: true };
}
```

**Note:** Backend validation is optional since:

- Frontend validation provides immediate feedback
- Date is set by owner, not user input from untrusted source
- Reduces API calls and complexity
- Can be added in Phase 5 if needed

---

## 🔄 Data Flow Diagram

```
┌─────────────────────┐
│  Owner selects      │
│  Priority (Low)     │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ getPriorityDays(priority)            │
│ Returns: 7 days                      │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ calculateDeadline(priority)          │
│ Today: Nov 29                        │
│ Deadline: Dec 6 (7 days from now)    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Date Picker                          │
│ Min: Nov 29 (today)                  │
│ Max: Dec 6 (deadline)                │
│ Shows: "Deadline: Dec 6"             │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Owner selects: Dec 10                │
│ (Past the deadline)                  │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ isValidScheduledDate(priority, date) │
│ Returns: false                       │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ getDateValidationError()             │
│ Returns: "Scheduled date must be     │
│  within 7 days from today.           │
│  Deadline: Dec 6"                    │
└──────────┬───────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Show Red Error Message               │
│ Disable form submission              │
│ User must fix the date               │
└──────────────────────────────────────┘
```

---

## 📊 Testing Checklist

### **Unit Tests** (for validation function)

```typescript
describe('Priority Validation', () => {
  test('getPriorityDays returns correct values', () => {
    expect(getPriorityDays('low')).toBe(7);
    expect(getPriorityDays('medium')).toBe(5);
    expect(getPriorityDays('high')).toBe(3);
    expect(getPriorityDays('urgent')).toBe(1);
  });

  test('isValidScheduledDate accepts dates within range', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(isValidScheduledDate('low', today)).toBe(true);
  });

  test('isValidScheduledDate rejects past dates', () => {
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];
    expect(isValidScheduledDate('low', yesterday)).toBe(false);
  });

  test('isValidScheduledDate rejects dates beyond deadline', () => {
    const twoWeeksLater = new Date(Date.now() + 1209600000)
      .toISOString()
      .split('T')[0];
    expect(isValidScheduledDate('low', twoWeeksLater)).toBe(false);
  });
});
```

### **Manual Testing Scenarios**

| Scenario                    | Priority   | Input Date      | Expected Result                        |
| --------------------------- | ---------- | --------------- | -------------------------------------- |
| Valid - Low                 | Low        | Today + 5 days  | ✅ Accepted                            |
| Valid - Urgent              | Urgent     | Tomorrow        | ✅ Accepted                            |
| Invalid - Past              | Any        | Yesterday       | ❌ Error: "cannot be in the past"      |
| Invalid - Too Late (Low)    | Low        | Today + 10 days | ❌ Error: "must be within 7 days"      |
| Invalid - Too Late (Medium) | Medium     | Today + 7 days  | ❌ Error: "must be within 5 days"      |
| Priority Change             | Low → High | Today + 5 days  | ⚠️ Show error: "must be within 3 days" |
| Exact Deadline              | Low        | Today + 7 days  | ✅ Accepted (last valid date)          |
| Empty Date (Create)         | Any        | (empty)         | ❌ Error: "is required"                |
| Empty Date (Edit)           | Any        | (empty)         | ✅ Accepted (optional in edit)         |

---

## 🎯 Non-Breaking Changes Analysis

✅ **Safe to Implement:**

- New utility file doesn't affect existing code
- Optional scheduled_date field (doesn't break existing records)
- Validation only runs if scheduled_date is provided
- Existing maintenance requests without scheduled_date still work
- Can be toggled off with feature flag if needed

⚠️ **Consider:**

- Update database migration (if needed) to allow `scheduled_date` nullable
- Update TypeScript types to include optional `scheduled_date`
- Existing tests should still pass

---

## 📁 File Changes Summary

| Phase | File                                            | Changes                | Complexity | Risk    |
| ----- | ----------------------------------------------- | ---------------------- | ---------- | ------- |
| 1     | `lib/utils/priority-validation.ts`              | NEW FILE               | Low        | ✅ None |
| 2     | `app/owner/dashboard/maintenance/new/page.tsx`  | Add field + validation | Medium     | ✅ Low  |
| 3     | `app/owner/dashboard/maintenance/[id]/page.tsx` | Add field + validation | Medium     | ✅ Low  |
| 4     | `lib/api/maintenance.ts`                        | Optional backend check | Low        | ✅ None |

---

## 🚀 Rollout Strategy

### **Stage 1: Foundation (Day 1)**

- Create utility file with all validation functions
- Write unit tests for validation
- Test with simple examples

### **Stage 2: Owner Creation Form (Day 1-2)**

- Add scheduled_date field to creation form
- Integrate date picker
- Add validation and error messages
- Manual testing with different priorities

### **Stage 3: Owner Edit Form (Day 2)**

- Add validation to edit form
- Test priority changes with existing dates
- Test error messages

### **Stage 4: Backend Integration (Day 3)**

- (Optional) Add backend validation
- Add API tests
- End-to-end testing

### **Stage 5: Deployment (Day 3)**

- Deploy to staging environment
- QA testing
- Production deployment

---

## 💾 Database Considerations

**No migration needed IF:**

- `scheduled_date` column already exists in `maintenance_requests` table
- Column is nullable (allows NULL values)

**If migration needed:**

```sql
-- Add column if it doesn't exist
ALTER TABLE maintenance_requests
ADD COLUMN scheduled_date TIMESTAMP WITH TIME ZONE;

-- Make it nullable (optional during creation)
-- Column is already nullable by default
```

**Check existing schema:**

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'maintenance_requests'
AND column_name = 'scheduled_date';
```

---

## 🔍 Code Review Checklist

- [ ] Validation utility functions are pure and testable
- [ ] Error messages are clear and helpful
- [ ] Date picker respects timezone
- [ ] Validation runs on both field change and form submission
- [ ] Errors clear when user corrects input
- [ ] Priority changes revalidate scheduled date
- [ ] Type safety maintained throughout
- [ ] No console errors or warnings
- [ ] Responsive on mobile devices
- [ ] Accessibility features included (labels, ARIA)

---

## 🎓 Example Usage

### **Creating a New Request**

```
1. Owner selects "High" priority
2. Scheduled date deadline shown: "Dec 1" (3 days from now)
3. Owner tries to select Dec 5 (4 days away)
4. Error appears: "Scheduled date must be within 3 days from today. Deadline: Dec 1"
5. Owner corrects to Dec 1
6. Error clears, can now submit form
```

### **Editing Existing Request**

```
1. Request has scheduled_date: Dec 5, priority: "Low" (7 days allowed)
2. Owner changes priority to "High" (3 days allowed)
3. Current scheduled date becomes invalid
4. Error appears: "Scheduled date must be within 3 days from today. Deadline: Dec 1"
5. Owner must select new date within 3 days or revert priority
6. After fixing, form can be submitted
```

---

## 📞 Questions & Support

**Q: Can owner leave scheduled_date empty?**

- A: On creation form, it's required. On edit form, it's optional (can be set later).

**Q: What if priority changes after deadline passes?**

- A: Validation rejects it, user must pick a new valid date for new priority.

**Q: What about timezones?**

- A: Uses browser's local timezone. For accuracy, consider server-side timezone handling.

**Q: Can we modify priority days?**

- A: Yes! Change values in `PRIORITY_DAYS` object in `priority-validation.ts`.

**Q: Do past maintenance requests need validation?**

- A: No, validation only applies during creation/edit. Completed requests are immutable.

---

## ✅ Implementation Ready

This plan provides:

- ✅ Step-by-step non-breaking changes
- ✅ Clear code examples
- ✅ Testing strategies
- ✅ Rollout timeline
- ✅ Risk mitigation
- ✅ Database considerations

**Ready to proceed?** Start with Phase 1 (create utility file).

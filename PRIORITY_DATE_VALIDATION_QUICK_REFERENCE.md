# Priority Date Validation - Quick Reference Guide

## 🎯 Feature Summary

Owner must set scheduled date that respects priority-based deadlines. System validates and rejects dates outside allowed timeframes with clear error messages.

---

## ⏰ Priority Deadlines at a Glance

```
TODAY = November 29, 2025 (Friday)

┌──────────────────────────────────────────────────────────────────┐
│ PRIORITY: LOW (7 days / 1 week)                                  │
├──────────────────────────────────────────────────────────────────┤
│ Selected Date: November 29 - December 6                          │
│ ✅ Valid:   Nov 30, Dec 1, Dec 2, Dec 3, Dec 4, Dec 5, Dec 6   │
│ ❌ Invalid: Dec 7 onwards (too late)                             │
│ Deadline: Friday, Dec 6, 2025 at 11:59 PM                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PRIORITY: MEDIUM (5 days)                                        │
├──────────────────────────────────────────────────────────────────┤
│ Selected Date: November 29 - December 3                          │
│ ✅ Valid:   Nov 30, Dec 1, Dec 2, Dec 3                         │
│ ❌ Invalid: Dec 4 onwards (too late)                             │
│ Deadline: Wednesday, Dec 3, 2025 at 11:59 PM                    │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PRIORITY: HIGH (3 days)                                          │
├──────────────────────────────────────────────────────────────────┤
│ Selected Date: November 29 - December 1                          │
│ ✅ Valid:   Nov 30, Dec 1                                        │
│ ❌ Invalid: Dec 2 onwards (too late)                             │
│ Deadline: Monday, Dec 1, 2025 at 11:59 PM                       │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ PRIORITY: URGENT (1 day / 24 hours)                              │
├──────────────────────────────────────────────────────────────────┤
│ Selected Date: November 29 only (today or tomorrow)              │
│ ✅ Valid:   Nov 30                                               │
│ ❌ Invalid: Dec 1 onwards (too late)                             │
│ Deadline: Saturday, Nov 30, 2025 at 11:59 PM                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔴 Error Messages (User Will See)

### **Error 1: Date in the Past**

```
"Scheduled date cannot be in the past"
```

**Cause:** Owner selected a date before today
**Fix:** Pick today or a future date

---

### **Error 2: Date Beyond Priority Deadline**

```
For LOW priority:
"Scheduled date must be within 7 days from today. Deadline: Dec 6"

For MEDIUM priority:
"Scheduled date must be within 5 days from today. Deadline: Dec 3"

For HIGH priority:
"Scheduled date must be within 3 days from today. Deadline: Dec 1"

For URGENT priority:
"Scheduled date must be within 1 day from today. Deadline: Nov 30"
```

**Cause:** Owner selected date past the priority's deadline
**Fix:** Pick a date between today and the deadline date

---

### **Error 3: Empty Scheduled Date**

```
"Scheduled date is required"
```

**Cause:** Form submitted without selecting a date
**Fix:** Select a valid scheduled date in date picker

---

## 🛠️ Implementation Phases

```
PHASE 1
┌─────────────────────────────────────────┐
│ Create utility file:                    │
│ lib/utils/priority-validation.ts        │
│                                         │
│ • getPriorityDays()                     │
│ • calculateDeadline()                   │
│ • isValidScheduledDate()                │
│ • getDateValidationError()              │
│ • formatDeadline()                      │
└─────────────────────────────────────────┘
           ↓
PHASE 2
┌─────────────────────────────────────────┐
│ Update Owner Create Form:               │
│ app/owner/dashboard/maintenance/new     │
│                                         │
│ • Add scheduled_date to form state      │
│ • Add date picker input                 │
│ • Add validation on change              │
│ • Show error messages                   │
└─────────────────────────────────────────┘
           ↓
PHASE 3
┌─────────────────────────────────────────┐
│ Update Owner Edit Form:                 │
│ app/owner/dashboard/maintenance/[id]    │
│                                         │
│ • Add validation to edit form           │
│ • Validate on priority change           │
│ • Update form submission logic          │
└─────────────────────────────────────────┘
           ↓
PHASE 4 (Optional)
┌─────────────────────────────────────────┐
│ Add Backend Validation:                 │
│ lib/api/maintenance.ts                  │
│                                         │
│ • Server-side validation (security)     │
└─────────────────────────────────────────┘
```

---

## 📋 Files to Create/Modify

### **CREATE (New File)**

```
lib/utils/priority-validation.ts ← NEW
```

- Pure utility functions
- No UI dependencies
- Reusable across components
- ~100 lines of code

### **UPDATE (Existing Files)**

```
app/owner/dashboard/maintenance/new/page.tsx
├─ Add: scheduled_date field to form state
├─ Add: date picker input (after priority field)
├─ Add: validation logic
└─ Add: error message display

app/owner/dashboard/maintenance/[id]/page.tsx
├─ Add: scheduled_date field to edit form
├─ Add: validation on priority change
├─ Add: date picker with dynamic min/max
└─ Add: error message display
```

---

## 🎮 User Experience Flow

### **Creating New Maintenance Request**

```
STEP 1: Select Priority
┌─────────────────────────────┐
│ Priority: [HIGH ▼]          │
│ Deadline: Dec 1             │ ← Shows immediately
└─────────────────────────────┘
         ↓
STEP 2: Pick Scheduled Date
┌─────────────────────────────┐
│ Scheduled Date: [Nov 30 ▼]  │
│ Min: Nov 29 (today)         │ ← Date picker restricted
│ Max: Dec 1 (deadline)       │ ← Date picker restricted
└─────────────────────────────┘
         ↓
STEP 3a: Valid Date Selected
┌─────────────────────────────┐
│ ✅ Date is Dec 1            │ → Form can be submitted
└─────────────────────────────┘
         ↓
        SUCCESS

═════════════════════════════════════════════

STEP 3b: Invalid Date Selected
┌─────────────────────────────────────────────┐
│ ❌ Scheduled date must be within 3 days     │ ← Red error
│    from today. Deadline: Dec 1              │
└─────────────────────────────────────────────┘
         ↓
User must fix
         ↓
        SUCCESS
```

### **Editing Request - Priority Change**

```
BEFORE CHANGE
┌──────────────────────────────────────┐
│ Priority: [LOW]   Deadline: Dec 6    │
│ Scheduled Date: Dec 5                │
│ ✅ Valid (Dec 5 is within 7 days)    │
└──────────────────────────────────────┘
         ↓
USER CHANGES PRIORITY TO "HIGH"
         ↓
AFTER CHANGE
┌──────────────────────────────────────┐
│ Priority: [HIGH]  Deadline: Dec 1    │
│ Scheduled Date: Dec 5                │
│ ❌ Error: "must be within 3 days"    │ ← Automatic error
└──────────────────────────────────────┘
         ↓
USER MUST FIX
Option 1: Revert to LOW
Option 2: Select new date (Nov 30 or Dec 1)
         ↓
        SUCCESS
```

---

## 🎨 UI Element Placement

### **Owner Maintenance Creation Form**

```
┌─────────────────────────────────────────────────────────────┐
│ CREATE MAINTENANCE REQUEST                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ BASIC INFORMATION                                            │
│                                                              │
│ Request Title *                 Category *                  │
│ [________________]              [Plumbing ▼]                │
│                                                              │
│ Description *                                                │
│ [____________________________________]                     │
│                                                              │
│ Priority *                      Estimated Cost (Optional)    │
│ [Medium ▼]                      [$________]                 │
│                                                              │
│ Scheduled Date *          ← NEW FIELD (ADD HERE)            │
│ (Deadline: Dec 3)         ← Helper text shows deadline      │
│ [Nov 30 ▼]                                                  │
│ ❌ Error message if invalid (red)                           │
│                                                              │
│ [CANCEL]  [CREATE REQUEST]                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### **Owner Maintenance Edit Form**

```
┌─────────────────────────────────────────────────────────────┐
│ MAINTENANCE REQUEST DETAILS                                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Priority *                      Scheduled Date               │
│ [High ▼]                        [Dec 1 ▼]          ← NEW    │
│ (Deadline: Dec 1)               (Deadline: Dec 1)  ← NEW    │
│                                 ❌ Error if invalid         │
│                                                              │
│ [SAVE CHANGES] [CANCEL]                                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Testing Scenarios

| #   | Priority | Input Date             | Expected       | Result |
| --- | -------- | ---------------------- | -------------- | ------ |
| 1   | Low      | Today                  | ✅ Accept      | Pass   |
| 2   | Low      | +3 days                | ✅ Accept      | Pass   |
| 3   | Low      | +7 days                | ✅ Accept      | Pass   |
| 4   | Low      | +8 days                | ❌ Reject      | Pass   |
| 5   | Urgent   | Tomorrow               | ✅ Accept      | Pass   |
| 6   | Urgent   | +2 days                | ❌ Reject      | Pass   |
| 7   | High     | Priority change to Low | ❌ Reset error | Pass   |
| 8   | Any      | Yesterday              | ❌ Reject      | Pass   |
| 9   | Any      | Empty                  | ❌ Reject      | Pass   |
| 10  | Medium   | +5 days                | ✅ Accept      | Pass   |

---

## 🚀 Deployment Checklist

### **Pre-Deployment**

- [ ] All validation functions tested in isolation
- [ ] Form components tested with valid/invalid dates
- [ ] Priority changes trigger re-validation
- [ ] Error messages are clear and actionable
- [ ] Date picker min/max update with priority
- [ ] No TypeScript errors
- [ ] No console errors or warnings

### **Post-Deployment**

- [ ] Owner can create request with scheduled date
- [ ] Owner can edit request and change scheduled date
- [ ] Changing priority updates deadline hint
- [ ] Invalid dates show correct error messages
- [ ] Valid dates allow form submission
- [ ] Existing requests without scheduled_date still work

---

## 💡 Key Points

✅ **Non-Breaking:**

- Optional field (scheduled_date)
- Validation only runs when field is provided
- Existing data not affected
- Can disable feature with feature flag

✅ **User-Friendly:**

- Helper text shows deadline immediately
- Date picker restricted to valid range
- Clear error messages explain the problem
- Errors clear when user fixes input

✅ **Maintainable:**

- Centralized validation logic
- Easy to modify priority days
- Testable utility functions
- Reusable across components

---

## 📞 Quick Links

- **Implementation Plan:** `PRIORITY_DATE_VALIDATION_IMPLEMENTATION_PLAN.md`
- **Utility Functions:** `lib/utils/priority-validation.ts` (to be created)
- **Creation Form:** `app/owner/dashboard/maintenance/new/page.tsx`
- **Edit Form:** `app/owner/dashboard/maintenance/[id]/page.tsx`

---

**Status:** ✅ Ready to implement - Start with Phase 1 (create utility file)

# Priority Date Validation - Visual Architecture & Flow Diagrams

## 📊 System Architecture

```
╔══════════════════════════════════════════════════════════════════════════╗
║                    PRIORITY DATE VALIDATION SYSTEM                       ║
╚══════════════════════════════════════════════════════════════════════════╝

                              UTILITY LAYER
                    ┌─────────────────────────────────────┐
                    │  lib/utils/priority-validation.ts   │
                    ├─────────────────────────────────────┤
                    │  • getPriorityDays()                │
                    │  • calculateDeadline()              │
                    │  • isValidScheduledDate()           │
                    │  • getDateValidationError()         │
                    │  • formatDeadline()                 │
                    └──────────────┬──────────────────────┘
                                   │
                ┌──────────────────┼──────────────────┐
                │                  │                  │
                ▼                  ▼                  ▼
        COMPONENT LAYER
    ┌─────────────────────┐  ┌─────────────────────┐
    │  Owner Create Form  │  │   Owner Edit Form   │
    │  /maintenance/new   │  │   /maintenance/[id] │
    ├─────────────────────┤  ├─────────────────────┤
    │ • Priority Select   │  │ • Priority Select   │
    │ • Date Picker       │  │ • Date Picker       │
    │ • Validation Logic  │  │ • Validation Logic  │
    │ • Error Display     │  │ • Error Display     │
    └─────────────────────┘  └─────────────────────┘
            │                         │
            └──────────────┬──────────┘
                           │
                           ▼
                    API LAYER (Optional)
            ┌──────────────────────────────────┐
            │   lib/api/maintenance.ts         │
            ├──────────────────────────────────┤
            │   • Server-side validation       │
            │   • Database update              │
            │   • Error handling               │
            └──────────────────────────────────┘
                           │
                           ▼
                    DATABASE LAYER
            ┌──────────────────────────────────┐
            │   maintenance_requests table     │
            ├──────────────────────────────────┤
            │   • id                           │
            │   • priority                     │
            │   • scheduled_date (NEW)         │
            │   • other fields...              │
            └──────────────────────────────────┘
```

---

## 🔄 Data Flow - Creating New Maintenance Request

```
START
  │
  ├─▶ Owner navigates to /maintenance/new
  │
  ├─▶ Form loads with default values
  │   ├─ priority: 'medium'
  │   ├─ scheduled_date: ''
  │   └─ ...other fields
  │
  ├─▶ OWNER INTERACTION #1: SELECT PRIORITY
  │   │
  │   ├─▶ Priority dropdown: change from 'medium' to 'high'
  │   │
  │   ├─▶ onChange event triggers:
  │   │   ├─ calculateDeadline('high')
  │   │   ├─ Returns: new Date(today + 3 days)
  │   │   └─ Displays: "Deadline: Dec 1"
  │   │
  │   └─▶ Date picker max updated:
  │       └─ max="Dec 1" (today + 3 days)
  │
  ├─▶ OWNER INTERACTION #2: SELECT SCHEDULED DATE
  │   │
  │   ├─▶ Owner clicks date picker, selects "Dec 2"
  │   │
  │   ├─▶ onChange event triggers:
  │   │   ├─ isValidScheduledDate('high', 'Dec 2')
  │   │   ├─ Check: Dec 2 > Dec 1 (deadline)?
  │   │   ├─ Result: YES, it's past deadline
  │   │   ├─ Returns: false
  │   │   │
  │   │   └─▶ getDateValidationError('high', 'Dec 2')
  │   │       ├─ Format error message
  │   │       ├─ Calculate deadline: "Dec 1"
  │   │       └─ Returns: "Scheduled date must be within 3 days..."
  │   │
  │   ├─▶ Form state updates:
  │   │   ├─ errors.scheduled_date = "Scheduled date must be..."
  │   │   └─ Display RED error message
  │   │
  │   └─▶ Form submission BLOCKED ❌
  │
  ├─▶ OWNER INTERACTION #3: CORRECT THE DATE
  │   │
  │   ├─▶ Owner changes date to "Dec 1"
  │   │
  │   ├─▶ onChange event triggers:
  │   │   ├─ isValidScheduledDate('high', 'Dec 1')
  │   │   ├─ Check: Dec 1 = Dec 1 (deadline)?
  │   │   ├─ Result: YES, it's exactly on deadline
  │   │   └─ Returns: true
  │   │
  │   ├─▶ Form state updates:
  │   │   ├─ errors.scheduled_date = '' (cleared)
  │   │   └─ Error message disappears
  │   │
  │   └─▶ Form submission ENABLED ✅
  │
  ├─▶ OWNER INTERACTION #4: SUBMIT FORM
  │   │
  │   ├─▶ Owner clicks "Create Request"
  │   │
  │   ├─▶ validateForm() runs:
  │   │   ├─ Check all required fields
  │   │   ├─ Check: isValidScheduledDate('high', 'Dec 1')
  │   │   ├─ All valid? YES
  │   │   └─ Returns: true
  │   │
  │   ├─▶ MaintenanceAPI.createMaintenanceRequest({
  │   │     ...formData,
  │   │     priority: 'high',
  │   │     scheduled_date: 'Dec 1'
  │   │   })
  │   │
  │   ├─▶ Backend receives request:
  │   │   ├─ (Optional) Server-side validation
  │   │   ├─ Insert into database
  │   │   └─ Return success
  │   │
  │   └─▶ Frontend:
  │       ├─ Show success toast
  │       └─ Redirect to /maintenance
  │
  └─▶ END (Success)
```

---

## 🔄 Data Flow - Editing Request with Priority Change

```
START (User on maintenance details page)
  │
  ├─▶ Page loads existing request:
  │   ├─ priority: 'low'
  │   ├─ scheduled_date: 'Dec 5'
  │   └─ Validation state: ✅ Valid
  │       (Dec 5 is within 7 days for 'low')
  │
  ├─▶ User clicks "Edit" → enableEditing()
  │
  ├─▶ OWNER CHANGES PRIORITY FROM LOW TO HIGH
  │   │
  │   ├─▶ Priority dropdown: 'low' → 'high'
  │   │
  │   ├─▶ onChange event triggers:
  │   │   ├─ Update formData.priority = 'high'
  │   │   ├─ Calculate new deadline: Dec 1 (3 days)
  │   │   │
  │   │   ├─▶ AUTOMATIC REVALIDATION:
  │   │   │   ├─ isValidScheduledDate('high', 'Dec 5')
  │   │   │   ├─ Check: Dec 5 > Dec 1?
  │   │   │   ├─ Result: YES, past deadline
  │   │   │   ├─ Returns: false
  │   │   │   │
  │   │   │   └─▶ getDateValidationError('high', 'Dec 5')
  │   │   │       ├─ Format error
  │   │   │       └─ Returns: "Scheduled date must be within 3 days. Deadline: Dec 1"
  │   │   │
  │   │   └─▶ Form state updates:
  │   │       ├─ errors.scheduled_date = "Scheduled date must be..."
  │   │       ├─ Date picker max updated to "Dec 1"
  │   │       └─ Display RED error message
  │   │
  │   └─▶ Form submission BLOCKED ❌
  │
  ├─▶ OWNER MUST NOW FIX THE DATE
  │   │
  │   ├─▶ Option A: Revert priority back to 'low'
  │   │   ├─ error clears
  │   │ │   └─ Form submission ENABLED ✅
  │   │
  │   ├─▶ Option B: Change scheduled_date to valid range
  │   │   ├─ Date changed to 'Dec 1'
  │   │   ├─ isValidScheduledDate('high', 'Dec 1') = true
  │   │   ├─ error clears
  │   │   └─ Form submission ENABLED ✅
  │   │
  │   └─▶ Owner chooses Option A: Revert to 'low'
  │       └─ Priority changed back to 'low'
  │
  ├─▶ OWNER SUBMITS FORM
  │   │
  │   ├─▶ validateForm() runs:
  │   │   ├─ isValidScheduledDate('low', 'Dec 5')
  │   │   ├─ Result: true ✅
  │   │   └─ All validations pass
  │   │
  │   ├─▶ MaintenanceAPI.updateMaintenanceRequest({
  │   │     id: 'req-123',
  │   │     priority: 'low',
  │   │     scheduled_date: 'Dec 5'
  │   │   })
  │   │
  │   ├─▶ Backend updates database
  │   │
  │   └─▶ Frontend:
  │       ├─ Show success toast
  │       └─ Refresh page with updated data
  │
  └─▶ END (Success)
```

---

## 🌳 Decision Tree - Validation Logic

```
                    ┌─ Start Validation ─┐
                    │                    │
                    ▼
            ┌───────────────────┐
            │ Has scheduled_date?│
            └─────┬─────────┬───┘
                  │         │
                 YES       NO
                  │         │
                  ▼         ▼
            (continue)   ❌ Error: Required
                  │         │
                  ▼         │
            ┌──────────────────────┐
            │ Date in the past?    │
            └─────┬──────────┬─────┘
                  │          │
                 YES        NO
                  │          │
                  ▼          ▼
            ❌ Error     (continue)
            Past date        │
                  │          ▼
                  │   ┌──────────────────────────┐
                  │   │ Get Priority Days        │
                  │   │ (1, 3, 5, or 7)         │
                  │   └────────────┬─────────────┘
                  │                │
                  │                ▼
                  │   ┌──────────────────────────┐
                  │   │ Calculate Deadline       │
                  │   │ Today + Days            │
                  │   └────────────┬─────────────┘
                  │                │
                  │                ▼
                  │   ┌──────────────────────────┐
                  │   │ Date > Deadline?        │
                  │   └─────┬──────────┬────────┘
                  │         │          │
                  │        YES        NO
                  │         │          │
                  │         ▼          ▼
                  │   ❌ Error     ✅ Valid!
                  │   Too Late
                  │         │          │
                  └─────────┴──────────┘
                            │
                            ▼
                      Return Result
```

---

## 📈 State Machine - Form Validation States

```
┌─────────────────────────────────────────────────────────────┐
│           FORM STATE MACHINE - Scheduled Date               │
└─────────────────────────────────────────────────────────────┘

                  ┌────────────────┐
                  │   NO DATE SET  │
                  │ (Initial State)│
                  └────────┬───────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          │                │                │
    User selects      Form submitted   Priority changes
    a date            (without date)   (Priority required)
          │                │                │
          ▼                ▼                │
    ┌──────────────┐  ❌ Error: Required  │
    │ VALIDATE     │  (Cannot proceed)   │
    │ DATE CHOSEN  │  (Stays in INVALID) │
    └─┬────────────┘                      │
      │                                   │
      ├──────────────────────────────┬────┘
      │                              │
      │                         Returns here
      │                              │
   Result of                         │
   Validation?                       │
      │                              │
      ├─YES──▶ ┌──────────────────┐ │
      │        │   VALID DATE     │ │
      │        │ (Can submit form)│ │
      │        └──────────────────┘ │
      │                             │
      ├─NO───▶ ┌──────────────────┐ │
      │        │   INVALID DATE   │◀┘
      │        │ (Cannot submit)  │
      │        │ • Past date      │
      │        │ • Too late       │
      │        │ • No date set    │
      │        └────────┬─────────┘
      │                 │
      │            Show error
      │            message
      │                 │
      │            User must fix
      │                 │
      └─────────────────┘
       (User corrects date)
```

---

## 🎯 Validation Function Call Stack

```
User Action: Schedule Date Selected
│
├─ onChange event fires
│
├─ handleInputChange('scheduled_date', '2025-12-05')
│
├─ Form state updates: {
│     ...formData,
│     scheduled_date: '2025-12-05'
│   }
│
├─ VALIDATION TRIGGERED
│   │
│   ├─▶ isValidScheduledDate('high', '2025-12-05')
│   │   │
│   │   ├─ Parse date: Date('2025-12-05')
│   │   │
│   │   ├─ Get today: new Date() = 2025-11-29
│   │   │
│   │   ├─ Check 1: Is date >= today?
│   │   │  2025-12-05 >= 2025-11-29? YES ✓
│   │   │
│   │   ├─ getPriorityDays('high')
│   │   │  Returns: 3
│   │   │
│   │   ├─ Calculate max date:
│   │   │  new Date() + 3 days = 2025-12-01
│   │   │
│   │   ├─ Check 2: Is date <= max date?
│   │   │  2025-12-05 <= 2025-12-01? NO ✗
│   │   │
│   │   └─ Return: false (INVALID)
│   │
│   ├─▶ getDateValidationError('high', '2025-12-05')
│   │   │
│   │   ├─ date < today? NO
│   │   │
│   │   ├─ isValidScheduledDate() = false?
│   │   │  YES, so format error message
│   │   │
│   │   ├─ getPriorityDays('high') = 3
│   │   │
│   │   ├─ calculateDeadline('high')
│   │   │  Returns: 2025-12-01
│   │   │
│   │   ├─ Format deadline: "Dec 1"
│   │   │
│   │   └─ Return: "Scheduled date must be within 3 days
│   │            from today. Deadline: Dec 1"
│   │
│   └─ Set error state: {
│         ...errors,
│         scheduled_date: "Scheduled date must be within..."
│       }
│
├─ UI Updates
│   ├─ Error message displays in RED
│   ├─ Input border turns RED
│   └─ Form submit button remains DISABLED
│
└─ User sees validation feedback immediately
```

---

## 🔐 Validation Security Layers

```
┌───────────────────────────────────────────────────────────────┐
│              VALIDATION SECURITY ARCHITECTURE                  │
└───────────────────────────────────────────────────────────────┘

LAYER 1: CLIENT-SIDE VALIDATION
┌─────────────────────────────────────┐
│ Frontend (React Component)           │
├─────────────────────────────────────┤
│ • Real-time validation              │
│ • User feedback on form             │
│ • Date picker restrictions          │
│ • Error message display             │
│ • Form submission prevention        │
│                                     │
│ Purpose: User experience, UX        │
│ Speed: Immediate feedback           │
│ Trust Level: ⚠️ Not secure         │
└─────────────────────────────────────┘
         ↓ (Only after validation pass)
LAYER 2: FORM SUBMISSION VALIDATION
┌─────────────────────────────────────┐
│ validateForm() function             │
├─────────────────────────────────────┤
│ • Final check before API call       │
│ • Prevents malformed data           │
│ • Double-checks all fields          │
│ • Prevents accidental submission    │
│                                     │
│ Purpose: Prevent bad API calls      │
│ Speed: Before network request       │
│ Trust Level: ⚠️ Can be bypassed    │
└─────────────────────────────────────┘
         ↓ (Only after both pass)
LAYER 3: SERVER-SIDE VALIDATION (Optional)
┌─────────────────────────────────────┐
│ API endpoint /api/maintenance       │
├─────────────────────────────────────┤
│ • Server-side validation            │
│ • Replay attack prevention          │
│ • Security-critical check           │
│ • Database constraint enforcement   │
│                                     │
│ Purpose: Security & data integrity  │
│ Speed: Network round-trip           │
│ Trust Level: ✅ Secure             │
└─────────────────────────────────────┘
         ↓
LAYER 4: DATABASE VALIDATION
┌─────────────────────────────────────┐
│ maintenance_requests table          │
├─────────────────────────────────────┤
│ • Constraint checks                 │
│ • Type validation                   │
│ • Foreign key validation            │
│ • Business rule enforcement         │
│                                     │
│ Purpose: Data integrity             │
│ Speed: At storage time              │
│ Trust Level: ✅ Most secure        │
└─────────────────────────────────────┘
```

---

## 📱 UI Component Hierarchy

```
Owner Maintenance Form
│
├─ Card: Basic Information
│  │
│  ├─ FormGroup
│  │  ├─ Label: "Priority"
│  │  └─ Select (Dropdown)
│  │     ├─ Low (7 days)
│  │     ├─ Medium (5 days)
│  │     ├─ High (3 days)
│  │     └─ Urgent (1 day)
│  │
│  ├─ FormGroup ← NEW
│  │  ├─ Label: "Scheduled Date"
│  │  │  └─ Helper Text: "Deadline: Dec 3"
│  │  ├─ Input[type="date"]
│  │  │  ├─ min: today
│  │  │  └─ max: deadline (dynamic)
│  │  └─ ErrorMessage
│  │     └─ "Scheduled date must be within..."
│  │
│  └─ FormGroup
│     ├─ Label: "Estimated Cost"
│     └─ Input[type="number"]
│
├─ Card: Property & Tenant Selection
│  └─ ...
│
├─ Card: Image Attachments
│  └─ ...
│
├─ Card: Additional Information
│  └─ ...
│
└─ Footer
   ├─ Button: Cancel
   └─ Button: Create Request (Disabled if errors)
```

---

## 🔄 Component Interaction Flow

```
┌──────────────────────────────────┐
│  Owner Maintenance Form          │
│  (parent component)              │
└──────────────┬───────────────────┘
               │
               ├─ FormState
               │  ├─ priority: string
               │  ├─ scheduled_date: string ← NEW
               │  └─ errors: Record<string, string>
               │
               ├─ Handlers
               │  ├─ handleInputChange(field, value)
               │  └─ validateForm()
               │
               └─ Renders
                  │
                  ├─ PriorityField
                  │  └─ onChange → handleInputChange('priority', value)
                  │     └─ Updates formData.priority
                  │
                  ├─ ScheduledDateField ← NEW
                  │  ├─ Props:
                  │  │  ├─ value: formData.scheduled_date
                  │  │  ├─ priority: formData.priority
                  │  │  ├─ error: errors.scheduled_date
                  │  │  └─ onChange handler
                  │  │
                  │  └─ onChange → handleInputChange('scheduled_date', value)
                  │     ├─ Calls: isValidScheduledDate()
                  │     ├─ Calls: getDateValidationError() if invalid
                  │     └─ Updates formData & errors
                  │
                  └─ SubmitButton
                     └─ disabled={Object.keys(errors).length > 0}
```

---

## 🎓 Example Timeline

```
Timeline: Friday, Nov 29, 2025 → Monday, Dec 2, 2025

FRI 11/29  SAT 11/30  SUN 12/01  MON 12/02  TUE 12/03
   │          │         │         │         │
   │          │         │         │         │
   ▼          ▼         ▼         ▼         ▼
  TODAY    +1 day    +2 days   +3 days   +4 days

PRIORITY DEADLINES:

┌─────────────────────────────────────────────────────┐
│ LOW (7 days) deadline: Friday, Dec 6                │
├─────────────────────────────────────────────────────┤
│ ✅ Valid:   11/29 - 12/06                           │
│ ❌ Invalid: 12/07 onwards                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ MEDIUM (5 days) deadline: Wednesday, Dec 3          │
├─────────────────────────────────────────────────────┤
│ ✅ Valid:   11/29 - 12/03                           │
│ ❌ Invalid: 12/04 onwards                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ HIGH (3 days) deadline: Monday, Dec 1               │
├─────────────────────────────────────────────────────┤
│ ✅ Valid:   11/29 - 12/01                           │
│ ❌ Invalid: 12/02 onwards                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ URGENT (1 day) deadline: Saturday, Nov 30           │
├─────────────────────────────────────────────────────┤
│ ✅ Valid:   11/29 - 11/30                           │
│ ❌ Invalid: 12/01 onwards                           │
└─────────────────────────────────────────────────────┘
```

---

**This visual guide complements the implementation plan. Refer to the detailed plan for code examples and step-by-step instructions.**

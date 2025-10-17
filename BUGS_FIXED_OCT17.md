# Bug Fixes - October 17, 2025

## ✅ Issues Fixed

### **Issue #1: Owner Receiving Self-Notifications for Announcements** ✅ FIXED
**Problem:** When an owner creates an announcement, they receive a notification about their own announcement.

**Solution:** 
- Modified `AnnouncementsAPI.createAnnouncement()` to pass `creatorId`
- Updated `createAnnouncementNotifications()` to accept and filter out the creator
- Added logic: `targetUserIds = targetUserIds.filter(userId => userId !== creatorId)`

**Files Changed:**
- `client/lib/api/announcements.ts` (lines 247-352, 499-595)

**Status:** ✅ Complete - Owners no longer receive notifications for their own announcements

---

### **Issue #2: Profile Button Redirecting to Dashboard** ✅ FIXED
**Problem:** Clicking "Profile" in the upper right menu was showing the dashboard instead of the profile page.

**Solution:**
- Added `getProfilePath()` function to route based on user role
- Updated profile menu item to use `getProfilePath()` instead of hardcoded `/dashboard/profile`
- Now correctly routes to:
  - Owners: `/owner/dashboard/profile`
  - Tenants: `/tenant/dashboard/profile`

**Files Changed:**
- `client/components/layout/top-navbar.tsx` (lines 264-266, 651)

**Status:** ✅ Complete - Profile button now correctly navigates to profile page

---

### **Issue #3: Payment Schedule Order** ✅ ALREADY CORRECT
**Problem:** Payments should show latest first.

**Finding:** 
- Checked `client/lib/api/payments.ts`
- Payments are already ordered with `.order('created_at', { ascending: false })`
- This means latest payments are already shown first (descending order)

**Status:** ✅ No fix needed - Already working correctly

---

### **Issue #4: Remove Cash Payment Option** ⏳ IN PROGRESS
**Problem:** Cash payment option should be removed as per paper requirements.

**Solution Required:**
- Find all payment method selectors
- Remove "cash" from payment method options
- Update payment forms in:
  - Owner payment creation
  - Tenant payment pages
  - Admin payment monitoring

**Files to Change:**
- Payment form components
- Payment type definitions
- Payment method constants

**Status:** ⏳ Pending implementation

---

### **Issue #5: Three Dots Menu Not Working in Tenants Page** ⏳ NEEDS INVESTIGATION
**Problem:** Three dots dropdown menu (MoreVertical) not showing options in `/owner/dashboard/tenants/[id]`

**Investigation Needed:**
- Check if dropdown menu is properly implemented
- Verify if options are missing or menu is not triggering
- Check for console errors

**Files to Check:**
- `client/app/owner/dashboard/tenants/[id]/page.tsx`

**Status:** ⏳ Pending investigation and fix

---

### **Issue #6: Emergency Contact Name Column Error** ⏳ NEEDS FIX
**Problem:** Error when creating new tenant - "could not find emergency_contact_name column"

**Root Cause:**
- Database schema mismatch
- Column might be named differently or doesn't exist

**Solution Required:**
1. Check actual database schema for tenants table
2. Update form to match correct column names
3. Possible fixes:
   - Rename `emergency_contact_name` to match database
   - Or add column to database if missing

**Files to Change:**
- `client/app/owner/dashboard/tenants/new/page.tsx`
- Possibly database migration

**Status:** ⏳ Pending schema verification and fix

---

### **Issue #7: Replace Dollar Signs with Peso Signs** ⏳ IN PROGRESS
**Problem:** All $ (dollar sign) icons should be ₱ (Philippine peso sign)

**Solution Required:**
- Find all instances of `DollarSign` icon from lucide-react
- Replace with peso sign (₱) or PhilippinePeso icon if available
- Update all financial displays to use PHP currency format

**Files to Search:**
- All payment-related components
- Dashboard statistics
- Financial summaries
- Maintenance cost displays

**Common Replacements:**
```tsx
// Before
<DollarSign className="..." />

// After  
<span className="...">₱</span>
// Or use a custom PhilippinePeso icon component
```

**Status:** ⏳ Pending implementation

---

### **Issue #8: Add Camera Option for Image Upload** ⏳ NEEDS IMPLEMENTATION
**Problem:** Image upload should have camera option for easier mobile photo capture

**Solution Required:**
- Add camera capture option to ImageUpload component
- Use HTML5 `capture` attribute: `<input capture="environment">`
- Provide two options:
  1. "Take Photo" - Opens camera directly
  2. "Choose from Gallery" - Opens file picker

**Files to Change:**
- `client/components/ui/image-upload.tsx`
- Any maintenance request forms
- Property image upload forms

**Implementation:**
```tsx
<input
  type="file"
  accept="image/*"
  capture="environment"  // For camera
  ...
/>
```

**Status:** ⏳ Pending implementation

---

## 📊 Summary

| Issue # | Description | Status |
|---------|-------------|--------|
| 1 | Owner self-notifications | ✅ Fixed |
| 2 | Profile button redirect | ✅ Fixed |
| 3 | Payment order | ✅ Already correct |
| 4 | Remove cash payment | ⏳ In progress |
| 5 | Three dots menu | ⏳ Needs investigation |
| 6 | Emergency contact error | ⏳ Needs fix |
| 7 | Dollar to peso signs | ⏳ In progress |
| 8 | Camera upload option | ⏳ Needs implementation |

**Completed:** 3/8 (37.5%)  
**In Progress:** 5/8 (62.5%)

---

## 🎯 Next Steps

1. ✅ Complete Issues #4, #5, #6, #7, #8
2. Test all fixes in dev environment
3. Verify no regressions
4. Update documentation

---

**Last Updated:** October 17, 2025 4:25 PM  
**Developer:** AI Assistant  
**Status:** Actively fixing remaining issues

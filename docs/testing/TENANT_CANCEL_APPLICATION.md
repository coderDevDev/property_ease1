# Tenant Cancel Application Feature

## Overview
Tenants can now cancel their own **pending applications** from the tenant dashboard.

---

## Key Points

### ✅ **Can Cancel:**
- **Pending applications only**
- Applications submitted by the tenant
- Before owner approves/rejects

### ❌ **Cannot Cancel:**
- **Approved applications** (lease already created)
- **Rejected applications** (already processed)
- Applications submitted by other users

---

## How It Works

### **Tenant Side:**

1. Go to `/tenant/dashboard/applications`
2. Find a **pending** application
3. Click **"Cancel"** button (red, with trash icon)
4. Confirm cancellation
5. ✅ Application deleted immediately

### **What Gets Deleted:**
1. ✅ Application record
2. ✅ All uploaded documents (CASCADE)

### **What Stays:**
- Property record (unchanged)
- Tenant can apply again if they want

---

## UI Implementation

### **Card View:**
```
┌─────────────────────────────────────┐
│  Property Name                      │
│  Status: Pending                    │
│  Monthly Rent: ₱10,000              │
│  ─────────────────────────────────  │
│  [View Details] [Cancel]            │ ← Cancel button
└─────────────────────────────────────┘
```

### **Table View:**
```
Property | Unit | Rent | Status | Actions
─────────────────────────────────────────
Property | 1BR  | ₱10k | Pending | [👁️] [🗑️] ← Cancel icon
```

---

## Confirmation Dialog

```
Cancel your application for [Property Name]?

Unit: [Unit Type]
Monthly Rent: ₱[Amount]

This will delete your application and all uploaded documents.
This action cannot be undone!

[Cancel] [OK]
```

---

## Safety Checks

### **1. Status Check:**
```typescript
if (application.status !== 'pending') {
  toast.error('You can only cancel pending applications');
  return;
}
```

### **2. User Ownership Check:**
```typescript
.eq('user_id', authState.user?.id) // Extra safety
```

### **3. Confirmation Required:**
- User must confirm before deletion
- Shows application details in confirmation
- Warns about permanent deletion

---

## Code Implementation

### **File:** `app/tenant/dashboard/applications/page.tsx`

### **Handler Function (lines 141-185):**
```typescript
const handleCancelApplication = async (
  application: Application,
  e: React.MouseEvent
) => {
  e.stopPropagation();

  // Only allow canceling pending applications
  if (application.status !== 'pending') {
    toast.error('You can only cancel pending applications');
    return;
  }

  const confirmCancel = confirm(
    `Cancel your application for ${application.property_name}?\n\n` +
    `Unit: ${application.unit_type}\n` +
    `Monthly Rent: ₱${application.monthly_rent.toLocaleString()}\n\n` +
    `This will delete your application and all uploaded documents.\n` +
    `This action cannot be undone!`
  );

  if (!confirmCancel) return;

  try {
    // Delete application (documents cascade deleted)
    const { error } = await supabase
      .from('rental_applications')
      .delete()
      .eq('id', application.id)
      .eq('user_id', authState.user?.id); // Extra safety check

    if (error) throw error;

    // Update local state
    setApplications(prev => prev.filter(app => app.id !== application.id));

    toast.success('Application cancelled successfully', {
      description: 'All related documents have been removed'
    });
  } catch (error) {
    console.error('Failed to cancel application:', error);
    toast.error('Failed to cancel application', {
      description: error instanceof Error ? error.message : 'Please try again later'
    });
  }
};
```

### **Card View Button (lines 523-532):**
```typescript
{application.status === 'pending' && (
  <Button
    variant="destructive"
    size="sm"
    className="flex-1"
    onClick={e => handleCancelApplication(application, e)}>
    <Trash2 className="w-4 h-4 mr-2" />
    Cancel
  </Button>
)}
```

### **Table View Button (lines 646-657):**
```typescript
{application.status === 'pending' && (
  <Button
    variant="ghost"
    size="sm"
    className="text-red-600 hover:text-red-700 hover:bg-red-50"
    onClick={e => handleCancelApplication(application, e)}
    title="Cancel Application">
    <Trash2 className="w-4 h-4" />
  </Button>
)}
```

---

## Use Cases

### **1. Changed Mind**
**Scenario:** Tenant no longer wants to rent this property
```
Submit application → Change mind → Cancel → Apply elsewhere
```

### **2. Found Better Property**
**Scenario:** Tenant found a better option
```
Multiple applications → Choose best one → Cancel others
```

### **3. Testing/Simulation**
**Scenario:** Testing the application workflow
```
Create application → Review → Cancel → Repeat
```

### **4. Incorrect Information**
**Scenario:** Tenant entered wrong details
```
Submit with error → Cancel → Resubmit correctly
```

---

## Difference: Owner vs Tenant Delete

### **Owner Delete:**
- Can delete ANY status (pending, approved, rejected)
- Gets warning for approved applications
- Tenant record stays intact (if approved)

### **Tenant Cancel:**
- Can ONLY cancel **pending** applications
- Cannot cancel approved/rejected
- Simpler confirmation (no tenant record concern)

---

## Testing Checklist

### **Test 1: Cancel Pending Application**
1. Login as tenant
2. Go to `/tenant/dashboard/applications`
3. Find pending application
4. Click "Cancel" button
5. Confirm cancellation
6. ✅ Application removed from list
7. ✅ Documents deleted

### **Test 2: Try to Cancel Approved**
1. Find approved application
2. ✅ No cancel button visible
3. Or if somehow triggered: ❌ Error message

### **Test 3: Try to Cancel Rejected**
1. Find rejected application
2. ✅ No cancel button visible

### **Test 4: Cancel Then Reapply**
1. Cancel an application
2. Go to properties page
3. Apply for same property again
4. ✅ New application created

### **Test 5: Verify Owner Can't See**
1. Tenant cancels application
2. Login as owner
3. Go to `/owner/dashboard/applications`
4. ✅ Cancelled application not visible
5. ✅ Application count decreased

---

## Why Tenant Still Sees Deleted Applications

### **Issue:**
After owner deletes, tenant still sees it

### **Causes:**
1. **Browser cache** - Page not refreshed
2. **Local state** - Component state not updated
3. **Database delay** - Replication lag (rare)

### **Solutions:**

#### **1. Refresh Page (Quick Fix):**
```
Press F5 or Ctrl+R
```

#### **2. Clear Cache:**
```
Ctrl + Shift + R (hard refresh)
```

#### **3. Real-time Updates (Future Enhancement):**
```typescript
// Subscribe to database changes
supabase
  .channel('applications')
  .on('postgres_changes', {
    event: 'DELETE',
    schema: 'public',
    table: 'rental_applications'
  }, (payload) => {
    // Remove from local state
    setApplications(prev => 
      prev.filter(app => app.id !== payload.old.id)
    );
  })
  .subscribe();
```

---

## Database Impact

### **Tables Affected:**

1. **`rental_applications`**
   - Record deleted

2. **`application_documents`** (CASCADE)
   - All documents auto-deleted

### **RLS Policies:**
```sql
-- Tenants can delete their own applications
CREATE POLICY "Tenants can delete own applications" 
ON rental_applications
FOR DELETE 
USING (auth.uid() = user_id);
```

---

## Error Messages

### **Success:**
```
✅ "Application cancelled successfully"
   "All related documents have been removed"
```

### **Errors:**
```
❌ "You can only cancel pending applications"
   (Trying to cancel approved/rejected)

❌ "Failed to cancel application"
   "[Specific error message]"
   (Database error, permission denied, etc.)
```

---

## Future Enhancements

### **Possible Improvements:**

1. **Soft Cancel** - Mark as cancelled instead of delete
2. **Cancel Reason** - Ask why tenant is cancelling
3. **Undo Cancel** - Allow restoring within time window
4. **Real-time Sync** - Auto-remove when owner deletes
5. **Email Notification** - Notify owner when tenant cancels

---

## Summary

### **Tenant Can:**
- ✅ Cancel **pending** applications
- ✅ Delete their own documents
- ✅ Reapply after cancelling

### **Tenant Cannot:**
- ❌ Cancel **approved** applications
- ❌ Cancel **rejected** applications
- ❌ Cancel other users' applications

### **Button Visibility:**
- **Pending**: Shows "Cancel" button (red)
- **Approved**: Shows "Download Lease" button (green)
- **Rejected**: Shows "View Details" only

---

**Date**: October 25, 2025  
**Status**: ✅ Implemented  
**Feature**: Tenant can cancel pending applications  
**Perfect for**: Testing workflow, changing mind, found better property

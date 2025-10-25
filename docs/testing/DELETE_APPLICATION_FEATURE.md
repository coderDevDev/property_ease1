# Delete Application Feature

## Overview
Added functionality to delete rental applications from the owner dashboard with proper safety checks.

---

## Delete Process

### **What Gets Deleted:**

When you delete an application:
1. ✅ **Application record** (`rental_applications` table)
2. ✅ **All documents** (`application_documents` table) - CASCADE deleted automatically

### **What Does NOT Get Deleted:**

❌ **Tenant records** - If application was approved and created a tenant, the tenant record remains intact

---

## Safety Checks

### **For Pending/Rejected Applications:**
```
Confirmation Dialog:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Delete application from [Applicant Name]?

Property: [Property Name]
Status: [pending/rejected]

This will also delete all uploaded documents.
This action cannot be undone!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **For Approved Applications:**
```
Confirmation Dialog:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ WARNING: This application was APPROVED and 
may have created a tenant record.

Deleting this will NOT delete the tenant record.

Are you sure you want to delete this application 
record?

Applicant: [Name]
Property: [Property Name]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## When to Delete

### ✅ **Safe to Delete:**
- **Pending applications** - No tenant created yet
- **Rejected applications** - Already processed, no tenant
- **Duplicate applications** - Testing/simulation purposes
- **Test data** - During development/testing

### ⚠️ **Use Caution:**
- **Approved applications** - Tenant record already exists
  - Deleting application won't delete tenant
  - Only removes application history
  - Tenant record remains in system

---

## Database Impact

### **Tables Affected:**

#### 1. `rental_applications`
```sql
DELETE FROM rental_applications WHERE id = 'APPLICATION_ID';
```

#### 2. `application_documents` (CASCADE)
```sql
-- Automatically deleted due to ON DELETE CASCADE
-- No manual deletion needed
```

### **Foreign Key Cascade:**
From schema (line 30):
```sql
application_documents (
  application_id UUID REFERENCES rental_applications(id) 
  ON DELETE CASCADE  -- ✅ Auto-deletes documents
)
```

---

## UI Implementation

### **Delete Button Location:**
📍 **Application Details Dialog** (bottom section)

### **Button Styling:**
- **Variant**: `destructive` (red)
- **Icon**: Trash2
- **Width**: Full width
- **Position**: Below action buttons, above rejection reason

### **Visual Feedback:**
```
┌─────────────────────────────────────┐
│  [Reject]  [Approve]                │ ← Action buttons
├─────────────────────────────────────┤
│  [🗑️ Delete Application]            │ ← Delete button
│  ⚠️ Warning text based on status    │
└─────────────────────────────────────┘
```

---

## Code Implementation

### **File:** `app/owner/dashboard/applications/page.tsx`

### **Handler Function (lines 327-372):**
```typescript
const handleDeleteApplication = async (application: Application) => {
  // Safety check for approved applications
  if (application.status === 'approved') {
    const confirmDelete = confirm(
      `⚠️ WARNING: This application was APPROVED...\n\n` +
      `Deleting this will NOT delete the tenant record...`
    );
    if (!confirmDelete) return;
  } else {
    const confirmDelete = confirm(
      `Delete application from ${application.user_name}?...`
    );
    if (!confirmDelete) return;
  }

  try {
    // Delete application (documents cascade deleted)
    const { error } = await supabase
      .from('rental_applications')
      .delete()
      .eq('id', application.id);

    if (error) throw error;

    // Update local state
    setApplications(prev => prev.filter(app => app.id !== application.id));

    toast.success('Application deleted successfully');
  } catch (error) {
    toast.error('Failed to delete application');
  }
};
```

### **UI Button (lines 993-1010):**
```typescript
<div className="pt-4 border-t">
  <Button
    variant="destructive"
    className="w-full"
    onClick={() => {
      setShowDetailsDialog(false);
      handleDeleteApplication(selectedApplication);
    }}>
    <Trash2 className="w-4 h-4 mr-2" />
    Delete Application
  </Button>
  <p className="text-xs text-gray-500 mt-2 text-center">
    {selectedApplication.status === 'approved' 
      ? '⚠️ This will NOT delete the tenant record'
      : 'This will delete the application and all documents'}
  </p>
</div>
```

---

## Testing Checklist

### **Test 1: Delete Pending Application**
1. Go to `/owner/dashboard/applications`
2. Click on a pending application
3. Click "Delete Application"
4. Confirm deletion
5. ✅ Application removed from list
6. ✅ Documents deleted (check database)

### **Test 2: Delete Rejected Application**
1. Find a rejected application
2. Click "Delete Application"
3. Confirm deletion
4. ✅ Application removed
5. ✅ No errors

### **Test 3: Delete Approved Application**
1. Find an approved application
2. Click "Delete Application"
3. ✅ See warning about tenant record
4. Confirm deletion
5. ✅ Application deleted
6. ✅ Tenant record still exists (verify in tenants page)

### **Test 4: Cancel Deletion**
1. Click "Delete Application"
2. Click "Cancel" in confirmation
3. ✅ Application remains unchanged
4. ✅ No deletion occurs

---

## Use Cases

### **1. Testing/Simulation**
**Scenario:** Testing the application workflow
```
Create application → Review → Delete → Repeat
```
**Benefit:** Clean up test data easily

### **2. Duplicate Applications**
**Scenario:** Same user applied multiple times
```
Keep one → Delete duplicates
```
**Benefit:** Clean application list

### **3. Outdated Applications**
**Scenario:** Old rejected applications cluttering dashboard
```
Filter by rejected → Delete old ones
```
**Benefit:** Better dashboard organization

### **4. Data Cleanup**
**Scenario:** Removing approved applications after tenant moved in
```
Approved → Tenant created → Delete application record
```
**Benefit:** Keep only active tenant records

---

## Important Notes

### ⚠️ **Critical:**
1. **Approved applications** - Deleting won't affect tenant records
2. **Documents** - All uploaded documents are permanently deleted
3. **No undo** - Deletion is permanent, cannot be recovered
4. **Audit trail** - Consider keeping rejected applications for records

### 💡 **Best Practices:**
1. Only delete during testing/simulation
2. Keep rejected applications for audit purposes
3. Delete approved applications only after confirming tenant is active
4. Export/backup important documents before deletion

---

## Alternative Approaches Considered

### **Option 1: Soft Delete (Not Implemented)**
- Add `deleted_at` timestamp
- Keep records but mark as deleted
- **Pros:** Full audit trail, can restore
- **Cons:** More complex queries

### **Option 2: Archive (Not Implemented)**
- Move to `archived_applications` table
- Keep for historical records
- **Pros:** Clean main table, keep history
- **Cons:** More storage, complex migration

### **Option 3: Hard Delete (✅ Implemented)**
- Permanently delete from database
- Cascade delete documents
- **Pros:** Simple, clean database
- **Cons:** No recovery, no audit trail

---

## Database Schema Reference

### `rental_applications` table:
```sql
CREATE TABLE rental_applications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  status application_status DEFAULT 'pending',
  -- ... other fields
);
```

### `application_documents` table:
```sql
CREATE TABLE application_documents (
  id UUID PRIMARY KEY,
  application_id UUID REFERENCES rental_applications(id) 
    ON DELETE CASCADE,  -- ✅ Auto-deletes when application deleted
  name TEXT,
  type TEXT,
  url TEXT,
  -- ... other fields
);
```

---

## Error Handling

### **Possible Errors:**

1. **Permission denied**
   - User not authorized to delete
   - Check RLS policies

2. **Foreign key constraint**
   - Should not happen (CASCADE handles it)
   - Check database schema

3. **Network error**
   - Supabase connection issue
   - Show retry option

### **Error Messages:**
```typescript
✅ Success: "Application deleted successfully"
           "All related documents have been removed"

❌ Error:   "Failed to delete application"
           "[Specific error message]"
```

---

## Future Enhancements

### **Possible Improvements:**
1. **Bulk delete** - Select multiple applications to delete
2. **Soft delete** - Add deleted_at column for recovery
3. **Archive feature** - Move to archive instead of delete
4. **Export before delete** - Download application data first
5. **Confirmation checkbox** - "I understand this is permanent"

---

**Date**: October 25, 2025  
**Status**: ✅ Implemented and Ready for Testing  
**Feature**: Delete Application with Safety Checks  
**Use Case**: Perfect for testing/simulation workflow

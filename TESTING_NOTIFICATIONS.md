# Testing Real-Time Notifications - Step by Step Guide

## 🧪 How to Test Tenant Notifications

### Setup
1. Open your browser
2. Open **Developer Console** (F12 or Right-click → Inspect → Console tab)
3. Keep the console open to see debug logs

### Test Scenario 1: Maintenance Assignment Notification

**Step 1: Login as Tenant**
- Go to `/tenant/dashboard`
- Create a maintenance request (or use existing one)
- Note the maintenance request ID

**Step 2: Open Notifications Page (in same or different tab)**
- Navigate to `/tenant/dashboard/notifications`
- Keep this page open
- You should see the real-time connection status

**Step 3: Login as Owner (in different browser/incognito)**
- Go to `/owner/dashboard/maintenance`
- Find the tenant's maintenance request
- Click to view details
- **Assign personnel** and change status to "In Progress"
- Click Save/Update

**Step 4: Check Tenant Side**
- Look at the tenant's notifications page
- You should see:
  - 🔧 **Toast notification** appear at top-right
  - **New notification** in the list
  - **Notification count** update

**Step 5: Check Console Logs**
Look for these logs in the owner's console:
```
🔔 Maintenance assigned: { maintenanceId: "...", assignedTo: "...", tenantUserId: "..." }
🔔 Assignment notification result: { success: true, data: {...} }
```

### Test Scenario 2: Maintenance Completion Notification

**Step 1: As Owner**
- Go to maintenance request details
- Change status to "Completed"
- Add actual cost (optional)
- Save

**Step 2: As Tenant**
- Check `/tenant/dashboard/notifications`
- Should see:
  - ✅ **"Maintenance Request Completed"** notification
  - Toast notification with completion message
  - Final cost if provided

### Test Scenario 3: Application Approval

**Step 1: As Tenant/Applicant**
- Submit a rental application
- Open `/tenant/dashboard/notifications` page

**Step 2: As Owner**
- Go to `/owner/dashboard/applications`
- Approve the application

**Step 3: As Tenant**
- Check notifications page
- Should see:
  - 🎉 **"Application Approved!"** notification
  - High priority badge (red)
  - Welcome message

### Test Scenario 4: Payment Notifications

**Step 1: As Owner**
- Go to `/owner/dashboard/payments`
- Create a new payment for a tenant
- Fill in amount, due date, type

**Step 2: As Tenant**
- Open `/tenant/dashboard/notifications`
- Should see:
  - 💰 **"New Payment Due"** notification
  - Amount and due date
  - Property name

**Step 3: As Owner**
- Mark payment as "Paid"

**Step 4: As Tenant**
- Should see:
  - ✅ **"Payment Confirmed"** notification

## 🔍 Troubleshooting

### Issue: No notifications appearing

**Check 1: Console Logs**
Look for these in owner's console:
```
🔔 Maintenance status changed: { ... }
🔔 Notification result: { success: true, ... }
```

If you see `⚠️ No tenant user ID found`, the issue is with data fetching.

**Check 2: Database**
Open Supabase dashboard → notifications table
- Check if notifications are being created
- Verify `user_id` matches the tenant's user ID

**Check 3: Real-Time Connection**
In tenant's notifications page, check:
- `isConnected` should be `true`
- Look for Supabase connection logs in console

**Check 4: User ID**
In tenant's console, run:
```javascript
// Check current user
console.log('Current user:', authState.user?.id);
```

Compare with the `user_id` in the notifications table.

### Issue: Notifications created but not appearing in real-time

**Solution 1: Refresh the page**
- Notifications page should auto-load on mount
- Real-time subscription starts automatically

**Solution 2: Check Supabase Real-Time**
- Ensure Supabase real-time is enabled for `notifications` table
- Check RLS policies allow tenant to read their notifications

**Solution 3: Check Browser Console**
Look for errors like:
- WebSocket connection errors
- Supabase subscription errors
- RLS policy violations

## ✅ Expected Console Output

### When Owner Assigns Maintenance:
```
🔔 Maintenance assigned: {
  maintenanceId: "abc-123",
  assignedTo: "John Doe",
  tenantUserId: "user-456",
  tenantData: { user: { id: "user-456", ... } }
}
🔔 Assignment notification result: {
  success: true,
  data: { id: "notif-789", title: "🔧 Maintenance Work Started", ... }
}
```

### When Tenant's Page Receives Notification:
```
New notification received: {
  new: { id: "notif-789", title: "🔧 Maintenance Work Started", ... }
}
```

## 📱 Real-Time Features to Verify

1. ✅ **Toast Notifications** - Appear automatically
2. ✅ **Notification List** - Updates without refresh
3. ✅ **Unread Count** - Updates in real-time
4. ✅ **Connection Status** - Shows if real-time is working
5. ✅ **Mark as Read** - Updates instantly
6. ✅ **Delete** - Removes from list instantly

## 🎯 Quick Test Checklist

- [ ] Maintenance assignment sends notification
- [ ] Maintenance completion sends notification
- [ ] Application approval sends notification
- [ ] Application rejection sends notification
- [ ] Payment creation sends notification
- [ ] Payment status change sends notification
- [ ] Toast notifications appear
- [ ] Notifications list updates without refresh
- [ ] Unread count updates
- [ ] Mark as read works
- [ ] Delete notification works
- [ ] Console logs show notification creation
- [ ] Console logs show notification delivery

## 🚀 Next Steps

If all tests pass:
1. Remove console.log statements (or keep for debugging)
2. Test with multiple tenants
3. Test with multiple maintenance requests
4. Test edge cases (no tenant user, invalid IDs, etc.)

If tests fail:
1. Check console logs for errors
2. Verify database has notifications
3. Check Supabase RLS policies
4. Verify real-time is enabled
5. Check user IDs match correctly

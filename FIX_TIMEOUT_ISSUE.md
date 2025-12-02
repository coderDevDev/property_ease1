# Fix: Subscription TIMED_OUT and CLOSED

## 🔍 What's Happening

Your console shows:
```
✅ Successfully subscribed to notifications for user: ef9e7ff8-...
🔔 Subscription status changed: TIMED_OUT
🔔 Subscription status changed: CLOSED
```

This means:
- ✅ Supabase connection works
- ✅ Subscription starts successfully
- ❌ **But the `notifications` table is NOT in the real-time publication**
- ❌ So the subscription times out and closes

## 🛠️ The Fix

The `notifications` table needs to be added to Supabase's real-time publication.

### Method 1: Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Navigate to Database → Replication**
   - Click on "Database" in the left sidebar
   - Click on "Replication" tab

3. **Enable Real-Time for notifications table**
   - Scroll down to find "Source" section
   - Look for `notifications` table
   - Click the toggle to **enable real-time**
   - Make sure these are checked:
     - ✅ INSERT
     - ✅ UPDATE  
     - ✅ DELETE

4. **Save Changes**

### Method 2: SQL Command (Alternative)

If the dashboard doesn't work, run this SQL:

1. **Go to Supabase Dashboard → SQL Editor**

2. **Run this command:**
```sql
-- Add notifications table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

3. **Verify it worked:**
```sql
-- Check if notifications is in the publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
```

You should see:
```
schemaname | tablename
-----------+--------------
public     | notifications
```

## ✅ Test After Enabling

### Step 1: Refresh Tenant Page
- Close and reopen `/tenant/dashboard/notifications`
- Or just refresh the page (F5)

### Step 2: Check Console
You should now see:
```
🔔 Setting up real-time subscription for user: ef9e7ff8-...
🔔 Subscription status changed: SUBSCRIBED
🔔 ✅ Successfully subscribed to notifications for user: ef9e7ff8-...
```

**And NO MORE:**
- ❌ `TIMED_OUT`
- ❌ `CLOSED`

### Step 3: Test Real-Time
**As Owner:**
- Complete a maintenance request

**As Tenant (watch console):**
You should immediately see:
```
🔔 ✅ New notification received in real-time: {
  new: { title: "✅ Maintenance Request Completed", ... }
}
```

**And on the page:**
- Toast notification pops up
- New item appears in list
- No refresh needed!

## 🎯 Expected Console Output (After Fix)

### When Page Loads:
```
🔔 Setting up real-time subscription for user: ef9e7ff8-f88c-4a67-ba22-4414a9499e62
🔔 Subscription status changed: SUBSCRIBED
🔔 ✅ Successfully subscribed to notifications for user: ef9e7ff8-f88c-4a67-ba22-4414a9499e62
```

### When Notification is Created:
```
🔔 ✅ New notification received in real-time: {
  commit_timestamp: "2024-12-02T08:35:00Z",
  errors: null,
  eventType: "INSERT",
  new: {
    id: "abc-123",
    user_id: "ef9e7ff8-f88c-4a67-ba22-4414a9499e62",
    title: "✅ Maintenance Request Completed",
    message: "Your maintenance request has been completed",
    type: "maintenance",
    priority: "high",
    is_read: false,
    created_at: "2024-12-02T08:35:00Z"
  },
  old: {},
  schema: "public",
  table: "notifications"
}
```

## 🐛 Still Getting TIMED_OUT?

### Check 1: Verify Publication
```sql
-- Run in Supabase SQL Editor
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';
```

Look for `notifications` in the results.

### Check 2: Check RLS Policies
```sql
-- Verify tenant can SELECT their notifications
SELECT * FROM pg_policies 
WHERE tablename = 'notifications' 
AND cmd = 'SELECT';
```

Should show a policy allowing users to select their own notifications.

### Check 3: Restart Supabase (if needed)
Sometimes Supabase needs a moment to apply changes:
- Wait 1-2 minutes after enabling real-time
- Refresh your browser
- Try again

### Check 4: Supabase Plan Limits
Free tier has limits on real-time connections:
- Max 2 concurrent connections
- Max 500 messages/second

If you're hitting limits, consider upgrading.

## 📊 Comparison: Before vs After

### Before (BROKEN):
```
SUBSCRIBED → TIMED_OUT → CLOSED
❌ No real-time updates
❌ Must refresh to see notifications
```

### After (WORKING):
```
SUBSCRIBED → stays SUBSCRIBED
✅ Real-time updates work
✅ Notifications appear instantly
✅ No refresh needed
```

## 🎉 Success Indicators

You'll know it's fixed when:

1. ✅ Console shows `SUBSCRIBED` and stays subscribed
2. ✅ No `TIMED_OUT` or `CLOSED` messages
3. ✅ New notifications appear without refresh
4. ✅ Toast notifications pop up automatically
5. ✅ Unread count updates in real-time

---

## 🚀 Next Step

**Run this SQL command now:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

Then refresh the tenant's notifications page and test again!

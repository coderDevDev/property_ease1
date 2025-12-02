# Fix Real-Time Notifications Not Appearing

## ✅ Good News
Your notifications **ARE being created** successfully in the database!
```
🔔 Completion notification result: {success: true, data: {…}}
```

## ❌ The Problem
Notifications only appear after **page refresh**, not in real-time.

## 🔍 Root Cause
This is a **Supabase Real-Time configuration issue**. The subscription is set up correctly in code, but Supabase needs to be configured to broadcast changes.

## 🛠️ Solution Steps

### Step 1: Enable Real-Time in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to your project
   - Click on **Database** → **Replication**

2. **Enable Real-Time for notifications table**
   - Find the `notifications` table
   - Toggle **Real-time** to ON
   - Make sure these events are enabled:
     - ✅ INSERT
     - ✅ UPDATE
     - ✅ DELETE

### Step 2: Check RLS Policies

The tenant needs permission to **SELECT** their own notifications in real-time.

**Go to:** Database → Tables → notifications → Policies

**Required Policy:**
```sql
-- Policy name: "Users can view their own notifications"
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);
```

**Or if using custom user table:**
```sql
-- If user_id references users table
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
USING (
  user_id IN (
    SELECT id FROM users WHERE user_id = auth.uid()
  )
);
```

### Step 3: Verify Subscription in Browser Console

**As Tenant:**
1. Open `/tenant/dashboard/notifications`
2. Open Browser Console (F12)
3. Look for these logs:

**Expected Output:**
```
🔔 Setting up real-time subscription for user: ef9e7ff8-f88c-4a67-ba22-4414a9499e62
🔔 Subscription status changed: SUBSCRIBED
🔔 ✅ Successfully subscribed to notifications for user: ef9e7ff8-f88c-4a67-ba22-4414a9499e62
```

**If you see:**
```
🔔 ❌ Channel error - real-time notifications may not work
```
→ Real-time is not enabled in Supabase

**If you see:**
```
🔔 ❌ Subscription timed out
```
→ Check RLS policies or network connection

### Step 4: Test Real-Time

**Keep tenant notifications page open with console visible**

**As Owner:**
1. Complete a maintenance request
2. Watch owner console for:
   ```
   🔔 Completion notification result: {success: true, ...}
   ```

**As Tenant (in console):**
You should immediately see:
```
🔔 ✅ New notification received in real-time: {
  new: {
    id: "...",
    title: "✅ Maintenance Request Completed",
    message: "...",
    user_id: "ef9e7ff8-f88c-4a67-ba22-4414a9499e62"
  }
}
```

**And on the page:**
- Toast notification appears
- New notification in the list
- No page refresh needed

## 🐛 Common Issues & Fixes

### Issue 1: "SUBSCRIBED" but no notifications received

**Cause:** RLS policy blocking real-time events

**Fix:**
```sql
-- Make sure this policy exists
CREATE POLICY "Enable realtime for own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
```

### Issue 2: "CHANNEL_ERROR" status

**Cause:** Real-time not enabled on table

**Fix:**
1. Supabase Dashboard → Database → Replication
2. Enable real-time for `notifications` table
3. Refresh the tenant page

### Issue 3: Subscription keeps reconnecting

**Cause:** Network issues or Supabase plan limits

**Fix:**
- Check Supabase plan limits (free tier has limits)
- Check network connection
- Try different browser

### Issue 4: Works in one browser but not another

**Cause:** Browser extensions blocking WebSockets

**Fix:**
- Disable ad blockers
- Try incognito mode
- Check browser console for WebSocket errors

## 📋 Quick Checklist

Before testing, verify:

- [ ] Supabase Real-Time is enabled for `notifications` table
- [ ] RLS policy allows SELECT for own notifications
- [ ] Tenant is logged in with correct user ID
- [ ] Tenant is on `/tenant/dashboard/notifications` page
- [ ] Browser console is open to see logs
- [ ] No browser extensions blocking WebSockets

## 🎯 Expected Behavior After Fix

1. **Tenant opens notifications page**
   - Console shows: `🔔 ✅ Successfully subscribed`
   - `isConnected` badge shows green/connected

2. **Owner completes maintenance**
   - Owner console: `🔔 Completion notification result: {success: true}`
   - Tenant console: `🔔 ✅ New notification received in real-time`
   - Tenant page: Toast appears + list updates
   - **NO PAGE REFRESH NEEDED**

3. **Tenant can:**
   - See notification immediately
   - Click to view details
   - Mark as read (updates instantly)
   - Delete (removes instantly)

## 🔧 Alternative: Manual Polling (Fallback)

If real-time doesn't work (e.g., free tier limits), add polling:

```typescript
// In useRealtimeNotifications.ts
useEffect(() => {
  if (!isConnected) {
    // Poll every 10 seconds if real-time fails
    const interval = setInterval(() => {
      loadNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
  }
}, [isConnected]);
```

## 📞 Still Not Working?

Check these in order:

1. **Supabase Dashboard → API Settings**
   - Is Real-time enabled for your project?
   - Check Real-time logs for errors

2. **Browser Network Tab**
   - Look for WebSocket connection
   - Should see `wss://` connection to Supabase
   - Check for 101 Switching Protocols response

3. **Supabase Logs**
   - Dashboard → Logs → Real-time
   - Look for subscription errors

4. **Database Direct Check**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM notifications 
   WHERE user_id = 'ef9e7ff8-f88c-4a67-ba22-4414a9499e62'
   ORDER BY created_at DESC
   LIMIT 5;
   ```
   - Verify notifications exist
   - Check user_id matches

## ✨ Success Indicators

You'll know it's working when:

✅ Console shows `SUBSCRIBED` status
✅ New notifications appear without refresh
✅ Toast notifications pop up automatically
✅ Unread count updates in real-time
✅ Mark as read works instantly
✅ No need to refresh page

---

**Next Step:** Enable Real-Time in Supabase Dashboard and test again!

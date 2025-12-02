# Real-Time Notifications Fix Checklist

## ❌ Current Problem
```
🔔 Subscription closed - will not receive real-time updates
```

Even though you enabled real-time in the database, the subscription still closes.

## ✅ Complete Fix Checklist

Follow these steps **in order**:

### Step 1: Run Complete SQL Fix ⭐ MOST IMPORTANT

1. **Open Supabase Dashboard**
2. **Go to SQL Editor**
3. **Copy and paste ALL commands from `FIX_REALTIME_COMPLETE.sql`**
4. **Click "Run"**

This will:
- ✅ Add notifications to real-time publication
- ✅ Fix RLS policies
- ✅ Grant proper permissions
- ✅ Verify everything is set up correctly

### Step 2: Verify in Database

After running the SQL, check these queries:

**Query 1: Check if notifications is in publication**
```sql
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
```
**Expected:** Should return `notifications`

**Query 2: Check RLS policies**
```sql
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'notifications'
AND cmd = 'SELECT';
```
**Expected:** Should show a SELECT policy for authenticated users

### Step 3: Wait 1-2 Minutes

Supabase needs time to apply real-time changes:
- ⏰ Wait 1-2 minutes after running SQL
- ☕ Get coffee
- 🔄 Then proceed to next step

### Step 4: Clear Browser Cache & Refresh

1. **Close all browser tabs** with your app
2. **Clear cache** (Ctrl+Shift+Delete)
   - Or use Incognito/Private mode
3. **Reopen app**
4. **Login as tenant**
5. **Go to `/tenant/dashboard/notifications`**

### Step 5: Check Console Logs

Open browser console (F12) and look for:

**✅ SUCCESS - Should see:**
```
🔔 Setting up real-time subscription for user: ef9e7ff8-...
🔔 Subscription status changed: SUBSCRIBED
🔔 ✅ Successfully subscribed to notifications for user: ef9e7ff8-...
```

**❌ STILL BROKEN - If you see:**
```
🔔 Subscription status changed: TIMED_OUT
🔔 Subscription status changed: CLOSED
```
→ Go to Step 6 (Advanced Troubleshooting)

### Step 6: Test Real-Time (If Step 5 Succeeded)

**As Tenant:**
- Keep notifications page open
- Keep console visible

**As Owner (different browser/incognito):**
- Complete a maintenance request

**As Tenant (watch console):**
Should see:
```
🔔 ✅ New notification received in real-time: { ... }
```

And on page:
- 🎉 Toast notification appears
- 📝 New item in list
- 🔔 Unread count updates
- ✨ No refresh needed!

---

## 🔧 Advanced Troubleshooting (If Still Not Working)

### Issue 1: RLS Policy Mismatch

Your `user_id` column might reference a different table.

**Check your notifications table structure:**
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
AND column_name = 'user_id';
```

**Then check what it references:**
```sql
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'notifications'
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'user_id';
```

**If `user_id` references `users.id` (not `auth.users.id`):**

Use this RLS policy instead:
```sql
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE user_id = auth.uid()
  )
);
```

**If `user_id` directly references `auth.users.id`:**

Use this simpler policy:
```sql
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
```

### Issue 2: Multiple Conflicting Subscriptions

Check if you have multiple real-time hooks running:

**In browser console, run:**
```javascript
// Check active Supabase channels
console.log(window.supabase?.getChannels());
```

If you see multiple `notifications-realtime-*` channels:
- Close all tabs
- Clear browser cache
- Reopen only one tab

### Issue 3: Supabase Free Tier Limits

Free tier has limits:
- Max 2 concurrent real-time connections
- Max 500 messages/second

**Check in Supabase Dashboard:**
- Settings → Usage
- Look at "Realtime" section

If you're hitting limits, you need to upgrade.

### Issue 4: Network/Firewall Blocking WebSocket

**Check in browser Network tab:**
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "WS" (WebSocket)
4. Look for connection to Supabase

Should see:
- Status: 101 Switching Protocols
- Type: websocket
- URL: wss://[your-project].supabase.co/realtime/v1/websocket

If blocked:
- Check firewall settings
- Try different network
- Disable VPN/proxy

---

## 📊 Diagnostic Commands

Run these in Supabase SQL Editor to diagnose:

```sql
-- 1. Check real-time publication
SELECT * FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- 2. Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';

-- 3. Check all policies
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';

-- 4. Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'notifications';

-- 5. Test notification creation
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  priority
) VALUES (
  'ef9e7ff8-f88c-4a67-ba22-4414a9499e62', -- Your user ID
  '🧪 Manual Test',
  'Testing real-time',
  'system',
  'high'
);
```

---

## ✅ Success Criteria

You'll know it's fixed when:

1. ✅ Console shows `SUBSCRIBED` (no TIMED_OUT or CLOSED)
2. ✅ Test notification appears instantly
3. ✅ Toast notification pops up
4. ✅ No page refresh needed
5. ✅ Works consistently (not just once)

---

## 🆘 If Nothing Works

1. **Export your SQL schema:**
   ```sql
   -- Get notifications table definition
   SELECT 
     'CREATE TABLE ' || tablename || ' (' ||
     string_agg(column_name || ' ' || data_type, ', ') || ');'
   FROM information_schema.columns
   WHERE table_name = 'notifications'
   GROUP BY tablename;
   ```

2. **Share in Discord/Support:**
   - Table structure
   - RLS policies
   - Console error messages
   - Supabase project region

3. **Temporary workaround:**
   Use polling instead of real-time (add to hook):
   ```typescript
   // Poll every 10 seconds as fallback
   useEffect(() => {
     if (!isConnected) {
       const interval = setInterval(loadNotifications, 10000);
       return () => clearInterval(interval);
     }
   }, [isConnected, loadNotifications]);
   ```

---

**Start with Step 1 and work through each step carefully!**

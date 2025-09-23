# Real-Time Messaging Troubleshooting Guide

## Issue: Messages Sent Successfully But Receiver Gets No Events

### **Step 1: Check Supabase Real-Time Status**

1. **Go to your Supabase Dashboard**

   - Navigate to Settings > API
   - Check if "Realtime" is enabled

2. **Run the SQL Check Script**

   ```sql
   -- Copy and paste this in Supabase SQL Editor
   SELECT
       schemaname,
       tablename,
       'Enabled' as status
   FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime'
   AND tablename IN ('messages', 'conversations');
   ```

3. **If tables are NOT enabled, run this:**

   ```sql
   -- Enable real-time for messages table
   ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

   -- Enable real-time for conversations table
   ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
   ```

### **Step 2: Check Browser Console**

1. **Open Developer Tools (F12)**
2. **Look for these logs:**

   - `Setting up debug real-time subscription for user: [USER_ID]`
   - `DEBUG: Subscription status: SUBSCRIBED` (should be SUBSCRIBED)
   - `DEBUG: Message received:` (should appear when message is sent)

3. **If you see errors:**
   - `Failed to subscribe to real-time updates`
   - `Database connection error`
   - `WebSocket connection failed`

### **Step 3: Test Real-Time Connection**

1. **Click "Test Connection" button** in the debug component
2. **Check console for:**
   - `Database connection OK`
   - `Test channel status: SUBSCRIBED`

### **Step 4: Check Network Tab**

1. **Open Network tab in Developer Tools**
2. **Look for WebSocket connections:**
   - Should see `wss://[your-project].supabase.co/realtime/v1/websocket`
   - Status should be 101 (Switching Protocols)

### **Step 5: Check RLS Policies**

Make sure Row Level Security allows real-time subscriptions:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('messages', 'conversations');

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('messages', 'conversations');
```

### **Step 6: Environment Variables**

Check your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Step 7: Common Solutions**

#### **Solution 1: Enable Real-Time in Supabase**

```sql
-- If real-time is not enabled, run this:
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
```

#### **Solution 2: Check RLS Policies**

```sql
-- Allow users to see their own messages
CREATE POLICY "Users can view own messages" ON public.messages
FOR SELECT USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

-- Allow users to insert messages
CREATE POLICY "Users can insert messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
);
```

#### **Solution 3: Restart Supabase Real-Time**

```sql
-- Restart the real-time service
SELECT pg_reload_conf();
```

#### **Solution 4: Check WebSocket Connection**

- Ensure your firewall/proxy allows WebSocket connections
- Check if your network blocks `wss://` connections
- Try from a different network (mobile hotspot)

### **Step 8: Debug Information**

The debug component shows:

- **Green dot**: Connected to real-time
- **Red dot**: Disconnected
- **Events**: Real-time events as they happen
- **Test Connection**: Tests database and real-time connection

### **Step 9: Manual Test**

1. **Open two browser windows**
2. **Both should show green dot** in debug component
3. **Send a message from one window**
4. **Check if "received" event appears** in the other window's debug component

### **Step 10: If Still Not Working**

1. **Check Supabase Status Page**: https://status.supabase.com/
2. **Try different browser** (Chrome, Firefox, Safari)
3. **Clear browser cache** and cookies
4. **Check browser console** for WebSocket errors
5. **Verify Supabase project** is not paused

## Expected Behavior

### **Sender Side:**

- Message appears immediately
- Console shows: `Message sent successfully:`
- Debug shows: `sent` event

### **Receiver Side:**

- Message appears instantly without refresh
- Console shows: `Message received:`
- Debug shows: `received` event
- Toast notification appears

## Quick Fixes

### **Fix 1: Enable Real-Time**

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
```

### **Fix 2: Check RLS**

```sql
-- Temporarily disable RLS for testing
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations DISABLE ROW LEVEL SECURITY;
```

### **Fix 3: Restart Service**

- Go to Supabase Dashboard
- Settings > Database
- Click "Restart" on the database

---

**Note**: The debug component should be removed before production deployment.

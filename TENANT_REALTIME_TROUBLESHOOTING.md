# Tenant Real-Time Debug Offline Issue

## Problem

The Real-time Debug component shows "offline" (red dot) for tenant users but "online" (green dot) for owner users.

## Possible Causes

### 1. **RLS (Row Level Security) Policies**

The most common cause is that tenants don't have proper permissions to subscribe to real-time updates.

**Solution**: Run the RLS fix script:

```sql
-- Copy and paste this in Supabase SQL Editor
-- File: scripts/fix-messages-rls-policies.sql
```

### 2. **Real-Time Not Enabled for Messages Table**

Real-time might not be enabled for the messages table.

**Solution**: Enable real-time:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
```

### 3. **User Authentication Issues**

The tenant user might not be properly authenticated.

**Check**: Look for these console logs:

- `User ID type: string`
- `User ID value: [some-uuid]`
- `Supabase URL: https://your-project.supabase.co`

### 4. **Network/Firewall Issues**

WebSocket connections might be blocked for the tenant.

**Check**: Look for WebSocket errors in browser console.

## Debugging Steps

### Step 1: Check Console Logs

Open browser console on tenant page and look for:

```
Setting up debug real-time subscription for user: [user-id]
User ID type: string
User ID value: [user-id]
DEBUG: Subscription status: SUBSCRIBED
```

If you see `FAILED` or `CLOSED` instead of `SUBSCRIBED`, there's a connection issue.

### Step 2: Test Connection

Click "Test Connection" button in debug component and check console for:

```
Testing real-time connection for user: [user-id]
Database connection OK: [data]
User-specific query OK: [data]
Test channel status: SUBSCRIBED
```

### Step 3: Check RLS Policies

Run this in Supabase SQL Editor:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'messages';
```

### Step 4: Check Real-Time Status

Run this in Supabase SQL Editor:

```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('messages', 'conversations');
```

## Quick Fixes

### Fix 1: Enable Real-Time

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
```

### Fix 2: Fix RLS Policies

```sql
-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own messages" ON public.messages
FOR SELECT USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

CREATE POLICY "Users can view own conversations" ON public.conversations
FOR SELECT USING (
  auth.uid() = ANY(participants)
);
```

### Fix 3: Check User Authentication

Make sure the tenant user is properly logged in and has a valid session.

### Fix 4: Restart Supabase Services

In Supabase Dashboard:

1. Go to Settings > Database
2. Click "Restart" on the database
3. Wait for restart to complete

## Expected Behavior After Fix

### Tenant Console Logs:

```
Setting up debug real-time subscription for user: [tenant-id]
User ID type: string
User ID value: [tenant-id]
DEBUG: Subscription status: SUBSCRIBED
DEBUG: Successfully subscribed to real-time updates
```

### Debug Component:

- Green dot (connected)
- "Test Connection" button works
- Real-time events appear when messages are sent

## Testing

1. **Open two browser windows** (owner and tenant)
2. **Both should show green dots** in debug components
3. **Send a message** from owner to tenant
4. **Check tenant console** for:
   - `DEBUG: Message received:`
   - `Real-time new message received:`
5. **Message should appear instantly** in tenant chat

## If Still Not Working

1. **Check Supabase Status**: https://status.supabase.com/
2. **Try different browser** (Chrome, Firefox, Safari)
3. **Clear browser cache** and cookies
4. **Check network tab** for WebSocket connections
5. **Verify Supabase project** is not paused

## Common Error Messages

### "Failed to subscribe to real-time updates"

- **Cause**: RLS policies or real-time not enabled
- **Solution**: Run the RLS fix script

### "Database connection error"

- **Cause**: Authentication or network issue
- **Solution**: Check user login and network

### "User-specific query error"

- **Cause**: RLS policies blocking access
- **Solution**: Fix RLS policies

---

**Note**: The debug component should be removed before production deployment.


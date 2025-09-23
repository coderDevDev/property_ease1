# Real-Time Messaging Testing Guide

## How to Test Real-Time Messaging

### 1. **Open Two Browser Windows**

- Open Chrome (or any browser) twice
- Or use incognito mode for one window
- Make sure you're logged in as different users (owner and tenant)

### 2. **Navigate to Messages**

- **Owner**: Go to `/owner/dashboard/messages`
- **Tenant**: Go to `/tenant/dashboard/messages`

### 3. **Start a Conversation**

- Click "New Message" on either side
- Select the other user as recipient
- Send a test message

### 4. **Test Real-Time Updates**

- Send a message from one window
- Check if it appears instantly in the other window
- Try sending messages back and forth

### 5. **Debug Information**

- Look for the **Debug Component** in the bottom-right corner
- It shows real-time events as they happen
- Green dot = Connected, Red dot = Disconnected
- Events show "received" and "sent" messages

## Troubleshooting

### **If Messages Don't Appear in Real-Time:**

1. **Check Browser Console**

   - Open Developer Tools (F12)
   - Look for console logs:
     - `Message received:` - Shows incoming messages
     - `Message sent:` - Shows outgoing messages
     - `Adding new message to chat:` - Shows when messages are added to UI

2. **Check Supabase Connection**

   - Look for `Subscription status: SUBSCRIBED` in console
   - If status is not SUBSCRIBED, there's a connection issue

3. **Check Database Permissions**

   - Make sure RLS (Row Level Security) policies allow real-time subscriptions
   - Verify user authentication is working

4. **Check Network**
   - Ensure WebSocket connections are not blocked
   - Check if firewall/proxy is blocking real-time connections

### **Common Issues:**

#### **Issue 1: Messages Only Appear After Refresh**

- **Cause**: Real-time subscription not working
- **Solution**: Check console for subscription errors

#### **Issue 2: Duplicate Messages**

- **Cause**: Message added both via API response and real-time subscription
- **Solution**: Check deduplication logic in ChatInterface

#### **Issue 3: Messages Not Sending**

- **Cause**: API error or validation issue
- **Solution**: Check console for send message errors

## Expected Behavior

### **Sender Side:**

1. Type message and press Enter
2. Message appears immediately in sender's chat
3. Console shows: `Message sent successfully:`
4. Debug component shows "sent" event

### **Receiver Side:**

1. Message appears instantly without refresh
2. Console shows: `Message received:`
3. Debug component shows "received" event
4. Toast notification appears (if not in same conversation)

## Debug Console Commands

```javascript
// Check Supabase connection
console.log('Supabase:', supabase);

// Check current subscriptions
console.log('Active channels:', supabase.getChannels());

// Test real-time connection
supabase.channel('test').subscribe(console.log);
```

## Production Checklist

Before deploying to production:

1. **Remove Debug Component**

   - Delete `components/messages/debug-realtime.tsx`
   - Remove debug imports from message pages
   - Remove debug component usage

2. **Enable Supabase Real-Time**

   - Ensure real-time is enabled in Supabase dashboard
   - Check RLS policies allow real-time subscriptions

3. **Test Performance**

   - Test with multiple users
   - Check memory usage
   - Verify subscription cleanup

4. **Security Review**
   - Ensure RLS policies are correct
   - Verify user authentication
   - Check data privacy

## Supabase Real-Time Setup

If real-time is not working, check:

1. **Supabase Dashboard**

   - Go to Settings > API
   - Ensure "Realtime" is enabled
   - Check if WebSocket URL is accessible

2. **Database Policies**

   ```sql
   -- Enable real-time for messages table
   ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
   ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
   ```

3. **RLS Policies**
   ```sql
   -- Allow users to see their own messages
   CREATE POLICY "Users can view own messages" ON public.messages
   FOR SELECT USING (
     sender_id = auth.uid() OR recipient_id = auth.uid()
   );
   ```

---

**Note**: The debug component should be removed before production deployment.

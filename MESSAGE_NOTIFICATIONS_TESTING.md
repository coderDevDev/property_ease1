# Real-Time Message Notifications Testing Guide

## 🎯 **Overview**

This guide helps you test the real-time message notification system that separates message counts from notification counts in the top navbar.

## 🔧 **Setup Requirements**

### 1. **Enable Real-Time for Messages**

Run this SQL script in your Supabase SQL editor:

```sql
-- Enable real-time for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
```

### 2. **Verify Database Structure**

Ensure your `messages` table has these columns:

- `id` (UUID, Primary Key)
- `conversation_id` (UUID, Foreign Key)
- `sender_id` (UUID, Foreign Key to users)
- `recipient_id` (UUID, Foreign Key to users)
- `content` (TEXT)
- `is_read` (BOOLEAN, default: false)
- `created_at` (TIMESTAMP)

## 🧪 **Testing Steps**

### **Step 1: Test Message Notifications**

1. **Open Two Browser Windows/Tabs**:

   - Tab 1: Owner dashboard (`/owner/dashboard/messages`)
   - Tab 2: Tenant dashboard (`/tenant/dashboard/messages`)

2. **Check Initial State**:

   - Both tabs should show "Live" status (green dot)
   - Message count should be 0 initially
   - Notification count should be separate

3. **Send a Message**:

   - From Owner tab: Send a message to a tenant
   - **Expected Result**:
     - Tenant tab should show message count increase
     - Tenant should see toast notification
     - Message icon should show unread count

4. **Reply to Message**:
   - From Tenant tab: Reply to the message
   - **Expected Result**:
     - Owner tab should show message count increase
     - Owner should see toast notification

### **Step 2: Test Real-Time Updates**

1. **Monitor Console Logs**:

   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for these logs:
     ```
     Messages subscription status: SUBSCRIBED
     New message received: { ... }
     Message notification created successfully
     ```

2. **Test Connection Status**:
   - Both tabs should show "Live" status
   - If showing "Offline", check Supabase connection

### **Step 3: Test Message Count Updates**

1. **Mark Messages as Read**:

   - Click on a conversation
   - **Expected Result**: Message count should decrease

2. **Mark All Messages as Read**:
   - Use the "Mark All as Read" button
   - **Expected Result**: Message count should become 0

## 🔍 **Troubleshooting**

### **Issue: Message Count Not Updating**

**Solutions**:

1. Check if real-time is enabled for messages table
2. Verify RLS policies allow message access
3. Check browser console for errors
4. Ensure both users are logged in

### **Issue: Notifications Not Creating**

**Solutions**:

1. Check if `NotificationsAPI.createMessageNotification` is being called
2. Verify notification table structure
3. Check console for "Message notification created successfully" log

### **Issue: Real-Time Status Shows "Offline"**

**Solutions**:

1. Check Supabase connection
2. Verify real-time is enabled
3. Check browser network tab for WebSocket connections

## 📊 **Expected Behavior**

### **Message Flow**:

1. **User A sends message** → **User B receives notification**
2. **Message count increases** for User B
3. **Toast notification appears** for User B
4. **Real-time updates** work instantly

### **Count Separation**:

- **Message Count** (Blue badge): Unread messages
- **Notification Count** (Red badge): System notifications (announcements, etc.)

### **Real-Time Indicators**:

- **Green dot**: Both message and notification subscriptions active
- **Red dot**: One or both subscriptions offline

## 🎉 **Success Criteria**

✅ **Message notifications work in real-time**
✅ **Message count updates instantly**
✅ **Separate counts for messages vs notifications**
✅ **Toast notifications appear for new messages**
✅ **Real-time status shows "Live"**
✅ **Console shows successful subscription and message creation logs**

## 🚀 **Advanced Testing**

### **Test Multiple Users**:

1. Open 3+ browser tabs with different users
2. Send messages between all users
3. Verify all users receive notifications

### **Test Message Types**:

1. Test direct messages
2. Test maintenance-related messages
3. Test payment-related messages

### **Test Edge Cases**:

1. Send message to offline user
2. Send message with long content
3. Send message with attachments

## 📝 **Notes**

- Message notifications are separate from system notifications
- Real-time works best with stable internet connection
- Console logs help debug any issues
- Both sender and receiver should see appropriate updates


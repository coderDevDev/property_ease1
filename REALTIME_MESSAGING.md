# Real-Time Messaging System

## Overview

The Property Ease messaging system now includes full real-time capabilities powered by Supabase's real-time subscriptions. Messages appear instantly without requiring page refreshes, providing a modern chat experience similar to WhatsApp or Telegram.

## Features

### ✅ **Instant Message Delivery**

- Messages appear immediately when sent
- No page refresh required
- Real-time updates for both sender and recipient

### ✅ **Real-Time Subscriptions**

- **Messages Table**: Subscribes to all message changes for the current user
- **Conversations Table**: Subscribes to conversation updates
- **Bidirectional**: Handles both incoming and outgoing messages

### ✅ **Smart Notifications**

- Toast notifications for new messages from other conversations
- No notifications when actively viewing the same conversation
- Context-aware notification system

### ✅ **Typing Indicators** (Ready for Implementation)

- Typing detection with 1-second timeout
- Visual typing indicator with animated dots
- Ready for real-time typing status sharing

### ✅ **Message Status Indicators**

- Read/Unread status with checkmarks
- Real-time status updates
- Visual feedback for message delivery

### ✅ **Auto-Scroll**

- Automatically scrolls to latest messages
- Smooth scrolling animation
- Maintains scroll position during typing

## Technical Implementation

### Supabase Real-Time Channels

```typescript
// Subscribe to messages received by current user
supabase.channel('messages-realtime').on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'messages',
    filter: `recipient_id=eq.${userId}`
  },
  handleMessageChange
);

// Subscribe to messages sent by current user
supabase.channel('messages-realtime').on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'messages',
    filter: `sender_id=eq.${userId}`
  },
  handleMessageChange
);

// Subscribe to conversation updates
supabase.channel('messages-realtime').on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'conversations',
    filter: `participants=cs.{${userId}}`
  },
  handleConversationChange
);
```

### Real-Time Hook (`useRealtimeMessages`)

- Manages Supabase subscriptions
- Handles message and conversation updates
- Provides callbacks for UI updates
- Automatic cleanup on component unmount

### Chat Interface (`ChatInterface`)

- Integrates with real-time hook
- Shows typing indicators
- Handles message sending and receiving
- Auto-scrolls to new messages

## Database Schema Requirements

### Messages Table

```sql
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  message_type message_type DEFAULT 'direct',
  is_read BOOLEAN DEFAULT FALSE,
  attachments TEXT[] DEFAULT '{}',
  parent_message_id UUID REFERENCES public.messages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Conversations Table

```sql
CREATE TABLE public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  participants UUID[] NOT NULL,
  last_message_id UUID,
  last_message_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Real-Time Events Handled

### Message Events

- **INSERT**: New message received/sent
- **UPDATE**: Message status changes (read/unread)

### Conversation Events

- **INSERT**: New conversation created
- **UPDATE**: Conversation updates (last message, participants)
- **DELETE**: Conversation archived/deleted

## Performance Optimizations

### Efficient Updates

- Only updates relevant conversations
- Avoids unnecessary API calls
- Prevents duplicate message handling

### Smart Filtering

- Filters messages by user ID
- Only processes relevant events
- Reduces network overhead

### Memory Management

- Automatic subscription cleanup
- Proper timeout handling
- Prevents memory leaks

## Usage Examples

### Basic Real-Time Chat

```typescript
// In your component
const { conversations, setConversations } = useState([]);
const { messages, setMessages } = useState([]);

useRealtimeMessages({
  userId: currentUser.id,
  conversations,
  selectedConversationId: selectedConversation?.id,
  onConversationsUpdate: setConversations,
  onMessagesUpdate: setMessages,
  onNewMessage: message => {
    // Handle new message
    console.log('New message:', message);
  }
});
```

### Sending Messages

```typescript
const handleSendMessage = async () => {
  const result = await MessagesAPI.sendMessage(messageData, currentUserId);
  if (result.success) {
    // Message will appear automatically via real-time subscription
    setNewMessage('');
  }
};
```

## Future Enhancements

### Typing Indicators

- Real-time typing status sharing
- Visual typing indicators
- Typing timeout management

### Message Reactions

- Emoji reactions
- Real-time reaction updates
- Reaction counts

### Message Editing

- Edit sent messages
- Real-time edit notifications
- Edit history tracking

### File Sharing

- Real-time file upload progress
- File preview in chat
- Download notifications

## Troubleshooting

### Common Issues

1. **Messages not appearing**: Check Supabase connection and RLS policies
2. **Duplicate messages**: Ensure proper message deduplication logic
3. **Performance issues**: Optimize subscription filters and reduce API calls

### Debug Mode

Enable console logging to see real-time events:

```typescript
console.log('Message change received:', payload);
console.log('Conversation change received:', payload);
```

## Security Considerations

### Row Level Security (RLS)

- Messages are filtered by user ID
- Users can only see their own conversations
- Proper access control for all operations

### Data Privacy

- No sensitive data in real-time payloads
- User information properly sanitized
- Secure message content handling

---

The real-time messaging system provides a modern, responsive chat experience that keeps users engaged and provides instant communication between property owners and tenants.

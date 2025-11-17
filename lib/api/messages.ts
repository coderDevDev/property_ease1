import { supabase } from '@/lib/supabase';
import { NotificationsAPI } from './notifications';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  property_id?: string;
  subject?: string;
  content: string;
  message_type: 'direct' | 'maintenance' | 'payment' | 'general';
  is_read: boolean;
  attachments: string[];
  parent_message_id?: string;
  created_at: string;
  updated_at: string;
  sender: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
  recipient: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
  property?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface Conversation {
  id: string;
  property_id?: string;
  participants: string[];
  last_message_id?: string;
  last_message_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  property?: {
    id: string;
    name: string;
    address: string;
  };
  last_message?: Message;
  participants_data: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  }>;
  unread_count: number;
}

export interface MessageFormData {
  recipient_id: string;
  property_id?: string;
  subject?: string;
  content: string;
  message_type: 'direct' | 'maintenance' | 'payment' | 'general';
  attachments?: string[];
  parent_message_id?: string;
}

export class MessagesAPI {
  // Get all conversations for a user
  static async getConversations(userId: string): Promise<{
    success: boolean;
    data?: Conversation[];
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', [userId])
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Get conversations with all related data separately
      const conversationsWithDetails = await Promise.all(
        (data || []).map(async conversation => {
          // Get property data
          const propertyResult = conversation.property_id
            ? await supabase
                .from('properties')
                .select('id, name, address')
                .eq('id', conversation.property_id)
                .single()
            : { data: null };

          // Get last message data
          const lastMessageResult = conversation.last_message_id
            ? await supabase
                .from('messages')
                .select('id, content, created_at, sender_id')
                .eq('id', conversation.last_message_id)
                .single()
            : { data: null };

          // Get sender data for last message
          const senderResult = lastMessageResult.data?.sender_id
            ? await supabase
                .from('users')
                .select('id, first_name, last_name, avatar_url')
                .eq('id', lastMessageResult.data.sender_id)
                .single()
            : { data: null };

          // Get participants data
          const { data: participantsData } = await supabase
            .from('users')
            .select('id, first_name, last_name, email, avatar_url, role')
            .in('id', conversation.participants);

          // Get unread count
          const { count: unreadCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conversation.id)
            .eq('recipient_id', userId)
            .eq('is_read', false);

          return {
            ...conversation,
            property: propertyResult.data,
            last_message: lastMessageResult.data
              ? {
                  ...lastMessageResult.data,
                  sender: senderResult.data
                }
              : null,
            participants_data: participantsData || [],
            unread_count: unreadCount || 0
          };
        })
      );

      return { success: true, data: conversationsWithDetails };
    } catch (error) {
      console.error('Get conversations error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get conversations'
      };
    }
  }

  // Get messages for a specific conversation
  static async getConversationMessages(
    conversationId: string,
    userId: string
  ): Promise<{
    success: boolean;
    data?: Message[];
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', userId)
        .eq('is_read', false);

      // Get sender and recipient data separately
      const messagesWithDetails = await Promise.all(
        (data || []).map(async message => {
          const [senderResult, recipientResult, propertyResult] =
            await Promise.all([
              supabase
                .from('users')
                .select('id, first_name, last_name, email, avatar_url, role')
                .eq('id', message.sender_id)
                .single(),
              supabase
                .from('users')
                .select('id, first_name, last_name, email, avatar_url, role')
                .eq('id', message.recipient_id)
                .single(),
              message.property_id
                ? supabase
                    .from('properties')
                    .select('id, name, address')
                    .eq('id', message.property_id)
                    .single()
                : Promise.resolve({ data: null })
            ]);

          return {
            ...message,
            sender: senderResult.data,
            recipient: recipientResult.data,
            property: propertyResult.data
          };
        })
      );

      return { success: true, data: messagesWithDetails };
    } catch (error) {
      console.error('Get conversation messages error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get messages'
      };
    }
  }

  // Create a new conversation
  static async createConversation(
    participants: string[],
    propertyId?: string
  ): Promise<{
    success: boolean;
    data?: Conversation;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participants,
          property_id: propertyId
        })
        .select(
          `
          *,
          property:properties(id, name, address)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create conversation error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create conversation'
      };
    }
  }

  // Send a message - OPTIMIZED VERSION
  static async sendMessage(
    messageData: MessageFormData,
    senderId: string
  ): Promise<{
    success: boolean;
    data?: Message;
    message?: string;
  }> {
    try {
      // Check if conversation exists or create it - SINGLE QUERY
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [senderId, messageData.recipient_id])
        .eq('is_active', true)
        .maybeSingle();

      let conversationId: string;

      if (existingConversation) {
        conversationId = existingConversation.id;
      } else {
        // Create new conversation
        const { data: newConv, error: convError } = await supabase
          .from('conversations')
          .insert({
            participants: [senderId, messageData.recipient_id],
            property_id: messageData.property_id
          })
          .select('id')
          .single();

        if (convError || !newConv) {
          throw new Error('Failed to create conversation');
        }
        conversationId = newConv.id;
      }

      // Send the message and update conversation in ONE transaction
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: messageData.recipient_id,
          property_id: messageData.property_id,
          subject: messageData.subject,
          content: messageData.content,
          message_type: messageData.message_type,
          attachments: messageData.attachments || [],
          parent_message_id: messageData.parent_message_id
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update conversation's last message (fire and forget - don't wait)
      supabase
        .from('conversations')
        .update({
          last_message_id: data.id,
          last_message_at: data.created_at
        })
        .eq('id', conversationId)
        .then();

      // Create notification asynchronously (fire and forget)
      // Fetch recipient's role to generate correct action URL
      supabase
        .from('users')
        .select('role')
        .eq('id', data.recipient_id)
        .single()
        .then(({ data: recipientData }) => {
          if (recipientData) {
            NotificationsAPI.createMessageNotification(
              data.id,
              'New Message',
              data.content.substring(0, 100),
              data.recipient_id,
              recipientData.role as 'owner' | 'tenant'
            );
          }
        });

      // Return immediately without fetching extra data
      // The UI already has this data from context
      return { success: true, data };
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  // Get available recipients for a user
  static async getAvailableRecipients(
    userId: string,
    userRole: string
  ): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      avatar_url?: string;
      property?: {
        id: string;
        name: string;
      };
    }>;
    message?: string;
  }> {
    try {
      let query = supabase
        .from('users')
        .select('id, first_name, last_name, email, avatar_url, role')
        .neq('id', userId)
        .eq('is_active', true);

      if (userRole === 'owner') {
        // Owners can message tenants from their properties
        const { data: ownerProperties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', userId);

        if (ownerProperties && ownerProperties.length > 0) {
          const propertyIds = ownerProperties.map(p => p.id);
          const { data: tenants } = await supabase
            .from('tenants')
            .select('user_id, property_id')
            .in('property_id', propertyIds);

          // Get user and property data separately
          const recipients = await Promise.all(
            (tenants || []).map(async tenant => {
              const [userResult, propertyResult] = await Promise.all([
                supabase
                  .from('users')
                  .select('id, first_name, last_name, email, avatar_url, role')
                  .eq('id', tenant.user_id)
                  .single(),
                supabase
                  .from('properties')
                  .select('id, name')
                  .eq('id', tenant.property_id)
                  .single()
              ]);

              return {
                id: userResult.data?.id,
                name: `${userResult.data?.first_name} ${userResult.data?.last_name}`,
                email: userResult.data?.email,
                role: userResult.data?.role,
                avatar_url: userResult.data?.avatar_url,
                property: {
                  id: propertyResult.data?.id,
                  name: propertyResult.data?.name
                }
              };
            })
          );

          return { success: true, data: recipients };
        }
      } else if (userRole === 'tenant') {
        // Tenants can message their property owner - OPTIMIZED
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select(`
            property_id,
            properties!inner (
              id,
              name,
              owner_id,
              users!properties_owner_id_fkey (
                id,
                first_name,
                last_name,
                email,
                avatar_url,
                role
              )
            )
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .limit(1)
          .maybeSingle();

        if (tenantError) {
          console.error('Tenant query error:', tenantError);
          return { success: true, data: [] };
        }

        if (tenantData && tenantData.properties) {
          const property = tenantData.properties as any;
          const owner = property.users;

          if (owner) {
            const recipients = [
              {
                id: owner.id,
                name: `${owner.first_name} ${owner.last_name}`,
                email: owner.email,
                role: owner.role || 'owner',
                avatar_url: owner.avatar_url,
                property: {
                  id: property.id,
                  name: property.name
                }
              }
            ];

            return { success: true, data: recipients };
          }
        }
      }

      return { success: true, data: [] };
    } catch (error) {
      console.error('Get available recipients error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get recipients'
      };
    }
  }

  // Mark message as read
  static async markMessageAsRead(messageId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Mark message as read error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark message as read'
      };
    }
  }

  // Mark all messages as read for a user
  static async markAllMessagesAsRead(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Mark all messages as read error:', error);
      return {
        success: false,
        message: 'Failed to mark all messages as read'
      };
    }
  }

  // Get unread messages count for a user
  static async getUnreadMessagesCount(userId: string): Promise<{
    success: boolean;
    data?: { count: number };
    message?: string;
  }> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: { count: count || 0 } };
    } catch (error) {
      console.error('Get unread messages count error:', error);
      return {
        success: false,
        message: 'Failed to get unread messages count'
      };
    }
  }

  // Get recent messages for a user (for navbar display) - grouped by conversation
  static async getRecentMessages(
    userId: string,
    limit: number = 5
  ): Promise<{
    success: boolean;
    data?: Message[];
    message?: string;
  }> {
    try {
      // Get conversations for the user
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select(`
          id,
          participants,
          last_message_id,
          last_message_at
        `)
        .contains('participants', [userId])
        .eq('is_active', true)
        .order('last_message_at', { ascending: false })
        .limit(limit);

      if (conversationsError) {
        throw new Error(conversationsError.message);
      }

      if (!conversations || conversations.length === 0) {
        return { success: true, data: [] };
      }

      // Get the latest message for each conversation
      const conversationIds = conversations.map(c => c.id);
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(id, first_name, last_name, email, avatar_url, role),
          recipient:users!messages_recipient_id_fkey(id, first_name, last_name, email, avatar_url, role),
          property:properties(id, name, address)
        `
        )
        .in('conversation_id', conversationIds)
        .order('created_at', { ascending: false });

      if (messagesError) {
        throw new Error(messagesError.message);
      }

      // Group messages by conversation and get the latest one for each
      const latestMessagesByConversation = new Map();
      
      if (messages) {
        messages.forEach(message => {
          const conversationId = message.conversation_id;
          if (!latestMessagesByConversation.has(conversationId)) {
            latestMessagesByConversation.set(conversationId, message);
          }
        });
      }

      // Convert map to array and sort by creation time
      const latestMessages = Array.from(latestMessagesByConversation.values())
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);

      return { success: true, data: latestMessages };
    } catch (error) {
      console.error('Get recent messages error:', error);
      return {
        success: false,
        message: 'Failed to get recent messages'
      };
    }
  }

  // Delete a message
  static async deleteMessage(messageId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Delete message error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete message'
      };
    }
  }

  // Archive a conversation
  static async archiveConversation(conversationId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ is_active: false })
        .eq('id', conversationId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Archive conversation error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to archive conversation'
      };
    }
  }

  // Get message statistics
  static async getMessageStats(userId: string): Promise<{
    success: boolean;
    data?: {
      total_conversations: number;
      unread_messages: number;
      total_messages: number;
      recent_activity: number;
    };
    message?: string;
  }> {
    try {
      const [conversationsResult, unreadResult, totalResult] =
        await Promise.all([
          // Total conversations
          supabase
            .from('conversations')
            .select('*', { count: 'exact', head: true })
            .contains('participants', [userId])
            .eq('is_active', true),

          // Unread messages
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', userId)
            .eq('is_read', false),

          // Total messages
          supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        ]);

      const stats = {
        total_conversations: conversationsResult.count || 0,
        unread_messages: unreadResult.count || 0,
        total_messages: totalResult.count || 0,
        recent_activity: 0 // This could be calculated based on messages in last 7 days
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get message stats error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get message stats'
      };
    }
  }

  // Subscribe to real-time message updates
  static subscribeToMessages(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participants=cs.{${userId}}`
        },
        callback
      )
      .subscribe();
  }

  // Subscribe to conversation updates
  static subscribeToConversations(
    userId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participants=cs.{${userId}}`
        },
        callback
      )
      .subscribe();
  }
}

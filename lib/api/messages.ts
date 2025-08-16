import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];
type MessageInsert = Database['public']['Tables']['messages']['Insert'];
type MessageUpdate = Database['public']['Tables']['messages']['Update'];
type Conversation = Database['public']['Tables']['conversations']['Row'];
type ConversationInsert =
  Database['public']['Tables']['conversations']['Insert'];

export class MessagesAPI {
  static async getConversations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          last_message:messages(*),
          property:properties(*)
        `
        )
        .contains('participants', [userId])
        .eq('is_active', true)
        .order('last_message_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get conversations error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch conversations',
        data: []
      };
    }
  }

  static async getConversation(id: string) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(
          `
          *,
          property:properties(*)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get conversation error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch conversation',
        data: null
      };
    }
  }

  static async createConversation(
    conversation: Omit<ConversationInsert, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([conversation])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Conversation created successfully',
        data
      };
    } catch (error) {
      console.error('Create conversation error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create conversation',
        data: null
      };
    }
  }

  static async getMessages(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:users!sender_id(*),
          recipient:users!recipient_id(*)
        `
        )
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data?.reverse() || [] };
    } catch (error) {
      console.error('Get messages error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch messages',
        data: []
      };
    }
  }

  static async sendMessage(
    message: Omit<MessageInsert, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([message])
        .select(
          `
          *,
          sender:users!sender_id(*),
          recipient:users!recipient_id(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Send notification to recipient
      if (data) {
        await this.notifyRecipient(data);
      }

      return {
        success: true,
        message: 'Message sent successfully',
        data
      };
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to send message',
        data: null
      };
    }
  }

  static async markMessageAsRead(messageId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Message marked as read',
        data
      };
    } catch (error) {
      console.error('Mark message as read error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark message as read',
        data: null
      };
    }
  }

  static async markConversationAsRead(conversationId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Conversation marked as read'
      };
    } catch (error) {
      console.error('Mark conversation as read error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark conversation as read'
      };
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id')
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data?.length || 0 };
    } catch (error) {
      console.error('Get unread count error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get unread count',
        data: 0
      };
    }
  }

  static async findOrCreateConversation(
    participants: string[],
    propertyId?: string
  ) {
    try {
      // Try to find existing conversation
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .contains('participants', participants)
        .eq('property_id', propertyId || null)
        .eq('is_active', true)
        .single();

      if (existingConversation) {
        return { success: true, data: existingConversation };
      }

      // Create new conversation
      const { data: newConversation, error } = await supabase
        .from('conversations')
        .insert([
          {
            participants,
            property_id: propertyId,
            is_active: true
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: newConversation
      };
    } catch (error) {
      console.error('Find or create conversation error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to find or create conversation',
        data: null
      };
    }
  }

  static async searchMessages(
    query: string,
    conversationId?: string,
    userId?: string
  ) {
    try {
      let dbQuery = supabase
        .from('messages')
        .select(
          `
          *,
          sender:users!sender_id(*),
          recipient:users!recipient_id(*),
          conversation:conversations(*)
        `
        )
        .textSearch('content', query)
        .order('created_at', { ascending: false })
        .limit(20);

      if (conversationId) {
        dbQuery = dbQuery.eq('conversation_id', conversationId);
      }

      if (userId) {
        dbQuery = dbQuery.or(
          `sender_id.eq.${userId},recipient_id.eq.${userId}`
        );
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Search messages error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to search messages',
        data: []
      };
    }
  }

  private static async notifyRecipient(message: any) {
    try {
      // Create notification for recipient
      await supabase.from('notifications').insert({
        user_id: message.recipient_id,
        title: 'New Message',
        message: `You have a new message from ${
          message.sender?.first_name || 'someone'
        }`,
        type: 'system',
        priority: 'medium',
        action_url: `/dashboard/messages/${message.conversation_id}`,
        data: {
          message_id: message.id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id
        }
      });
    } catch (error) {
      console.error('Failed to notify recipient:', error);
    }
  }
}







'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MessagesAPI } from '@/lib/api/messages';

interface UseRealtimeMessagesProps {
  userId: string;
  channelName?: string; // Optional unique channel name
  onNewMessage?: (message: any) => void;
  onMessageUpdate?: (message: any) => void;
}

export function useRealtimeMessages({
  userId,
  channelName,
  onNewMessage,
  onMessageUpdate
}: UseRealtimeMessagesProps) {
  console.log('🎯 useRealtimeMessages HOOK CALLED with userId:', userId);
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  // Load initial unread count
  const loadUnreadCount = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await MessagesAPI.getUnreadMessagesCount(userId);
      if (result.success) {
        setUnreadCount(result.data?.count || 0);
      }
    } catch (error) {
      console.error('Failed to load unread messages count:', error);
    }
  }, [userId]);

  // Set up real-time subscription for messages
  useEffect(() => {
    console.log('🔄 useRealtimeMessages useEffect running, userId:', userId);
    
    if (!userId) {
      console.warn('⚠️ No userId provided, skipping subscription');
      return;
    }

    // Load initial count ONCE
    const loadInitialCount = async () => {
      try {
        const result = await MessagesAPI.getUnreadMessagesCount(userId);
        if (result.success) {
          setUnreadCount(result.data?.count || 0);
          console.log('✅ Initial unread count loaded:', result.data?.count);
        }
      } catch (error) {
        console.error('Failed to load unread messages count:', error);
      }
    };

    loadInitialCount();

    // 🔥 REAL-TIME: Subscribe to messages for this user
    const uniqueChannelName = channelName || `messages-${userId}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔌 Setting up real-time subscription:', uniqueChannelName);
    
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        payload => {
          console.log('🔥 Real-time: New message received!', payload);
          const newMessage = payload.new;

          // Only increment if message is unread
          if (!newMessage.is_read) {
            setUnreadCount(prev => {
              const newCount = prev + 1;
              console.log('📬 Unread count updated:', prev, '->', newCount);
              return newCount;
            });
          } else {
            console.log('✅ Message already read, not incrementing count');
          }

          if (onNewMessage) {
            onNewMessage(newMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        payload => {
          console.log('🔄 Real-time: Message updated!', payload);
          const updatedMessage = payload.new;

          // If message was marked as read, decrease unread count
          if (
            payload.old.is_read !== payload.new.is_read &&
            payload.new.is_read
          ) {
            setUnreadCount(prev => {
              const newCount = Math.max(0, prev - 1);
              console.log('📭 Message marked as read, count:', prev, '->', newCount);
              return newCount;
            });
          }

          if (onMessageUpdate) {
            onMessageUpdate(updatedMessage);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Messages subscription status:', status);
        console.log('📡 Status type:', typeof status);
        console.log('📡 Is SUBSCRIBED?', status === 'SUBSCRIBED');
        console.log('📡 Exact value:', JSON.stringify(status));
        
        if (err) {
          console.error('❌ Subscription error:', err);
        }
        
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time messages connected!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - check Supabase Realtime settings');
        } else if (status === 'TIMED_OUT') {
          console.error('❌ Subscription timed out');
        } else if (status === 'CLOSED') {
          console.warn('⚠️ Subscription closed');
        } else {
          console.warn('⚠️ Unknown status:', status);
        }
      });

    return () => {
      console.log('🔌 Cleaning up messages subscription');
      supabase.removeChannel(channel);
    };
  }, [userId]); // ⚠️ FIXED: Only depend on userId, not callbacks

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const result = await MessagesAPI.markMessageAsRead(messageId);
      if (result.success) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  }, []);

  // Mark all messages as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      console.log('📭 Marking all messages as read...');
      const result = await MessagesAPI.markAllMessagesAsRead(userId);
      if (result.success) {
        setUnreadCount(0);
        console.log('✅ All messages marked as read, count set to 0');
        console.log('📡 Subscription still connected:', isConnected);
      }
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  }, [userId, isConnected]);

  return {
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount: loadUnreadCount
  };
}

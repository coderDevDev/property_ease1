'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { MessagesAPI } from '@/lib/api/messages';

interface UseRealtimeMessagesProps {
  userId: string;
  onNewMessage?: (message: any) => void;
  onMessageUpdate?: (message: any) => void;
}

export function useRealtimeMessages({
  userId,
  onNewMessage,
  onMessageUpdate
}: UseRealtimeMessagesProps) {
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
    if (!userId) return;

    loadUnreadCount();

    // Subscribe to messages for this user
    const channel = supabase
      .channel(`messages-realtime-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${userId}`
        },
        payload => {
          console.log('New message received:', payload);
          const newMessage = payload.new;

          setUnreadCount(prev => prev + 1);

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
          console.log('Message updated:', payload);
          const updatedMessage = payload.new;

          // If message was marked as read, decrease unread count
          if (
            payload.old.is_read !== payload.new.is_read &&
            payload.new.is_read
          ) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }

          if (onMessageUpdate) {
            onMessageUpdate(updatedMessage);
          }
        }
      )
      .subscribe(status => {
        console.log('Messages subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, loadUnreadCount, onNewMessage, onMessageUpdate]);

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
      const result = await MessagesAPI.markAllMessagesAsRead(userId);
      if (result.success) {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all messages as read:', error);
    }
  }, [userId]);

  return {
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount: loadUnreadCount
  };
}

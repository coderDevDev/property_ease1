'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { MessagesAPI } from '@/lib/api/messages';

// Global subscription manager to prevent duplicate subscriptions
const globalSubscriptions = new Map<string, any>();
const globalConnectionStatus = new Map<string, boolean>();
const globalCallbacks = new Map<string, Set<{onNewMessage?: (msg: any) => void, onMessageUpdate?: (msg: any) => void}>>();
const globalCountUpdaters = new Map<string, Set<(updater: (prev: number) => number) => void>>();

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
  const [isLoading, setIsLoading] = useState(true);
  const [unreadSenders, setUnreadSenders] = useState<Set<string>>(new Set());
  const subscriptionRef = useRef<any>(null);
  const isSubscribingRef = useRef(false);
  const prevUserIdRef = useRef<string>();
  
  // Track userId changes
  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      console.log('🔄 userId CHANGED from', prevUserIdRef.current, 'to', userId);
      prevUserIdRef.current = userId;
    }
  }, [userId]);

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
    console.log('🔍 isSubscribingRef.current:', isSubscribingRef.current);
    console.log('🔍 subscriptionRef.current:', subscriptionRef.current);
    
    if (!userId) {
      console.warn('⚠️ No userId provided, skipping subscription');
      return;
    }
    
    // Load initial unread conversations (unique senders)
    const loadInitialCount = async () => {
      try {
        setIsLoading(true);
        // Get all unread messages to count unique senders
        const { data: unreadMessages, error } = await supabase
          .from('messages')
          .select('sender_id')
          .eq('recipient_id', userId)
          .eq('is_read', false);
        
        if (!error && unreadMessages) {
          // Count unique senders
          const uniqueSenders = new Set(unreadMessages.map(m => m.sender_id));
          setUnreadSenders(uniqueSenders);
          setUnreadCount(uniqueSenders.size);
        }
      } catch (error) {
        console.error('Failed to load unread conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialCount();
    
    // Register callbacks for this component instance
    if (!globalCallbacks.has(userId)) {
      globalCallbacks.set(userId, new Set());
    }
    const callbackSet = globalCallbacks.get(userId)!;
    const componentCallbacks = { onNewMessage, onMessageUpdate };
    callbackSet.add(componentCallbacks);
    
    // Register count updater for this component instance
    if (!globalCountUpdaters.has(userId)) {
      globalCountUpdaters.set(userId, new Set());
    }
    const countUpdaterSet = globalCountUpdaters.get(userId)!;
    countUpdaterSet.add(setUnreadCount);

    // Check if there's already a global subscription for this user
    const globalKey = `messages-${userId}`;
    
    if (globalSubscriptions.has(globalKey)) {
      console.log('✅ Using existing global subscription for:', userId);
      subscriptionRef.current = globalSubscriptions.get(globalKey);
      const isGloballyConnected = globalConnectionStatus.get(globalKey) || false;
      setIsConnected(isGloballyConnected);
      console.log('📡 Global subscription status:', isGloballyConnected);
      return;
    }
    
    // Prevent multiple simultaneous subscriptions
    if (isSubscribingRef.current && subscriptionRef.current) {
      console.warn('⚠️ Already subscribed, skipping...');
      return;
    }
    
    console.log('✅ Starting new subscription...');
    isSubscribingRef.current = true;

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

          // Only increment if message is unread and from a NEW sender
          if (!newMessage.is_read) {
            setUnreadSenders(prev => {
              const newSenders = new Set(prev);
              const hadSender = newSenders.has(newMessage.sender_id);
              newSenders.add(newMessage.sender_id);
              
              // Only increment count if this is a NEW sender
              if (!hadSender) {
                // Update count for ALL instances
                const countUpdaters = globalCountUpdaters.get(globalKey);
                if (countUpdaters) {
                  countUpdaters.forEach(updater => {
                    updater(prev => prev + 1);
                  });
                }
              }
              
              return newSenders;
            });
          } else {
            console.log('✅ Message already read, not incrementing count');
          }

          // Call onNewMessage callbacks for ALL instances using this subscription
          const callbacks = globalCallbacks.get(userId);
          if (callbacks) {
            callbacks.forEach(callback => {
              if (callback.onNewMessage) {
                callback.onNewMessage(newMessage);
              }
            });
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

          // If message was marked as read, check if sender has any more unread messages
          if (
            payload.old.is_read !== payload.new.is_read &&
            payload.new.is_read
          ) {
            // Check if this sender has any other unread messages
            const checkSenderUnread = async () => {
              const { data, error } = await supabase
                .from('messages')
                .select('id')
                .eq('recipient_id', userId)
                .eq('sender_id', updatedMessage.sender_id)
                .eq('is_read', false)
                .limit(1);
              
              // If no more unread messages from this sender, remove from set
              if (!error && data && data.length === 0) {
                setUnreadSenders(prev => {
                  const newSenders = new Set(prev);
                  const hadSender = newSenders.has(updatedMessage.sender_id);
                  newSenders.delete(updatedMessage.sender_id);
                  
                  // Only decrement if sender was in the set
                  if (hadSender) {
                    // Update count for ALL instances
                    const countUpdaters = globalCountUpdaters.get(globalKey);
                    if (countUpdaters) {
                      countUpdaters.forEach(updater => {
                        updater(prev => Math.max(0, prev - 1));
                      });
                    }
                  }
                  
                  return newSenders;
                });
              }
            };
            
            checkSenderUnread();
          }

          // Call onMessageUpdate callbacks for ALL instances using this subscription
          const callbacks = globalCallbacks.get(userId);
          if (callbacks) {
            callbacks.forEach(callback => {
              if (callback.onMessageUpdate) {
                callback.onMessageUpdate(updatedMessage);
              }
            });
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
        
        const connected = status === 'SUBSCRIBED';
        setIsConnected(connected);
        globalConnectionStatus.set(globalKey, connected);
        
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

    // Store subscription ref
    subscriptionRef.current = channel;
    globalSubscriptions.set(globalKey, channel);
    console.log('💾 Stored global subscription for:', globalKey);

    return () => {
      console.log('🔌 Cleaning up messages subscription for userId:', userId);
      console.log('🔍 Cleanup - isSubscribingRef:', isSubscribingRef.current);
      console.log('🔍 Cleanup - subscriptionRef:', subscriptionRef.current);
      
      // DON'T clean up global subscriptions unless component is truly unmounting
      // Only clean up if this is the last instance using this subscription
      console.log('⚠️ Cleanup called, but keeping global subscription alive');
      // isSubscribingRef.current = false;
      // The subscription stays in globalSubscriptions for reuse
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
    isLoading,
    markAsRead,
    markAllAsRead,
    refreshUnreadCount: loadUnreadCount
  };
}

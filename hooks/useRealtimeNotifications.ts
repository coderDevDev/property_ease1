'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { NotificationsAPI, type Notification } from '@/lib/api/notifications';

interface UseRealtimeNotificationsProps {
  userId: string;
  onNewNotification?: (notification: Notification) => void;
  onNotificationUpdate?: (notification: Notification) => void;
  onNotificationDelete?: (notificationId: string) => void;
}

export function useRealtimeNotifications({
  userId,
  onNewNotification,
  onNotificationUpdate,
  onNotificationDelete
}: UseRealtimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
    urgent: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const [notificationsResult, statsResult] = await Promise.all([
        NotificationsAPI.getUserNotifications(userId),
        NotificationsAPI.getNotificationStats(userId)
      ]);

      if (notificationsResult.success) {
        setNotifications(notificationsResult.data || []);
      }

      if (statsResult.success && statsResult.data) {
        setStats({
          total: statsResult.data.total_notifications,
          unread: statsResult.data.unread_notifications,
          urgent: statsResult.data.urgent_notifications
        });
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    // Load initial notifications ONCE
    const loadInitialNotifications = async () => {
      try {
        setIsLoading(true);
        const [notificationsResult, statsResult] = await Promise.all([
          NotificationsAPI.getUserNotifications(userId),
          NotificationsAPI.getNotificationStats(userId)
        ]);

        if (notificationsResult.success) {
          setNotifications(notificationsResult.data || []);
        }

        if (statsResult.success && statsResult.data) {
          setStats({
            total: statsResult.data.total_notifications,
            unread: statsResult.data.unread_notifications,
            urgent: statsResult.data.urgent_notifications
          });
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialNotifications();

    // Subscribe to notifications for this user
    console.log('🔔 Setting up real-time subscription for user:', userId);
    
    // Use unique channel name like messages (prevents conflicts)
    const uniqueChannelName = `notifications-${userId}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('🔌 Channel name:', uniqueChannelName);
    
    const channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        payload => {
          console.log('🔔 ✅ New notification received in real-time:', payload);
          const newNotification = payload.new as Notification;

          setNotifications(prev => [newNotification, ...prev]);
          setStats(prev => ({
            ...prev,
            total: prev.total + 1,
            unread: prev.unread + 1,
            urgent:
              newNotification.priority === 'high'
                ? prev.urgent + 1
                : prev.urgent
          }));

          if (onNewNotification) {
            onNewNotification(newNotification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        payload => {
          console.log('Notification updated:', payload);
          const updatedNotification = payload.new as Notification;

          setNotifications(prev =>
            prev.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );

          // Update stats based on read status change
          if (payload.old.is_read !== payload.new.is_read) {
            setStats(prev => ({
              ...prev,
              unread: payload.new.is_read ? prev.unread - 1 : prev.unread + 1
            }));
          }

          if (onNotificationUpdate) {
            onNotificationUpdate(updatedNotification);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        payload => {
          console.log('Notification deleted:', payload);
          const deletedId = payload.old.id;

          setNotifications(prev => prev.filter(n => n.id !== deletedId));
          setStats(prev => ({
            ...prev,
            total: prev.total - 1
          }));

          if (onNotificationDelete) {
            onNotificationDelete(deletedId);
          }
        }
      )
      .subscribe((status, err) => {
        console.log('🔔 Subscription status changed:', status);
        console.log('🔔 Status type:', typeof status);
        console.log('🔔 Is SUBSCRIBED?', status === 'SUBSCRIBED');
        console.log('🔔 Exact value:', JSON.stringify(status));
        
        if (err) {
          console.error('🔔 ❌ Subscription error:', err);
        }
        
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'SUBSCRIBED') {
          console.log('🔔 ✅ Successfully subscribed to notifications for user:', userId);
          setReconnectAttempts(0); // Reset on successful connection
        } else if (status === 'CHANNEL_ERROR') {
          console.error('🔔 ❌ Channel error - real-time notifications may not work');
          console.error('🔔 💡 Fix: Enable RLS on notifications table');
          console.error('🔔 💡 Run: ENABLE_RLS_FOR_REALTIME.sql');
        } else if (status === 'TIMED_OUT') {
          console.error('🔔 ❌ Subscription timed out');
          console.error('🔔 💡 Fix: Check RLS policies allow SELECT on notifications table');
        } else if (status === 'CLOSED') {
          console.warn('🔔 ⚠️ Subscription closed - will not receive real-time updates');
          console.error('🔔 💡 Most common cause: RLS is disabled on notifications table');
          console.error('🔔 💡 Fix: Run ENABLE_RLS_FOR_REALTIME.sql');
        }
      });

    return () => {
      console.log('🔔 Cleaning up real-time subscription for user:', userId);
      supabase.removeChannel(channel);
    };
  }, [userId]); // ⚠️ FIXED: Only depend on userId, not callbacks

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const result = await NotificationsAPI.markAsRead(notificationId);
      if (result.success) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
        );
        setStats(prev => ({
          ...prev,
          unread: Math.max(0, prev.unread - 1)
        }));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      const result = await NotificationsAPI.markAllAsRead(userId);
      if (result.success) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setStats(prev => ({
          ...prev,
          unread: 0
        }));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [userId]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const result = await NotificationsAPI.deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setStats(prev => ({
          ...prev,
          total: Math.max(0, prev.total - 1)
        }));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  return {
    notifications,
    stats,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications: loadNotifications
  };
}

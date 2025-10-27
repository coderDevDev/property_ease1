'use client';

import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type:
    | 'payment'
    | 'maintenance'
    | 'lease'
    | 'system'
    | 'announcement'
    | 'reminder';
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
  action_url?: string;
  data?: any;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationStats {
  total_notifications: number;
  unread_notifications: number;
  urgent_notifications: number;
  recent_notifications: number;
}

export class NotificationsAPI {
  // Get notifications for a user
  static async getUserNotifications(userId: string): Promise<{
    success: boolean;
    data?: Notification[];
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        // Check for connection errors
        if (error.message.includes('upstream connect error') || 
            error.message.includes('connection') ||
            error.message.includes('Failed to fetch')) {
          console.warn('Database connection issue, returning empty notifications');
          return { 
            success: true, 
            data: [], 
            message: 'Connection issue - showing cached data' 
          };
        }
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get user notifications error:', error);
      // Return empty array instead of failing completely
      return {
        success: true,
        data: [],
        message: 'Unable to load notifications'
      };
    }
  }

  // Get notification statistics
  static async getNotificationStats(userId: string): Promise<{
    success: boolean;
    data?: NotificationStats;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('is_read, priority, created_at')
        .eq('user_id', userId);

      if (error) {
        // Check for connection errors
        if (error.message.includes('upstream connect error') || 
            error.message.includes('connection') ||
            error.message.includes('Failed to fetch')) {
          console.warn('Database connection issue, returning zero stats');
          return { 
            success: true, 
            data: {
              total_notifications: 0,
              unread_notifications: 0,
              urgent_notifications: 0,
              recent_notifications: 0
            },
            message: 'Connection issue' 
          };
        }
        throw new Error(error.message);
      }

      const notifications = data || [];
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: NotificationStats = {
        total_notifications: notifications.length,
        unread_notifications: notifications.filter(n => !n.is_read).length,
        urgent_notifications: notifications.filter(n => n.priority === 'high')
          .length,
        recent_notifications: notifications.filter(
          n => new Date(n.created_at) > oneWeekAgo
        ).length
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get notification stats error:', error);
      // Return zero stats instead of failing
      return {
        success: true,
        data: {
          total_notifications: 0,
          unread_notifications: 0,
          urgent_notifications: 0,
          recent_notifications: 0
        },
        message: 'Unable to load notification statistics'
      };
    }
  }

  // Create a new notification
  static async createNotification(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type: Notification['type'];
    priority?: Notification['priority'];
    action_url?: string;
    data?: any;
    expires_at?: string;
  }): Promise<{
    success: boolean;
    data?: Notification;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notificationData.user_id,
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          priority: notificationData.priority || 'medium',
          action_url: notificationData.action_url,
          data: notificationData.data,
          expires_at: notificationData.expires_at
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create notification error:', error);
      return {
        success: false,
        message: 'Failed to create notification'
      };
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return {
        success: false,
        message: 'Failed to mark notification as read'
      };
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return {
        success: false,
        message: 'Failed to mark all notifications as read'
      };
    }
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
    } catch (error) {
      console.error('Delete notification error:', error);
      return {
        success: false,
        message: 'Failed to delete notification'
      };
    }
  }

  // Create notification for announcement
  static async createAnnouncementNotification(
    announcementId: string,
    announcementTitle: string,
    propertyName: string,
    targetUserIds: string[]
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Get user roles to determine correct action URLs
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, role')
        .in('id', targetUserIds);

      if (usersError) {
        console.error('Error fetching user roles:', usersError);
        throw usersError;
      }

      const notifications = targetUserIds.map(userId => {
        const user = users?.find(u => u.id === userId);
        const actionUrl =
          user?.role === 'owner'
            ? `/owner/dashboard/announcements/${announcementId}`
            : `/tenant/dashboard/announcements/${announcementId}`;

        return {
          user_id: userId,
          title: 'New Announcement',
          message: `${announcementTitle} - ${propertyName}`,
          type: 'announcement' as const,
          priority: 'medium' as const,
          action_url: actionUrl,
          data: {
            announcement_id: announcementId,
            property_name: propertyName
          }
        };
      });

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) {
        console.error('Supabase insert error:', error);
        console.error('Notifications being inserted:', notifications);
        throw new Error(error.message);
      }

      console.log(
        `Successfully created ${notifications.length} notifications for announcement ${announcementId}`
      );
      return { success: true };
    } catch (error) {
      console.error('Create announcement notification error:', error);
      return {
        success: false,
        message: 'Failed to create announcement notification'
      };
    }
  }

  // Create notification for message
  static async createMessageNotification(
    messageId: string,
    senderName: string,
    messagePreview: string,
    recipientId: string
  ): Promise<{
    success: boolean;
    data?: Notification;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          title: `New Message from ${senderName}`,
          message: messagePreview,
          type: 'system',
          priority: 'medium',
          action_url: '/dashboard/messages',
          data: {
            message_id: messageId,
            sender_name: senderName
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create message notification error:', error);
      return {
        success: false,
        message: 'Failed to create message notification'
      };
    }
  }

  // Create notification for maintenance update
  static async createMaintenanceNotification(
    maintenanceId: string,
    maintenanceTitle: string,
    status: string,
    userId: string,
    isOwner: boolean = false
  ): Promise<{
    success: boolean;
    data?: Notification;
    message?: string;
  }> {
    try {
      const title = isOwner
        ? `Maintenance Request Updated: ${maintenanceTitle}`
        : `Your Maintenance Request: ${maintenanceTitle}`;

      const message = isOwner
        ? `Status updated to: ${status.replace('_', ' ')}`
        : `Your request status has been updated to: ${status.replace(
            '_',
            ' '
          )}`;

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type: 'maintenance',
          priority: status === 'urgent' ? 'high' : 'medium',
          action_url: `/dashboard/maintenance/${maintenanceId}`,
          data: {
            maintenance_id: maintenanceId,
            status,
            is_owner: isOwner
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create maintenance notification error:', error);
      return {
        success: false,
        message: 'Failed to create maintenance notification'
      };
    }
  }

  // Create notification for payment reminder
  static async createPaymentReminderNotification(
    paymentId: string,
    amount: number,
    dueDate: string,
    userId: string
  ): Promise<{
    success: boolean;
    data?: Notification;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Payment Reminder',
          message: `Payment of ₱${amount.toLocaleString()} is due on ${new Date(
            dueDate
          ).toLocaleDateString()}`,
          type: 'payment',
          priority: 'high',
          action_url: '/dashboard/payments',
          data: {
            payment_id: paymentId,
            amount,
            due_date: dueDate
          }
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create payment reminder notification error:', error);
      return {
        success: false,
        message: 'Failed to create payment reminder notification'
      };
    }
  }
}

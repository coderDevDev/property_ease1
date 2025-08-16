import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationInsert =
  Database['public']['Tables']['notifications']['Insert'];
type NotificationUpdate =
  Database['public']['Tables']['notifications']['Update'];

export class NotificationsAPI {
  static async getNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get notifications error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch notifications',
        data: []
      };
    }
  }

  static async getUnreadNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get unread notifications error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch unread notifications',
        data: []
      };
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: count || 0 };
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

  static async createNotification(
    notification: Omit<NotificationInsert, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Notification created successfully',
        data
      };
    } catch (error) {
      console.error('Create notification error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create notification',
        data: null
      };
    }
  }

  static async markAsRead(notificationId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Notification marked as read',
        data
      };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark notification as read',
        data: null
      };
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'All notifications marked as read'
      };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark all notifications as read'
      };
    }
  }

  static async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Notification deleted successfully'
      };
    } catch (error) {
      console.error('Delete notification error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete notification'
      };
    }
  }

  static async getNotificationsByType(userId: string, type: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', type)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get notifications by type error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch notifications',
        data: []
      };
    }
  }

  static async sendBulkNotifications(
    userIds: string[],
    title: string,
    message: string,
    type: Database['public']['Enums']['notification_type'],
    priority: Database['public']['Enums']['notification_priority'] = 'medium',
    actionUrl?: string,
    data?: Record<string, any>
  ) {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        priority,
        action_url: actionUrl,
        data
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: `${notifications.length} notifications sent successfully`,
        data
      };
    } catch (error) {
      console.error('Send bulk notifications error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send bulk notifications',
        data: null
      };
    }
  }

  static async sendPaymentReminder(
    tenantIds: string[],
    dueDate: string,
    amount: number
  ) {
    try {
      const title = 'Payment Reminder';
      const message = `Your rent payment of ₱${amount.toLocaleString()} is due on ${new Date(
        dueDate
      ).toLocaleDateString()}`;

      return await this.sendBulkNotifications(
        tenantIds,
        title,
        message,
        'payment',
        'high',
        '/dashboard/payments'
      );
    } catch (error) {
      console.error('Send payment reminder error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send payment reminder',
        data: null
      };
    }
  }

  static async sendMaintenanceUpdate(
    tenantId: string,
    maintenanceId: string,
    status: string
  ) {
    try {
      const title = 'Maintenance Update';
      const message = `Your maintenance request status has been updated to: ${status}`;

      return await this.createNotification({
        user_id: tenantId,
        title,
        message,
        type: 'maintenance',
        priority: 'medium',
        action_url: `/dashboard/maintenance/${maintenanceId}`,
        data: {
          maintenance_id: maintenanceId,
          status
        }
      });
    } catch (error) {
      console.error('Send maintenance update error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to send maintenance update',
        data: null
      };
    }
  }

  static async cleanupExpiredNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Expired notifications cleaned up successfully'
      };
    } catch (error) {
      console.error('Cleanup expired notifications error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to cleanup expired notifications'
      };
    }
  }
}







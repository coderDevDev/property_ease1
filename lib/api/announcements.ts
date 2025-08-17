import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';
import { NotificationsAPI } from './notifications';

type Announcement = Database['public']['Tables']['announcements']['Row'];
type AnnouncementInsert =
  Database['public']['Tables']['announcements']['Insert'];
type AnnouncementUpdate =
  Database['public']['Tables']['announcements']['Update'];

export class AnnouncementsAPI {
  static async getAnnouncements(propertyId?: string, targetAudience?: string) {
    try {
      let query = supabase
        .from('announcements')
        .select(
          `
          *,
          property:properties(*),
          creator:users!created_by(*)
        `
        )
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      if (targetAudience) {
        query = query.eq('target_audience', targetAudience);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get announcements error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch announcements',
        data: []
      };
    }
  }

  static async getAnnouncement(id: string) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(
          `
          *,
          property:properties(*),
          creator:users!created_by(*)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get announcement error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch announcement',
        data: null
      };
    }
  }

  static async createAnnouncement(
    announcement: Omit<AnnouncementInsert, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .insert([announcement])
        .select(
          `
          *,
          property:properties(*),
          creator:users!created_by(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Announcement created successfully',
        data
      };
    } catch (error) {
      console.error('Create announcement error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create announcement',
        data: null
      };
    }
  }

  static async updateAnnouncement(id: string, updates: AnnouncementUpdate) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          property:properties(*),
          creator:users!created_by(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Announcement updated successfully',
        data
      };
    } catch (error) {
      console.error('Update announcement error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update announcement',
        data: null
      };
    }
  }

  static async publishAnnouncement(id: string) {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(
          `
          *,
          property:properties(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Send notifications to target audience
      if (data) {
        await this.notifyTargetAudience(data);
      }

      return {
        success: true,
        message: 'Announcement published successfully',
        data
      };
    } catch (error) {
      console.error('Publish announcement error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to publish announcement',
        data: null
      };
    }
  }

  static async deleteAnnouncement(id: string) {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Announcement deleted successfully'
      };
    } catch (error) {
      console.error('Delete announcement error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete announcement'
      };
    }
  }

  static async getAnnouncementsByProperty(propertyId: string, userId?: string) {
    try {
      let query = supabase
        .from('announcements')
        .select(
          `
          *,
          creator:users!created_by(*)
        `
        )
        .eq('property_id', propertyId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      // Filter by target audience if user is provided
      if (userId) {
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (user) {
          query = query.or(
            `target_audience.eq.all,target_audience.eq.${user.role}s,target_users.cs.{${userId}}`
          );
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get announcements by property error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch announcements',
        data: []
      };
    }
  }

  static async getAnnouncementsByType(type: string, propertyId?: string) {
    try {
      let query = supabase
        .from('announcements')
        .select(
          `
          *,
          property:properties(*),
          creator:users!created_by(*)
        `
        )
        .eq('type', type)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get announcements by type error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch announcements',
        data: []
      };
    }
  }

  static async getUrgentAnnouncements(propertyId?: string, userId?: string) {
    try {
      let query = supabase
        .from('announcements')
        .select(
          `
          *,
          property:properties(*),
          creator:users!created_by(*)
        `
        )
        .eq('is_published', true)
        .eq('priority', 'urgent')
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      // Filter by target audience if user is provided
      if (userId) {
        const { data: user } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();

        if (user) {
          query = query.or(
            `target_audience.eq.all,target_audience.eq.${user.role}s,target_users.cs.{${userId}}`
          );
        }
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get urgent announcements error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch urgent announcements',
        data: []
      };
    }
  }

  static async searchAnnouncements(searchQuery: string, propertyId?: string) {
    try {
      let query = supabase
        .from('announcements')
        .select(
          `
          *,
          property:properties(*),
          creator:users!created_by(*)
        `
        )
        .eq('is_published', true)
        .or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Search announcements error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to search announcements',
        data: []
      };
    }
  }

  static async cleanupExpiredAnnouncements() {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Expired announcements cleaned up successfully'
      };
    } catch (error) {
      console.error('Cleanup expired announcements error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to cleanup expired announcements'
      };
    }
  }

  private static async notifyTargetAudience(announcement: any) {
    try {
      let targetUserIds: string[] = [];

      if (announcement.target_audience === 'all') {
        // Get all users
        const { data: allUsers } = await supabase.from('users').select('id');

        targetUserIds = allUsers?.map(u => u.id) || [];
      } else if (
        announcement.target_audience === 'tenants' ||
        announcement.target_audience === 'owners'
      ) {
        // Get users by role
        const role =
          announcement.target_audience === 'tenants' ? 'tenant' : 'owner';
        const { data: roleUsers } = await supabase
          .from('users')
          .select('id')
          .eq('role', role);

        targetUserIds = roleUsers?.map(u => u.id) || [];

        // If property-specific, filter by property tenants/owners
        if (
          announcement.property_id &&
          announcement.target_audience === 'tenants'
        ) {
          const { data: propertyTenants } = await supabase
            .from('tenants')
            .select('user_id')
            .eq('property_id', announcement.property_id);

          const tenantIds = propertyTenants?.map(t => t.user_id) || [];
          targetUserIds = targetUserIds.filter(id => tenantIds.includes(id));
        } else if (
          announcement.property_id &&
          announcement.target_audience === 'owners'
        ) {
          const { data: property } = await supabase
            .from('properties')
            .select('owner_id')
            .eq('id', announcement.property_id)
            .single();

          targetUserIds = property?.owner_id ? [property.owner_id] : [];
        }
      } else if (
        announcement.target_audience === 'specific' &&
        announcement.target_users
      ) {
        targetUserIds = announcement.target_users;
      }

      if (targetUserIds.length > 0) {
        const priority = announcement.priority === 'urgent' ? 'high' : 'medium';

        await NotificationsAPI.sendBulkNotifications(
          targetUserIds,
          `New Announcement: ${announcement.title}`,
          announcement.content.substring(0, 100) +
            (announcement.content.length > 100 ? '...' : ''),
          'announcement',
          priority as 'high' | 'medium',
          `/dashboard/announcements/${announcement.id}`,
          {
            announcement_id: announcement.id,
            property_id: announcement.property_id,
            type: announcement.type
          }
        );
      }
    } catch (error) {
      console.error('Failed to notify target audience:', error);
    }
  }
}








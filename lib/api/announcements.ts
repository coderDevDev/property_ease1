'use client';

import { supabase } from '@/lib/supabase';
import { NotificationsAPI } from './notifications';

export interface Announcement {
  id: string;
  property_id?: string;
  created_by: string;
  title: string;
  content: string;
  type: 'general' | 'maintenance' | 'policy' | 'event' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_audience: 'all' | 'tenants' | 'owners' | 'specific';
  target_users?: string[];
  attachments: string[];
  is_published: boolean;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  // Related data
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    type: string;
  };
  creator?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
    role: string;
  };
  target_users_data?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  }>;
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  type: 'general' | 'maintenance' | 'policy' | 'event' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  target_audience: 'all' | 'tenants' | 'owners' | 'specific';
  target_users: string[];
  attachments: string[];
  expires_at?: string;
  is_published: boolean;
  property_id?: string;
}

export interface AnnouncementStats {
  total_announcements: number;
  published_announcements: number;
  draft_announcements: number;
  urgent_announcements: number;
  expired_announcements: number;
}

export class AnnouncementsAPI {
  // Get announcements for owner (all their properties)
  static async getOwnerAnnouncements(ownerId: string): Promise<{
    success: boolean;
    data?: Announcement[];
    message?: string;
  }> {
    try {
      // First get all properties owned by this user
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', ownerId);

      if (propertiesError) {
        throw new Error(propertiesError.message);
      }

      const propertyIds = properties?.map(p => p.id) || [];

      if (propertyIds.length === 0) {
        return { success: true, data: [] };
      }

      // Get announcements for these properties
      const { data, error } = await supabase
        .from('announcements')
        .select(
          `
          *,
          property:properties(id, name, address, city, type),
          creator:users!announcements_created_by_fkey(id, first_name, last_name, email, avatar_url, role)
        `
        )
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Get target users data for specific announcements
      const announcementsWithTargetUsers = await Promise.all(
        (data || []).map(async announcement => {
          if (
            announcement.target_users &&
            announcement.target_users.length > 0
          ) {
            const { data: targetUsersData } = await supabase
              .from('users')
              .select('id, first_name, last_name, email, avatar_url')
              .in('id', announcement.target_users);

            return {
              ...announcement,
              target_users_data: targetUsersData || []
            };
          }
          return announcement;
        })
      );

      return { success: true, data: announcementsWithTargetUsers };
    } catch (error) {
      console.error('Get owner announcements error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get announcements'
      };
    }
  }

  // Get announcements for tenant (their property)
  static async getTenantAnnouncements(tenantId: string): Promise<{
    success: boolean;
    data?: Announcement[];
    message?: string;
  }> {
    try {
      // First get the tenant's property
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('property_id')
        .eq('id', tenantId)
        .single();

      if (tenantError) {
        throw new Error(tenantError.message);
      }

      if (!tenant?.property_id) {
        return { success: true, data: [] };
      }

      // Get published announcements for this property
      const { data, error } = await supabase
        .from('announcements')
        .select(
          `
          *,
          property:properties(id, name, address, city, type),
          creator:users!announcements_created_by_fkey(id, first_name, last_name, email, avatar_url, role)
        `
        )
        .eq('property_id', tenant.property_id)
        .eq('is_published', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Filter announcements based on target audience
      const filteredAnnouncements = (data || []).filter(announcement => {
        if (announcement.target_audience === 'all') return true;
        if (announcement.target_audience === 'tenants') return true;
        if (announcement.target_audience === 'specific') {
          return announcement.target_users?.includes(tenantId) || false;
        }
        return false;
      });

      return { success: true, data: filteredAnnouncements };
    } catch (error) {
      console.error('Get tenant announcements error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get announcements'
      };
    }
  }

  // Get single announcement
  static async getAnnouncement(announcementId: string): Promise<{
    success: boolean;
    data?: Announcement;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(
          `
          *,
          property:properties(id, name, address, city, type),
          creator:users!announcements_created_by_fkey(id, first_name, last_name, email, avatar_url, role)
        `
        )
        .eq('id', announcementId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Get target users data if specific
      if (data.target_users && data.target_users.length > 0) {
        const { data: targetUsersData } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, avatar_url')
          .in('id', data.target_users);

        data.target_users_data = targetUsersData || [];
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get announcement error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to get announcement'
      };
    }
  }

  // Create announcement
  static async createAnnouncement(
    announcementData: AnnouncementFormData,
    creatorId: string,
    propertyId?: string
  ): Promise<{
    success: boolean;
    data?: Announcement;
    message?: string;
  }> {
    try {
      console.log('createAnnouncement called with:', {
        announcementData,
        creatorId,
        propertyId,
        isPublished: announcementData.is_published
      });
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          property_id: propertyId,
          created_by: creatorId,
          title: announcementData.title,
          content: announcementData.content,
          type: announcementData.type,
          priority: announcementData.priority,
          target_audience: announcementData.target_audience,
          target_users:
            announcementData.target_users.length > 0
              ? announcementData.target_users
              : null,
          attachments: announcementData.attachments,
          expires_at: announcementData.expires_at || null,
          is_published: announcementData.is_published,
          published_at: announcementData.is_published
            ? new Date().toISOString()
            : null
        })
        .select(
          `
          *,
          property:properties(id, name, address, city, type),
          creator:users!announcements_created_by_fkey(id, first_name, last_name, email, avatar_url, role)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      console.log('Announcement created successfully:', {
        data,
        isPublished: announcementData.is_published,
        willCreateNotifications: announcementData.is_published && data
      });

      // Create notifications if announcement is published
      if (announcementData.is_published && data) {
        console.log('Creating notifications for published announcement:', {
          announcementId: data.id,
          title: data.title,
          propertyName: data.property?.name || 'Property',
          targetAudience: announcementData.target_audience,
          propertyId,
          creatorId // Pass creator ID to exclude from notifications
        });

        try {
          const notificationResult =
            await AnnouncementsAPI.createAnnouncementNotifications(
              data.id,
              data.title,
              data.property?.name || 'Property',
              announcementData.target_audience,
              propertyId,
              creatorId // Exclude creator from notifications
            );

          if (notificationResult.success) {
            console.log('Successfully created announcement notifications');
          } else {
            console.error(
              'Failed to create announcement notifications:',
              notificationResult.message
            );
          }
        } catch (notificationError) {
          console.error(
            'Failed to create announcement notifications:',
            notificationError
          );
          // Don't fail the announcement creation if notifications fail
        }
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create announcement error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create announcement'
      };
    }
  }

  // Update announcement
  static async updateAnnouncement(
    announcementId: string,
    updateData: Partial<AnnouncementFormData>
  ): Promise<{
    success: boolean;
    data?: Announcement;
    message?: string;
  }> {
    try {
      const updatePayload: any = {
        updated_at: new Date().toISOString()
      };

      if (updateData.title !== undefined)
        updatePayload.title = updateData.title;
      if (updateData.content !== undefined)
        updatePayload.content = updateData.content;
      if (updateData.type !== undefined) updatePayload.type = updateData.type;
      if (updateData.priority !== undefined)
        updatePayload.priority = updateData.priority;
      if (updateData.target_audience !== undefined)
        updatePayload.target_audience = updateData.target_audience;
      if (updateData.target_users !== undefined) {
        updatePayload.target_users =
          updateData.target_users.length > 0 ? updateData.target_users : null;
      }
      if (updateData.attachments !== undefined)
        updatePayload.attachments = updateData.attachments;
      if (updateData.expires_at !== undefined)
        updatePayload.expires_at = updateData.expires_at || null;
      if (updateData.is_published !== undefined) {
        updatePayload.is_published = updateData.is_published;
        if (updateData.is_published && !updatePayload.published_at) {
          updatePayload.published_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('announcements')
        .update(updatePayload)
        .eq('id', announcementId)
        .select(
          `
          *,
          property:properties(id, name, address, city, type),
          creator:users!announcements_created_by_fkey(id, first_name, last_name, email, avatar_url, role)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update announcement error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update announcement'
      };
    }
  }

  // Delete announcement
  static async deleteAnnouncement(announcementId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true };
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

  // Publish/Unpublish announcement
  static async toggleAnnouncementPublish(
    announcementId: string,
    isPublished: boolean
  ): Promise<{
    success: boolean;
    data?: Announcement;
    message?: string;
  }> {
    try {
      const updatePayload: any = {
        is_published: isPublished,
        updated_at: new Date().toISOString()
      };

      if (isPublished) {
        updatePayload.published_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('announcements')
        .update(updatePayload)
        .eq('id', announcementId)
        .select(
          `
          *,
          property:properties(id, name, address, city, type),
          creator:users!announcements_created_by_fkey(id, first_name, last_name, email, avatar_url, role)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Toggle announcement publish error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to toggle announcement publish status'
      };
    }
  }

  // Create notifications for announcement
  static async createAnnouncementNotifications(
    announcementId: string,
    title: string,
    propertyName: string,
    targetAudience: string,
    propertyId?: string,
    creatorId?: string
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      console.log('createAnnouncementNotifications called with:', {
        announcementId,
        title,
        propertyName,
        targetAudience,
        propertyId,
        creatorId
      });

      let targetUserIds: string[] = [];

      if (targetAudience === 'all') {
        // Get all users (owners and tenants)
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id')
          .in('role', ['owner', 'tenant']);

        if (usersError) throw usersError;
        targetUserIds = users?.map(u => u.id) || [];
      } else if (targetAudience === 'tenants') {
        // Get all ACTIVE tenants only
        const { data: tenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('user_id')
          .eq('status', 'active');

        if (tenantsError) throw tenantsError;
        targetUserIds = tenants?.map(t => t.user_id) || [];
      } else if (targetAudience === 'owners') {
        // Get all owners
        const { data: owners, error: ownersError } = await supabase
          .from('users')
          .select('id')
          .eq('role', 'owner');

        if (ownersError) throw ownersError;
        targetUserIds = owners?.map(o => o.id) || [];
      } else if (targetAudience === 'specific' && propertyId) {
        // Get ACTIVE tenants of specific property only
        const { data: tenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('user_id')
          .eq('property_id', propertyId)
          .eq('status', 'active');

        if (tenantsError) throw tenantsError;
        targetUserIds = tenants?.map(t => t.user_id) || [];
      }

      // IMPORTANT: Exclude the creator from receiving notifications
      if (creatorId) {
        targetUserIds = targetUserIds.filter(userId => userId !== creatorId);
        console.log('Filtered out creator from notifications:', creatorId);
      }

      console.log(
        'Target user IDs found (after excluding creator):',
        targetUserIds.length,
        targetUserIds
      );

      if (targetUserIds.length > 0) {
        const result = await NotificationsAPI.createAnnouncementNotification(
          announcementId,
          title,
          propertyName,
          targetUserIds
        );

        if (result.success) {
          console.log(
            'Successfully created notifications via NotificationsAPI'
          );
        } else {
          console.error(
            'Failed to create notifications via NotificationsAPI:',
            result.message
          );
        }

        return result;
      } else {
        console.log('No target users found, skipping notification creation');
        return { success: true };
      }
    } catch (error) {
      console.error('Create announcement notifications error:', error);
      return {
        success: false,
        message: 'Failed to create announcement notifications'
      };
    }
  }

  // Get announcement statistics
  static async getAnnouncementStats(ownerId: string): Promise<{
    success: boolean;
    data?: AnnouncementStats;
    message?: string;
  }> {
    try {
      // Get all properties owned by this user
      const { data: properties, error: propertiesError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', ownerId);

      if (propertiesError) {
        throw new Error(propertiesError.message);
      }

      const propertyIds = properties?.map(p => p.id) || [];

      if (propertyIds.length === 0) {
        return {
          success: true,
          data: {
            total_announcements: 0,
            published_announcements: 0,
            draft_announcements: 0,
            urgent_announcements: 0,
            expired_announcements: 0
          }
        };
      }

      // Get all announcements for these properties
      const { data: announcements, error } = await supabase
        .from('announcements')
        .select('is_published, priority, expires_at')
        .in('property_id', propertyIds);

      if (error) {
        throw new Error(error.message);
      }

      const stats: AnnouncementStats = {
        total_announcements: announcements?.length || 0,
        published_announcements:
          announcements?.filter(a => a.is_published).length || 0,
        draft_announcements:
          announcements?.filter(a => !a.is_published).length || 0,
        urgent_announcements:
          announcements?.filter(a => a.priority === 'urgent').length || 0,
        expired_announcements:
          announcements?.filter(
            a => a.expires_at && new Date(a.expires_at) < new Date()
          ).length || 0
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get announcement stats error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get announcement statistics'
      };
    }
  }

  // Get available tenants for targeting
  static async getAvailableTenants(ownerId: string): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      avatar_url?: string;
      property_name: string;
      unit_number: string;
    }>;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(
          `
          id,
          unit_number,
          user:users(id, first_name, last_name, email, avatar_url),
          property:properties(id, name)
        `
        )
        .eq('property.owner_id', ownerId)
        .eq('status', 'active');

      if (error) {
        throw new Error(error.message);
      }

      const tenants = (data || []).map((tenant: any) => ({
        id: tenant.id,
        first_name: tenant.user.first_name,
        last_name: tenant.user.last_name,
        email: tenant.user.email,
        avatar_url: tenant.user.avatar_url,
        property_name: tenant.property.name,
        unit_number: tenant.unit_number
      }));

      return { success: true, data: tenants };
    } catch (error) {
      console.error('Get available tenants error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get available tenants'
      };
    }
  }

  // Subscribe to real-time announcements updates
  static subscribeToAnnouncements(
    propertyIds: string[],
    callback: (payload: any) => void
  ) {
    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'announcements',
          filter: `property_id=in.(${propertyIds.join(',')})`
        },
        callback
      )
      .subscribe();

    return channel;
  }
}

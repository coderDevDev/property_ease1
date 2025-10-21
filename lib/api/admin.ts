import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type User = Database['public']['Tables']['users']['Row'];
type SystemSetting = Database['public']['Tables']['system_settings']['Row'];
type AuditLog = Database['public']['Tables']['audit_logs']['Row'];

export class AdminAPI {
  // User Management
  static async getAllUsers(role?: string, isActive?: boolean) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (role) {
        query = query.eq('role', role);
      }
      if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get all users error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch users',
        data: []
      };
    }
  }

  static async updateUserStatus(userId: string, isActive: boolean) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: isActive })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data
      };
    } catch (error) {
      console.error('Update user status error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update user status',
        data: null
      };
    }
  }

  static async updateUserRole(
    userId: string,
    role: 'owner' | 'tenant' | 'admin'
  ) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'User role updated successfully',
        data
      };
    } catch (error) {
      console.error('Update user role error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update user role',
        data: null
      };
    }
  }

  // System Analytics
  static async getSystemStats() {
    try {
      const [usersResult, propertiesResult, tenantsResult, paymentsResult] =
        await Promise.all([
          supabase.from('users').select('role, is_active, created_at'),
          supabase.from('properties').select('status, created_at'),
          supabase.from('tenants').select('status, created_at'),
          supabase.from('payments').select('payment_status, amount, created_at')
        ]);

      const users = usersResult.data || [];
      const properties = propertiesResult.data || [];
      const tenants = tenantsResult.data || [];
      const payments = paymentsResult.data || [];

      const stats = {
        users: {
          total: users.length,
          active: users.filter(u => u.is_active).length,
          owners: users.filter(u => u.role === 'owner').length,
          tenants: users.filter(u => u.role === 'tenant').length,
          admins: users.filter(u => u.role === 'admin').length,
          newThisMonth: users.filter(
            u => new Date(u.created_at).getMonth() === new Date().getMonth()
          ).length
        },
        properties: {
          total: properties.length,
          active: properties.filter(p => p.status === 'active').length,
          maintenance: properties.filter(p => p.status === 'maintenance')
            .length,
          inactive: properties.filter(p => p.status === 'inactive').length,
          newThisMonth: properties.filter(
            p => new Date(p.created_at).getMonth() === new Date().getMonth()
          ).length
        },
        tenants: {
          total: tenants.length,
          active: tenants.filter(t => t.status === 'active').length,
          pending: tenants.filter(t => t.status === 'pending').length,
          terminated: tenants.filter(t => t.status === 'terminated').length,
          newThisMonth: tenants.filter(
            t => new Date(t.created_at).getMonth() === new Date().getMonth()
          ).length
        },
        payments: {
          total: payments.length,
          paid: payments.filter(p => p.payment_status === 'paid').length,
          pending: payments.filter(p => p.payment_status === 'pending').length,
          failed: payments.filter(p => p.payment_status === 'failed').length,
          totalAmount: payments
            .filter(p => p.payment_status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0),
          thisMonthAmount: payments
            .filter(
              p =>
                p.payment_status === 'paid' &&
                new Date(p.created_at).getMonth() === new Date().getMonth()
            )
            .reduce((sum, p) => sum + p.amount, 0)
        }
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get system stats error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch system statistics',
        data: null
      };
    }
  }

  // System Settings Management
  static async getSystemSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get system settings error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch system settings',
        data: []
      };
    }
  }

  static async updateSystemSetting(
    settingKey: string,
    settingValue: Record<string, any>,
    updatedBy: string
  ) {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: settingValue,
          updated_by: updatedBy
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'System setting updated successfully',
        data
      };
    } catch (error) {
      console.error('Update system setting error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update system setting',
        data: null
      };
    }
  }

  // Audit Logs
  static async getAuditLogs(
    entityType?: string,
    action?: string,
    userId?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(
          `
          *,
          user:users(*)
        `
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (action) {
        query = query.eq('action', action);
      }
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get audit logs error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch audit logs',
        data: []
      };
    }
  }

  // Content Moderation
  static async getReportedContent() {
    try {
      // This would need a reports table in the future
      // For now, return maintenance requests and announcements that might need moderation
      const [maintenanceResult, announcementsResult] = await Promise.all([
        supabase
          .from('maintenance_requests')
          .select(
            `
            *,
            tenant:tenants(*),
            property:properties(*)
          `
          )
          .eq('status', 'pending')
          .order('created_at', { ascending: false }),
        supabase
          .from('announcements')
          .select(
            `
            *,
            property:properties(*),
            creator:users!created_by(*)
          `
          )
          .eq('is_published', false)
          .order('created_at', { ascending: false })
      ]);

      const data = {
        maintenance_requests: maintenanceResult.data || [],
        announcements: announcementsResult.data || []
      };

      return { success: true, data };
    } catch (error) {
      console.error('Get reported content error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch reported content',
        data: null
      };
    }
  }

  // Property Oversight
  static async getAllProperties(status?: string) {
    try {
      let query = supabase
        .from('properties')
        .select(
          `
          *,
          owner:users!owner_id(*)
        `
        )
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get all properties error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch properties',
        data: []
      };
    }
  }

  // Payment Oversight
  static async getAllPayments(status?: string, limit: number = 100) {
    try {
      let query = supabase
        .from('payments')
        .select(
          `
          *,
          tenant:tenants(*),
          property:properties(*)
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) {
        query = query.eq('payment_status', status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get all payments error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch payments',
        data: []
      };
    }
  }

  // Maintenance Oversight
  static async getAllMaintenanceRequests(status?: string, priority?: string) {
    try {
      let query = supabase
        .from('maintenance_requests')
        .select(
          `
          *,
          tenant:tenants(*),
          property:properties(*)
        `
        )
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }
      if (priority) {
        query = query.eq('priority', priority);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get all maintenance requests error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch maintenance requests',
        data: []
      };
    }
  }

  // System Health
  static async getSystemHealth() {
    try {
      const [dbResult, storageResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.storage.from('documents').list('', { limit: 1 })
      ]);

      const health = {
        database: {
          status: dbResult.error ? 'error' : 'healthy',
          error: dbResult.error?.message
        },
        storage: {
          status: storageResult.error ? 'error' : 'healthy',
          error: storageResult.error?.message
        },
        timestamp: new Date().toISOString()
      };

      return { success: true, data: health };
    } catch (error) {
      console.error('Get system health error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to check system health',
        data: null
      };
    }
  }

  // Comprehensive Analytics
  static async getSystemAnalytics(timeRange: string = '30d') {
    try {
      // Calculate date range
      const now = new Date();
      let startDate: Date;

      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default: // 30d
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Previous period for growth calculations
      const periodLength = now.getTime() - startDate.getTime();
      const previousStartDate = new Date(startDate.getTime() - periodLength);

      // Fetch all data
      const [
        usersResult,
        propertiesResult,
        tenantsResult,
        paymentsResult,
        maintenanceResult
      ] = await Promise.all([
        supabase.from('users').select('role, is_active, created_at'),
        supabase
          .from('properties')
          .select('status, monthly_rent, city, province, created_at'),
        supabase.from('tenants').select('status, created_at'),
        supabase
          .from('payments')
          .select(
            'payment_status, amount, payment_method, payment_type, created_at'
          ),
        supabase
          .from('maintenance_requests')
          .select(
            'status, priority, estimated_cost, actual_cost, created_at, updated_at'
          )
      ]);

      const users = usersResult.data || [];
      const properties = propertiesResult.data || [];
      const tenants = tenantsResult.data || [];
      const payments = paymentsResult.data || [];
      const maintenanceRequests = maintenanceResult.data || [];

      // Filter data by date range
      const currentPeriodUsers = users.filter(
        u => new Date(u.created_at) >= startDate
      );
      const previousPeriodUsers = users.filter(
        u =>
          new Date(u.created_at) >= previousStartDate &&
          new Date(u.created_at) < startDate
      );

      const currentPeriodPayments = payments.filter(
        p => new Date(p.created_at) >= startDate
      );
      const previousPeriodPayments = payments.filter(
        p =>
          new Date(p.created_at) >= previousStartDate &&
          new Date(p.created_at) < startDate
      );

      const currentPeriodProperties = properties.filter(
        p => new Date(p.created_at) >= startDate
      );
      const previousPeriodProperties = properties.filter(
        p =>
          new Date(p.created_at) >= previousStartDate &&
          new Date(p.created_at) < startDate
      );

      // Calculate revenue metrics
      const currentRevenue = currentPeriodPayments
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const previousRevenue = previousPeriodPayments
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const totalRevenue = payments
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);

      const revenueGrowth =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      // Calculate user metrics
      const totalUsers = users.length;
      const activeUsers = users.filter(u => u.is_active).length;
      const newUsersThisPeriod = currentPeriodUsers.length;
      const newUsersPreviousPeriod = previousPeriodUsers.length;
      const userGrowth =
        newUsersPreviousPeriod > 0
          ? ((newUsersThisPeriod - newUsersPreviousPeriod) /
              newUsersPreviousPeriod) *
            100
          : 0;

      // Calculate property metrics
      const totalProperties = properties.length;
      const activeProperties = properties.filter(
        p => p.status === 'active'
      ).length;
      const occupiedUnits = tenants.filter(t => t.status === 'active').length;
      const totalUnits = properties.reduce(
        (sum, p) => sum + (p.monthly_rent ? 1 : 0),
        0
      ); // Simplified assumption
      const occupancyRate =
        totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;
      const averageRent =
        properties.length > 0
          ? properties.reduce((sum, p) => sum + (p.monthly_rent || 0), 0) /
            properties.length
          : 0;
      const propertyGrowth =
        previousPeriodProperties.length > 0
          ? ((currentPeriodProperties.length -
              previousPeriodProperties.length) /
              previousPeriodProperties.length) *
            100
          : 0;

      // Calculate payment metrics
      const totalPayments = payments.length;
      const successfulPayments = payments.filter(
        p => p.payment_status === 'paid'
      ).length;
      const failedPayments = payments.filter(
        p => p.payment_status === 'failed'
      ).length;
      const pendingPayments = payments.filter(
        p => p.payment_status === 'pending'
      ).length;
      const successRate =
        totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;
      const averagePayment =
        successfulPayments > 0
          ? payments
              .filter(p => p.payment_status === 'paid')
              .reduce((sum, p) => sum + p.amount, 0) / successfulPayments
          : 0;

      // Calculate maintenance metrics
      const totalMaintenance = maintenanceRequests.length;
      const completedMaintenance = maintenanceRequests.filter(
        m => m.status === 'completed'
      ).length;
      const pendingMaintenance = maintenanceRequests.filter(
        m => m.status === 'pending' || m.status === 'in_progress'
      ).length;
      const totalMaintenanceCost = maintenanceRequests
        .filter(m => m.actual_cost || m.estimated_cost)
        .reduce((sum, m) => sum + (m.actual_cost || m.estimated_cost || 0), 0);

      // Calculate average resolution time for completed requests
      const completedMaintenanceWithDates = maintenanceRequests.filter(
        m => m.status === 'completed' && m.created_at && m.updated_at
      );
      const averageResolutionTime =
        completedMaintenanceWithDates.length > 0
          ? completedMaintenanceWithDates.reduce((sum, m) => {
              const created = new Date(m.created_at).getTime();
              const updated = new Date(m.updated_at).getTime();
              return sum + (updated - created) / (1000 * 60 * 60 * 24); // Convert to days
            }, 0) / completedMaintenanceWithDates.length
          : 0;

      // Calculate geographic distribution
      const cityRevenue: {
        [key: string]: { properties: number; revenue: number };
      } = {};

      properties.forEach(property => {
        const city = property.city || 'Unknown';
        if (!cityRevenue[city]) {
          cityRevenue[city] = { properties: 0, revenue: 0 };
        }
        cityRevenue[city].properties += 1;

        // Calculate revenue for this property from payments
        const propertyPayments = payments.filter(
          p =>
            p.payment_status === 'paid' && new Date(p.created_at) >= startDate
        );
        const propertyRevenue = propertyPayments.reduce(
          (sum, p) => sum + p.amount,
          0
        );
        cityRevenue[city].revenue += propertyRevenue / properties.length; // Simplified distribution
      });

      const topCities = Object.entries(cityRevenue)
        .map(([city, data]) => ({ city, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Build final analytics object
      const analytics = {
        revenue: {
          total: totalRevenue,
          monthly: currentRevenue,
          growth: Math.round(revenueGrowth * 100) / 100,
          trend:
            revenueGrowth > 0
              ? ('up' as const)
              : revenueGrowth < 0
              ? ('down' as const)
              : ('stable' as const)
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          newThisMonth: newUsersThisPeriod,
          growth: Math.round(userGrowth * 100) / 100,
          breakdown: {
            owners: users.filter(u => u.role === 'owner').length,
            tenants: users.filter(u => u.role === 'tenant').length,
            admins: users.filter(u => u.role === 'admin').length
          }
        },
        properties: {
          total: totalProperties,
          active: activeProperties,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          averageRent: Math.round(averageRent),
          growth: Math.round(propertyGrowth * 100) / 100
        },
        payments: {
          total: totalPayments,
          successful: successfulPayments,
          failed: failedPayments,
          pending: pendingPayments,
          successRate: Math.round(successRate * 100) / 100,
          averageAmount: Math.round(averagePayment)
        },
        maintenance: {
          total: totalMaintenance,
          completed: completedMaintenance,
          pending: pendingMaintenance,
          averageResolutionTime: Math.round(averageResolutionTime * 10) / 10,
          totalCost: totalMaintenanceCost
        },
        geographic: {
          topCities
        }
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Get system analytics error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch analytics',
        data: null
      };
    }
  }

  // Backup and Maintenance
  static async cleanupSystem() {
    try {
      const results = await Promise.all([
        // Cleanup expired notifications
        supabase
          .from('notifications')
          .delete()
          .lt('expires_at', new Date().toISOString()),
        // Cleanup expired announcements
        supabase
          .from('announcements')
          .delete()
          .lt('expires_at', new Date().toISOString()),
        // Cleanup expired documents
        supabase
          .from('documents')
          .delete()
          .lt('expires_at', new Date().toISOString()),
        // Cleanup old audit logs (older than 1 year)
        supabase
          .from('audit_logs')
          .delete()
          .lt(
            'created_at',
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
          )
      ]);

      const cleanupStats = {
        notifications: (results[0].data as any)?.length || 0,
        announcements: (results[1].data as any)?.length || 0,
        documents: (results[2].data as any)?.length || 0,
        audit_logs: (results[3].data as any)?.length || 0
      };

      return {
        success: true,
        message: 'System cleanup completed successfully',
        data: cleanupStats
      };
    } catch (error) {
      console.error('System cleanup error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to cleanup system',
        data: null
      };
    }
  }

  // ============================================================================
  // PROPERTY APPROVAL & VERIFICATION
  // ============================================================================

  /**
   * Approve a property listing
   */
  static async approveProperty(propertyId: string) {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the database function
      const { data, error } = await supabase.rpc('approve_property', {
        p_property_id: propertyId,
        p_admin_id: user.id
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Property approved successfully',
        data
      };
    } catch (error) {
      console.error('Approve property error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to approve property',
        data: null
      };
    }
  }

  /**
   * Reject a property listing with reason
   */
  static async rejectProperty(propertyId: string, reason: string) {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the database function
      const { data, error } = await supabase.rpc('reject_property', {
        p_property_id: propertyId,
        p_admin_id: user.id,
        p_reason: reason
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Property rejected successfully',
        data
      };
    } catch (error) {
      console.error('Reject property error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to reject property',
        data: null
      };
    }
  }

  /**
   * Toggle featured status for a property
   */
  static async toggleFeaturedProperty(
    propertyId: string,
    featured: boolean,
    featuredUntil?: string
  ) {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: any = {
        is_featured: featured
      };

      if (featured) {
        updateData.featured_by = user.id;
        updateData.featured_at = new Date().toISOString();
        if (featuredUntil) {
          updateData.featured_until = featuredUntil;
        }
      } else {
        updateData.featured_by = null;
        updateData.featured_at = null;
        updateData.featured_until = null;
      }

      const { data, error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Log the action
      await supabase.from('property_moderation_log').insert({
        property_id: propertyId,
        admin_id: user.id,
        action: featured ? 'featured' : 'unfeatured'
      });

      return {
        success: true,
        message: `Property ${featured ? 'featured' : 'unfeatured'} successfully`,
        data
      };
    } catch (error) {
      console.error('Toggle featured property error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to toggle featured status',
        data: null
      };
    }
  }

  /**
   * Get property moderation history
   */
  static async getPropertyModerationHistory(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('property_moderation_log')
        .select(
          `
          *,
          admin:users!admin_id(first_name, last_name, email)
        `
        )
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get property moderation history error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch moderation history',
        data: []
      };
    }
  }

  // ============================================================================
  // USER VERIFICATION (KYC)
  // ============================================================================

  /**
   * Verify a user (mark as verified)
   */
  static async verifyUser(userId: string) {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the database function
      const { data, error } = await supabase.rpc('verify_user', {
        p_user_id: userId,
        p_admin_id: user.id
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'User verified successfully',
        data
      };
    } catch (error) {
      console.error('Verify user error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to verify user',
        data: null
      };
    }
  }

  /**
   * Request verification documents from a user
   */
  static async requestVerificationDocuments(
    userId: string,
    documents: string[] = ['id', 'proof_of_address']
  ) {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the database function
      const { data, error } = await supabase.rpc(
        'request_verification_documents',
        {
          p_user_id: userId,
          p_admin_id: user.id,
          p_documents: documents
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Document request sent successfully',
        data
      };
    } catch (error) {
      console.error('Request verification documents error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to request documents',
        data: null
      };
    }
  }

  /**
   * Get user verification history
   */
  static async getUserVerificationHistory(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_verification_log')
        .select(
          `
          *,
          admin:users!admin_id(first_name, last_name, email)
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false});

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get user verification history error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch verification history',
        data: []
      };
    }
  }

  /**
   * Get all unverified users
   */
  static async getUnverifiedUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get unverified users error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch unverified users',
        data: []
      };
    }
  }

  /**
   * Get all unverified properties
   */
  static async getUnverifiedProperties() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(
          `
          *,
          owner:users!owner_id(*)
        `
        )
        .eq('is_verified', false)
        .order('created_at', { ascending: false});

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get unverified properties error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch unverified properties',
        data: []
      };
    }
  }
}

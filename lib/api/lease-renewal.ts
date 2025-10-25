/**
 * Lease Renewal API
 * Handles lease renewals, extensions, and history
 * 
 * @module LeaseRenewalAPI
 * @created October 25, 2025
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface LeaseRenewal {
  id: string;
  tenant_id: string;
  property_id: string;
  original_lease_start: string;
  original_lease_end: string;
  original_monthly_rent: number;
  new_lease_start: string;
  new_lease_end: string;
  new_monthly_rent: number;
  rent_increase: number;
  rent_increase_percentage: number;
  renewal_duration_months: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired';
  requested_by: string;
  requested_date: string;
  reviewed_by: string | null;
  reviewed_date: string | null;
  rejection_reason: string | null;
  terms: string | null;
  special_conditions: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeaseHistory {
  id: string;
  tenant_id: string;
  property_id: string;
  renewal_id: string | null;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  deposit_amount: number | null;
  status: 'active' | 'completed' | 'terminated' | 'renewed';
  change_type: 'initial' | 'renewal' | 'extension' | 'termination' | 'rent_adjustment';
  change_reason: string | null;
  created_by: string;
  created_at: string;
}

export interface LeaseNotification {
  id: string;
  tenant_id: string;
  property_id: string;
  notification_type: 'renewal_reminder' | 'expiring_soon' | 'expired' | 'renewal_approved' | 'renewal_rejected';
  notification_date: string;
  lease_end_date: string;
  days_until_expiry: number | null;
  is_read: boolean;
  is_sent: boolean;
  sent_at: string | null;
  title: string;
  message: string;
  created_at: string;
}

export interface CreateRenewalParams {
  tenantId: string;
  propertyId: string;
  originalLeaseStart: string;
  originalLeaseEnd: string;
  originalMonthlyRent: number;
  newLeaseStart: string;
  newLeaseEnd: string;
  newMonthlyRent: number;
  renewalDurationMonths: number;
  requestedBy: string;
  terms?: string;
  specialConditions?: string;
  notes?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

// =====================================================
// LEASE RENEWAL API CLASS
// =====================================================

export class LeaseRenewalAPI {
  // ===================================================
  // LEASE RENEWALS - TENANT METHODS
  // ===================================================

  /**
   * Get tenant's renewal requests
   */
  static async getTenantRenewals(tenantId: string): Promise<LeaseRenewal[]> {
    try {
      const { data, error } = await supabase
        .from('lease_renewals')
        .select(`
          *,
          property:properties(id, name, address),
          tenant:tenants(id, user:users(id, full_name, email))
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching tenant renewals:', error);
      throw error;
    }
  }

  /**
   * Create renewal request
   */
  static async createRenewalRequest(
    params: CreateRenewalParams
  ): Promise<ApiResponse<LeaseRenewal>> {
    try {
      const { data, error } = await supabase
        .from('lease_renewals')
        .insert({
          tenant_id: params.tenantId,
          property_id: params.propertyId,
          original_lease_start: params.originalLeaseStart,
          original_lease_end: params.originalLeaseEnd,
          original_monthly_rent: params.originalMonthlyRent,
          new_lease_start: params.newLeaseStart,
          new_lease_end: params.newLeaseEnd,
          new_monthly_rent: params.newMonthlyRent,
          renewal_duration_months: params.renewalDurationMonths,
          requested_by: params.requestedBy,
          terms: params.terms,
          special_conditions: params.specialConditions,
          notes: params.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Renewal request submitted successfully',
      };
    } catch (error: any) {
      console.error('Error creating renewal request:', error);
      return {
        success: false,
        message: error.message || 'Failed to create renewal request',
      };
    }
  }

  /**
   * Cancel renewal request
   */
  static async cancelRenewalRequest(renewalId: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('lease_renewals')
        .update({ status: 'cancelled' })
        .eq('id', renewalId);

      if (error) throw error;

      return {
        success: true,
        message: 'Renewal request cancelled',
      };
    } catch (error: any) {
      console.error('Error cancelling renewal:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel renewal request',
      };
    }
  }

  // ===================================================
  // LEASE RENEWALS - OWNER METHODS
  // ===================================================

  /**
   * Get all renewal requests for owner's properties
   */
  static async getOwnerRenewals(ownerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lease_renewals')
        .select(`
          *,
          property:properties!inner(id, name, address, owner_id),
          tenant:tenants(id, user:users(id, full_name, email, phone))
        `)
        .eq('property.owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching owner renewals:', error);
      return [];
    }
  }

  /**
   * Get pending renewal requests
   */
  static async getPendingRenewals(ownerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lease_renewals')
        .select(`
          *,
          property:properties!inner(id, name, address, owner_id),
          tenant:tenants(id, user:users(id, full_name, email, phone))
        `)
        .eq('property.owner_id', ownerId)
        .eq('status', 'pending')
        .order('requested_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching pending renewals:', error);
      return [];
    }
  }

  /**
   * Approve renewal request
   */
  static async approveRenewal(
    renewalId: string,
    reviewedBy: string
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase.rpc('approve_lease_renewal', {
        p_renewal_id: renewalId,
        p_reviewed_by: reviewedBy,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Renewal request approved successfully',
      };
    } catch (error: any) {
      console.error('Error approving renewal:', error);
      return {
        success: false,
        message: error.message || 'Failed to approve renewal',
      };
    }
  }

  /**
   * Reject renewal request
   */
  static async rejectRenewal(
    renewalId: string,
    reviewedBy: string,
    rejectionReason: string
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase.rpc('reject_lease_renewal', {
        p_renewal_id: renewalId,
        p_reviewed_by: reviewedBy,
        p_rejection_reason: rejectionReason,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Renewal request rejected',
      };
    } catch (error: any) {
      console.error('Error rejecting renewal:', error);
      return {
        success: false,
        message: error.message || 'Failed to reject renewal',
      };
    }
  }

  // ===================================================
  // LEASE HISTORY
  // ===================================================

  /**
   * Get lease history for tenant
   */
  static async getTenantLeaseHistory(tenantId: string): Promise<LeaseHistory[]> {
    try {
      const { data, error } = await supabase
        .from('lease_history')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('lease_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching lease history:', error);
      return [];
    }
  }

  /**
   * Get lease history for property
   */
  static async getPropertyLeaseHistory(propertyId: string): Promise<LeaseHistory[]> {
    try {
      const { data, error } = await supabase
        .from('lease_history')
        .select(`
          *,
          tenant:tenants(id, user:users(id, full_name, email))
        `)
        .eq('property_id', propertyId)
        .order('lease_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching property history:', error);
      return [];
    }
  }

  /**
   * Create lease history record
   */
  static async createLeaseHistory(
    tenantId: string,
    propertyId: string,
    leaseStart: string,
    leaseEnd: string,
    monthlyRent: number,
    changeType: string,
    createdBy: string,
    changeReason?: string,
    renewalId?: string
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('lease_history')
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          renewal_id: renewalId,
          lease_start: leaseStart,
          lease_end: leaseEnd,
          monthly_rent: monthlyRent,
          change_type: changeType,
          change_reason: changeReason,
          created_by: createdBy,
        });

      if (error) throw error;

      return {
        success: true,
        message: 'Lease history recorded',
      };
    } catch (error: any) {
      console.error('Error creating lease history:', error);
      return {
        success: false,
        message: error.message || 'Failed to create lease history',
      };
    }
  }

  // ===================================================
  // NOTIFICATIONS
  // ===================================================

  /**
   * Get tenant notifications
   */
  static async getTenantNotifications(tenantId: string): Promise<LeaseNotification[]> {
    try {
      const { data, error } = await supabase
        .from('lease_notifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('notification_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * Get unread notifications
   */
  static async getUnreadNotifications(tenantId: string): Promise<LeaseNotification[]> {
    try {
      const { data, error } = await supabase
        .from('lease_notifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_read', false)
        .order('notification_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching unread notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationAsRead(notificationId: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('lease_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return {
        success: true,
        message: 'Notification marked as read',
      };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        message: error.message || 'Failed to mark notification as read',
      };
    }
  }

  /**
   * Check for expiring leases (run via cron)
   */
  static async checkExpiringLeases(): Promise<ApiResponse> {
    try {
      const { error } = await supabase.rpc('check_expiring_leases');

      if (error) throw error;

      return {
        success: true,
        message: 'Expiring leases checked successfully',
      };
    } catch (error: any) {
      console.error('Error checking expiring leases:', error);
      return {
        success: false,
        message: error.message || 'Failed to check expiring leases',
      };
    }
  }

  // ===================================================
  // STATISTICS & UTILITIES
  // ===================================================

  /**
   * Get renewal statistics for owner
   */
  static async getOwnerRenewalStats(ownerId: string): Promise<any> {
    try {
      const renewals = await this.getOwnerRenewals(ownerId);

      const stats = {
        total: renewals.length,
        pending: renewals.filter((r) => r.status === 'pending').length,
        approved: renewals.filter((r) => r.status === 'approved').length,
        rejected: renewals.filter((r) => r.status === 'rejected').length,
        avgRentIncrease: renewals.length > 0
          ? renewals.reduce((sum, r) => sum + Number(r.rent_increase_percentage), 0) / renewals.length
          : 0,
      };

      return stats;
    } catch (error) {
      console.error('Error calculating renewal stats:', error);
      return null;
    }
  }

  /**
   * Calculate renewal duration in months
   */
  static calculateRenewalDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + 
                   (end.getMonth() - start.getMonth());
    return months;
  }

  /**
   * Get renewal details with full information
   */
  static async getRenewalDetails(renewalId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('lease_renewals')
        .select(`
          *,
          property:properties(id, name, address),
          tenant:tenants(id, user:users(id, full_name, email, phone)),
          requested_by_user:users!lease_renewals_requested_by_fkey(id, full_name, email),
          reviewed_by_user:users!lease_renewals_reviewed_by_fkey(id, full_name, email)
        `)
        .eq('id', renewalId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching renewal details:', error);
      return null;
    }
  }
}

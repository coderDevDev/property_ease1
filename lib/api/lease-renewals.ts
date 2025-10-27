/**
 * Lease Renewals API
 * Handles lease renewal requests and approvals
 * 
 * @module LeaseRenewalsAPI
 * @created October 26, 2025
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface LeaseRenewal {
  id: string;
  tenant_id: string;
  property_id: string;
  current_lease_end: string;
  proposed_lease_start: string;
  proposed_lease_end: string;
  proposed_rent: number;
  current_rent: number;
  duration_months: number;
  tenant_notes: string | null;
  owner_notes: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRenewalParams {
  tenantId: string;
  propertyId: string;
  currentLeaseEnd: string;
  proposedLeaseStart: string;
  proposedLeaseEnd: string;
  proposedRent: number;
  currentRent: number;
  durationMonths: number;
  tenantNotes?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

// =====================================================
// LEASE RENEWALS API CLASS
// =====================================================

export class LeaseRenewalsAPI {
  /**
   * Get tenant's renewal requests
   */
  static async getTenantRenewals(tenantId: string): Promise<LeaseRenewal[]> {
    try {
      const { data, error } = await supabase
        .from('lease_renewals')
        .select(`
          *,
          property:properties(id, name, address, city),
          tenant:tenants(
            id,
            user:users(id, first_name, last_name, email)
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching tenant renewals:', error);
      return [];
    }
  }

  /**
   * Get owner's renewal requests for their properties
   */
  static async getOwnerRenewals(ownerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('lease_renewals')
        .select(`
          *,
          property:properties!inner(id, name, address, city, owner_id),
          tenant:tenants(
            id,
            user:users(id, first_name, last_name, email, phone)
          )
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
   * Create renewal request (Tenant)
   */
  static async createRenewal(
    params: CreateRenewalParams
  ): Promise<ApiResponse<LeaseRenewal>> {
    try {
      // Validate required fields
      if (!params.tenantId || !params.propertyId) {
        return {
          success: false,
          message: 'Missing required fields',
        };
      }

      // Check if there's already a pending renewal
      const { data: existing } = await supabase
        .from('lease_renewals')
        .select('id')
        .eq('tenant_id', params.tenantId)
        .eq('property_id', params.propertyId)
        .eq('status', 'pending')
        .single();

      if (existing) {
        return {
          success: false,
          message: 'You already have a pending renewal request for this property',
        };
      }

      const { data, error } = await supabase
        .from('lease_renewals')
        .insert({
          tenant_id: params.tenantId,
          property_id: params.propertyId,
          current_lease_end: params.currentLeaseEnd,
          proposed_lease_start: params.proposedLeaseStart,
          proposed_lease_end: params.proposedLeaseEnd,
          proposed_rent: params.proposedRent,
          current_rent: params.currentRent,
          duration_months: params.durationMonths,
          tenant_notes: params.tenantNotes,
          status: 'pending',
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
      console.error('Error creating renewal:', error);
      return {
        success: false,
        message: error.message || 'Failed to create renewal request',
      };
    }
  }

  /**
   * Approve renewal request (Owner)
   */
  static async approveRenewal(
    renewalId: string,
    ownerId: string,
    ownerNotes?: string
  ): Promise<ApiResponse> {
    try {
      // Get renewal details
      const { data: renewal, error: fetchError } = await supabase
        .from('lease_renewals')
        .select(`
          *,
          property:properties!inner(owner_id),
          tenant:tenants(id, lease_start, lease_end)
        `)
        .eq('id', renewalId)
        .single();

      if (fetchError) throw fetchError;

      // Verify owner
      if (renewal.property.owner_id !== ownerId) {
        return {
          success: false,
          message: 'Unauthorized',
        };
      }

      // Update renewal status
      const { error: updateError } = await supabase
        .from('lease_renewals')
        .update({
          status: 'approved',
          reviewed_by: ownerId,
          reviewed_at: new Date().toISOString(),
          owner_notes: ownerNotes,
        })
        .eq('id', renewalId);

      if (updateError) throw updateError;

      // Update tenant's lease dates
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          lease_start: renewal.proposed_lease_start,
          lease_end: renewal.proposed_lease_end,
          monthly_rent: renewal.proposed_rent,
        })
        .eq('id', renewal.tenant_id);

      if (tenantError) throw tenantError;

      return {
        success: true,
        message: 'Renewal approved successfully. Lease dates have been updated.',
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
   * Reject renewal request (Owner)
   */
  static async rejectRenewal(
    renewalId: string,
    ownerId: string,
    ownerNotes: string
  ): Promise<ApiResponse> {
    try {
      // Get renewal details
      const { data: renewal, error: fetchError } = await supabase
        .from('lease_renewals')
        .select(`
          *,
          property:properties!inner(owner_id)
        `)
        .eq('id', renewalId)
        .single();

      if (fetchError) throw fetchError;

      // Verify owner
      if (renewal.property.owner_id !== ownerId) {
        return {
          success: false,
          message: 'Unauthorized',
        };
      }

      // Update renewal status
      const { error: updateError } = await supabase
        .from('lease_renewals')
        .update({
          status: 'rejected',
          reviewed_by: ownerId,
          reviewed_at: new Date().toISOString(),
          owner_notes: ownerNotes,
        })
        .eq('id', renewalId);

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Renewal rejected',
      };
    } catch (error: any) {
      console.error('Error rejecting renewal:', error);
      return {
        success: false,
        message: error.message || 'Failed to reject renewal',
      };
    }
  }

  /**
   * Cancel renewal request (Tenant)
   */
  static async cancelRenewal(renewalId: string, tenantId: string): Promise<ApiResponse> {
    try {
      // Verify tenant owns this renewal
      const { data: renewal, error: fetchError } = await supabase
        .from('lease_renewals')
        .select('tenant_id, status')
        .eq('id', renewalId)
        .single();

      if (fetchError) throw fetchError;

      if (renewal.tenant_id !== tenantId) {
        return {
          success: false,
          message: 'Unauthorized',
        };
      }

      if (renewal.status !== 'pending') {
        return {
          success: false,
          message: 'Can only cancel pending renewal requests',
        };
      }

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
        message: error.message || 'Failed to cancel renewal',
      };
    }
  }

  /**
   * Get renewal statistics for tenant
   */
  static async getTenantRenewalStats(tenantId: string): Promise<any> {
    try {
      const renewals = await this.getTenantRenewals(tenantId);

      return {
        total: renewals.length,
        pending: renewals.filter((r) => r.status === 'pending').length,
        approved: renewals.filter((r) => r.status === 'approved').length,
        rejected: renewals.filter((r) => r.status === 'rejected').length,
      };
    } catch (error) {
      console.error('Error calculating tenant renewal stats:', error);
      return null;
    }
  }

  /**
   * Get renewal statistics for owner
   */
  static async getOwnerRenewalStats(ownerId: string): Promise<any> {
    try {
      const renewals = await this.getOwnerRenewals(ownerId);

      return {
        total: renewals.length,
        pending: renewals.filter((r) => r.status === 'pending').length,
        approved: renewals.filter((r) => r.status === 'approved').length,
        rejected: renewals.filter((r) => r.status === 'rejected').length,
      };
    } catch (error) {
      console.error('Error calculating owner renewal stats:', error);
      return null;
    }
  }
}

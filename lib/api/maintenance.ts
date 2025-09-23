import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type MaintenanceRequest =
  Database['public']['Tables']['maintenance_requests']['Row'];
type MaintenanceRequestInsert =
  Database['public']['Tables']['maintenance_requests']['Insert'];
type MaintenanceRequestUpdate =
  Database['public']['Tables']['maintenance_requests']['Update'];

export class MaintenanceAPI {
  static async getMaintenanceRequests(propertyId?: string, tenantId?: string) {
    try {
      let query = supabase
        .from('maintenance_requests')
        .select(
          `
          *,
          tenant:tenants(
            *,
            user:users(*)
          ),
          property:properties(*)
        `
        )
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get maintenance requests error:', error);
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

  static async getMaintenanceRequest(id: string) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select(
          `
          *,
          tenant:tenants(
            *,
            user:users(*)
          ),
          property:properties(*)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get maintenance request error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch maintenance request',
        data: null
      };
    }
  }

  static async createMaintenanceRequest(
    request: Omit<MaintenanceRequestInsert, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert([request])
        .select(
          `
          *,
          tenant:tenants(
            *,
            user:users(*)
          ),
          property:properties(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Send notification to property owner
      if (data) {
        await this.notifyPropertyOwner(data);
      }

      return {
        success: true,
        message: 'Maintenance request created successfully',
        data
      };
    } catch (error) {
      console.error('Create maintenance request error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create maintenance request',
        data: null
      };
    }
  }

  static async updateMaintenanceRequest(
    id: string,
    updates: MaintenanceRequestUpdate
  ) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          tenant:tenants(
            *,
            user:users(*)
          ),
          property:properties(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Maintenance request updated successfully',
        data
      };
    } catch (error) {
      console.error('Update maintenance request error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update maintenance request',
        data: null
      };
    }
  }

  static async assignMaintenanceRequest(
    id: string,
    assignedTo: string,
    scheduledDate?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          assigned_to: assignedTo,
          scheduled_date: scheduledDate,
          status: 'in_progress'
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Maintenance request assigned successfully',
        data
      };
    } catch (error) {
      console.error('Assign maintenance request error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to assign maintenance request',
        data: null
      };
    }
  }

  static async completeMaintenanceRequest(
    id: string,
    actualCost?: number,
    ownerNotes?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          status: 'completed',
          completed_date: new Date().toISOString(),
          actual_cost: actualCost,
          owner_notes: ownerNotes
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Maintenance request completed successfully',
        data
      };
    } catch (error) {
      console.error('Complete maintenance request error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to complete maintenance request',
        data: null
      };
    }
  }

  static async getMaintenanceRequestsByStatus(
    status: string,
    propertyId?: string
  ) {
    try {
      let query = supabase
        .from('maintenance_requests')
        .select(
          `
          *,
          tenant:tenants(
            *,
            user:users(*)
          ),
          property:properties(*)
        `
        )
        .eq('status', status)
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
      console.error('Get maintenance requests by status error:', error);
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

  static async getMaintenanceStats(
    propertyId?: string,
    startDate?: string,
    endDate?: string
  ) {
    try {
      let query = supabase
        .from('maintenance_requests')
        .select('status, priority, actual_cost, estimated_cost');

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Calculate statistics
      const stats = {
        total: data?.length || 0,
        pending: data?.filter(r => r.status === 'pending').length || 0,
        in_progress: data?.filter(r => r.status === 'in_progress').length || 0,
        completed: data?.filter(r => r.status === 'completed').length || 0,
        high_priority:
          data?.filter(r => r.priority === 'high' || r.priority === 'urgent')
            .length || 0,
        total_cost:
          data?.reduce(
            (sum, r) => sum + (r.actual_cost || r.estimated_cost || 0),
            0
          ) || 0
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get maintenance stats error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch maintenance statistics',
        data: null
      };
    }
  }

  static async deleteMaintenanceRequest(id: string) {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Maintenance request deleted successfully'
      };
    } catch (error) {
      console.error('Delete maintenance request error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete maintenance request'
      };
    }
  }

  private static async notifyPropertyOwner(maintenanceRequest: any) {
    try {
      // Get property owner
      const { data: property } = await supabase
        .from('properties')
        .select('owner_id')
        .eq('id', maintenanceRequest.property_id)
        .single();

      if (property?.owner_id) {
        // Create notification
        await supabase.from('notifications').insert({
          user_id: property.owner_id,
          title: 'New Maintenance Request',
          message: `A new maintenance request has been submitted for ${maintenanceRequest.title}`,
          type: 'maintenance',
          priority:
            maintenanceRequest.priority === 'urgent' ? 'high' : 'medium',
          action_url: `/dashboard/maintenance/${maintenanceRequest.id}`,
          data: {
            maintenance_request_id: maintenanceRequest.id,
            property_id: maintenanceRequest.property_id
          }
        });
      }
    } catch (error) {
      console.error('Failed to notify property owner:', error);
    }
  }
}

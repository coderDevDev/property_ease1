import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type MaintenanceRequest =
  Database['public']['Tables']['maintenance_requests']['Row'];
type MaintenanceRequestInsert =
  Database['public']['Tables']['maintenance_requests']['Insert'];
type MaintenanceRequestUpdate =
  Database['public']['Tables']['maintenance_requests']['Update'];

export class MaintenanceAPI {
  static async getMaintenanceRequests(
    propertyId?: string,
    tenantId?: string,
    options?: {
      page?: number;
      pageSize?: number;
    }
  ) {
    try {
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Skip count query to avoid timeout - we'll estimate based on results
      // Count can be slow with complex filters, so we'll estimate
      let count = 0;

      // Then get the actual data with relations
      let query = supabase
        .from('maintenance_requests')
        .select(
          `
          id,
          tenant_id,
          property_id,
          title,
          description,
          category,
          priority,
          status,
          images,
          estimated_cost,
          actual_cost,
          assigned_to,
          assigned_personnel_phone,
          scheduled_date,
          completed_date,
          tenant_notes,
          owner_notes,
          feedback_rating,
          feedback_comment,
          feedback_submitted_at,
          feedback_required,
          created_at,
          updated_at,
          tenant:tenants(
            id,
            user_id,
            property_id,
            unit_number,
            user:users(
              id,
              email,
              first_name,
              last_name,
              phone,
              role
            )
          ),
          property:properties(
            id,
            name,
            address,
            city,
            type
          )
        `
        )
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      // Apply pagination
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Estimate total: if we got a full page, there's likely more
      const hasMore = data && data.length === pageSize;
      if (hasMore) {
        count = page * pageSize + 1; // At least this many
      } else {
        count = (page - 1) * pageSize + (data?.length || 0);
      }

      return {
        success: true,
        data: data || [],
        pagination: {
          page,
          pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize) || 1
        }
      };
    } catch (error) {
      console.error('Get maintenance requests error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch maintenance requests',
        data: [],
        pagination: {
          page: 1,
          pageSize: 20,
          total: 0,
          totalPages: 0
        }
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
    scheduledDate?: string,
    personnelPhone?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          assigned_to: assignedTo,
          assigned_personnel_phone: personnelPhone,
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
      // First, check if feedback is required and if it has been submitted
      const { data: request, error: fetchError } = await supabase
        .from('maintenance_requests')
        .select('feedback_required, feedback_rating')
        .eq('id', id)
        .single();

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // If feedback is required but not submitted, prevent completion
      if (request?.feedback_required && !request?.feedback_rating) {
        return {
          success: false,
          message:
            'Cannot complete request. Tenant feedback is required before completion.',
          data: null
        };
      }

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

  static async submitFeedback(id: string, rating: number, comment: string) {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        return {
          success: false,
          message: 'Rating must be between 1 and 5',
          data: null
        };
      }

      // Validate comment is not empty
      if (!comment || comment.trim().length === 0) {
        return {
          success: false,
          message: 'Comment is required',
          data: null
        };
      }

      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          feedback_rating: rating,
          feedback_comment: comment.trim(),
          feedback_submitted_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Feedback submitted successfully',
        data
      };
    } catch (error) {
      console.error('Submit feedback error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to submit feedback',
        data: null
      };
    }
  }

  static async requestFeedback(id: string) {
    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .update({
          feedback_required: true,
          status: 'in_progress' // Keep as in_progress until feedback is received
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Feedback request sent to tenant',
        data
      };
    } catch (error) {
      console.error('Request feedback error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to request feedback',
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
          id,
          tenant_id,
          property_id,
          title,
          description,
          category,
          priority,
          status,
          images,
          estimated_cost,
          actual_cost,
          assigned_to,
          assigned_personnel_phone,
          scheduled_date,
          completed_date,
          tenant_notes,
          owner_notes,
          feedback_rating,
          feedback_comment,
          feedback_submitted_at,
          feedback_required,
          created_at,
          updated_at,
          tenant:tenants(
            id,
            user_id,
            property_id,
            unit_number,
            lease_start,
            lease_end,
            monthly_rent,
            deposit,
            security_deposit,
            status,
            user:users(
              id,
              email,
              first_name,
              last_name,
              phone,
              role
            )
          ),
          property:properties(
            id,
            name,
            address,
            city,
            type
          )
        `
        )
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(500);

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
          action_url: `/owner/dashboard/maintenance/${maintenanceRequest.id}`,
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

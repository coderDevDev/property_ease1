import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Tenant = Database['public']['Tables']['tenants']['Row'];
type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
type TenantUpdate = Database['public']['Tables']['tenants']['Update'];

export interface TenantAnalytics {
  totalPayments: number;
  paidOnTime: number;
  latePayments: number;
  averagePaymentDelay: number;
  maintenanceRequests: number;
  leaseRenewalDate: string;
  tenancyDuration: number; // in months
}

export interface TenantFormData {
  user_id: string;
  property_id: string;
  unit_number: string;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  deposit: number;
  security_deposit: number;
  status: 'active' | 'pending' | 'terminated';
  lease_terms?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
}

export class TenantsAPI {
  static async getTenants(ownerId: string) {
    try {
      // First get owner's property IDs
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', ownerId);
      
      if (propError) {
        throw new Error(propError.message);
      }
      
      if (!properties || properties.length === 0) {
        return { success: true, data: [] };
      }
      
      const propertyIds = properties.map(p => p.id);
      
      // Then get tenants for those properties
      const { data, error } = await supabase
        .from('tenants')
        .select(
          `
          *,
          user:users(*),
          property:properties(*)
        `
        )
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get tenants error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch tenants',
        data: []
      };
    }
  }

  static async getTenant(id: string) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(
          `
          *,
          user:users(*),
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
      console.error('Get tenant error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch tenant',
        data: null
      };
    }
  }

  static async createTenant(
    tenant: Omit<TenantInsert, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([tenant])
        .select(
          `
          *,
          user:users(*),
          property:properties(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update property occupied units
      await supabase.rpc('increment_occupied_units', {
        property_id: tenant.property_id
      });

      return {
        success: true,
        message: 'Tenant created successfully',
        data
      };
    } catch (error) {
      console.error('Create tenant error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create tenant',
        data: null
      };
    }
  }

  static async updateTenant(id: string, updates: TenantUpdate) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          user:users(*),
          property:properties(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Tenant updated successfully',
        data
      };
    } catch (error) {
      console.error('Update tenant error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update tenant',
        data: null
      };
    }
  }

  static async deleteTenant(id: string) {
    try {
      // Get tenant data first to update property occupied units
      const { data: tenant } = await supabase
        .from('tenants')
        .select('property_id')
        .eq('id', id)
        .single();

      const { error } = await supabase.from('tenants').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Update property occupied units
      if (tenant) {
        await supabase.rpc('decrement_occupied_units', {
          property_id: tenant.property_id
        });
      }

      return {
        success: true,
        message: 'Tenant deleted successfully'
      };
    } catch (error) {
      console.error('Delete tenant error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete tenant'
      };
    }
  }

  static async getTenantByUserId(userId: string) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(
          `
          *,
          property:properties(*)
        `
        )
        .eq('user_id', userId)
        .eq('status', 'active')
   
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get tenant by user ID error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch tenant data',
        data: null
      };
    }
  }

  static async getTenantAnalytics(
    tenantId: string
  ): Promise<{ success: boolean; data?: TenantAnalytics; message?: string }> {
    try {
      // Get tenant details
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();

      if (tenantError) throw new Error(tenantError.message);

      // Get payments for this tenant
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId);

      if (paymentsError) throw new Error(paymentsError.message);

      // Get maintenance requests for this tenant
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', tenantId);

      if (maintenanceError) throw new Error(maintenanceError.message);

      // Calculate analytics
      const totalPayments = payments?.length || 0;
      const paidOnTime =
        payments?.filter(
          p =>
            p.payment_status === 'completed' &&
            new Date(p.payment_date) <= new Date(p.due_date)
        ).length || 0;
      const latePayments =
        payments?.filter(
          p =>
            p.payment_status === 'completed' &&
            new Date(p.payment_date) > new Date(p.due_date)
        ).length || 0;

      // Calculate average payment delay
      const latePaymentDelays =
        payments
          ?.filter(
            p =>
              p.payment_status === 'completed' &&
              new Date(p.payment_date) > new Date(p.due_date)
          )
          .map(p => {
            const dueDate = new Date(p.due_date);
            const paidDate = new Date(p.payment_date);
            return Math.ceil(
              (paidDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
            );
          }) || [];

      const averagePaymentDelay =
        latePaymentDelays.length > 0
          ? latePaymentDelays.reduce((sum, delay) => sum + delay, 0) /
            latePaymentDelays.length
          : 0;

      // Calculate tenancy duration
      const leaseStart = new Date(tenant.lease_start);
      const now = new Date();
      const tenancyDuration = Math.ceil(
        (now.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      const analytics: TenantAnalytics = {
        totalPayments,
        paidOnTime,
        latePayments,
        averagePaymentDelay,
        maintenanceRequests: maintenance?.length || 0,
        leaseRenewalDate: tenant.lease_end,
        tenancyDuration
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error('Get tenant analytics error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch tenant analytics'
      };
    }
  }

  static async searchTenants(ownerId: string, searchTerm: string) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(
          `
          *,
          user:users(*),
          property:properties(*)
        `
        )
        .eq('properties.owner_id', ownerId)
        .or(
          `
          user.first_name.ilike.%${searchTerm}%,
          user.last_name.ilike.%${searchTerm}%,
          user.email.ilike.%${searchTerm}%,
          unit_number.ilike.%${searchTerm}%,
          property.name.ilike.%${searchTerm}%
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Search tenants error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to search tenants',
        data: []
      };
    }
  }

  static async getTenantsExpiringSoon(ownerId: string, daysAhead: number = 30) {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const { data, error } = await supabase
        .from('tenants')
        .select(
          `
          *,
          user:users(*),
          property:properties(*)
        `
        )
        .eq('properties.owner_id', ownerId)
        .lte('lease_end', futureDate.toISOString())
        .eq('status', 'active')
        .order('lease_end', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get expiring leases error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch expiring leases',
        data: []
      };
    }
  }

  static async renewLease(
    tenantId: string,
    newLeaseEnd: string,
    newRent?: number
  ) {
    try {
      const updates: any = {
        lease_end: newLeaseEnd,
        updated_at: new Date().toISOString()
      };

      if (newRent !== undefined) {
        updates.monthly_rent = newRent;
      }

      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
        .select(
          `
          *,
          user:users(*),
          property:properties(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Lease renewed successfully',
        data
      };
    } catch (error) {
      console.error('Renew lease error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to renew lease',
        data: null
      };
    }
  }

  static async getAvailableUsers() {
    try {
      // Get users who are not already tenants and have role 'tenant'
      const { data: existingTenantUsers, error: tenantsError } = await supabase
        .from('tenants')
        .select('user_id')
        .eq('status', 'active');

      if (tenantsError) throw new Error(tenantsError.message);

      const existingUserIds = existingTenantUsers?.map(t => t.user_id) || [];

      let query = supabase.from('users').select('*').eq('role', 'tenant');

      if (existingUserIds.length > 0) {
        query = query.not('id', 'in', `(${existingUserIds.join(',')})`);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get available users error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch available users',
        data: []
      };
    }
  }
}

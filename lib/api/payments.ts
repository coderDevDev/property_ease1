import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export class PaymentsAPI {
  static async getPayments(tenantId?: string, propertyId?: string) {
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
        .order('due_date', { ascending: false });

      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get payments error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch payments',
        data: []
      };
    }
  }

  static async getPayment(id: string) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(
          `
          *,
          tenant:tenants(*),
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
      console.error('Get payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch payment',
        data: null
      };
    }
  }

  static async createPayment(
    payment: Omit<PaymentInsert, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .select(
          `
          *,
          tenant:tenants(*),
          property:properties(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Payment record created successfully',
        data
      };
    } catch (error) {
      console.error('Create payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create payment',
        data: null
      };
    }
  }

  static async updatePayment(id: string, updates: PaymentUpdate) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          tenant:tenants(*),
          property:properties(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Payment updated successfully',
        data
      };
    } catch (error) {
      console.error('Update payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update payment',
        data: null
      };
    }
  }

  static async deletePayment(id: string) {
    try {
      const { error } = await supabase.from('payments').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Payment deleted successfully'
      };
    } catch (error) {
      console.error('Delete payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete payment'
      };
    }
  }

  static async getPaymentsByStatus(status: string, propertyId?: string) {
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
        .eq('payment_status', status)
        .order('due_date', { ascending: true });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get payments by status error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch payments',
        data: []
      };
    }
  }

  static async getOverduePayments(propertyId?: string) {
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
        .eq('payment_status', 'pending')
        .lt('due_date', new Date().toISOString())
        .order('due_date', { ascending: true });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get overdue payments error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch overdue payments',
        data: []
      };
    }
  }

  static async recordPayment(
    paymentId: string,
    paymentMethod: string,
    referenceNumber?: string,
    receiptUrl?: string
  ) {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          payment_status: 'paid',
          paid_date: new Date().toISOString(),
          payment_method: paymentMethod,
          reference_number: referenceNumber,
          receipt_url: receiptUrl
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Payment recorded successfully',
        data
      };
    } catch (error) {
      console.error('Record payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to record payment',
        data: null
      };
    }
  }
}

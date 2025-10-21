import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import {
  generateLeasePayments,
  validateLeaseForPaymentGeneration,
  calculateLeaseTotal
} from '@/lib/utils/paymentGenerator';
import type { Database } from '@/types/database';

export type { LeaseDetails } from '@/lib/utils/paymentGenerator';

type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

export interface PaymentWithDetails extends Payment {
  tenant: {
    id: string;
    unit_number: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    };
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    type: string;
  };
  created_by_user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  // Refund tracking fields (from migration)
  is_refunded?: boolean;
  refund_id?: string;
  refund_amount?: number;
}

export interface PaymentFormData {
  tenant_id: string;
  property_id: string;
  amount: number;
  payment_type:
    | 'rent'
    | 'deposit'
    | 'security_deposit'
    | 'utility'
    | 'penalty'
    | 'other';
  payment_method: 'gcash' | 'maya' | 'bank_transfer' | 'check';
  due_date: string;
  late_fee?: number;
  reference_number?: string;
  notes?: string;
  sendXenditLink?: boolean;
}

export interface PaymentStats {
  total: number;
  pending: number;
  paid: number;
  overdue: number;
  failed: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  overdueAmount: number;
}

export class PaymentsAPI {
  static async getPayments(
    propertyId?: string,
    tenantId?: string,
    userId?: string
  ): Promise<{
    success: boolean;
    data?: PaymentWithDetails[];
    message?: string;
  }> {
    try {
      let query = supabase
        .from('payments')
        .select(
          `
          *,
          tenant:tenants(
            id,
            unit_number,
            user:users(
              id,
              first_name,
              last_name,
              email,
              phone
            )
          ),
          property:properties(
            id,
            name,
            address,
            city,
            type
          ),
          created_by_user:users!payments_created_by_fkey(
            id,
            first_name,
            last_name,
            email
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

  static async getPayment(paymentId: string): Promise<{
    success: boolean;
    data?: PaymentWithDetails;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(
          `
          *,
          tenant:tenants(
            id,
            unit_number,
            user:users(
              id,
              first_name,
              last_name,
              email,
              phone
            )
          ),
          property:properties(
            id,
            name,
            address,
            city,
            type
          ),
          created_by_user:users!payments_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .eq('id', paymentId)
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
        data: undefined
      };
    }
  }

  static async createPayment(
    paymentData: PaymentFormData,
    createdBy: string
  ): Promise<{
    success: boolean;
    data?: Payment;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          ...paymentData,
          created_by: createdBy,
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Create payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create payment',
        data: undefined
      };
    }
  }

  static async createPaymentWithXendit(data: {
    tenant_id: string;
    property_id: string;
    amount: number;
    payment_type: string;
    payment_method: string;
    due_date: string;
    description?: string;
    created_by: string;
    sendXenditLink?: boolean;
  }): Promise<{ success: boolean; data?: Payment; message?: string }> {
    try {
      let xenditLink = null;

      // Generate Xendit payment link if requested
      if (data.sendXenditLink) {
        try {
          const xenditResponse = await fetch(
            '/api/xendit/create-payment-link',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                amount: data.amount,
                description: data.description || `${data.payment_type} payment`,
                external_id: `payment_${Date.now()}`,
                customer_email: '', // Will be filled by tenant email
                customer_name: '' // Will be filled by tenant name
              })
            }
          );

          if (xenditResponse.ok) {
            const xenditData = await xenditResponse.json();
            xenditLink = xenditData.invoice_url;
          }
        } catch (xenditError) {
          console.warn('Failed to create Xendit link:', xenditError);
          // Continue with payment creation even if Xendit fails
        }
      }

      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          tenant_id: data.tenant_id,
          property_id: data.property_id,
          amount: data.amount,
          payment_type: data.payment_type,
          payment_method: data.payment_method,
          due_date: data.due_date,
          notes: data.description || null,
          created_by: data.created_by,
          payment_status: 'pending',
          reference_number: xenditLink // Store Xendit link as reference
        })
        .select()
        .single();

      if (error) {
        console.error('Create payment with Xendit error:', error);
        return {
          success: false,
          message: error.message || 'Failed to create payment',
          data: undefined
        };
      }

      return {
        success: true,
        data: payment,
        message: xenditLink
          ? 'Payment created successfully with Xendit link'
          : 'Payment created successfully'
      };
    } catch (error) {
      console.error('Create payment with Xendit error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create payment',
        data: undefined
      };
    }
  }

  static async updatePayment(
    paymentId: string,
    updateData: Partial<PaymentUpdate>
  ): Promise<{
    success: boolean;
    data?: Payment;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Update payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update payment',
        data: undefined
      };
    }
  }

  static async deletePayment(paymentId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, message: 'Payment deleted successfully' };
    } catch (error) {
      console.error('Delete payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete payment'
      };
    }
  }

  static async markPaymentAsPaid(
    paymentId: string,
    receiptUrl?: string,
    referenceNumber?: string
  ): Promise<{
    success: boolean;
    data?: Payment;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update({
          payment_status: 'paid',
          paid_date: new Date().toISOString(),
          receipt_url: receiptUrl,
          reference_number: referenceNumber
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Mark payment as paid error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark payment as paid',
        data: undefined
      };
    }
  }

  static async getPaymentStats(
    propertyId?: string,
    tenantId?: string
  ): Promise<{
    success: boolean;
    data?: PaymentStats;
    message?: string;
  }> {
    try {
      let query = supabase.from('payments').select('*');

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data: payments, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const stats: PaymentStats = {
        total: payments?.length || 0,
        pending:
          payments?.filter(p => p.payment_status === 'pending').length || 0,
        paid: payments?.filter(p => p.payment_status === 'paid').length || 0,
        overdue:
          payments?.filter(
            p =>
              p.payment_status === 'pending' &&
              new Date(p.due_date) < new Date()
          ).length || 0,
        failed:
          payments?.filter(p => p.payment_status === 'failed').length || 0,
        totalAmount:
          payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        pendingAmount:
          payments
            ?.filter(p => p.payment_status === 'pending')
            .reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        paidAmount:
          payments
            ?.filter(p => p.payment_status === 'paid')
            .reduce((sum, p) => sum + Number(p.amount), 0) || 0,
        overdueAmount:
          payments
            ?.filter(
              p =>
                p.payment_status === 'pending' &&
                new Date(p.due_date) < new Date()
            )
            .reduce((sum, p) => sum + Number(p.amount), 0) || 0
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Get payment stats error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch payment statistics',
        data: undefined
      };
    }
  }

  /**
   * Get payments for a tenant by user_id
   * Note: A tenant can have multiple active rentals
   */
  static async getTenantPayments(userId: string) {
    try {
      // First, get all tenant records for this user (can have multiple properties)
      const { data: tenants, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (tenantError) {
        console.error('Tenant lookup error:', tenantError);
        throw new Error('Failed to fetch tenant records');
      }

      if (!tenants || tenants.length === 0) {
        console.log('No active tenant records found for user:', userId);
        return {
          success: true,
          data: [], // Return empty array instead of error
          message: 'No active rentals found'
        };
      }

      // Get all tenant IDs
      const tenantIds = tenants.map(t => t.id);

      // Get all payments for these tenants (across all properties)
      const { data, error } = await supabase
        .from('payments')
        .select(
          `
          *,
          tenant:tenants!inner(
            id,
            unit_number,
            user:users!inner(
              id,
              first_name,
              last_name,
              email,
              phone
            )
          ),
          property:properties(
            id,
            name,
            address,
            city,
            type
          ),
          created_by_user:users!payments_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .in('tenant_id', tenantIds) // Use 'in' to get payments for all tenant records
        .order('due_date', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Remove duplicates based on payment ID (in case of duplicate tenant records)
      const uniquePayments = data
        ? Array.from(
            new Map(data.map(payment => [payment.id, payment])).values()
          )
        : [];

      return { success: true, data: uniquePayments };
    } catch (error) {
      console.error('Get tenant payments error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch tenant payments',
        data: []
      };
    }
  }

  static async getOwnerPayments(ownerId: string): Promise<{
    success: boolean;
    data?: PaymentWithDetails[];
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

      if (!properties || properties.length === 0) {
        return { success: true, data: [] };
      }

      // Get payments for all owned properties
      const { data: payments, error } = await supabase
        .from('payments')
        .select(
          `
          *,
          tenant:tenants(
            id,
            unit_number,
            user:users(
              id,
              first_name,
              last_name,
              email,
              phone
            )
          ),
          property:properties(
            id,
            name,
            address,
            city,
            type
          ),
          created_by_user:users!payments_created_by_fkey(
            id,
            first_name,
            last_name,
            email
          )
        `
        )
        .in(
          'property_id',
          properties.map(p => p.id)
        )
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: payments || [] };
    } catch (error) {
      console.error('Get owner payments error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch owner payments',
        data: []
      };
    }
  }

  // ============================================================================
  // REFUND MANAGEMENT
  // ============================================================================

  /**
   * Request a refund for a payment (tenant)
   */
  static async requestRefund(
    paymentId: string,
    amount: number,
    reason: string
  ): Promise<{
    success: boolean;
    message?: string;
    data?: any;
  }> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('request_payment_refund', {
        p_payment_id: paymentId,
        p_user_id: user.id,
        p_amount: amount,
        p_reason: reason
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Refund request submitted successfully',
        data
      };
    } catch (error) {
      console.error('Request refund error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to request refund'
      };
    }
  }

  /**
   * Get refund requests for a user (tenant)
   */
  static async getUserRefunds(userId: string): Promise<{
    success: boolean;
    message?: string;
    data?: any[];
  }> {
    try {
      const { data, error } = await supabase
        .from('payment_refunds')
        .select(
          `
          *,
          payment:payments(
            *,
            property:properties(id, name, address, city)
          ),
          reviewed_by_user:users!reviewed_by(first_name, last_name)
        `
        )
        .eq('requested_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Get user refunds error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch refund requests',
        data: []
      };
    }
  }

  /**
   * Get refund details
   */
  static async getRefund(refundId: string): Promise<{
    success: boolean;
    message?: string;
    data?: any;
  }> {
    try {
      const { data, error } = await supabase
        .from('payment_refunds')
        .select(
          `
          *,
          payment:payments(
            *,
            tenant:tenants(
              id,
              unit_number,
              user:users(first_name, last_name, email, phone)
            ),
            property:properties(id, name, address, city)
          ),
          requested_by_user:users!requested_by(first_name, last_name, email),
          reviewed_by_user:users!reviewed_by(first_name, last_name, email)
        `
        )
        .eq('id', refundId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Get refund error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch refund'
      };
    }
  }

  /**
   * Check if payment can be refunded
   */
  static async canRequestRefund(paymentId: string): Promise<{
    success: boolean;
    canRefund: boolean;
    reason?: string;
  }> {
    try {
      const { data: payment, error } = await supabase
        .from('payments')
        .select('*, payment_refunds(*)')
        .eq('id', paymentId)
        .single();

      if (error) throw error;

      // Check if already refunded
      if (payment.is_refunded) {
        return {
          success: true,
          canRefund: false,
          reason: 'Payment already refunded'
        };
      }

      // Check if payment is not paid
      if (payment.payment_status !== 'paid') {
        return {
          success: true,
          canRefund: false,
          reason: 'Only paid payments can be refunded'
        };
      }

      // Check if there's a pending refund request
      const pendingRefund = payment.payment_refunds?.find(
        (r: any) => r.status === 'pending'
      );
      if (pendingRefund) {
        return {
          success: true,
          canRefund: false,
          reason: 'Refund request already pending'
        };
      }

      return {
        success: true,
        canRefund: true
      };
    } catch (error) {
      console.error('Check refund eligibility error:', error);
      return {
        success: false,
        canRefund: false,
        reason: 'Failed to check refund eligibility'
      };
    }
  }
}

/**
 * Advance Payments API
 * Handles prepayments and automatic allocation to rent
 * 
 * @module AdvancePaymentsAPI
 * @created October 25, 2025
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface AdvancePayment {
  id: string;
  tenant_id: string;
  property_id: string;
  payment_id: string | null;
  total_amount: number;
  allocated_amount: number;
  remaining_balance: number;
  months_covered: number;
  start_month: string;
  end_month: string;
  status: 'active' | 'fully_allocated' | 'cancelled' | 'refunded';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdvancePaymentAllocation {
  id: string;
  advance_payment_id: string;
  payment_id: string;
  allocated_amount: number;
  allocation_date: string;
  payment_month: string;
  notes: string | null;
  created_at: string;
}

export interface PaymentSchedule {
  id: string;
  tenant_id: string;
  property_id: string;
  due_date: string;
  amount: number;
  payment_type: string;
  status: 'scheduled' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  paid_amount: number;
  remaining_amount: number;
  payment_id: string | null;
  advance_payment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAdvancePaymentParams {
  tenantId: string;
  propertyId: string;
  totalAmount: number;
  monthsCovered: number;
  startMonth: string;
  paymentId?: string;
  notes?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

// =====================================================
// ADVANCE PAYMENTS API CLASS
// =====================================================

export class AdvancePaymentsAPI {
  // ===================================================
  // ADVANCE PAYMENTS - TENANT METHODS
  // ===================================================

  /**
   * Get tenant's advance payments
   */
  static async getTenantAdvancePayments(tenantId: string): Promise<AdvancePayment[]> {
    try {
      const { data, error } = await supabase
        .from('advance_payments')
        .select(`
          *,
          property:properties(id, name, address),
          tenant:tenants(id, user:users(id, first_name, last_name, email))
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching tenant advance payments:', error);
      throw error;
    }
  }

  /**
   * Get active advance payment for tenant
   */
  static async getActiveAdvancePayment(
    tenantId: string,
    propertyId: string
  ): Promise<AdvancePayment | null> {
    try {
      const { data, error } = await supabase
        .from('advance_payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .gt('remaining_balance', 0)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching active advance payment:', error);
      return null;
    }
  }

  /**
   * Get advance payment allocations
   */
  static async getAdvancePaymentAllocations(
    advancePaymentId: string
  ): Promise<AdvancePaymentAllocation[]> {
    try {
      const { data, error } = await supabase
        .from('advance_payment_allocations')
        .select('*')
        .eq('advance_payment_id', advancePaymentId)
        .order('payment_month', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching allocations:', error);
      return [];
    }
  }

  // ===================================================
  // ADVANCE PAYMENTS - OWNER METHODS
  // ===================================================

  /**
   * Get all advance payments for owner's properties
   */
  static async getOwnerAdvancePayments(ownerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('advance_payments')
        .select(`
          *,
          property:properties!inner(id, name, address, owner_id),
          tenant:tenants(id, user:users(id, first_name, last_name, email, phone))
        `)
        .eq('property.owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching owner advance payments:', error);
      return [];
    }
  }

  /**
   * Create advance payment
   */
  static async createAdvancePayment(
    params: CreateAdvancePaymentParams
  ): Promise<ApiResponse<AdvancePayment>> {
    try {
      // Validate required fields
      if (!params.tenantId || !params.propertyId || !params.totalAmount) {
        return {
          success: false,
          message: 'Missing required fields',
        };
      }

      // Calculate start and end months safely from YYYY-MM
      // Parse startMonth in the format YYYY-MM and construct proper Date objects
      const [startYearStr, startMonthStr] = params.startMonth.split('-');
      const startYear = Number(startYearStr);
      const startMonthIndex = Number(startMonthStr) - 1; // 0-indexed month

      const startDate = new Date(startYear, startMonthIndex, 1);
      // End month is the last covered month start (inclusive)
      const endDate = new Date(startYear, startMonthIndex + params.monthsCovered - 1, 1);

      // Format as YYYY-MM-01 for DATE columns
      const startMonthDateStr = `${startDate.getFullYear()}-${String(
        startDate.getMonth() + 1
      ).padStart(2, '0')}-01`;
      const endMonthDateStr = `${endDate.getFullYear()}-${String(
        endDate.getMonth() + 1
      ).padStart(2, '0')}-01`;

      // Get current user ID for created_by
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          success: false,
          message: 'User not authenticated',
        };
      }

      // First, create a payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: params.tenantId,
          property_id: params.propertyId,
          amount: params.totalAmount,
          due_date: startMonthDateStr,
          payment_type: 'deposit', // Using deposit type for advance payments
          payment_status: 'pending',
          notes: params.notes || `Advance payment for ${params.monthsCovered} months`,
          created_by: user.id, // Add the required created_by field
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Then create the advance payment record linked to the payment
      const { data, error } = await supabase
        .from('advance_payments')
        .insert({
          tenant_id: params.tenantId,
          property_id: params.propertyId,
          payment_id: paymentData.id, // Link to the payment record
          total_amount: params.totalAmount,
          remaining_balance: params.totalAmount,
          months_covered: params.monthsCovered,
          start_month: startMonthDateStr,
          end_month: endMonthDateStr,
          notes: params.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Advance payment created successfully',
      };
    } catch (error: any) {
      console.error('Error creating advance payment:', error);
      return {
        success: false,
        message: error.message || 'Failed to create advance payment',
      };
    }
  }

  /**
   * Update advance payment
   */
  static async updateAdvancePayment(
    advancePaymentId: string,
    updates: Partial<AdvancePayment>
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('advance_payments')
        .update(updates)
        .eq('id', advancePaymentId);

      if (error) throw error;

      return {
        success: true,
        message: 'Advance payment updated successfully',
      };
    } catch (error: any) {
      console.error('Error updating advance payment:', error);
      return {
        success: false,
        message: error.message || 'Failed to update advance payment',
      };
    }
  }

  /**
   * Cancel advance payment
   */
  static async cancelAdvancePayment(advancePaymentId: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('advance_payments')
        .update({ status: 'cancelled' })
        .eq('id', advancePaymentId);

      if (error) throw error;

      return {
        success: true,
        message: 'Advance payment cancelled successfully',
      };
    } catch (error: any) {
      console.error('Error cancelling advance payment:', error);
      return {
        success: false,
        message: error.message || 'Failed to cancel advance payment',
      };
    }
  }

  // ===================================================
  // PAYMENT SCHEDULES
  // ===================================================

  /**
   * Get payment schedule for tenant
   */
  static async getTenantPaymentSchedule(tenantId: string): Promise<PaymentSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching payment schedule:', error);
      return [];
    }
  }

  /**
   * Get upcoming payments for tenant
   */
  static async getUpcomingPayments(
    tenantId: string,
    months: number = 3
  ): Promise<PaymentSchedule[]> {
    try {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + months);

      const { data, error } = await supabase
        .from('payment_schedules')
        .select('*')
        .eq('tenant_id', tenantId)
        .gte('due_date', new Date().toISOString().split('T')[0])
        .lte('due_date', futureDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching upcoming payments:', error);
      return [];
    }
  }

  /**
   * Generate payment schedule for lease
   */
  static async generatePaymentSchedule(
    tenantId: string,
    propertyId: string,
    startDate: string,
    endDate: string,
    monthlyAmount: number
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase.rpc('generate_payment_schedule', {
        p_tenant_id: tenantId,
        p_property_id: propertyId,
        p_start_date: startDate,
        p_end_date: endDate,
        p_monthly_amount: monthlyAmount,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Payment schedule generated successfully',
      };
    } catch (error: any) {
      console.error('Error generating payment schedule:', error);
      return {
        success: false,
        message: error.message || 'Failed to generate payment schedule',
      };
    }
  }

  // ===================================================
  // ALLOCATION METHODS
  // ===================================================

  /**
   * Manually allocate advance payment to rent
   */
  static async allocateToPayment(
    advancePaymentId: string,
    paymentId: string,
    amount: number,
    paymentMonth: string
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase.rpc('allocate_advance_payment', {
        p_advance_payment_id: advancePaymentId,
        p_payment_id: paymentId,
        p_amount: amount,
        p_payment_month: paymentMonth,
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Advance payment allocated successfully',
      };
    } catch (error: any) {
      console.error('Error allocating advance payment:', error);
      return {
        success: false,
        message: error.message || 'Failed to allocate advance payment',
      };
    }
  }

  /**
   * Auto-allocate advance payments to due rent
   */
  static async autoAllocateAdvancePayments(): Promise<ApiResponse> {
    try {
      const { error } = await supabase.rpc('auto_allocate_advance_payments');

      if (error) throw error;

      return {
        success: true,
        message: 'Advance payments auto-allocated successfully',
      };
    } catch (error: any) {
      console.error('Error auto-allocating advance payments:', error);
      return {
        success: false,
        message: error.message || 'Failed to auto-allocate advance payments',
      };
    }
  }

  // ===================================================
  // STATISTICS & UTILITIES
  // ===================================================

  /**
   * Get advance payment statistics for tenant
   */
  static async getTenantAdvanceStats(tenantId: string): Promise<any> {
    try {
      const payments = await this.getTenantAdvancePayments(tenantId);

      const stats = {
        total: payments.length,
        active: payments.filter((p) => p.status === 'active').length,
        totalAmount: payments.reduce((sum, p) => sum + Number(p.total_amount), 0),
        allocatedAmount: payments.reduce((sum, p) => sum + Number(p.allocated_amount), 0),
        remainingBalance: payments.reduce((sum, p) => sum + Number(p.remaining_balance), 0),
      };

      return stats;
    } catch (error) {
      console.error('Error calculating tenant stats:', error);
      return null;
    }
  }

  /**
   * Get advance payment statistics for owner
   */
  static async getOwnerAdvanceStats(ownerId: string): Promise<any> {
    try {
      const payments = await this.getOwnerAdvancePayments(ownerId);

      const stats = {
        total: payments.length,
        active: payments.filter((p) => p.status === 'active').length,
        totalAmount: payments.reduce((sum, p) => sum + Number(p.total_amount), 0),
        allocatedAmount: payments.reduce((sum, p) => sum + Number(p.allocated_amount), 0),
        remainingBalance: payments.reduce((sum, p) => sum + Number(p.remaining_balance), 0),
      };

      return stats;
    } catch (error) {
      console.error('Error calculating owner stats:', error);
      return null;
    }
  }

  /**
   * Calculate months covered by advance payment
   */
  static calculateMonthsCovered(
    totalAmount: number,
    monthlyRent: number
  ): number {
    return Math.floor(totalAmount / monthlyRent);
  }

  /**
   * Get advance payment details with allocations
   */
  static async getAdvancePaymentDetails(advancePaymentId: string): Promise<any> {
    try {
      const { data: payment, error: paymentError } = await supabase
        .from('advance_payments')
        .select(`
          *,
          property:properties(id, name, address),
          tenant:tenants(id, user:users(id, first_name, last_name, email))
        `)
        .eq('id', advancePaymentId)
        .single();

      if (paymentError) throw paymentError;

      const allocations = await this.getAdvancePaymentAllocations(advancePaymentId);

      return {
        payment,
        allocations,
      };
    } catch (error: any) {
      console.error('Error fetching advance payment details:', error);
      return null;
    }
  }
}

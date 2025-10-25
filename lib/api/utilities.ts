/**
 * Utilities API
 * Handles utility bills, rates, and meter readings management
 * 
 * @module UtilitiesAPI
 * @created October 25, 2025
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES & INTERFACES
// =====================================================

export interface UtilityBill {
  id: string;
  property_id: string;
  tenant_id: string | null;
  created_by: string;
  bill_type: string;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  previous_reading: number | null;
  current_reading: number | null;
  consumption: number | null;
  unit: string | null;
  rate_per_unit: number | null;
  base_charge: number;
  consumption_charge: number;
  additional_charges: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_id: string | null;
  paid_date: string | null;
  bill_image_url: string | null;
  receipt_image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UtilityRate {
  id: string;
  property_id: string | null;
  owner_id: string;
  utility_type: string;
  rate_per_unit: number;
  base_charge: number;
  unit: string;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MeterReading {
  id: string;
  property_id: string;
  tenant_id: string | null;
  recorded_by: string;
  utility_type: string;
  reading_date: string;
  meter_reading: number;
  unit: string;
  meter_number: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateBillParams {
  propertyId: string;
  tenantId: string | null;
  createdBy: string;
  billType: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  previousReading?: number;
  currentReading?: number;
  unit?: string;
  ratePerUnit?: number;
  baseCharge?: number;
  additionalCharges?: number;
  billImageUrl?: string;
  notes?: string;
}

export interface CreateRateParams {
  propertyId?: string;
  ownerId: string;
  utilityType: string;
  ratePerUnit: number;
  baseCharge?: number;
  unit: string;
  effectiveFrom: string;
  effectiveTo?: string;
  notes?: string;
}

export interface CreateReadingParams {
  propertyId: string;
  tenantId?: string;
  recordedBy: string;
  utilityType: string;
  readingDate: string;
  meterReading: number;
  unit: string;
  meterNumber?: string;
  photoUrl?: string;
  notes?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
}

// =====================================================
// UTILITIES API CLASS
// =====================================================

export class UtilitiesAPI {
  // ===================================================
  // UTILITY BILLS - TENANT METHODS
  // ===================================================

  /**
   * Get all utility bills for a tenant
   */
  static async getTenantBills(tenantId: string): Promise<UtilityBill[]> {
    try {
      const { data, error } = await supabase
        .from('utility_bills')
        .select(`
          *,
          property:properties(id, name, address),
          tenant:tenants(id, user:users(id, full_name, email))
        `)
        .eq('tenant_id', tenantId)
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching tenant bills:', error);
      throw error;
    }
  }

  /**
   * Get pending bills for a tenant
   */
  static async getTenantPendingBills(tenantId: string): Promise<UtilityBill[]> {
    try {
      const { data, error } = await supabase
        .from('utility_bills')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('payment_status', ['pending', 'overdue'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching pending bills:', error);
      throw error;
    }
  }

  /**
   * Get bill details by ID
   */
  static async getBillById(billId: string): Promise<UtilityBill | null> {
    try {
      const { data, error } = await supabase
        .from('utility_bills')
        .select(`
          *,
          property:properties(id, name, address),
          tenant:tenants(id, user:users(id, full_name, email))
        `)
        .eq('id', billId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching bill:', error);
      return null;
    }
  }

  // ===================================================
  // UTILITY BILLS - OWNER METHODS
  // ===================================================

  /**
   * Get all utility bills for owner's properties
   */
  static async getOwnerBills(ownerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('utility_bills')
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
      console.error('Error fetching owner bills:', error);
      return [];
    }
  }

  /**
   * Get bills for a specific property
   */
  static async getPropertyBills(propertyId: string): Promise<UtilityBill[]> {
    try {
      const { data, error } = await supabase
        .from('utility_bills')
        .select(`
          *,
          tenant:tenants(id, user:users(id, full_name, email))
        `)
        .eq('property_id', propertyId)
        .order('billing_period_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching property bills:', error);
      return [];
    }
  }

  /**
   * Create a new utility bill
   */
  static async createBill(params: CreateBillParams): Promise<ApiResponse<UtilityBill>> {
    try {
      // Validate required fields
      if (!params.propertyId || !params.createdBy || !params.billType) {
        return {
          success: false,
          message: 'Missing required fields: propertyId, createdBy, billType',
        };
      }

      const { data, error } = await supabase
        .from('utility_bills')
        .insert({
          property_id: params.propertyId,
          tenant_id: params.tenantId,
          created_by: params.createdBy,
          bill_type: params.billType,
          billing_period_start: params.billingPeriodStart,
          billing_period_end: params.billingPeriodEnd,
          due_date: params.dueDate,
          previous_reading: params.previousReading,
          current_reading: params.currentReading,
          unit: params.unit,
          rate_per_unit: params.ratePerUnit,
          base_charge: params.baseCharge || 0,
          additional_charges: params.additionalCharges || 0,
          bill_image_url: params.billImageUrl,
          notes: params.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Utility bill created successfully',
      };
    } catch (error: any) {
      console.error('Error creating bill:', error);
      return {
        success: false,
        message: error.message || 'Failed to create utility bill',
      };
    }
  }

  /**
   * Update utility bill
   */
  static async updateBill(
    billId: string,
    updates: Partial<UtilityBill>
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('utility_bills')
        .update(updates)
        .eq('id', billId);

      if (error) throw error;

      return {
        success: true,
        message: 'Utility bill updated successfully',
      };
    } catch (error: any) {
      console.error('Error updating bill:', error);
      return {
        success: false,
        message: error.message || 'Failed to update utility bill',
      };
    }
  }

  /**
   * Delete utility bill
   */
  static async deleteBill(billId: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('utility_bills')
        .delete()
        .eq('id', billId);

      if (error) throw error;

      return {
        success: true,
        message: 'Utility bill deleted successfully',
      };
    } catch (error: any) {
      console.error('Error deleting bill:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete utility bill',
      };
    }
  }

  /**
   * Mark bill as paid
   */
  static async markBillAsPaid(
    billId: string,
    paymentId: string
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('utility_bills')
        .update({
          payment_status: 'paid',
          payment_id: paymentId,
          paid_date: new Date().toISOString(),
        })
        .eq('id', billId);

      if (error) throw error;

      return {
        success: true,
        message: 'Bill marked as paid',
      };
    } catch (error: any) {
      console.error('Error marking bill as paid:', error);
      return {
        success: false,
        message: error.message || 'Failed to mark bill as paid',
      };
    }
  }

  // ===================================================
  // UTILITY RATES
  // ===================================================

  /**
   * Get utility rates for owner
   */
  static async getOwnerRates(ownerId: string): Promise<UtilityRate[]> {
    try {
      const { data, error } = await supabase
        .from('utility_rates')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching rates:', error);
      return [];
    }
  }

  /**
   * Get active rate for utility type
   */
  static async getActiveRate(
    ownerId: string,
    utilityType: string,
    propertyId?: string
  ): Promise<UtilityRate | null> {
    try {
      let query = supabase
        .from('utility_rates')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('utility_type', utilityType)
        .eq('is_active', true)
        .lte('effective_from', new Date().toISOString())
        .order('effective_from', { ascending: false })
        .limit(1);

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query.single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching active rate:', error);
      return null;
    }
  }

  /**
   * Create utility rate
   */
  static async createRate(params: CreateRateParams): Promise<ApiResponse<UtilityRate>> {
    try {
      const { data, error } = await supabase
        .from('utility_rates')
        .insert({
          property_id: params.propertyId,
          owner_id: params.ownerId,
          utility_type: params.utilityType,
          rate_per_unit: params.ratePerUnit,
          base_charge: params.baseCharge || 0,
          unit: params.unit,
          effective_from: params.effectiveFrom,
          effective_to: params.effectiveTo,
          notes: params.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Utility rate created successfully',
      };
    } catch (error: any) {
      console.error('Error creating rate:', error);
      return {
        success: false,
        message: error.message || 'Failed to create utility rate',
      };
    }
  }

  /**
   * Update utility rate
   */
  static async updateRate(
    rateId: string,
    updates: Partial<UtilityRate>
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('utility_rates')
        .update(updates)
        .eq('id', rateId);

      if (error) throw error;

      return {
        success: true,
        message: 'Utility rate updated successfully',
      };
    } catch (error: any) {
      console.error('Error updating rate:', error);
      return {
        success: false,
        message: error.message || 'Failed to update utility rate',
      };
    }
  }

  /**
   * Delete utility rate
   */
  static async deleteRate(rateId: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('utility_rates')
        .delete()
        .eq('id', rateId);

      if (error) throw error;

      return {
        success: true,
        message: 'Utility rate deleted successfully',
      };
    } catch (error: any) {
      console.error('Error deleting rate:', error);
      return {
        success: false,
        message: error.message || 'Failed to delete utility rate',
      };
    }
  }

  // ===================================================
  // METER READINGS
  // ===================================================

  /**
   * Get meter readings for property
   */
  static async getPropertyReadings(
    propertyId: string,
    utilityType?: string
  ): Promise<MeterReading[]> {
    try {
      let query = supabase
        .from('utility_meter_readings')
        .select('*')
        .eq('property_id', propertyId)
        .order('reading_date', { ascending: false });

      if (utilityType) {
        query = query.eq('utility_type', utilityType);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching readings:', error);
      return [];
    }
  }

  /**
   * Get latest reading for utility type
   */
  static async getLatestReading(
    propertyId: string,
    utilityType: string
  ): Promise<MeterReading | null> {
    try {
      const { data, error } = await supabase
        .from('utility_meter_readings')
        .select('*')
        .eq('property_id', propertyId)
        .eq('utility_type', utilityType)
        .order('reading_date', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching latest reading:', error);
      return null;
    }
  }

  /**
   * Create meter reading
   */
  static async createReading(params: CreateReadingParams): Promise<ApiResponse<MeterReading>> {
    try {
      const { data, error } = await supabase
        .from('utility_meter_readings')
        .insert({
          property_id: params.propertyId,
          tenant_id: params.tenantId,
          recorded_by: params.recordedBy,
          utility_type: params.utilityType,
          reading_date: params.readingDate,
          meter_reading: params.meterReading,
          unit: params.unit,
          meter_number: params.meterNumber,
          photo_url: params.photoUrl,
          notes: params.notes,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data,
        message: 'Meter reading recorded successfully',
      };
    } catch (error: any) {
      console.error('Error creating reading:', error);
      return {
        success: false,
        message: error.message || 'Failed to record meter reading',
      };
    }
  }

  // ===================================================
  // UTILITY FUNCTIONS
  // ===================================================

  /**
   * Calculate bill amount based on consumption
   */
  static calculateBillAmount(
    consumption: number,
    ratePerUnit: number,
    baseCharge: number = 0,
    additionalCharges: number = 0
  ): number {
    const consumptionCharge = consumption * ratePerUnit;
    return baseCharge + consumptionCharge + additionalCharges;
  }

  /**
   * Get bill statistics for owner
   */
  static async getOwnerBillStats(ownerId: string): Promise<any> {
    try {
      const bills = await this.getOwnerBills(ownerId);

      const stats = {
        total: bills.length,
        pending: bills.filter((b) => b.payment_status === 'pending').length,
        paid: bills.filter((b) => b.payment_status === 'paid').length,
        overdue: bills.filter((b) => b.payment_status === 'overdue').length,
        totalAmount: bills.reduce((sum, b) => sum + Number(b.total_amount), 0),
        pendingAmount: bills
          .filter((b) => b.payment_status === 'pending')
          .reduce((sum, b) => sum + Number(b.total_amount), 0),
        paidAmount: bills
          .filter((b) => b.payment_status === 'paid')
          .reduce((sum, b) => sum + Number(b.total_amount), 0),
      };

      return stats;
    } catch (error) {
      console.error('Error calculating stats:', error);
      return null;
    }
  }
}

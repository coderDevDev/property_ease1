/**
 * Deposits API
 * Handles security deposit management, move-out inspections, and deductions
 * 
 * @module DepositsAPI
 * @created October 25, 2025
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface DepositBalance {
  id: string;
  tenant_id: string;
  property_id: string;
  deposit_amount: number;
  deductions: number;
  refundable_amount: number;
  status: 'held' | 'partially_refunded' | 'fully_refunded' | 'forfeited';
  payment_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MoveOutInspection {
  id: string;
  tenant_id: string;
  property_id: string;
  inspector_id: string;
  inspection_date: string;
  checklist: InspectionChecklist;
  photos: string[];
  notes?: string;
  total_deductions: number;
  refundable_amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'disputed';
  created_at: string;
  updated_at: string;
}

export interface InspectionChecklist {
  walls?: 'good' | 'fair' | 'poor' | 'damaged';
  flooring?: 'good' | 'fair' | 'poor' | 'damaged';
  appliances?: 'good' | 'fair' | 'poor' | 'damaged';
  plumbing?: 'good' | 'fair' | 'poor' | 'damaged';
  electrical?: 'good' | 'fair' | 'poor' | 'damaged';
  windows?: 'good' | 'fair' | 'poor' | 'damaged';
  doors?: 'good' | 'fair' | 'poor' | 'damaged';
  kitchen?: 'good' | 'fair' | 'poor' | 'damaged';
  bathroom?: 'good' | 'fair' | 'poor' | 'damaged';
  cleanliness?: 'good' | 'fair' | 'poor' | 'damaged';
  [key: string]: string | undefined;
}

export interface DepositDeduction {
  id: string;
  inspection_id: string;
  item_description: string;
  cost: number;
  proof_photos: string[];
  notes?: string;
  category?: string;
  disputed: boolean;
  dispute_reason?: string;
  dispute_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: any;
}

// =====================================================
// DEPOSITS API CLASS
// =====================================================

export class DepositsAPI {
  
  // ===================================================
  // TENANT METHODS (Read-only)
  // ===================================================
  
  /**
   * Get tenant's deposit balance
   * @param tenantId - Tenant ID
   * @returns Deposit balance or null
   */
  static async getTenantDeposit(tenantId: string): Promise<DepositBalance | null> {
    try {
      const { data, error } = await supabase
        .from('deposit_balances')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No deposit found - this is normal
          return null;
        }
        console.error('Error fetching deposit:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getTenantDeposit:', error);
      return null;
    }
  }

  /**
   * Get tenant's move-out inspection
   * @param tenantId - Tenant ID
   * @returns Most recent inspection or null
   */
  static async getTenantInspection(tenantId: string): Promise<MoveOutInspection | null> {
    try {
      const { data, error } = await supabase
        .from('move_out_inspections')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching inspection:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getTenantInspection:', error);
      return null;
    }
  }

  /**
   * Get deductions for an inspection
   * @param inspectionId - Inspection ID
   * @returns Array of deductions
   */
  static async getInspectionDeductions(inspectionId: string): Promise<DepositDeduction[]> {
    try {
      const { data, error } = await supabase
        .from('deposit_deductions')
        .select('*')
        .eq('inspection_id', inspectionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching deductions:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getInspectionDeductions:', error);
      return [];
    }
  }

  /**
   * Dispute a deduction (Tenant only)
   * @param deductionId - Deduction ID
   * @param reason - Reason for dispute
   * @returns API response
   */
  static async disputeDeduction(
    deductionId: string,
    reason: string
  ): Promise<ApiResponse> {
    try {
      if (!reason || reason.trim().length === 0) {
        return { 
          success: false, 
          message: 'Dispute reason is required' 
        };
      }

      const { error } = await supabase
        .from('deposit_deductions')
        .update({
          disputed: true,
          dispute_reason: reason,
          dispute_date: new Date().toISOString()
        })
        .eq('id', deductionId);
      
      if (error) {
        return { 
          success: false, 
          message: error.message,
          error 
        };
      }
      
      return { 
        success: true, 
        message: 'Deduction disputed successfully. Owner will be notified.' 
      };
    } catch (error: any) {
      console.error('Error in disputeDeduction:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to dispute deduction',
        error 
      };
    }
  }

  // ===================================================
  // OWNER METHODS (Full CRUD)
  // ===================================================
  
  /**
   * Create deposit balance when lease starts
   * @param tenantId - Tenant ID
   * @param propertyId - Property ID
   * @param depositAmount - Deposit amount
   * @param paymentId - Optional payment ID
   * @returns API response with deposit data
   */
  static async createDepositBalance(
    tenantId: string,
    propertyId: string,
    depositAmount: number,
    paymentId?: string
  ): Promise<ApiResponse<DepositBalance>> {
    try {
      // Validation
      if (!tenantId || !propertyId) {
        return { 
          success: false, 
          message: 'Tenant ID and Property ID are required' 
        };
      }

      if (depositAmount <= 0) {
        return { 
          success: false, 
          message: 'Deposit amount must be greater than 0' 
        };
      }

      // Check if deposit already exists
      const existing = await this.getTenantDeposit(tenantId);
      if (existing) {
        return { 
          success: false, 
          message: 'Deposit already exists for this tenant' 
        };
      }

      const { data, error } = await supabase
        .from('deposit_balances')
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          deposit_amount: depositAmount,
          refundable_amount: depositAmount,
          status: 'held',
          payment_id: paymentId
        })
        .select()
        .single();
      
      if (error) {
        return { 
          success: false, 
          message: error.message,
          error 
        };
      }
      
      return { 
        success: true, 
        data,
        message: 'Deposit balance created successfully' 
      };
    } catch (error: any) {
      console.error('Error in createDepositBalance:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to create deposit balance',
        error 
      };
    }
  }

  /**
   * Get all deposits for owner's properties
   * @param ownerId - Owner user ID
   * @returns Array of deposits with tenant and property info
   */
  static async getOwnerDeposits(ownerId: string): Promise<any[]> {
    try {
      // First, get all property IDs for this owner
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', ownerId);
      
      if (propError) {
        console.error('Error fetching owner properties:', propError);
        return [];
      }
      
      if (!properties || properties.length === 0) {
        return [];
      }
      
      const propertyIds = properties.map(p => p.id);
      
      // Then get deposits for those properties
      const { data, error } = await supabase
        .from('deposit_balances')
        .select(`
          *,
          tenants (
            id,
            user_id,
            lease_start,
            lease_end,
            users (
              first_name,
              last_name,
              email
            )
          ),
          properties (
            id,
            name,
            address,
            owner_id
          )
        `)
        .in('property_id', propertyIds)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching owner deposits:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getOwnerDeposits:', error);
      return [];
    }
  }

  /**
   * Create move-out inspection
   * @param params - Inspection parameters
   * @returns API response with inspection data
   */
  static async createInspection(params: {
    tenantId: string;
    propertyId: string;
    inspectorId: string;
    checklist: InspectionChecklist;
    photos?: string[];
    notes?: string;
  }): Promise<ApiResponse<MoveOutInspection>> {
    try {
      const { tenantId, propertyId, inspectorId, checklist, photos = [], notes } = params;

      // Validation
      if (!tenantId || !propertyId || !inspectorId) {
        return { 
          success: false, 
          message: 'Tenant ID, Property ID, and Inspector ID are required' 
        };
      }

      // Get deposit to calculate initial refundable amount
      const deposit = await this.getTenantDeposit(tenantId);
      const refundableAmount = deposit?.deposit_amount || 0;

      const { data, error } = await supabase
        .from('move_out_inspections')
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          inspector_id: inspectorId,
          inspection_date: new Date().toISOString(),
          checklist,
          photos,
          notes,
          total_deductions: 0,
          refundable_amount: refundableAmount,
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) {
        return { 
          success: false, 
          message: error.message,
          error 
        };
      }
      
      return { 
        success: true, 
        data,
        message: 'Inspection created successfully' 
      };
    } catch (error: any) {
      console.error('Error in createInspection:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to create inspection',
        error 
      };
    }
  }

  /**
   * Update inspection status
   * @param inspectionId - Inspection ID
   * @param status - New status
   * @returns API response
   */
  static async updateInspectionStatus(
    inspectionId: string,
    status: MoveOutInspection['status']
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('move_out_inspections')
        .update({ status })
        .eq('id', inspectionId);
      
      if (error) {
        return { 
          success: false, 
          message: error.message,
          error 
        };
      }
      
      return { 
        success: true, 
        message: `Inspection status updated to ${status}` 
      };
    } catch (error: any) {
      console.error('Error in updateInspectionStatus:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to update inspection status',
        error 
      };
    }
  }

  /**
   * Add deduction to inspection
   * @param params - Deduction parameters
   * @returns API response with deduction data
   */
  static async addDeduction(params: {
    inspectionId: string;
    itemDescription: string;
    cost: number;
    proofPhotos?: string[];
    notes?: string;
    category?: string;
  }): Promise<ApiResponse<DepositDeduction>> {
    try {
      const { inspectionId, itemDescription, cost, proofPhotos = [], notes, category } = params;

      // Validation
      if (!inspectionId || !itemDescription) {
        return { 
          success: false, 
          message: 'Inspection ID and item description are required' 
        };
      }

      if (cost <= 0) {
        return { 
          success: false, 
          message: 'Cost must be greater than 0' 
        };
      }

      const { data, error } = await supabase
        .from('deposit_deductions')
        .insert({
          inspection_id: inspectionId,
          item_description: itemDescription,
          cost,
          proof_photos: proofPhotos,
          notes,
          category
        })
        .select()
        .single();
      
      if (error) {
        return { 
          success: false, 
          message: error.message,
          error 
        };
      }
      
      // Trigger will automatically update inspection totals
      
      return { 
        success: true, 
        data,
        message: 'Deduction added successfully' 
      };
    } catch (error: any) {
      console.error('Error in addDeduction:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to add deduction',
        error 
      };
    }
  }

  /**
   * Update a deduction
   * @param deductionId - Deduction ID
   * @param updates - Fields to update
   * @returns API response
   */
  static async updateDeduction(
    deductionId: string,
    updates: Partial<Omit<DepositDeduction, 'id' | 'inspection_id' | 'created_at' | 'updated_at'>>
  ): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('deposit_deductions')
        .update(updates)
        .eq('id', deductionId);
      
      if (error) {
        return { 
          success: false, 
          message: error.message,
          error 
        };
      }
      
      return { 
        success: true, 
        message: 'Deduction updated successfully' 
      };
    } catch (error: any) {
      console.error('Error in updateDeduction:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to update deduction',
        error 
      };
    }
  }

  /**
   * Delete a deduction
   * @param deductionId - Deduction ID
   * @returns API response
   */
  static async deleteDeduction(deductionId: string): Promise<ApiResponse> {
    try {
      const { error } = await supabase
        .from('deposit_deductions')
        .delete()
        .eq('id', deductionId);
      
      if (error) {
        return { 
          success: false, 
          message: error.message,
          error 
        };
      }
      
      // Trigger will automatically update inspection totals
      
      return { 
        success: true, 
        message: 'Deduction deleted successfully' 
      };
    } catch (error: any) {
      console.error('Error in deleteDeduction:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to delete deduction',
        error 
      };
    }
  }

  /**
   * Complete inspection and update deposit balance
   * @param inspectionId - Inspection ID
   * @returns API response
   */
  static async completeInspection(inspectionId: string): Promise<ApiResponse> {
    try {
      // Update inspection status to completed
      // Trigger will automatically update deposit balance
      const result = await this.updateInspectionStatus(inspectionId, 'completed');
      
      if (!result.success) {
        return result;
      }
      
      return { 
        success: true, 
        message: 'Inspection completed. Deposit balance updated.' 
      };
    } catch (error: any) {
      console.error('Error in completeInspection:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to complete inspection',
        error 
      };
    }
  }

  /**
   * Process deposit refund
   * Creates a refund payment record
   * @param tenantId - Tenant ID
   * @param propertyId - Property ID
   * @returns API response
   */
  static async processDepositRefund(
    tenantId: string,
    propertyId: string
  ): Promise<ApiResponse> {
    try {
      // Get deposit balance
      const deposit = await this.getTenantDeposit(tenantId);
      
      if (!deposit) {
        return { 
          success: false, 
          message: 'Deposit not found' 
        };
      }
      
      if (deposit.refundable_amount <= 0) {
        return { 
          success: false, 
          message: 'No refundable amount available' 
        };
      }
      
      // Get tenant and property info
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*, properties(*)')
        .eq('id', tenantId)
        .single();
      
      if (tenantError || !tenant) {
        return { 
          success: false, 
          message: 'Tenant not found',
          error: tenantError 
        };
      }
      
      // Get current user ID for created_by
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { 
          success: false, 
          message: 'User not authenticated' 
        };
      }
      
      // Create refund payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          tenant_id: tenantId,
          property_id: propertyId,
          amount: deposit.refundable_amount,
          payment_type: 'security_deposit',
          payment_method: 'bank_transfer',
          payment_status: 'refunded',
          due_date: new Date().toISOString().split('T')[0],
          paid_date: new Date().toISOString(),
          notes: `Security deposit refund - ${tenant.properties.name}`,
          created_by: user.id
        });
      
      if (paymentError) {
        return { 
          success: false, 
          message: paymentError.message,
          error: paymentError 
        };
      }
      
      // Update deposit status
      await supabase
        .from('deposit_balances')
        .update({
          status: 'fully_refunded'
        })
        .eq('id', deposit.id);
      
      return { 
        success: true, 
        message: `Deposit refund of ₱${deposit.refundable_amount.toLocaleString()} processed successfully` 
      };
    } catch (error: any) {
      console.error('Error in processDepositRefund:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to process deposit refund',
        error 
      };
    }
  }

  /**
   * Get inspection by ID with full details
   * @param inspectionId - Inspection ID
   * @returns Inspection with deductions
   */
  static async getInspectionWithDeductions(inspectionId: string): Promise<{
    inspection: MoveOutInspection | null;
    deductions: DepositDeduction[];
  }> {
    try {
      const { data: inspection, error } = await supabase
        .from('move_out_inspections')
        .select('*')
        .eq('id', inspectionId)
        .single();
      
      if (error || !inspection) {
        return { inspection: null, deductions: [] };
      }
      
      const deductions = await this.getInspectionDeductions(inspectionId);
      
      return { inspection, deductions };
    } catch (error) {
      console.error('Error in getInspectionWithDeductions:', error);
      return { inspection: null, deductions: [] };
    }
  }

  /**
   * Delete deposit balance and all related records
   * Only allowed if deposit has not been refunded
   * @param depositId - Deposit balance ID
   * @returns API response
   */
  static async deleteDeposit(depositId: string): Promise<ApiResponse> {
    try {
      // Get deposit to check status
      const { data: deposit, error: fetchError } = await supabase
        .from('deposit_balances')
        .select('*')
        .eq('id', depositId)
        .single();
      
      if (fetchError || !deposit) {
        return { 
          success: false, 
          message: 'Deposit not found' 
        };
      }
      
      // Check if deposit has been refunded
      if (deposit.status === 'fully_refunded' || deposit.status === 'partially_refunded') {
        return { 
          success: false, 
          message: 'Cannot delete a deposit that has been refunded. This is for audit purposes.' 
        };
      }
      
      // Get all inspections for this deposit
      const { data: inspections } = await supabase
        .from('move_out_inspections')
        .select('id')
        .eq('tenant_id', deposit.tenant_id);
      
      // Delete all deductions for these inspections
      if (inspections && inspections.length > 0) {
        const inspectionIds = inspections.map(i => i.id);
        
        await supabase
          .from('deposit_deductions')
          .delete()
          .in('inspection_id', inspectionIds);
      }
      
      // Delete all inspections
      await supabase
        .from('move_out_inspections')
        .delete()
        .eq('tenant_id', deposit.tenant_id);
      
      // Finally, delete the deposit balance
      const { error: deleteError } = await supabase
        .from('deposit_balances')
        .delete()
        .eq('id', depositId);
      
      if (deleteError) {
        return { 
          success: false, 
          message: deleteError.message,
          error: deleteError 
        };
      }
      
      return { 
        success: true, 
        message: 'Deposit and all related records deleted successfully' 
      };
    } catch (error: any) {
      console.error('Error in deleteDeposit:', error);
      return { 
        success: false, 
        message: error.message || 'Failed to delete deposit',
        error 
      };
    }
  }
}

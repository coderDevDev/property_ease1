/**
 * Automated Payment Generation Utility
 * Generates recurring payment records for tenant leases
 */

export interface LeaseDetails {
  tenant_id: string;
  property_id: string;
  monthly_rent: number;
  lease_start: string; // ISO date
  lease_end: string; // ISO date
  payment_due_day?: number; // Day of month (1-31), default 5
  include_utilities?: boolean;
  utility_amount?: number;
}

interface GeneratedPayment {
  tenant_id: string;
  property_id: string;
  payment_type: 'rent' | 'utility';
  amount: number;
  due_date: string;
  payment_status: 'pending';
  notes?: string;
}

/**
 * Generate monthly payment records for entire lease period
 */
export function generateLeasePayments(lease: LeaseDetails): GeneratedPayment[] {
  const payments: GeneratedPayment[] = [];
  const paymentDueDay = lease.payment_due_day || 5; // Default to 5th of month

  const startDate = new Date(lease.lease_start);
  const endDate = new Date(lease.lease_end);

  // Get the start month and year
  let currentDate = new Date(startDate);
  currentDate.setDate(paymentDueDay);

  // If payment due day is before lease start, move to next month
  if (currentDate < startDate) {
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Generate payments for each month
  while (currentDate <= endDate) {
    // Generate rent payment
    payments.push({
      tenant_id: lease.tenant_id,
      property_id: lease.property_id,
      payment_type: 'rent',
      amount: lease.monthly_rent,
      due_date: currentDate.toISOString().split('T')[0],
      payment_status: 'pending',
      notes: `Auto-generated rent payment for ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    });

    // Generate utility payment if included
    if (lease.include_utilities && lease.utility_amount) {
      const utilityDueDate = new Date(currentDate);
      utilityDueDate.setDate(Math.min(paymentDueDay + 15, 28)); // Utilities due 15 days after rent

      if (utilityDueDate <= endDate) {
        payments.push({
          tenant_id: lease.tenant_id,
          property_id: lease.property_id,
          payment_type: 'utility',
          amount: lease.utility_amount,
          due_date: utilityDueDate.toISOString().split('T')[0],
          payment_status: 'pending',
          notes: `Auto-generated utility payment for ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
        });
      }
    }

    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return payments;
}

/**
 * Calculate total payments for lease period
 */
export function calculateLeaseTotal(lease: LeaseDetails): {
  total_months: number;
  total_rent: number;
  total_utilities: number;
  grand_total: number;
  payments_count: number;
} {
  const payments = generateLeasePayments(lease);
  
  const rentPayments = payments.filter(p => p.payment_type === 'rent');
  const utilityPayments = payments.filter(p => p.payment_type === 'utility');

  return {
    total_months: rentPayments.length,
    total_rent: rentPayments.reduce((sum, p) => sum + p.amount, 0),
    total_utilities: utilityPayments.reduce((sum, p) => sum + p.amount, 0),
    grand_total: payments.reduce((sum, p) => sum + p.amount, 0),
    payments_count: payments.length
  };
}

/**
 * Generate payment schedule preview for display
 */
export function generatePaymentSchedulePreview(lease: LeaseDetails): string[] {
  const payments = generateLeasePayments(lease);
  
  return payments.map(payment => {
    const date = new Date(payment.due_date);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    return `${formattedDate} - ${payment.payment_type.toUpperCase()}: ₱${payment.amount.toLocaleString()}`;
  });
}

/**
 * Validate lease details before generating payments
 */
export function validateLeaseForPaymentGeneration(lease: LeaseDetails): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!lease.tenant_id) errors.push('Tenant ID is required');
  if (!lease.property_id) errors.push('Property ID is required');
  if (!lease.monthly_rent || lease.monthly_rent <= 0) errors.push('Monthly rent must be greater than 0');
  if (!lease.lease_start) errors.push('Lease start date is required');
  if (!lease.lease_end) errors.push('Lease end date is required');

  const startDate = new Date(lease.lease_start);
  const endDate = new Date(lease.lease_end);

  if (endDate <= startDate) {
    errors.push('Lease end date must be after start date');
  }

  if (lease.payment_due_day && (lease.payment_due_day < 1 || lease.payment_due_day > 31)) {
    errors.push('Payment due day must be between 1 and 31');
  }

  if (lease.include_utilities && (!lease.utility_amount || lease.utility_amount <= 0)) {
    errors.push('Utility amount is required when utilities are included');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

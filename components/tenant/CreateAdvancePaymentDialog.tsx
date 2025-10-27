'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, DollarSign, Calendar, Info, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AdvancePaymentsAPI } from '@/lib/api/advance-payments';
import { PaymentsAPI } from '@/lib/api/payments';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

interface CreateAdvancePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tenantId: string;
}

// Simplified Zod validation schema (only property selection needed now)
const advancePaymentSchema = z.object({
  propertyId: z.string().min(1, 'Please select a property'),
});

type AdvancePaymentFormData = z.infer<typeof advancePaymentSchema>;

export function CreateAdvancePaymentDialog({
  open,
  onClose,
  onSuccess,
  tenantId,
}: CreateAdvancePaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [formData, setFormData] = useState({
    propertyId: '',
    monthsCount: 3,
    startMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
  });
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [eligibilityStatus, setEligibilityStatus] = useState<{
    canPayAdvance: boolean;
    reason: string;
    unpaidMonths: number;
    overdueMonths: number;
    nextEligibleMonth: string;
  } | null>(null);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]); // IDs of selected pending payments

  useEffect(() => {
    if (open) {
      fetchProperties();
    }
  }, [open, tenantId]);

  const fetchProperties = async () => {
    try {
      setLoadingProperties(true);
      // Get tenant's payments to extract property info
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select(`
          property_id,
          property:properties(id, name, monthly_rent)
        `)
        .eq('tenant_id', tenantId)
        .not('property_id', 'is', null);

      if (error) throw error;

      // Extract unique properties
      const uniqueProperties = paymentsData
        ?.map((p: any) => p.property)
        .filter((p: any, index: number, self: any[]) => 
          p && self.findIndex((t: any) => t?.id === p?.id) === index
        ) || [];

      setProperties(uniqueProperties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Failed to load properties');
    } finally {
      setLoadingProperties(false);
    }
  };

  const handlePropertyChange = async (propertyId: string) => {
    setFormData({ ...formData, propertyId });
    const property = properties.find((p) => p.id === propertyId);
    setSelectedProperty(property);
    
    // Check payment eligibility for this property
    if (property) {
      await checkPaymentEligibility(propertyId);
    }
  };

  const checkPaymentEligibility = async (propertyId: string) => {
    try {
      setLoadingPayments(true);
      
      // Fetch tenant's payment history for this property
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('property_id', propertyId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      setPaymentHistory(payments || []);

      // Check eligibility
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      
      // Count unpaid and overdue payments
      const unpaidPayments = payments?.filter(p => p.payment_status !== 'paid') || [];
      const overduePayments = unpaidPayments.filter(p => {
        const dueDate = new Date(p.due_date);
        return dueDate < now;
      });

      // Determine eligibility
      let canPayAdvance = true;
      let reason = 'You can pay rent in advance';
      let nextEligibleMonth = currentMonth;

      if (overduePayments.length > 0) {
        canPayAdvance = false;
        reason = `You have ${overduePayments.length} overdue payment(s). Please settle overdue payments before making advance payments.`;
      } else if (unpaidPayments.length > 0) {
        // Has unpaid but not overdue - can pay advance for future months
        // Get the latest unpaid payment's due date
        const latestUnpaidDue = new Date(Math.max(...unpaidPayments.map(p => new Date(p.due_date).getTime())));
        
        // Extract year and month from the latest unpaid due date
        const latestYear = latestUnpaidDue.getFullYear();
        const latestMonth = latestUnpaidDue.getMonth(); // 0-indexed
        
        // Calculate next eligible month (month after the latest pending)
        const nextMonthDate = new Date(latestYear, latestMonth + 1, 1);
        nextEligibleMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
        
        reason = `You have ${unpaidPayments.length} pending payment(s). You can pay in advance starting from ${nextEligibleMonth}.`;
        
        // Update start month to next eligible month
        setFormData(prev => ({ ...prev, startMonth: nextEligibleMonth }));
      }

      setEligibilityStatus({
        canPayAdvance,
        reason,
        unpaidMonths: unpaidPayments.length,
        overdueMonths: overduePayments.length,
        nextEligibleMonth,
      });

    } catch (error) {
      console.error('Error checking eligibility:', error);
      toast.error('Failed to check payment eligibility');
    } finally {
      setLoadingPayments(false);
    }
  };

  const calculateEndMonth = () => {
    if (!formData.startMonth) return '';
    const date = new Date(formData.startMonth + '-01');
    date.setMonth(date.getMonth() + formData.monthsCount);
    return date.toISOString().slice(0, 7);
  };

  const calculateTotalAmount = () => {
    if (!selectedProperty) return 0;
    // If using checkbox selection, calculate from selected payments
    if (selectedPayments.length > 0) {
      return selectedPayments.reduce((total, paymentId) => {
        const payment = paymentHistory.find(p => p.id === paymentId);
        return total + (payment ? Number(payment.amount) : 0);
      }, 0);
    }
    // Otherwise use the old method
    return selectedProperty.monthly_rent * formData.monthsCount;
  };

  const handlePaymentSelection = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedPayments(prev => [...prev, paymentId]);
    } else {
      setSelectedPayments(prev => prev.filter(id => id !== paymentId));
    }
  };

  const handleSelectAllPending = () => {
    const pendingPayments = paymentHistory.filter(p => 
      p.payment_status !== 'paid' && new Date(p.due_date) >= new Date()
    );
    setSelectedPayments(pendingPayments.map(p => p.id));
  };

  const handleClearSelection = () => {
    setSelectedPayments([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate with Zod
    try {
      advancePaymentSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
        return;
      }
    }

    if (!selectedProperty) {
      toast.error('Property details not found');
      return;
    }

    setLoading(true);

    try {
      const totalAmount = calculateTotalAmount();
      
      // Get the selected payments details for notes
      const selectedPaymentDetails = selectedPayments.map(id => {
        const payment = paymentHistory.find(p => p.id === id);
        if (!payment) return '';
        const dueDate = new Date(payment.due_date);
        return dueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }).filter(Boolean).join(', ');

      const result = await AdvancePaymentsAPI.createAdvancePayment({
        tenantId,
        propertyId: formData.propertyId,
        totalAmount: totalAmount,
        monthsCovered: selectedPayments.length,
        startMonth: formData.startMonth,
        notes: `Advance payment for ${selectedPayments.length} months: ${selectedPaymentDetails}`,
      });

      if (result.success) {
        toast.success('Advance payment created successfully');
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          propertyId: '',
          monthsCount: 3,
          startMonth: new Date().toISOString().slice(0, 7),
        });
        setSelectedProperty(null);
      } else {
        toast.error(result.message || 'Failed to create advance payment');
      }
    } catch (error: any) {
      console.error('Error creating advance payment:', error);
      toast.error(error.message || 'Failed to create advance payment');
    } finally {
      setLoading(false);
    }
  };

  const endMonth = calculateEndMonth();
  const totalAmount = calculateTotalAmount();

  // Check if form is valid using Zod
  const validationResult = advancePaymentSchema.safeParse(formData);
  const isFormValid = validationResult.success && 
                      selectedProperty !== null && 
                      eligibilityStatus?.canPayAdvance === true &&
                      selectedPayments.length > 0; // Must have at least one payment selected

  // Get validation error message
  const getValidationMessage = () => {
    if (!selectedProperty) {
      return 'Please select a property';
    }
    if (eligibilityStatus && !eligibilityStatus.canPayAdvance) {
      return 'You must settle overdue payments before making advance payments';
    }
    if (selectedPayments.length === 0) {
      return 'Please select at least one month to pay in advance';
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Advance Payment</DialogTitle>
          <DialogDescription>
            Pay rent in advance for multiple months
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info Banner */}
          <div className="p-4 bg-blue-50 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">About Advance Payments</p>
              <p>
                Pay multiple months of rent upfront. The system will automatically
                allocate the payment to your monthly rent obligations.
              </p>
            </div>
          </div>

          {/* Property Selection */}
          <div className="space-y-2">
            <Label htmlFor="property">
              Select Property <span className="text-red-500">*</span>
            </Label>
            {loadingProperties ? (
              <div className="flex items-center justify-center p-4 border rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                <span className="text-sm text-gray-600">Loading properties...</span>
              </div>
            ) : properties.length === 0 ? (
              <div className="p-4 border rounded-lg text-center text-sm text-gray-600">
                No active properties found
              </div>
            ) : (
              <Select
                value={formData.propertyId}
                onValueChange={handlePropertyChange}
                required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name} - ₱{property.monthly_rent.toLocaleString()}/month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Eligibility Status */}
          {loadingPayments && selectedProperty && (
            <div className="p-4 border rounded-lg flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600">Checking payment eligibility...</span>
            </div>
          )}

          {eligibilityStatus && selectedProperty && !loadingPayments && (
            <div className={`p-4 rounded-lg border-2 ${
              eligibilityStatus.canPayAdvance
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex gap-3">
                {eligibilityStatus.canPayAdvance ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${
                    eligibilityStatus.canPayAdvance ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {eligibilityStatus.canPayAdvance ? 'Eligible for Advance Payment' : 'Not Eligible'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    eligibilityStatus.canPayAdvance ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {eligibilityStatus.reason}
                  </p>
                  
                  {/* Payment Status Summary */}
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-gray-700">
                        Pending: <strong>{eligibilityStatus.unpaidMonths}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-gray-700">
                        Overdue: <strong>{eligibilityStatus.overdueMonths}</strong>
                      </span>
                    </div>
                  </div>

                  {eligibilityStatus.canPayAdvance && eligibilityStatus.unpaidMonths > 0 && (
                    <p className="text-xs text-gray-600 mt-2">
                      💡 Tip: Your advance payment will start from {eligibilityStatus.nextEligibleMonth} (after pending payments)
                    </p>
                  )}
                </div>
              </div>

              {/* Payment History Timeline */}
              {paymentHistory.length > 0 && (
                <details className="mt-3" open>
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    📋 Select Months to Pay in Advance ({paymentHistory.length} payments)
                  </summary>
                  
                  {/* Selection Controls */}
                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleSelectAllPending}
                      className="text-xs"
                    >
                      Select All Pending
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleClearSelection}
                      className="text-xs"
                    >
                      Clear Selection
                    </Button>
                    {selectedPayments.length > 0 && (
                      <span className="text-xs text-blue-600 font-medium flex items-center">
                        {selectedPayments.length} selected
                      </span>
                    )}
                  </div>

                  <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                    {paymentHistory.map((payment) => {
                      const dueDate = new Date(payment.due_date);
                      const monthYear = dueDate.toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      });
                      const isPaid = payment.payment_status === 'paid';
                      const isOverdue = !isPaid && dueDate < new Date();
                      const isPending = !isPaid && !isOverdue;

                      const isSelected = selectedPayments.includes(payment.id);
                      const canSelect = isPending && !isOverdue; // Only pending, non-overdue payments

                      return (
                        <div
                          key={payment.id}
                          className={`flex items-center gap-3 p-2.5 rounded text-sm transition-all ${
                            isPaid
                              ? 'bg-green-50 border border-green-200'
                              : isOverdue
                              ? 'bg-red-50 border border-red-200 opacity-60'
                              : isSelected
                              ? 'bg-blue-100 border-2 border-blue-400 shadow-sm'
                              : 'bg-amber-50 border border-amber-200 hover:border-amber-300'
                          }`}
                        >
                          {/* Checkbox for pending payments */}
                          {canSelect && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => handlePaymentSelection(payment.id, checked as boolean)}
                              className="flex-shrink-0"
                            />
                          )}
                          {!canSelect && <div className="w-4" />} {/* Spacer for alignment */}

                          <div className="flex items-center gap-2 flex-1">
                            {isPaid ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : isOverdue ? (
                              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            )}
                            <div className="flex flex-col">
                              <span className={`font-medium ${
                                isPaid ? 'text-green-900' : isOverdue ? 'text-red-900' : 'text-amber-900'
                              }`}>
                                {monthYear}
                              </span>
                              <span className="text-xs text-gray-500">
                                Due: {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {payment.payment_type && ` • ${payment.payment_type}`}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                              isPaid 
                                ? 'bg-green-100 text-green-700' 
                                : isOverdue 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {isPaid ? 'PAID' : isOverdue ? 'OVERDUE' : 'PENDING'}
                            </span>
                            <span className="text-gray-700 font-medium">
                              ₱{Number(payment.amount).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>
              )}

              {/* Selected Payments Summary */}
              {selectedPayments.length > 0 && (
                <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Selected for Advance Payment
                  </h4>
                  <div className="space-y-2">
                    {selectedPayments.map(paymentId => {
                      const payment = paymentHistory.find(p => p.id === paymentId);
                      if (!payment) return null;
                      const dueDate = new Date(payment.due_date);
                      return (
                        <div key={paymentId} className="flex justify-between text-sm">
                          <span className="text-blue-700">
                            {dueDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                          <span className="font-medium text-blue-900">
                            ₱{Number(payment.amount).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                    <div className="pt-2 border-t-2 border-blue-300 flex justify-between font-bold text-base">
                      <span className="text-blue-900">Total Amount:</span>
                      <span className="text-blue-900">₱{calculateTotalAmount().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedProperty && (
            <>
              {/* How It Works - Only show if payments selected */}
              {selectedPayments.length > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    How It Works
                  </h4>
                  <ul className="space-y-1 text-sm text-purple-700">
                    <li>• Advance payment will be created for ₱{calculateTotalAmount().toLocaleString()}</li>
                    <li>• Covers {selectedPayments.length} selected month(s)</li>
                    <li>• You can pay this via Xendit in your payments dashboard</li>
                    <li>• System will automatically allocate to the selected months</li>
                    <li>• Track payment status in /tenant/dashboard/payments</li>
                  </ul>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <DialogFooter className="flex-col sm:flex-row gap-2">
            {!isFormValid && !loading && (
              <p className="text-xs text-amber-600 text-center sm:text-left flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                {getValidationMessage()}
              </p>
            )}
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !isFormValid}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Advance Payment
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

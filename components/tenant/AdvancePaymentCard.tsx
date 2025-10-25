/**
 * Advance Payment Card Component
 * Display tenant's advance payments and allocations
 * 
 * @component AdvancePaymentCard
 * @created October 25, 2025
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, TrendingDown, CheckCircle, Clock } from 'lucide-react';
import type { AdvancePayment, AdvancePaymentAllocation } from '@/lib/api/advance-payments';

interface AdvancePaymentCardProps {
  advancePayments: AdvancePayment[];
  allocations: Record<string, AdvancePaymentAllocation[]>;
  onViewDetails: (payment: AdvancePayment) => void;
}

export function AdvancePaymentCard({ 
  advancePayments, 
  allocations,
  onViewDetails 
}: AdvancePaymentCardProps) {
  const activePayments = advancePayments.filter(p => p.status === 'active' && p.remaining_balance > 0);
  const totalRemaining = activePayments.reduce((sum, p) => sum + Number(p.remaining_balance), 0);

  if (advancePayments.length === 0) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'fully_allocated': return 'bg-blue-500';
      case 'cancelled': return 'bg-gray-500';
      case 'refunded': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateProgress = (payment: AdvancePayment) => {
    const allocated = Number(payment.allocated_amount);
    const total = Number(payment.total_amount);
    return (allocated / total) * 100;
  };

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-600" />
          Advance Payments
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {activePayments.length > 0 && (
          <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Available Balance</p>
                <p className="text-2xl font-bold text-green-900">
                  ₱{totalRemaining.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-green-700">Active Prepayments</p>
                <p className="text-xl font-semibold text-green-900">
                  {activePayments.length}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Advance Payments List */}
        <div className="space-y-3">
          {advancePayments.map((payment) => {
            const progress = calculateProgress(payment);
            const paymentAllocations = allocations[payment.id] || [];

            return (
              <div
                key={payment.id}
                className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {payment.months_covered} Month{payment.months_covered > 1 ? 's' : ''} Prepaid
                      </h4>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      Period: {new Date(payment.start_month).toLocaleDateString()} - {new Date(payment.end_month).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(payment)}
                  >
                    Details
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Allocated: ₱{Number(payment.allocated_amount).toLocaleString()}</span>
                    <span>Remaining: ₱{Number(payment.remaining_balance).toLocaleString()}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {progress.toFixed(0)}% used
                  </p>
                </div>

                {/* Amounts */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-xs text-gray-600">Total</p>
                    <p className="font-semibold text-blue-900">
                      ₱{Number(payment.total_amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-xs text-gray-600">Allocated</p>
                    <p className="font-semibold text-green-900">
                      ₱{Number(payment.allocated_amount).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-yellow-50 rounded">
                    <p className="text-xs text-gray-600">Balance</p>
                    <p className="font-semibold text-yellow-900">
                      ₱{Number(payment.remaining_balance).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Recent Allocations */}
                {paymentAllocations.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      Recent Allocations ({paymentAllocations.length})
                    </p>
                    <div className="space-y-1">
                      {paymentAllocations.slice(0, 3).map((allocation) => (
                        <div
                          key={allocation.id}
                          className="flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span className="text-gray-600">
                              {new Date(allocation.payment_month).toLocaleDateString('en-US', { 
                                month: 'short', 
                                year: 'numeric' 
                              })}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">
                            ₱{Number(allocation.allocated_amount).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {payment.notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">{payment.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-900">
              <p className="font-medium mb-1">How Advance Payments Work</p>
              <p className="text-blue-700">
                Your prepayment will automatically be applied to upcoming rent payments. 
                You'll receive notifications when allocations are made.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

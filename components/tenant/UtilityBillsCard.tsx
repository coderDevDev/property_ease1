/**
 * Utility Bills Card Component
 * Display tenant's utility bills
 * 
 * @component UtilityBillsCard
 * @created October 25, 2025
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Calendar, DollarSign, Eye, CreditCard, AlertCircle } from 'lucide-react';
import type { UtilityBill } from '@/lib/api/utilities';

interface UtilityBillsCardProps {
  bills: UtilityBill[];
  onViewBill: (bill: UtilityBill) => void;
  onPayBill: (bill: UtilityBill) => void;
}

export function UtilityBillsCard({ bills, onViewBill, onPayBill }: UtilityBillsCardProps) {
  const pendingBills = bills.filter(b => b.payment_status === 'pending' || b.payment_status === 'overdue');
  const totalPending = pendingBills.reduce((sum, b) => sum + Number(b.total_amount), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBillTypeIcon = (type: string) => {
    return <Zap className="h-4 w-4" />;
  };

  if (bills.length === 0) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          Utility Bills
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {pendingBills.length > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-yellow-900">
                  {pendingBills.length} Pending Bill{pendingBills.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-yellow-700">
                  Total Amount: ₱{totalPending.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bills List */}
        <div className="space-y-3">
          {bills.slice(0, 5).map((bill) => (
            <div
              key={bill.id}
              className="p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Bill Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-blue-100 p-1.5 rounded">
                      {getBillTypeIcon(bill.bill_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold capitalize text-sm">
                          {bill.bill_type}
                        </h4>
                        <Badge className={getStatusColor(bill.payment_status)}>
                          {bill.payment_status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Consumption */}
                  {bill.consumption && (
                    <p className="text-xs text-gray-600 mb-1">
                      Consumption: {bill.consumption} {bill.unit}
                    </p>
                  )}

                  {/* Due Date */}
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>Due: {new Date(bill.due_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="text-right space-y-2">
                  <div>
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="text-lg font-bold text-blue-600">
                      ₱{Number(bill.total_amount).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewBill(bill)}
                      className="h-7 px-2"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {(bill.payment_status === 'pending' || bill.payment_status === 'overdue') && (
                      <Button
                        size="sm"
                        onClick={() => onPayBill(bill)}
                        className="h-7 px-2"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Overdue Warning */}
              {bill.payment_status === 'overdue' && (
                <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>This bill is overdue. Please pay as soon as possible to avoid penalties.</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* View All Link */}
        {bills.length > 5 && (
          <Button variant="outline" className="w-full" size="sm">
            View All Bills ({bills.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

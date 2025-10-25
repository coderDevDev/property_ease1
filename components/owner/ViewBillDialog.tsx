/**
 * View Bill Dialog Component
 * Display utility bill details
 * 
 * @component ViewBillDialog
 * @created October 25, 2025
 */

'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Calendar, User, Home, Zap, DollarSign } from 'lucide-react';

interface ViewBillDialogProps {
  bill: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function ViewBillDialog({ bill, onClose, onUpdate }: ViewBillDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Utility Bill Details</span>
            <Badge className={getStatusColor(bill.payment_status)}>
              {bill.payment_status.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Bill #{bill.id.slice(0, 8)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Property & Tenant Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Home className="h-5 w-5" />
              Property & Tenant
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Property:</span>
                <span className="font-medium">{bill.property?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Address:</span>
                <span className="font-medium">{bill.property?.address || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tenant:</span>
                <span className="font-medium">
                  {bill.tenant?.user?.full_name || 'No tenant assigned'}
                </span>
              </div>
            </div>
          </Card>

          {/* Bill Details */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Bill Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Bill Type:</span>
                <span className="font-medium capitalize">{bill.bill_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Billing Period:</span>
                <span className="font-medium">
                  {new Date(bill.billing_period_start).toLocaleDateString()} - {new Date(bill.billing_period_end).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">
                  {new Date(bill.due_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">
                  {new Date(bill.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Consumption */}
          {bill.consumption && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Consumption Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Previous Reading:</span>
                  <span className="font-medium">
                    {bill.previous_reading} {bill.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Reading:</span>
                  <span className="font-medium">
                    {bill.current_reading} {bill.unit}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-gray-600">Total Consumption:</span>
                  <span className="font-bold text-blue-600">
                    {bill.consumption} {bill.unit}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Charges Breakdown */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Charges Breakdown
            </h3>
            <div className="space-y-2 text-sm">
              {bill.base_charge > 0 && (
                <div className="flex justify-between">
                  <span>Base Charge:</span>
                  <span className="font-medium">
                    ₱{Number(bill.base_charge).toLocaleString()}
                  </span>
                </div>
              )}
              {bill.consumption_charge > 0 && (
                <div className="flex justify-between">
                  <span>Consumption Charge:</span>
                  <span className="font-medium">
                    ₱{Number(bill.consumption_charge).toLocaleString()}
                  </span>
                </div>
              )}
              {bill.additional_charges > 0 && (
                <div className="flex justify-between">
                  <span>Additional Charges:</span>
                  <span className="font-medium">
                    ₱{Number(bill.additional_charges).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-blue-300">
                <span className="font-semibold">Total Amount:</span>
                <span className="font-bold text-lg text-blue-600">
                  ₱{Number(bill.total_amount).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment Info */}
          {bill.payment_status === 'paid' && bill.paid_date && (
            <Card className="p-4 bg-green-50 border-green-200">
              <h3 className="font-semibold mb-3 text-green-900">Payment Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Paid Date:</span>
                  <span className="font-medium text-green-900">
                    {new Date(bill.paid_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Payment ID:</span>
                  <span className="font-medium text-green-900">
                    {bill.payment_id?.slice(0, 8) || 'N/A'}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {/* Notes */}
          {bill.notes && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-gray-600">{bill.notes}</p>
            </Card>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

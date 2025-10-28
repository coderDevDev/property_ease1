'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  User,
  Home,
  CreditCard,
  PhilippinePeso,
  CheckCircle,
  Clock,
  AlertTriangle,
  FileText
} from 'lucide-react';
import type { PaymentWithDetails } from '@/lib/api/payments';

interface PaymentDetailsModalProps {
  payment: PaymentWithDetails | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentDetailsModal({
  payment,
  isOpen,
  onClose
}: PaymentDetailsModalProps) {
  if (!payment) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'partial':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const isOverdue =
    payment.payment_status === 'pending' &&
    new Date(payment.due_date) < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <PhilippinePeso className="w-5 h-5 text-blue-600" />
            Payment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Amount */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm text-gray-600 mb-2 block">Status</Label>
              <Badge className={`${getStatusBadge(payment.payment_status)} flex items-center gap-1 w-fit`}>
                {getStatusIcon(payment.payment_status)}
                <span className="capitalize">{payment.payment_status}</span>
              </Badge>
              {isOverdue && (
                <Badge className="bg-red-100 text-red-700 border-red-200 mt-2 flex items-center gap-1 w-fit">
                  <AlertTriangle className="w-3 h-3" />
                  Overdue
                </Badge>
              )}
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <Label className="text-sm text-gray-600 mb-2 block">Amount</Label>
              <p className="text-2xl font-bold text-gray-900">
                ₱{Number(payment.amount).toLocaleString()}
              </p>
              {payment.late_fee && payment.late_fee > 0 && (
                <p className="text-sm text-red-600 mt-1">
                  +₱{Number(payment.late_fee).toLocaleString()} late fee
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Payment Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600 mb-1 block">Type</Label>
                <p className="text-gray-900 font-medium capitalize">
                  {payment.payment_type?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600 mb-1 block">Method</Label>
                <p className="text-gray-900 font-medium capitalize flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {payment.payment_method?.replace('_', ' ') || 'N/A'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600 mb-1 block">Due Date</Label>
                <p className="text-gray-900 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(payment.due_date).toLocaleDateString()}
                </p>
              </div>
              {payment.paid_date && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <Label className="text-sm text-green-700 mb-1 block">Paid Date</Label>
                  <p className="text-green-900 font-medium">
                    {new Date(payment.paid_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
            {payment.reference_number && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-sm text-gray-600 mb-1 block">Reference Number</Label>
                <p className="text-gray-900 font-mono text-sm">
                  {payment.reference_number}
                </p>
              </div>
            )}
            {payment.notes && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Label className="text-sm text-yellow-700 mb-1 block">Notes</Label>
                <p className="text-yellow-900 text-sm">{payment.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Tenant Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="w-4 h-4" />
              Tenant Information
            </h3>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="font-semibold text-gray-900 mb-2">
                {payment.tenant?.user?.first_name || 'N/A'}{' '}
                {payment.tenant?.user?.last_name || ''}
              </p>
              <div className="space-y-1 text-sm">
                {payment.tenant?.user?.email && (
                  <p className="text-gray-700">
                    <span className="text-gray-500">Email:</span> {payment.tenant.user.email}
                  </p>
                )}
                {payment.tenant?.user?.phone && (
                  <p className="text-gray-700">
                    <span className="text-gray-500">Phone:</span> {payment.tenant.user.phone}
                  </p>
                )}
                {payment.tenant?.unit_number && (
                  <p className="text-gray-700">
                    <span className="text-gray-500">Unit:</span> {payment.tenant.unit_number}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Property Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Home className="w-4 h-4" />
              Property Information
            </h3>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="font-semibold text-gray-900 mb-2">
                {payment.property?.name || 'Unnamed Property'}
              </p>
              <div className="space-y-1 text-sm">
                {payment.property?.address && (
                  <p className="text-gray-700">
                    <span className="text-gray-500">Address:</span> {payment.property.address}
                  </p>
                )}
                {payment.property?.city && (
                  <p className="text-gray-700">
                    <span className="text-gray-500">City:</span> {payment.property.city}
                  </p>
                )}
                {payment.property?.type && (
                  <p className="text-gray-700 capitalize">
                    <span className="text-gray-500">Type:</span> {payment.property.type}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-xs text-gray-600 mb-1 block">Created</Label>
                <p className="text-sm text-gray-900">
                  {new Date(payment.created_at).toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Label className="text-xs text-gray-600 mb-1 block">Last Updated</Label>
                <p className="text-sm text-gray-900">
                  {new Date(payment.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

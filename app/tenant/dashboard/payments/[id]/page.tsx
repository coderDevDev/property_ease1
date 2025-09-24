'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  Home,
  CreditCard,
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download
} from 'lucide-react';
import { PaymentsAPI, type PaymentWithDetails } from '@/lib/api/payments';
import { toast } from 'sonner';

export default function TenantPaymentDetailsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<PaymentWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load payment details
  useEffect(() => {
    const loadPayment = async () => {
      if (!paymentId) return;

      try {
        setIsLoading(true);
        const result = await PaymentsAPI.getPayment(paymentId);

        if (result.success && result.data) {
          // Verify this payment belongs to the current tenant
          if (result.data.tenant.user.id !== authState.user?.id) {
            toast.error('You do not have permission to view this payment');
            router.push('/tenant/dashboard/payments');
            return;
          }
          setPayment(result.data);
        } else {
          toast.error(result.message || 'Failed to load payment details');
          router.push('/tenant/dashboard/payments');
        }
      } catch (error) {
        console.error('Failed to load payment:', error);
        toast.error('Failed to load payment details');
        router.push('/tenant/dashboard/payments');
      } finally {
        setIsLoading(false);
      }
    };

    loadPayment();
  }, [paymentId, router, authState.user?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-blue-100 text-blue-700';
      case 'partial':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentTypeBadge = (type: string) => {
    switch (type) {
      case 'rent':
        return 'bg-blue-100 text-blue-700';
      case 'deposit':
        return 'bg-purple-100 text-purple-700';
      case 'security_deposit':
        return 'bg-indigo-100 text-indigo-700';
      case 'utility':
        return 'bg-green-100 text-green-700';
      case 'penalty':
        return 'bg-red-100 text-red-700';
      case 'other':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'gcash':
      case 'maya':
      case 'bank_transfer':
        return <CreditCard className="w-5 h-5" />;
      case 'cash':
        return <DollarSign className="w-5 h-5" />;
      case 'check':
        return <Receipt className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const handleDownloadReceipt = () => {
    if (payment?.receipt_url) {
      window.open(payment.receipt_url, '_blank');
    } else {
      toast.error('No receipt available for this payment');
    }
  };

  const isOverdue = payment?.payment_status === 'pending' && new Date(payment.due_date) < new Date();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Loading payment details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Payment not found
            </h3>
            <p className="text-gray-600 mb-6">
              The payment you're looking for doesn't exist.
            </p>
            <Button onClick={() => router.push('/tenant/dashboard/payments')}>
              Back to Payments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/tenant/dashboard/payments')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payments
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Payment Details
              </h1>
              <p className="text-blue-600/70 mt-1 text-lg">
                {payment.payment_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {payment.payment_status === 'paid' && payment.receipt_url && (
              <Button
                onClick={handleDownloadReceipt}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={cn(
            'bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200',
            isOverdue && 'border-red-200/50 bg-red-50/30'
          )}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  payment.payment_status === 'paid' ? 'bg-green-100' :
                  payment.payment_status === 'pending' ? 'bg-yellow-100' :
                  payment.payment_status === 'failed' ? 'bg-red-100' :
                  'bg-gray-100'
                )}>
                  {payment.payment_status === 'paid' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : payment.payment_status === 'pending' ? (
                    <Clock className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {payment.payment_status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₱{Number(payment.amount).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  {getPaymentMethodIcon(payment.payment_method)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Method</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {payment.payment_method.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Payment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {payment.payment_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getStatusBadge(payment.payment_status)}>
                      {payment.payment_status.replace('_', ' ')}
                    </Badge>
                    <Badge className={getPaymentTypeBadge(payment.payment_type)}>
                      {payment.payment_type.replace('_', ' ')}
                    </Badge>
                    {isOverdue && (
                      <Badge className="bg-red-100 text-red-700">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">
                        Amount
                      </Label>
                      <p className="text-gray-900 font-medium text-lg">
                        ₱{Number(payment.amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">
                        Payment Method
                      </Label>
                      <p className="text-gray-900 font-medium capitalize">
                        {payment.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">
                        Due Date
                      </Label>
                      <p className="text-gray-900 font-medium">
                        {new Date(payment.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    {payment.late_fee && payment.late_fee > 0 && (
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200/50">
                        <Label className="text-sm font-medium text-red-700 mb-1 block">
                          Late Fee
                        </Label>
                        <p className="text-red-900 font-medium">
                          ₱{Number(payment.late_fee).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {payment.paid_date && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200/50">
                    <Label className="text-sm font-medium text-green-700 mb-1 block">
                      Paid Date
                    </Label>
                    <p className="text-green-900 font-medium">
                      {new Date(payment.paid_date).toLocaleString()}
                    </p>
                  </div>
                )}

                {payment.reference_number && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600 mb-1 block">
                      Reference Number
                    </Label>
                    <p className="text-gray-900 font-medium">
                      {payment.reference_number}
                    </p>
                  </div>
                )}

                {payment.notes && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200/50">
                    <Label className="text-sm font-medium text-yellow-700 mb-2 block">
                      Notes
                    </Label>
                    <p className="text-yellow-900">
                      {payment.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Property Info */}
          <div className="space-y-6">
            {/* Property Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {payment.property.name}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Address:</span>
                      <span className="text-gray-900 font-medium">
                        {payment.property.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">City:</span>
                      <span className="text-gray-900 font-medium">
                        {payment.property.city}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Type:</span>
                      <span className="text-gray-900 font-medium capitalize">
                        {payment.property.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Your Unit:</span>
                      <span className="text-gray-900 font-medium">
                        {payment.tenant.unit_number}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Timeline */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  Payment Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">
                    Created
                  </Label>
                  <p className="text-gray-900 font-medium">
                    {new Date(payment.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">
                    Last Updated
                  </Label>
                  <p className="text-gray-900 font-medium">
                    {new Date(payment.updated_at).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">
                    Created By
                  </Label>
                  <p className="text-gray-900 font-medium">
                    {payment.created_by_user.first_name} {payment.created_by_user.last_name}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Instructions */}
            {payment.payment_status === 'pending' && (
              <Card className="bg-white/80 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-yellow-700">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    Payment Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-yellow-50/50 rounded-lg border border-yellow-200/50">
                    <p className="text-yellow-900 text-sm">
                      Please make your payment using the specified method and amount. 
                      Contact your property manager if you have any questions about this payment.
                    </p>
                    {isOverdue && (
                      <p className="text-red-700 text-sm mt-2 font-medium">
                        ⚠️ This payment is overdue. Late fees may apply.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


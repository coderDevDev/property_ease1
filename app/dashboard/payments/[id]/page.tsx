'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  User,
  Home,
  CreditCard,
  Receipt,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  FileCheck,
  PhilippinePeso,
  Building
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';

interface PaymentDetails {
  id: string;
  amount: number;
  type: string;
  method: string;
  status: string;
  due_date: string;
  paid_date?: string;
  created_at: string;
  updated_at: string;
  reference_number?: string;
  notes?: string;
  receipt_url?: string;
  tenant?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  property?: {
    name?: string;
    address?: string;
  };
}

export default function AdminPaymentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const paymentId = params.id as string;

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPayment = async () => {
      if (!paymentId) return;

      try {
        setIsLoading(true);
        const result = await AdminAPI.getPaymentDetails(paymentId);

        if (result.success && result.data) {
          setPayment(result.data);
        } else {
          toast.error('Failed to load payment details');
          router.push('/dashboard/payments');
        }
      } catch (error) {
        console.error('Failed to load payment:', error);
        toast.error('Failed to load payment details');
        router.push('/dashboard/payments');
      } finally {
        setIsLoading(false);
      }
    };

    loadPayment();
  }, [paymentId, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleDownloadReceipt = () => {
    if (payment?.receipt_url) {
      window.open(payment.receipt_url, '_blank');
    } else {
      toast.error('No receipt available for this payment');
    }
  };

  const handleVerifyPayment = () => {
    toast.success('Payment marked as verified');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment not found</h3>
            <p className="text-gray-600 mb-6">The payment you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/dashboard/payments')}>
              Back to Payments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isOverdue =
    payment.status === 'pending' && new Date(payment.due_date) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard/payments')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Payments
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Payment Details
              </h1>
              <p className="text-blue-600/70 mt-1">
                {payment.reference_number ? `#${payment.reference_number}` : 'Payment Record'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {payment.status === 'completed' && (
              <Button
                onClick={handleVerifyPayment}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                <FileCheck className="w-4 h-4 mr-2" />
                Verify Payment
              </Button>
            )}
            {payment.receipt_url && (
              <Button
                onClick={handleDownloadReceipt}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
            )}
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    payment.status === 'completed'
                      ? 'bg-green-100'
                      : payment.status === 'pending'
                      ? 'bg-yellow-100'
                      : 'bg-red-100'
                  }`}>
                  {payment.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : payment.status === 'pending' ? (
                    <Clock className="w-6 h-6 text-yellow-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {payment.status}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <PhilippinePeso className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Amount</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ₱{payment.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Method</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {payment.method?.replace('_', ' ') || 'N/A'}
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
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <DollarSign className="w-5 h-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 capitalize">
                    {payment.type?.replace('_', ' ') || 'Payment'}
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getStatusBadge(payment.status)}>
                      {payment.status}
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
                        ₱{payment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">
                        Payment Method
                      </Label>
                      <p className="text-gray-900 font-medium capitalize">
                        {payment.method?.replace('_', ' ') || 'N/A'}
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
                  </div>
                </div>

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
                    <p className="text-yellow-900">{payment.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tenant and Property Info */}
          <div className="space-y-6">
            {/* Tenant Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <User className="w-5 h-5" />
                  Tenant Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {payment.tenant?.first_name || 'N/A'}{' '}
                    {payment.tenant?.last_name || ''}
                  </h3>
                  {payment.tenant?.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Email:</span>
                      <span className="text-gray-900 font-medium">
                        {payment.tenant.email}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Property Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <Building className="w-5 h-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {payment.property?.name || 'Unnamed Property'}
                  </h3>
                  {payment.property?.address && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">Address:</span>
                      <span className="text-gray-900 font-medium">
                        {payment.property.address}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Timeline */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <Calendar className="w-5 h-5" />
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

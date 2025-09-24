'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  Table2,
  LayoutGrid,
  CreditCard,
  Receipt,
  Download
} from 'lucide-react';
import { PaymentsAPI, type PaymentWithDetails } from '@/lib/api/payments';
import { PaymentCard } from '@/components/payments/payment-card';
import { PaymentFilters } from '@/components/payments/payment-filters';
import { toast } from 'sonner';

export default function TenantPaymentsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Load tenant payments
  useEffect(() => {
    const loadPayments = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        const result = await PaymentsAPI.getTenantPayments(authState.user.id);

        if (result.success) {
          setPayments(result.data || []);
        } else {
          toast.error(result.message || 'Failed to load payments');
        }
      } catch (error) {
        console.error('Failed to load payments:', error);
        toast.error('Failed to load payments');
      } finally {
        setIsLoading(false);
      }
    };

    loadPayments();
  }, [authState.user?.id]);

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.payment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || payment.payment_status === filterStatus;
    const matchesType = filterType === 'all' || payment.payment_type === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Get status badge variant
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

  // Get payment type badge variant
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

  // Handle view payment
  const handleViewPayment = (payment: PaymentWithDetails) => {
    router.push(`/tenant/dashboard/payments/${payment.id}`);
  };

  // Handle download receipt
  const handleDownloadReceipt = (payment: PaymentWithDetails) => {
    if (payment.receipt_url) {
      window.open(payment.receipt_url, '_blank');
    } else {
      toast.error('No receipt available for this payment');
    }
  };

  // Statistics
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.payment_status === 'pending').length,
    paid: payments.filter(p => p.payment_status === 'paid').length,
    overdue: payments.filter(p => p.payment_status === 'pending' && new Date(p.due_date) < new Date()).length,
    totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    pendingAmount: payments.filter(p => p.payment_status === 'pending').reduce((sum, p) => sum + Number(p.amount), 0),
    paidAmount: payments.filter(p => p.payment_status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Loading payments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              My Payments
            </h1>
            <p className="text-blue-600/70 mt-1">
              Track and manage your payment history
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-600">Total Payments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.paid}</p>
                  <p className="text-sm text-gray-600">Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.overdue}</p>
                  <p className="text-sm text-gray-600">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Amount Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  ₱{stats.totalAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Total Amount</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  ₱{stats.pendingAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Pending Amount</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  ₱{stats.paidAmount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Paid Amount</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <PaymentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          filterType={filterType}
          onTypeChange={setFilterType}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredPayments.length} of {payments.length} payments
          </p>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/50">
                    <TableHead className="text-blue-700 font-semibold">Payment</TableHead>
                    <TableHead className="text-blue-700 font-semibold">Property</TableHead>
                    <TableHead className="text-blue-700 font-semibold">Type</TableHead>
                    <TableHead className="text-blue-700 font-semibold">Status</TableHead>
                    <TableHead className="text-blue-700 font-semibold">Amount</TableHead>
                    <TableHead className="text-blue-700 font-semibold">Due Date</TableHead>
                    <TableHead className="text-blue-700 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map(payment => (
                    <TableRow
                      key={payment.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {payment.payment_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          {payment.reference_number && (
                            <p className="text-sm text-gray-600">
                              Ref: {payment.reference_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">
                            {payment.property.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {payment.property.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentTypeBadge(payment.payment_type)}>
                          {payment.payment_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadge(payment.payment_status)}>
                          {payment.payment_status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-gray-900">
                            ₱{Number(payment.amount).toLocaleString()}
                          </p>
                          {payment.late_fee && payment.late_fee > 0 && (
                            <p className="text-sm text-red-600">
                              +₱{Number(payment.late_fee).toLocaleString()} late fee
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-gray-900">
                            {new Date(payment.due_date).toLocaleDateString()}
                          </p>
                          {payment.paid_date && (
                            <p className="text-xs text-green-600">
                              Paid: {new Date(payment.paid_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewPayment(payment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {payment.payment_status === 'paid' && payment.receipt_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadReceipt(payment)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPayments.map(payment => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                role="tenant"
                onView={handleViewPayment}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredPayments.length === 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No payments found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No payments have been created for your account yet.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
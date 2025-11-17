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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  DollarSign,
  Plus,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Home,
  Table2,
  LayoutGrid,
  Edit,
  Trash2,
  CreditCard,
  Receipt,
  PhilippinePeso
} from 'lucide-react';
import {
  PaymentsAPI,
  type PaymentWithDetails,
  type PaymentFormData
} from '@/lib/api/payments';
import { PropertiesAPI } from '@/lib/api/properties';
import { PaymentCard } from '@/components/payments/payment-card';
import { PaymentFilters } from '@/components/payments/payment-filters';
import { PaymentForm } from '@/components/payments/payment-form';
import { PaymentDetailsModal } from '@/components/payments/payment-details-modal';
import { toast } from 'sonner';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
}

interface Tenant {
  id: string;
  property_id: string;
  unit_number: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function OwnerPaymentsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterTenant, setFilterTenant] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        const [paymentsResult, propertiesResult] = await Promise.all([
          PaymentsAPI.getOwnerPayments(authState.user.id),
          PropertiesAPI.getProperties(authState.user.id)
        ]);

        if (paymentsResult.success) {
          setPayments(paymentsResult.data || []);
        }

        if (propertiesResult.success) {
          setProperties(propertiesResult.data || []);
          // Get tenants for all properties
          const allTenants: Tenant[] = [];
          for (const property of propertiesResult.data || []) {
            const tenantsResult = await PropertiesAPI.getPropertyTenants(
              property.id
            );
            if (tenantsResult.success) {
              // Add property_id to each tenant for filtering
              const tenantsWithProperty = (tenantsResult.data || []).map(
                tenant => ({
                  ...tenant,
                  property_id: property.id
                })
              );
              allTenants.push(...tenantsWithProperty);
            }
          }
          setTenants(allTenants);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load payments data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authState.user?.id]);

  // Filter and sort payments
  const filteredPayments = payments
    .filter(payment => {
      const matchesSearch =
        payment.payment_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.tenant?.user?.first_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payment.tenant?.user?.last_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payment.tenant?.user?.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payment.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference_number
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        !searchTerm;

      const matchesStatus =
        filterStatus === 'all' || payment.payment_status === filterStatus;
      const matchesType =
        filterType === 'all' || payment.payment_type === filterType;
      const matchesTenant =
        filterTenant === 'all' || payment.tenant_id === filterTenant;

      return matchesSearch && matchesStatus && matchesType && matchesTenant;
    })
    .sort((a, b) => {
      // Sort by due date (most recent first)
      const dateA = new Date(a.due_date).getTime();
      const dateB = new Date(b.due_date).getTime();
      return dateB - dateA;
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
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  // Handle edit payment
  const handleEditPayment = (payment: PaymentWithDetails) => {
    setSelectedPayment(payment);
    setIsEditDialogOpen(true);
  };

  // Handle delete payment
  const handleDeletePayment = async (payment: PaymentWithDetails) => {
    if (
      window.confirm(
        'Are you sure you want to delete this payment? This action cannot be undone.'
      )
    ) {
      try {
        const result = await PaymentsAPI.deletePayment(payment.id);
        if (result.success) {
          toast.success('Payment deleted successfully');
          setPayments(prev => prev.filter(p => p.id !== payment.id));
        } else {
          toast.error(result.message || 'Failed to delete payment');
        }
      } catch (error) {
        console.error('Delete payment error:', error);
        toast.error('Failed to delete payment');
      }
    }
  };

  // Handle mark as paid
  const handleMarkAsPaid = async (payment: PaymentWithDetails) => {
    try {
      const result = await PaymentsAPI.markPaymentAsPaid(payment.id);
      if (result.success) {
        toast.success('Payment marked as paid successfully');
        // Reload payments
        const paymentsResult = await PaymentsAPI.getOwnerPayments(
          authState.user?.id || ''
        );
        if (paymentsResult.success) {
          setPayments(paymentsResult.data || []);
        }
      } else {
        toast.error(result.message || 'Failed to mark payment as paid');
      }
    } catch (error) {
      console.error('Mark payment as paid error:', error);
      toast.error('Failed to mark payment as paid');
    }
  };

  // Handle create payment
  const handleCreatePayment = async (data: PaymentFormData) => {
    try {
      setIsSubmitting(true);

      // Use Xendit integration if requested
      if (data.sendXenditLink) {
        const result = await PaymentsAPI.createPaymentWithXendit({
          tenant_id: data.tenant_id,
          property_id: data.property_id,
          amount: data.amount,
          payment_type: data.payment_type,
          payment_method: data.payment_method,
          due_date: data.due_date,
          description: data.notes,
          created_by: authState.user?.id || '',
          sendXenditLink: true
        });

        if (result.success) {
          toast.success(
            result.message || 'Payment created successfully with Xendit link'
          );
          setIsCreateDialogOpen(false);
          // Reload payments
          const paymentsResult = await PaymentsAPI.getOwnerPayments(
            authState.user?.id || ''
          );
          if (paymentsResult.success) {
            setPayments(paymentsResult.data || []);
          }
        } else {
          toast.error(result.message || 'Failed to create payment');
        }
      } else {
        // Regular payment creation
        const result = await PaymentsAPI.createPayment(
          data,
          authState.user?.id || ''
        );
        if (result.success) {
          toast.success('Payment created successfully');
          setIsCreateDialogOpen(false);
          // Reload payments
          const paymentsResult = await PaymentsAPI.getOwnerPayments(
            authState.user?.id || ''
          );
          if (paymentsResult.success) {
            setPayments(paymentsResult.data || []);
          }
        } else {
          toast.error(result.message || 'Failed to create payment');
        }
      }
    } catch (error) {
      console.error('Create payment error:', error);
      toast.error('Failed to create payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle update payment
  const handleUpdatePayment = async (data: PaymentFormData) => {
    if (!selectedPayment) return;

    try {
      setIsSubmitting(true);
      const result = await PaymentsAPI.updatePayment(selectedPayment.id, data);
      if (result.success) {
        toast.success('Payment updated successfully');
        setIsEditDialogOpen(false);
        setSelectedPayment(null);
        // Reload payments
        const paymentsResult = await PaymentsAPI.getOwnerPayments(
          authState.user?.id || ''
        );
        if (paymentsResult.success) {
          setPayments(paymentsResult.data || []);
        }
      } else {
        toast.error(result.message || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Update payment error:', error);
      toast.error('Failed to update payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Statistics
  const stats = {
    total: payments.length,
    pending: payments.filter(p => p.payment_status === 'pending').length,
    paid: payments.filter(p => p.payment_status === 'paid').length,
    overdue: payments.filter(
      p => p.payment_status === 'pending' && new Date(p.due_date) < new Date()
    ).length,
    totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    pendingAmount: payments
      .filter(p => p.payment_status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0),
    paidAmount: payments
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0)
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-sm sm:text-base">
              Loading payments...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Payment Management
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Track and manage all property payments
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              {/* <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
                <Plus className="w-4 h-4 mr-2" />
                Create Payment
              </Button> */}
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">
                  Create New Payment
                </DialogTitle>
                <DialogDescription className="text-sm sm:text-base">
                  Create a new payment record for a tenant.
                </DialogDescription>
              </DialogHeader>
              <PaymentForm
                properties={properties}
                tenants={tenants}
                onSubmit={handleCreatePayment}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={isSubmitting}
                role="owner"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Total Payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.pending}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.paid}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {stats.overdue}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Amount Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  ₱{stats.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  ₱{stats.pendingAmount.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Pending Amount
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  ₱{stats.paidAmount.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Paid Amount</p>
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
          filterTenant={filterTenant}
          onTenantChange={setFilterTenant}
          tenants={tenants}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-sm sm:text-base">
            Showing {filteredPayments.length} of {payments.length} payments
          </p>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/50">
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                      Payment
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden sm:table-cell">
                      Tenant
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden md:table-cell">
                      Property
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                      Type
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                      Status
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                      Amount
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden lg:table-cell">
                      Due Date
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map(payment => (
                    <TableRow
                      key={payment.id}
                      className="hover:bg-blue-50/30 transition-colors">
                      <TableCell className="p-3 sm:p-4">
                        <div>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                            {payment.payment_type
                              .replace('_', ' ')
                              .replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                          {payment.reference_number && (
                            <p className="text-xs text-gray-600">
                              Ref: {payment.reference_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4 hidden sm:table-cell">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            {payment.tenant?.user?.first_name || 'N/A'}{' '}
                            {payment.tenant?.user?.last_name || ''}
                          </p>
                          <p className="text-xs text-gray-600">
                            {payment.tenant?.user?.email || 'No email'}
                          </p>
                          {payment.tenant?.unit_number && (
                            <p className="text-xs text-gray-500">
                              Unit {payment.tenant.unit_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4 hidden md:table-cell">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            {payment.property?.name || 'Unnamed Property'}
                          </p>
                          <p className="text-xs text-gray-600">
                            {payment.property?.city || payment.property?.address || 'No address'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4">
                        <Badge
                          className={getPaymentTypeBadge(payment.payment_type)}>
                          {payment.payment_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4">
                        <Badge
                          className={getStatusBadge(payment.payment_status)}>
                          {payment.payment_status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4">
                        <div>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                            ₱{Number(payment.amount).toLocaleString()}
                          </p>
                          {payment.late_fee && payment.late_fee > 0 ? (
                            <p className="text-xs text-red-600">
                              +₱{Number(payment.late_fee).toLocaleString()} late
                              fee
                            </p>
                          ):''}
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4 hidden lg:table-cell">
                        <div>
                          <p className="text-xs text-gray-900">
                            {new Date(payment.due_date).toLocaleDateString()}
                          </p>
                          {payment.paid_date && (
                            <p className="text-xs text-green-600">
                              Paid:{' '}
                              {new Date(payment.paid_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4">
                        <div className="flex gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleViewPayment(payment)}>
                            <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          </Button>
                          {payment.payment_status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 sm:h-8 sm:w-8"
                                onClick={() => handleEditPayment(payment)}>
                                <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 sm:h-8 sm:w-8 text-green-600 hover:text-green-700"
                                onClick={() => handleMarkAsPaid(payment)}>
                                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 sm:h-8 sm:w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleDeletePayment(payment)}>
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredPayments.map(payment => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                role="owner"
                onView={handleViewPayment}
                onEdit={handleEditPayment}
                onDelete={handleDeletePayment}
                onMarkPaid={handleMarkAsPaid}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredPayments.length === 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="py-8 sm:py-12 text-center">
              <PhilippinePeso className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No payments found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                {searchTerm || filterStatus !== 'all' || filterType !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first payment.'}
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base">
                <Plus className="w-4 h-4 mr-2" />
                Create Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">
                Edit Payment
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Update the payment details.
              </DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <PaymentForm
                initialData={{
                  tenant_id: selectedPayment.tenant_id,
                  property_id: selectedPayment.property_id,
                  amount: Number(selectedPayment.amount),
                  payment_type: selectedPayment.payment_type as any,
                  payment_method: selectedPayment.payment_method as any,
                  due_date: selectedPayment.due_date,
                  late_fee: Number(selectedPayment.late_fee),
                  reference_number: selectedPayment.reference_number || '',
                  notes: selectedPayment.notes || ''
                }}
                properties={properties}
                tenants={tenants}
                onSubmit={handleUpdatePayment}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedPayment(null);
                }}
                isLoading={isSubmitting}
                role="owner"
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Details Modal */}
        <PaymentDetailsModal
          payment={selectedPayment}
          isOpen={isDetailsModalOpen}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setSelectedPayment(null);
          }}
        />
      </div>
    </div>
  );
}

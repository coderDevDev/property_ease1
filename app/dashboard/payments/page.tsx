'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  PhilippinePeso,
  RefreshCw,
  X
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';

interface Payment {
  id: string;
  amount: number;
  type: 'rent' | 'deposit' | 'utilities' | 'penalty' | 'other';
  method: 'gcash' | 'maya' | 'bank_transfer' | 'cash' | 'check';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  due_date: string;
  paid_date?: string;
  created_at: string;
  tenant_id: string;
  property_id: string;
  receipt_url?: string;
  reference_number?: string;
  notes?: string;
}

interface PaymentWithDetails extends Payment {
  tenant: {
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  property: {
    name: string;
    address: string;
  } | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [refunds, setRefunds] = useState<any[]>([]);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [refundAction, setRefundAction] = useState<'approve' | 'reject' | null>(null);
  const [refundNotes, setRefundNotes] = useState('');

  useEffect(() => {
    loadPayments();
    loadRefunds();
  }, [statusFilter]);

  const loadPayments = async () => {
    try {
      setIsLoading(true);
      const statusParam = statusFilter !== 'all' ? statusFilter : undefined;

      const result = await AdminAPI.getAllPayments(statusParam, 100);
      if (result.success) {
        setPayments(result.data);
      } else {
        toast.error('Failed to load payments');
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRefunds = async () => {
    try {
      const result = await AdminAPI.getAllRefunds();
      if (result.success) {
        setRefunds(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load refunds:', error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.tenant?.first_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.tenant?.last_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payment.tenant?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || payment.type === typeFilter;
    const matchesMethod =
      methodFilter === 'all' || payment.method === methodFilter;

    return matchesSearch && matchesType && matchesMethod;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <PhilippinePeso className="w-4 h-4" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'gcash':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'maya':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'bank_transfer':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'cash':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'check':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading payments...</p>
        </div>
      </div>
    );
  }

  const totalPayments = payments.length;
  const completedPayments = payments.filter(p => p.status === 'completed');
  const pendingPayments = payments.filter(p => p.status === 'pending');
  const failedPayments = payments.filter(p => p.status === 'failed');

  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const failedAmount = failedPayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Payment Monitoring
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Monitor payment transactions and revenue
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 self-start sm:self-auto">
            <PhilippinePeso className="w-3 h-3 mr-1" />
            {filteredPayments.length} Payments
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">₱{pendingAmount.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">₱{failedAmount.toLocaleString()}</p>
                  <p className="text-xs sm:text-sm text-gray-600">Failed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {totalPayments > 0 ? Math.round((completedPayments.length / totalPayments) * 100) : 0}%
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Payments</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="search"
                  placeholder="Search by tenant, property, or reference..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="penalty">Penalty</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="method-filter">Method</Label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="maya">Maya</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

        {/* Tabs: Payments & Refunds */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-white/70 backdrop-blur-sm border-blue-200/50">
            <TabsTrigger value="all" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <PhilippinePeso className="w-4 h-4 mr-2" />
              Payments
              <Badge className="ml-2 bg-blue-100 text-blue-700">{filteredPayments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="refunds" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refunds
              <Badge className="ml-2 bg-yellow-100 text-yellow-700">
                {refunds.filter(r => r.status === 'pending').length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="all">
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhilippinePeso className="w-5 h-5" />
            All Payments ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payment Details</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map(payment => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div>
                        {payment.reference_number && (
                          <div className="font-medium text-gray-900">
                            #{payment.reference_number}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(payment.created_at).toLocaleDateString()}
                        </div>
                        {payment.notes && (
                          <div className="text-xs text-gray-400 mt-1">
                            {payment.notes}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.tenant ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {payment.tenant.first_name}{' '}
                            {payment.tenant.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.tenant.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No tenant</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.property ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {payment.property.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.property.address}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No property</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        ₱{payment.amount.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {payment.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getMethodBadgeColor(
                          payment.method
                        )} capitalize`}>
                        <CreditCard className="w-3 h-3 mr-1" />
                        {payment.method === 'bank_transfer'
                          ? 'Bank'
                          : payment.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusBadgeColor(
                          payment.status
                        )} capitalize`}>
                        {getStatusIcon(payment.status)}
                        <span className="ml-1">{payment.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {new Date(payment.due_date).toLocaleDateString()}
                      </div>
                      {new Date(payment.due_date) < new Date() &&
                        payment.status === 'pending' && (
                          <div className="text-xs text-red-600 font-medium">
                            Overdue
                          </div>
                        )}
                    </TableCell>
                    <TableCell>
                      {payment.paid_date ? (
                        <div className="text-sm text-gray-900">
                          {new Date(payment.paid_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <PhilippinePeso className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No payments found
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Try adjusting your search criteria.'
                  : 'No payments match the current filters.'}
              </p>
            </div>
          )}
        </CardContent>
        </Card>
          </TabsContent>

          {/* Refunds Tab */}
          <TabsContent value="refunds">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Refund Requests ({refunds.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tenant</TableHead>
                        <TableHead>Payment Details</TableHead>
                        <TableHead>Refund Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refunds.map((refund: any) => (
                        <TableRow key={refund.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">
                                {refund.requested_by_user?.first_name}{' '}
                                {refund.requested_by_user?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {refund.requested_by_user?.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">
                                #{refund.payment?.reference_number}
                              </div>
                              <div className="text-sm text-gray-500">
                                {refund.payment?.property?.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                ₱{Number(refund.payment?.amount || 0).toLocaleString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900">
                              ₱{Number(refund.amount).toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate text-sm text-gray-600">
                              {refund.reason}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                refund.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : refund.status === 'approved'
                                  ? 'bg-blue-100 text-blue-700'
                                  : refund.status === 'rejected'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-green-100 text-green-700'
                              }>
                              {refund.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-900">
                              {new Date(refund.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            {refund.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => {
                                    setSelectedRefund(refund);
                                    setRefundAction('approve');
                                    setIsRefundDialogOpen(true);
                                  }}>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedRefund(refund);
                                    setRefundAction('reject');
                                    setIsRefundDialogOpen(true);
                                  }}>
                                  <X className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {refund.status === 'approved' && (
                              <Badge className="bg-blue-100 text-blue-700">
                                Awaiting Processing
                              </Badge>
                            )}
                            {(refund.status === 'rejected' || refund.status === 'processed') && (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {refunds.length === 0 && (
                  <div className="text-center py-8">
                    <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No refund requests
                    </h3>
                    <p className="text-gray-600">
                      No refund requests have been submitted yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Refund Action Dialog */}
        <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {refundAction === 'approve' ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Approve Refund
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5 text-red-600" />
                    Reject Refund
                  </>
                )}
              </DialogTitle>
              <DialogDescription>
                {refundAction === 'approve'
                  ? 'Approve this refund request?'
                  : 'Provide a reason for rejecting this refund request.'}
              </DialogDescription>
            </DialogHeader>

            {selectedRefund && (
              <div className="space-y-4">
                {/* Refund Info */}
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tenant:</span>
                    <span className="font-medium">
                      {selectedRefund.requested_by_user?.first_name}{' '}
                      {selectedRefund.requested_by_user?.last_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">₱{Number(selectedRefund.amount).toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Reason:</span>
                    <p className="mt-1 text-gray-900">{selectedRefund.reason}</p>
                  </div>
                </div>

                {/* Notes/Reason Input */}
                <div>
                  <Label htmlFor="refund-notes">
                    {refundAction === 'approve' ? 'Notes (Optional)' : 'Rejection Reason *'}
                  </Label>
                  <Textarea
                    id="refund-notes"
                    placeholder={
                      refundAction === 'approve'
                        ? 'Add any notes for this approval...'
                        : 'Explain why this refund is being rejected...'
                    }
                    value={refundNotes}
                    onChange={(e) => setRefundNotes(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRefundDialogOpen(false);
                  setRefundNotes('');
                  setSelectedRefund(null);
                  setRefundAction(null);
                }}>
                Cancel
              </Button>
              <Button
                onClick={handleRefundAction}
                disabled={isSubmitting || (refundAction === 'reject' && !refundNotes.trim())}
                className={
                  refundAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }>
                {isSubmitting ? 'Processing...' : refundAction === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  // Handle refund approval/rejection
  async function handleRefundAction() {
    if (!selectedRefund) return;

    if (refundAction === 'reject' && !refundNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const result = refundAction === 'approve'
        ? await AdminAPI.approveRefund(selectedRefund.id, refundNotes || undefined)
        : await AdminAPI.rejectRefund(selectedRefund.id, refundNotes);

      if (result.success) {
        toast.success(
          refundAction === 'approve'
            ? 'Refund approved successfully!'
            : 'Refund rejected successfully.'
        );
        setIsRefundDialogOpen(false);
        setRefundNotes('');
        setSelectedRefund(null);
        setRefundAction(null);
        // Reload refunds
        loadRefunds();
      } else {
        toast.error(result.message || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Refund action error:', error);
      toast.error('Failed to process refund');
    } finally {
      setIsSubmitting(false);
    }
  }
}

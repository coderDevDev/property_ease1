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
  PhilippinePeso
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

  useEffect(() => {
    loadPayments();
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
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Monitoring
          </h1>
          <p className="text-gray-600">
            Monitor payment transactions and revenue
          </p>
        </div>
        <Badge variant="outline" className="border-blue-200 text-blue-700">
          {filteredPayments.length} Payments
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₱{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {completedPayments.length} completed payments
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Amount
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">
              ₱{pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {pendingPayments.length} pending payments
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Failed Amount
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              ₱{failedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {failedPayments.length} failed payments
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Success Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {totalPayments > 0
                ? Math.round((completedPayments.length / totalPayments) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {completedPayments.length} of {totalPayments} payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
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

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PhilippinePeso className="w-5 h-5" />
            Payments ({filteredPayments.length})
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
    </div>
  );
}

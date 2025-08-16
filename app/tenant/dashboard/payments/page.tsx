'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Receipt,
  Wallet,
  ArrowRight,
  Download,
  Filter,
  Search,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: 'paid' | 'pending' | 'overdue';
  payment_method?: string;
  transaction_id?: string;
  description: string;
  receipt_url?: string;
}

interface PaymentStats {
  total_paid: number;
  total_pending: number;
  next_payment_date?: string;
  next_payment_amount?: number;
}

export default function PaymentsPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getPayments(authState.user.id);

        if (result.success && result.data) {
          setPayments(result.data.payments);
          setStats(result.data.stats);
        } else {
          toast.error('Failed to load payments');
        }
      } catch (error) {
        console.error('Failed to fetch payments:', error);
        toast.error('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [authState.user?.id]);

  const handleMakePayment = async (paymentId: string) => {
    try {
      setProcessingPayment(true);
      const result = await TenantAPI.processPayment(paymentId);

      if (result.success) {
        // Update the payment in the list
        setPayments(prevPayments =>
          prevPayments.map(payment =>
            payment.id === paymentId
              ? {
                  ...payment,
                  status: 'paid',
                  paid_date: new Date().toISOString()
                }
              : payment
          )
        );
        setShowPaymentDialog(false);
        toast.success('Payment processed successfully');
      } else {
        toast.error(result.message || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      const result = await TenantAPI.downloadReceipt(payment.id);
      if (result.success && result.url) {
        window.open(result.url, '_blank');
      } else {
        toast.error('Failed to download receipt');
      }
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast.error('Failed to download receipt');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesFilter = filter === 'all' || payment.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      payment.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payments</h1>
        <p className="text-gray-600">
          View and manage your rent payments and transaction history
        </p>
      </div>

      {/* Payment Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{stats?.total_paid.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₱{stats?.total_pending.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Next Payment</p>
                {stats?.next_payment_date ? (
                  <>
                    <p className="text-lg font-semibold text-gray-900">
                      ₱{stats.next_payment_amount?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Due:{' '}
                      {new Date(stats.next_payment_date).toLocaleDateString()}
                    </p>
                  </>
                ) : (
                  <p className="text-lg font-semibold text-gray-900">
                    No upcoming payments
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search payments..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Payments List */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-600" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Payments Found
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'No payments match your search criteria'
                    : 'You have no payment history yet'}
                </p>
              </div>
            ) : (
              filteredPayments.map(payment => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-full ${
                        payment.status === 'paid'
                          ? 'bg-green-100'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100'
                          : 'bg-red-100'
                      }`}>
                      <CreditCard
                        className={`w-4 h-4 ${
                          payment.status === 'paid'
                            ? 'text-green-600'
                            : payment.status === 'pending'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Due: {new Date(payment.due_date).toLocaleDateString()}
                        </span>
                        {payment.paid_date && (
                          <>
                            <ArrowRight className="w-3 h-3" />
                            <span>
                              Paid:{' '}
                              {new Date(payment.paid_date).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-gray-900">
                      ₱{payment.amount.toLocaleString()}
                    </p>
                    <Badge
                      className={`${
                        payment.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : payment.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      } border-0`}>
                      {payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)}
                    </Badge>
                    {payment.status === 'pending' && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowPaymentDialog(true);
                        }}>
                        Pay Now
                      </Button>
                    )}
                    {payment.status === 'paid' && payment.receipt_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-700 hover:bg-blue-50"
                        onClick={() => handleDownloadReceipt(payment)}>
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Make Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPayment && (
              <>
                <div className="space-y-2">
                  <Label>Amount Due</Label>
                  <p className="text-2xl font-bold text-gray-900">
                    ₱{selectedPayment.amount.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <p className="text-gray-900">
                    {new Date(selectedPayment.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select defaultValue="card">
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Credit/Debit Card</SelectItem>
                      <SelectItem value="gcash">GCash</SelectItem>
                      <SelectItem value="maya">Maya</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  onClick={() => handleMakePayment(selectedPayment.id)}
                  disabled={processingPayment}>
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Payment'
                  )}
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
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
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { generatePaymentSchedulePDF } from '@/lib/pdf/paymentSchedulePDF';
import {
  DollarSign,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Home,
  CreditCard,
  Receipt,
  Download,
  RefreshCw,
  Zap,
  Droplet,
  Wifi,
  TrendingUp,
  FileText,
  ArrowRight,
  Shield,
  Plus
} from 'lucide-react';
import { PaymentsAPI, type PaymentWithDetails } from '@/lib/api/payments';
import { DepositsAPI, type DepositBalance, type MoveOutInspection, type DepositDeduction } from '@/lib/api/deposits';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { PaymentCalendar } from '@/components/payments/PaymentCalendar';
import { PropertyPaymentSummary } from '@/components/payments/PropertyPaymentSummary';
import { PaymentTimeline } from '@/components/payments/PaymentTimeline';
import { DepositBalanceCard } from '@/components/tenant/DepositBalanceCard';
import { CreateAdvancePaymentDialog } from '@/components/tenant/CreateAdvancePaymentDialog';

// Enhanced payment interface with status and calculations
interface EnhancedPayment extends PaymentWithDetails {
  status: 'overdue' | 'due_soon' | 'pending' | 'paid';
  lateFee: number;
  daysUntilDue: number;
  daysOverdue: number;
  totalAmount: number;
}

interface PaymentSummary {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  dueSoon: number;
  overdueCount: number;
  dueSoonCount: number;
}

// Helper Functions
function calculateDaysUntilDue(dueDate: string): number {
  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function calculateLateFee(payment: PaymentWithDetails): number {
  if (payment.payment_status === 'paid') return 0;

  const daysOverdue = Math.abs(
    Math.min(0, calculateDaysUntilDue(payment.due_date))
  );
  if (daysOverdue === 0) return 0;

  // Late fee: 5% of amount or ₱50/day, whichever is higher
  const percentageFee = Number(payment.amount) * 0.05;
  const dailyFee = daysOverdue * 50;

  return Math.max(percentageFee, dailyFee);
}

function getPaymentStatus(
  payment: PaymentWithDetails
): 'overdue' | 'due_soon' | 'pending' | 'paid' {
  if (payment.payment_status === 'paid') return 'paid';

  const daysUntilDue = calculateDaysUntilDue(payment.due_date);

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return 'due_soon';
  return 'pending';
}

function enhancePayment(payment: PaymentWithDetails): EnhancedPayment {
  const status = getPaymentStatus(payment);
  const lateFee = calculateLateFee(payment);
  const daysUntilDue = calculateDaysUntilDue(payment.due_date);
  const daysOverdue = Math.max(0, -daysUntilDue);
  const totalAmount = Number(payment.amount) + lateFee;

  return {
    ...payment,
    status,
    lateFee,
    daysUntilDue,
    daysOverdue,
    totalAmount
  };
}

export default function TenantPaymentsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [selectedPayment, setSelectedPayment] =
    useState<PaymentWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [viewMode, setViewMode] = useState<
    'list' | 'calendar' | 'timeline' | 'properties' | 'table'
  >('table'); // Default to table view
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Xendit payment dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Deposit state
  const [depositBalance, setDepositBalance] = useState<DepositBalance | null>(null);
  const [inspection, setInspection] = useState<MoveOutInspection | null>(null);
  const [deductions, setDeductions] = useState<DepositDeduction[]>([]);

  // Advance payment dialog
  const [showAdvancePaymentDialog, setShowAdvancePaymentDialog] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Load tenant payments function (can be called manually)
  const loadPayments = async () => {
    if (!authState.user?.id) return;

    try {
      setIsLoading(true);
      const result = await PaymentsAPI.getTenantPayments(authState.user.id);

      if (result.success) {
        setPayments(result.data || []);
        // Get tenant ID from first payment
        if (result.data && result.data.length > 0 && result.data[0].tenant_id) {
          setTenantId(result.data[0].tenant_id);
        }
      } else {
        // Show friendly error message
        const errorMessage = result.message || 'Failed to load payments';

        // Check if it's a connection issue
        if (
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('503')
        ) {
          toast.error(
            '⚠️ Database connection issue. Please refresh the page.'
          );
        } else {
          toast.error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Load payments error:', error);
      toast.error('⚠️ Unable to connect to database. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load tenant payments on mount
  useEffect(() => {
    loadPayments();
  }, [authState.user?.id]);

  // Load deposit data
  const loadDepositData = async () => {
    if (!payments || payments.length === 0) return;
    
    // Get first payment's tenant_id
    const tenantId = payments[0]?.tenant?.id;
    if (!tenantId) return;

    try {
      const deposit = await DepositsAPI.getTenantDeposit(tenantId);
      setDepositBalance(deposit);

      if (deposit) {
        const insp = await DepositsAPI.getTenantInspection(tenantId);
        setInspection(insp);

        if (insp) {
          const deds = await DepositsAPI.getInspectionDeductions(insp.id);
          setDeductions(deds);
        }
      }
    } catch (error) {
      console.error('Error loading deposit data:', error);
    }
  };

  // Load deposit when payments are loaded
  useEffect(() => {
    loadDepositData();
  }, [payments]);

  // Check for payment status from URL (after Xendit redirect)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paymentStatus = searchParams.get('payment');
    const paymentId = searchParams.get('payment_id');

    if (paymentStatus === 'success') {
      // Show success toast immediately
      toast.success('✅ Payment confirmed successfully!');

      // Poll for updated payment status (webhook may take a few seconds)
      const checkPaymentStatus = async () => {
        // Wait 2 seconds for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Reload payments to get updated status
        toast.info('🔄 Refreshing payment data...');
        await loadPayments();
        
        // Check if payment is still pending (webhook didn't work)
        // NOTE: This auto-confirm is temporary until Xendit webhooks are properly configured
        if (paymentId) {
          const result = await PaymentsAPI.getTenantPayments(authState.user.id);
          if (result.success && result.data) {
            const payment = result.data.find((p: any) => p.id === paymentId);
            if (payment && payment.payment_status === 'pending') {
              // Auto-confirm payment (webhook didn't arrive)
              console.log('⚠️ Webhook not received, auto-confirming payment...');
              
              // Wait 1 second then auto-confirm with the actual payment ID
              setTimeout(async () => {
                await confirmSpecificPayment(paymentId);
                // Refresh again after confirmation
                await loadPayments();
              }, 1000);
            } else {
              toast.success('✅ Payment status updated!');
            }
          }
        } else {
          toast.success('✅ Payment data refreshed!');
        }
      };

      checkPaymentStatus();

      // Clean up URL after a short delay
      setTimeout(() => {
        window.history.replaceState({}, '', '/tenant/dashboard/payments');
      }, 1000);
    } else if (paymentStatus === 'failed') {
      toast.error('❌ Payment failed. Please try again.');
      window.history.replaceState({}, '', '/tenant/dashboard/payments');
    }
  }, [typeof window !== 'undefined' ? window.location.search : '', authState.user?.id]);

  // Enhance payments with status
  const enhancedPayments: EnhancedPayment[] = payments.map(enhancePayment);

  // Filter by status filter
  const getPaymentsByStatus = () => {
    if (statusFilter === 'overdue') {
      return enhancedPayments.filter(p => p.status === 'overdue');
    } else if (statusFilter === 'pending') {
      return enhancedPayments.filter(p => p.payment_status === 'pending' && p.status !== 'overdue');
    } else if (statusFilter === 'paid') {
      return enhancedPayments.filter(p => p.payment_status === 'paid');
    } else {
      return enhancedPayments; // all
    }
  };

  const statusFilteredPayments = getPaymentsByStatus();

  // Filter payments by search and type
  const filteredPayments = statusFilteredPayments.filter(payment => {
    const matchesSearch =
      payment.payment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.reference_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || payment.payment_status === filterStatus;
    const matchesType =
      filterType === 'all' || payment.payment_type === filterType;

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
        return 'bg-green-100 text-green-700';
      case 'security_deposit':
        return 'bg-purple-100 text-purple-700';
      case 'utility':
        return 'bg-yellow-100 text-yellow-700';
      case 'penalty':
        return 'bg-red-100 text-red-700';
      case 'other':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get payment status badge variant
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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

  // Confirm specific payment by ID (for auto-confirm after Xendit redirect)
  const confirmSpecificPayment = async (paymentId: string) => {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    try {
      console.log('Confirming specific payment:', paymentId);

      // First check if this payment exists
      console.log('Looking for payment with ID:', paymentId);
      
      const { data: checkPayment, error: checkError } = await supabase
        .from('payments')
        .select('id, payment_type, amount, payment_status, tenant_id')
        .eq('id', paymentId);

      console.log('Query result:', { data: checkPayment, error: checkError });

      if (checkError) {
        console.error('Check payment error:', checkError);
      }

      // Check if we got any results
      const payment = checkPayment && checkPayment.length > 0 ? checkPayment[0] : null;
      console.log('Payment found in DB:', payment);

      if (!payment) {
        console.warn('Payment not found, trying to find most recent pending payment');
        
        // Fallback: Find most recent pending payment for this user
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('user_id', authState.user?.id)
          .single();

        if (tenant) {
          const { data: pendingPayments } = await supabase
            .from('payments')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('payment_status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);

          if (pendingPayments && pendingPayments.length > 0) {
            console.log('Found pending payment:', pendingPayments[0].id);
            // Confirm the most recent pending payment instead
            await confirmPaymentById(pendingPayments[0].id);
            return;
          }
        }

        toast.error('Payment not found in database');
        return;
      }

      // Confirm the payment
      await confirmPaymentById(paymentId);
    } catch (error) {
      console.error('Confirm payment error:', error);
    }
  };

  // Helper function to confirm payment by ID
  const confirmPaymentById = async (id: string) => {
    try {
      // Use API route to update payment (bypasses RLS)
      const response = await fetch('/api/payments/confirm-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        toast.error('Failed to confirm payment');
        return;
      }

      const result = await response.json();
      console.log('Payment confirmed via API:', result);
      toast.success('✅ Payment confirmed successfully!');
      
      // Reload payments
      if (authState.user?.id) {
        const paymentsResult = await PaymentsAPI.getTenantPayments(authState.user.id);
        if (paymentsResult.success && paymentsResult.data) {
          setPayments(paymentsResult.data);
        }
      }
    } catch (error) {
      console.error('Confirm error:', error);
      toast.error('Failed to confirm payment');
    }
  };

  // Manual payment confirmation for development (when webhook doesn't work)
  const handleManualConfirmPayment = async (paymentId: string) => {
    if (process.env.NODE_ENV !== 'development') {
      toast.error('This feature is only available in development mode');
      return;
    }

    try {
      // First, get the tenant ID for this user
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', authState.user?.id)
        .single();

      if (tenantError || !tenant) {
        console.error('Tenant fetch error:', tenantError);
        toast.error('Could not find tenant record');
        return;
      }

      console.log('Found tenant:', tenant.id);

      // Find the most recent pending payment for this tenant
      const { data: pendingPayments, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('payment_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);

      console.log('Pending payments found:', pendingPayments);

      if (fetchError || !pendingPayments || pendingPayments.length === 0) {
        console.error('Fetch error:', fetchError);
        toast.error('No pending payment found. Payment may already be confirmed.');
        return;
      }

      const paymentToConfirm = pendingPayments[0];
      console.log('Confirming payment:', paymentToConfirm.id);

      const { data, error } = await supabase
        .from('payments')
        .update({
          payment_status: 'paid',
          paid_date: new Date().toISOString(),
          payment_method: 'GCASH',
          reference_number: 'manual-dev-' + Date.now(),
          notes: 'Manually confirmed in development mode (webhook not available on localhost)'
        })
        .eq('id', paymentToConfirm.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('✅ Payment confirmed successfully!');
      
      // Reload payments
      if (authState.user?.id) {
        const result = await PaymentsAPI.getTenantPayments(authState.user.id);
        if (result.success && result.data) {
          setPayments(result.data);
        }
      }
    } catch (error) {
      console.error('Manual confirm error:', error);
      toast.error('Failed to confirm payment. Please try again.');
    }
  };

  // Categorize payments
  const overduePayments = enhancedPayments.filter(
    p => p.status === 'overdue' && 
    p.payment_status !== 'refunded'
  );
  const dueSoonPayments = enhancedPayments.filter(
    p => p.status === 'due_soon' && 
    p.payment_status !== 'refunded'
  );
  const paidPayments = enhancedPayments.filter(p => p.status === 'paid');
  const pendingPayments = enhancedPayments.filter(
    p => p.status === 'pending' && 
    p.payment_status !== 'refunded'
  );
  
  // Separate security deposits for special display
  const securityDeposits = enhancedPayments.filter(
    p => p.payment_type === 'security_deposit' && p.payment_status === 'pending'
  );

  // Calculate summary
  const summary: PaymentSummary = {
    total: payments.reduce((sum, p) => sum + Number(p.amount), 0),
    paid: paidPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    pending: pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    overdue: overduePayments.reduce((sum, p) => sum + p.totalAmount, 0),
    dueSoon: dueSoonPayments.reduce((sum, p) => sum + p.totalAmount, 0),
    overdueCount: overduePayments.length,
    dueSoonCount: dueSoonPayments.length
  };

  // Legacy stats for backward compatibility
  const stats = {
    total: payments.length,
    pending: pendingPayments.length,
    paid: paidPayments.length,
    overdue: overduePayments.length,
    totalAmount: summary.total,
    pendingAmount: summary.pending,
    paidAmount: summary.paid
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
              My Payments
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Track and manage your payment history
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {/* Refresh Button */}
            <Button
              onClick={async () => {
                toast.info('Refreshing payment data...');
                await loadPayments();
                toast.success('Payment data refreshed!');
              }}
              variant="outline"
              disabled={isLoading}
              className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {/* <Button
              onClick={() => setShowAdvancePaymentDialog(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Advance Payment
            </Button> */}
            <Button
              onClick={() => {
                if (payments.length === 0) {
                  toast.error('No payments to export');
                  return;
                }
                const firstPayment = payments[0];
                const scheduleData = {
                  tenantName: `${authState.user?.firstName || ''} ${authState.user?.lastName || ''}}`,
                  propertyName: firstPayment.property?.name || 'Property',
                  unitNumber: firstPayment.tenant?.unit_number || 'N/A',
                  leaseStart: firstPayment.tenant?.lease_start || '',
                  leaseEnd: firstPayment.tenant?.lease_end || '',
                  monthlyRent: Number(firstPayment.amount),
                  payments: payments.map(p => ({
                    id: p.id,
                    due_date: p.due_date,
                    amount: Number(p.amount),
                    payment_status: p.payment_status,
                    payment_type: p.payment_type,
                    paid_date: p.paid_date,
                    late_fee: Number(p.late_fee || 0)
                  }))
                };
                generatePaymentSchedulePDF(scheduleData);
                toast.success('Payment schedule exported!');
              }}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50">
              <Download className="w-4 h-4 mr-2" />
              Export as PDF
            </Button>
          </div>
        </div>

        {/* Urgent Payments Alert */}
        {overduePayments.length > 0 && (
          <Card className="border-red-300 bg-red-50/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
                Overdue Payments ({summary.overdueCount})
              </CardTitle>
              <CardDescription className="text-red-600">
                Please settle these payments to avoid additional penalties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {overduePayments.slice(0, 3).map(payment => (
                  <div
                    key={payment.id}
                    className="p-3 bg-white rounded-lg border border-red-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 capitalize">
                          {payment.payment_type.replace('_', ' ')} -{' '}
                          {payment.property.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Due: {new Date(payment.due_date).toLocaleDateString()}
                          <span className="text-red-600 font-medium ml-2">
                            ({payment.daysOverdue} days overdue)
                          </span>
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-lg font-bold text-gray-900">
                            ₱{payment.totalAmount.toLocaleString()}
                          </span>
                          {payment.lateFee > 0 && (
                            <span className="text-sm text-red-600">
                              (+ ₱{payment.lateFee.toLocaleString()} late fee)
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsPaymentDialogOpen(true);
                        }}>
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Due Soon Alert */}
        {dueSoonPayments.length > 0 && overduePayments.length === 0 && (
          <Card className="border-yellow-300 bg-yellow-50/50 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-700 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Due Soon ({summary.dueSoonCount})
              </CardTitle>
              <CardDescription className="text-yellow-600">
                Upcoming payments in the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dueSoonPayments.slice(0, 3).map(payment => (
                  <div
                    key={payment.id}
                    className="p-3 bg-white rounded-lg border border-yellow-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 capitalize">
                          {payment.payment_type.replace('_', ' ')} -{' '}
                          {payment.property.name}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          Due: {new Date(payment.due_date).toLocaleDateString()}
                          <span className="text-yellow-600 font-medium ml-2">
                            (in {payment.daysUntilDue}{' '}
                            {payment.daysUntilDue === 1 ? 'day' : 'days'})
                          </span>
                        </p>
                        <span className="text-lg font-bold text-gray-900 mt-2 inline-block">
                          ₱{payment.amount.toLocaleString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsPaymentDialogOpen(true);
                        }}>
                        Pay Now
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    ₱{summary.overdue.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Overdue ({summary.overdueCount})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    ₱{summary.dueSoon.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Due Soon ({summary.dueSoonCount})
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    ₱{summary.paid.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    ₱{summary.total.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats - Keep for backward compatibility */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-blue-600">
                  ₱{summary.total.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="text-center">
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">
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
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  ₱{stats.paidAmount.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Paid Amount</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Deposit Alert */}
        {securityDeposits.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    Security Deposit Required
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Please pay your security deposit to complete your move-in process
                  </p>
                  <div className="space-y-2">
                    {securityDeposits.map(deposit => (
                      <div key={deposit.id} className="flex items-center justify-between bg-white/70 rounded-lg p-3 border border-purple-200">
                        <div>
                          <p className="font-semibold text-gray-900">{deposit.property.name}</p>
                          <p className="text-sm text-gray-600">
                            Due: {new Date(deposit.due_date).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-700">
                            ₱{Number(deposit.amount).toLocaleString()}
                          </p>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPayment(deposit);
                              setIsPaymentDialogOpen(true);
                            }}
                            className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                            <DollarSign className="w-4 h-4 mr-1" />
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Deposit Card */}
        {depositBalance && (
          <DepositBalanceCard
            deposit={depositBalance}
            inspection={inspection}
            deductions={deductions}
            onRefresh={loadDepositData}
          />
        )}

        {/* Status Filter Buttons */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setStatusFilter('all')}
                className={`gap-1.5 text-xs sm:text-sm ${
                  statusFilter === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                    : 'bg-white hover:bg-blue-50 text-blue-700 border-blue-300'
                }`}>
                <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">All Payments</span>
                <span className="sm:hidden">All</span>
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {payments.length}
                </span>
              </Button>
              <Button
                size="sm"
                onClick={() => setStatusFilter('overdue')}
                className={`gap-1.5 text-xs sm:text-sm ${
                  statusFilter === 'overdue'
                    ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
                    : 'bg-white hover:bg-red-50 text-red-700 border-red-300'
                }`}>
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
                Overdue
                {summary.overdueCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                    {summary.overdueCount}
                  </span>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className={`gap-1.5 text-xs sm:text-sm ${
                  statusFilter === 'pending'
                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white'
                    : 'bg-white hover:bg-yellow-50 text-yellow-700 border-yellow-300'
                }`}>
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                Pending
                {summary.dueSoonCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                    {summary.dueSoonCount}
                  </span>
                )}
              </Button>
              <Button
                size="sm"
                onClick={() => setStatusFilter('paid')}
                className={`gap-1.5 text-xs sm:text-sm ${
                  statusFilter === 'paid'
                    ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                    : 'bg-white hover:bg-green-50 text-green-700 border-green-300'
                }`}>
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                Paid
                <span className="ml-1 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded-full">
                  {enhancedPayments.filter(p => p.payment_status === 'paid').length}
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-2">
                  <FileText className="w-4 h-4" />
                  Table
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Timeline
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="gap-2">
                  <Calendar className="w-4 h-4" />
                  Calendar
                </Button>

                <Button
                  variant={viewMode === 'properties' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('properties')}
                  className="gap-2">
                  <Home className="w-4 h-4" />
                  Properties
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="search" className="sr-only">
                  Search
                </Label>
                <div className="relative">
                  <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>

                <select
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="all">All Types</option>
                  <option value="rent">Rent</option>
                  <option value="advance_rent">Advance Rent</option>
                  <option value="deposit">Deposit (Legacy)</option>
                  <option value="security_deposit">Security Deposit</option>
                  <option value="utility">Utility</option>
                  <option value="penalty">Penalty</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Conditional View Rendering */}
        
        {/* Table View */}
        {viewMode === 'table' && (
          <>
            {/* Desktop Table View */}
            <Card className="hidden md:block bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <TableHead className="text-blue-700 font-semibold">Payment Type</TableHead>
                        <TableHead className="text-blue-700 font-semibold">Property</TableHead>
                        <TableHead className="text-blue-700 font-semibold">Amount</TableHead>
                        <TableHead className="text-blue-700 font-semibold">Due Date</TableHead>
                        <TableHead className="text-blue-700 font-semibold">Status</TableHead>
                        <TableHead className="text-blue-700 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            No payments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayments.map(payment => (
                          <TableRow key={payment.id} className="hover:bg-blue-50/30 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span className="capitalize font-medium">
                                  {payment.payment_type.replace('_', ' ')}
                                </span>
                                {payment.notes && payment.notes.toLowerCase().includes('advance') && (
                                  <span className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                    Advance
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-700">{payment.property.name}</TableCell>
                            <TableCell className="font-bold text-gray-900">
                              ₱{Number(payment.amount).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(payment.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getPaymentStatusBadge(payment.payment_status)} font-medium`}>
                                {payment.payment_status.toUpperCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {payment.payment_status === 'pending' && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setIsPaymentDialogOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                                    Pay Now
                                  </Button>
                                )}
                               
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredPayments.length === 0 ? (
                <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
                  <CardContent className="p-6 text-center text-gray-500">
                    No payments found
                  </CardContent>
                </Card>
              ) : (
                filteredPayments.map(payment => (
                  <Card key={payment.id} className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-gray-900 capitalize">
                                {payment.payment_type.replace('_', ' ')}
                              </h3>
                              {payment.notes && payment.notes.toLowerCase().includes('advance') && (
                                <span className="text-xs bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                  Advance
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{payment.property.name}</p>
                          </div>
                          <Badge className={`${getPaymentStatusBadge(payment.payment_status)} font-medium shrink-0`}>
                            {payment.payment_status.toUpperCase()}
                          </Badge>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Amount</p>
                            <p className="font-bold text-gray-900 text-lg">
                              ₱{Number(payment.amount).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Due Date</p>
                            <p className="font-medium text-gray-700">
                              {new Date(payment.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                          {payment.payment_status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setIsPaymentDialogOpen(true);
                              }}
                              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                              <DollarSign className="w-4 h-4 mr-1" />
                              Pay Now
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedPayment(payment)}
                            className={`${payment.payment_status === 'pending' ? 'flex-none' : 'flex-1'} border-blue-300 text-blue-700 hover:bg-blue-50`}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </>
        )}

        {viewMode === 'calendar' && (
          <PaymentCalendar 
            payments={filteredPayments} 
            onPayNow={(payment) => {
              setSelectedPayment(payment);
              setIsPaymentDialogOpen(true);
            }}
          />
        )}

        {viewMode === 'timeline' && (
          <PaymentTimeline
            payments={filteredPayments}
            daysAhead={30}
            onPayNow={payment => {
              setSelectedPayment(payment);
              setIsPaymentDialogOpen(true);
            }}
          />
        )}

        {viewMode === 'properties' && (
          <PropertyPaymentSummary
            payments={filteredPayments}
            onPayNow={payment => {
              setSelectedPayment(payment);
              setIsPaymentDialogOpen(true);
            }}
          />
        )}

        {/* List View (Default) */}
        {viewMode === 'list' && (
          <>
            {/* Results Count */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600 text-sm sm:text-base">
                Showing {filteredPayments.length} of {payments.length} payments
              </p>
            </div>

            {/* Payments Table */}
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50/50">
                        <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                          Payment
                        </TableHead>
                        <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden sm:table-cell">
                          Property
                        </TableHead>
                        <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden md:table-cell">
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
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                {payment.payment_type
                                  .replace('_', ' ')
                                  .replace(/\b\w/g, l => l.toUpperCase())}
                              </p>
                              {payment.reference_number && (
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Ref: {payment.reference_number}
                                </p>
                              )}
                              <div className="sm:hidden mt-1">
                                <p className="text-xs text-gray-500">
                                  {payment.property.name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <div>
                              <p className="font-medium text-gray-900 text-sm sm:text-base">
                                {payment.property.name}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600">
                                {payment.property.city}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              className={`${getPaymentTypeBadge(
                                payment.payment_type
                              )} text-xs sm:text-sm`}>
                              {payment.payment_type.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getStatusBadge(
                                payment.payment_status
                              )} text-xs sm:text-sm`}>
                              {payment.payment_status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                ₱{Number(payment.amount).toLocaleString()}
                              </p>
                              {payment.late_fee && payment.late_fee > 0 && (
                                <p className="text-xs sm:text-sm text-red-600">
                                  +₱{Number(payment.late_fee).toLocaleString()}{' '}
                                  late fee
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div>
                              <p className="text-xs sm:text-sm text-gray-900">
                                {new Date(
                                  payment.due_date
                                ).toLocaleDateString()}
                              </p>
                              {payment.paid_date && (
                                <p className="text-xs text-green-600">
                                  Paid:{' '}
                                  {new Date(
                                    payment.paid_date
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1 sm:gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPayment(payment)}
                                className="h-8 w-8 sm:h-9 sm:w-9"
                                title="View Details">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                              {payment.payment_status === 'paid' &&
                                !payment.is_refunded && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPayment(payment);
                                      setRefundAmount(String(payment.amount));
                                      setIsRefundDialogOpen(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-700 h-8 w-8 sm:h-9 sm:w-9"
                                    title="Request Refund">
                                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                )}
                              {payment.payment_status === 'paid' &&
                                payment.receipt_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDownloadReceipt(payment)
                                    }
                                    className="text-green-600 hover:text-green-700 h-8 w-8 sm:h-9 sm:w-9"
                                    title="Download Receipt">
                                    <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </Button>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Empty State */}
            {filteredPayments.length === 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
                <CardContent className="p-6 sm:p-12 text-center">
                  <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    No payments found
                  </h3>
                  <p className="text-gray-600 mb-6 text-sm sm:text-base">
                    {searchTerm ||
                    filterStatus !== 'all' ||
                    filterType !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'No payments have been created for your account yet.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Xendit Payment Dialog */}
        <Dialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Pay with Xendit
              </DialogTitle>
              <DialogDescription>
                Choose your preferred payment method
              </DialogDescription>
            </DialogHeader>

            {selectedPayment &&
              (() => {
                const enhanced = enhancePayment(selectedPayment);
                return (
                  <div className="space-y-4">
                    {/* Payment Details */}
                    <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Payment Type:</span>
                        <span className="font-medium capitalize">
                          {selectedPayment.payment_type.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Property:</span>
                        <span className="font-medium">
                          {selectedPayment.property.name}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Amount:</span>
                        <span className="font-medium">
                          ₱{Number(selectedPayment.amount).toLocaleString()}
                        </span>
                      </div>
                      {enhanced.lateFee > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Late Fee:</span>
                          <span className="font-medium">
                            +₱{enhanced.lateFee.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="pt-2 border-t border-blue-200 flex justify-between">
                        <span className="font-semibold text-gray-900">
                          Total:
                        </span>
                        <span className="font-bold text-xl text-blue-600">
                          ₱{enhanced.totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-2">
                      <Label>Select Payment Method</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            'h-16 flex-col gap-1',
                            selectedPaymentMethod === 'gcash' &&
                              'border-blue-500 bg-blue-50 border-2'
                          )}
                          onClick={() => setSelectedPaymentMethod('gcash')}>
                          <Droplet className="w-5 h-5 text-blue-600" />
                          <span className="text-xs font-medium">GCash</span>
                        </Button>

                       


                       
                      </div>
                    </div>

                    {/* Info Notice */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-600 flex items-start gap-2">
                        <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span>
                          You'll be redirected to Xendit's secure payment
                          gateway to complete your transaction.
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })()}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsPaymentDialogOpen(false);
                  setSelectedPaymentMethod('');
                  setSelectedPayment(null);
                }}>
                Cancel
              </Button>
              <Button
                onClick={handlePayWithXendit}
                disabled={!selectedPaymentMethod || isProcessingPayment}
                className="bg-blue-600 hover:bg-blue-700">
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Proceed to Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request Refund Dialog */}
        <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                Request Refund
              </DialogTitle>
              <DialogDescription>
                Request a refund for payment #
                {selectedPayment?.reference_number}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Payment Info */}
              {selectedPayment && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Payment Type:</p>
                      <p className="font-medium capitalize">
                        {selectedPayment.payment_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Amount:</p>
                      <p className="font-medium">
                        ₱{Number(selectedPayment.amount).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Refund Amount */}
              <div>
                <Label htmlFor="refund-amount">Refund Amount *</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  placeholder="Enter amount"
                  value={refundAmount}
                  onChange={e => setRefundAmount(e.target.value)}
                  max={selectedPayment?.amount}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Max: ₱
                  {selectedPayment?.amount
                    ? Number(selectedPayment.amount).toLocaleString()
                    : '0'}
                </p>
              </div>

              {/* Refund Reason */}
              <div>
                <Label htmlFor="refund-reason">Reason *</Label>
                <Textarea
                  id="refund-reason"
                  placeholder="Please explain why you're requesting a refund..."
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsRefundDialogOpen(false);
                  setRefundAmount('');
                  setRefundReason('');
                  setSelectedPayment(null);
                }}>
                Cancel
              </Button>
              <Button
                onClick={handleRequestRefund}
                disabled={!refundAmount || !refundReason.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Advance Payment Dialog */}
        {showAdvancePaymentDialog && tenantId && (
          <CreateAdvancePaymentDialog
            open={showAdvancePaymentDialog}
            onClose={() => setShowAdvancePaymentDialog(false)}
            onSuccess={async () => {
              // Reload payments after creating advance payment
              if (authState.user?.id) {
                const result = await PaymentsAPI.getTenantPayments(authState.user.id);
                if (result.success) {
                  setPayments(result.data || []);
                }
              }
              setShowAdvancePaymentDialog(false);
              // Switch to table view to show the new payment
              setViewMode('table');
              toast.success('Advance payment created successfully!');
            }}
            tenantId={tenantId}
          />
        )}
      </div>
    </div>
  );

  // Handler for requesting refund
  async function handleRequestRefund() {
    if (!selectedPayment || !refundAmount || !refundReason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(refundAmount);
    if (amount <= 0 || amount > Number(selectedPayment.amount)) {
      toast.error('Invalid refund amount');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await PaymentsAPI.requestRefund(
        selectedPayment.id,
        amount,
        refundReason
      );

      if (result.success) {
        toast.success('Refund request submitted successfully!');
        setIsRefundDialogOpen(false);
        setRefundAmount('');
        setRefundReason('');
        setSelectedPayment(null);
        // Reload payments
        const paymentsResult = await PaymentsAPI.getTenantPayments(
          authState.user!.id
        );
        if (paymentsResult.success) {
          setPayments(paymentsResult.data || []);
        }
      } else {
        toast.error(result.message || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Request refund error:', error);
      toast.error('Failed to submit refund request');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Xendit payment
  async function handlePayWithXendit() {
    if (!selectedPayment || !selectedPaymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    try {
      setIsProcessingPayment(true);

      const enhanced = enhancePayment(selectedPayment);
      const totalAmount = enhanced.totalAmount;

      // Create Xendit payment link
      const response = await fetch('/api/xendit/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_id: selectedPayment.id,
          amount: totalAmount,
          payment_method: selectedPaymentMethod,
          description: `${selectedPayment.payment_type} - ${selectedPayment.property.name}`,
          customer_email: authState.user!.email,
          customer_name: `${authState.user!.firstName} ${
            authState.user!.lastName
          }`,
          late_fee: enhanced.lateFee
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create payment link');
      }

      const { invoice_url } = await response.json();

      // Redirect to Xendit checkout
      toast.success('Redirecting to payment gateway...');
      window.location.href = invoice_url;
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  }
}

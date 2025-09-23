'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import {
  Users,
  MapPin,
  Edit,
  ArrowLeft,
  Calendar,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  Home,
  CreditCard,
  Wrench,
  TrendingUp,
  UserCheck,
  Shield,
  Activity,
  Download,
  Send,
  RefreshCw,
  Upload,
  Trash2,
  Image,
  File,
  PhilippinePeso
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TenantsAPI, type TenantAnalytics } from '@/lib/api/tenants';
import { PaymentsAPI } from '@/lib/api/payments';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { DocumentsAPI, type Document } from '@/lib/api/documents';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { saveAs } from 'file-saver';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { format } from 'date-fns';

interface Tenant {
  id: string;
  user_id: string;
  property_id: string;
  unit_number: string;
  lease_start: string;
  lease_end: string;
  monthly_rent: number;
  security_deposit: number;
  status: string;
  lease_terms?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    role: string;
    created_at: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
    type: string;
    total_units: number;
  };
}

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  payment_status: string;
  payment_method?: string;
  description: string;
  late_fee: number;
  created_at: string;
  reference_number?: string; // Added for Xendit link
}

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  resolved_at?: string;
  estimated_cost?: number;
  actual_cost?: number;
}

export default function TenantDetailsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [analytics, setAnalytics] = useState<TenantAnalytics | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<
    MaintenanceRequest[]
  >([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Add state for document upload UI
  const [selectedCategory, setSelectedCategory] = useState<
    'lease' | 'id' | 'payment' | 'other'
  >('lease');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );
  const [uploading, setUploading] = useState(false);

  // Add state for Add Payment modal
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [addPaymentLoading, setAddPaymentLoading] = useState(false);
  const [addPaymentAmount, setAddPaymentAmount] = useState<number>(
    tenant?.monthly_rent || 0
  );
  const [addPaymentDueDate, setAddPaymentDueDate] = useState<string>('');
  const [addPaymentType, setAddPaymentType] = useState<
    'rent' | 'utility' | 'deposit' | 'penalty' | 'other'
  >('rent');
  const [addPaymentMethod, setAddPaymentMethod] = useState<
    'gcash' | 'maya' | 'bank_transfer' | 'cash' | 'check'
  >('gcash');
  const [addPaymentDescription, setAddPaymentDescription] = useState('');
  const [addPaymentXendit, setAddPaymentXendit] = useState(false);

  const [paymentSummary, setPaymentSummary] = useState<any | null>(null);
  const [futurePayments, setFuturePayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  useEffect(() => {
    const loadTenantData = async () => {
      if (!tenantId) return;

      try {
        setIsLoading(true);

        const [
          tenantResult,
          analyticsResult,
          paymentsResult,
          maintenanceResult,
          documentsResult
        ] = await Promise.all([
          TenantsAPI.getTenant(tenantId),
          TenantsAPI.getTenantAnalytics(tenantId),
          PaymentsAPI.getPayments(tenantId),
          MaintenanceAPI.getMaintenanceRequests(undefined, tenantId),
          DocumentsAPI.getTenantDocuments(tenantId)
        ]);

        if (tenantResult.success) {
          setTenant(tenantResult.data);
        } else {
          toast.error('Failed to load tenant details');
        }

        if (analyticsResult.success && analyticsResult.data) {
          setAnalytics(analyticsResult.data);
        }

        if (paymentsResult.success) {
          setPayments(paymentsResult.data);
        }

        if (maintenanceResult.success) {
          setMaintenanceRequests(maintenanceResult.data);
        }

        if (documentsResult.success && documentsResult.data) {
          setDocuments(documentsResult.data);
        }
      } catch (error) {
        console.error('Failed to load tenant data:', error);
        toast.error('Failed to load tenant data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTenantData();
  }, [tenantId]);

  // Fetch payment summary and future payments
  useEffect(() => {
    const fetchPaymentSummary = async () => {
      if (!tenantId) return;
      setLoadingPayments(true);
      try {
        // Payment summary view
        const { data: summary, error: summaryError } = await supabase
          .from('payment_summary')
          .select('*')
          .eq('tenant_id', tenantId)
          .single();
        if (!summaryError && summary) setPaymentSummary(summary);
        // Future payments (next 3 months)
        const now = new Date();
        const threeMonths = new Date(now);
        threeMonths.setMonth(now.getMonth() + 3);
        const { data: future, error: futureError } = await supabase
          .from('payments')
          .select('*')
          .eq('tenant_id', tenantId)
          .gte('due_date', now.toISOString().slice(0, 10))
          .lte('due_date', threeMonths.toISOString().slice(0, 10))
          .order('due_date', { ascending: true });
        if (!futureError && future) setFuturePayments(future);
      } catch (e) {
        // ignore
      } finally {
        setLoadingPayments(false);
      }
    };
    fetchPaymentSummary();
  }, [tenantId]);

  // Helper to get next unpaid/scheduled month
  const getNextDueDate = () => {
    if (!tenant) return '';
    const now = new Date();
    const leaseEnd = new Date(tenant.lease_end);
    const leaseStart = new Date(tenant.lease_start);
    let current = new Date(Math.max(now.getTime(), leaseStart.getTime()));
    current.setDate(1);
    leaseEnd.setDate(1);
    const paymentMap = new Map();
    payments.forEach(p => {
      const d = new Date(p.due_date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      paymentMap.set(key, p);
    });
    while (current <= leaseEnd) {
      const key = `${current.getFullYear()}-${current.getMonth() + 1}`;
      if (!paymentMap.has(key)) {
        return format(current, 'yyyy-MM-dd');
      }
      current.setMonth(current.getMonth() + 1);
    }
    return format(now, 'yyyy-MM-dd');
  };

  useEffect(() => {
    if (tenant) {
      setAddPaymentAmount(tenant.monthly_rent);
      setAddPaymentDueDate(getNextDueDate());
    }
  }, [tenant]);

  const handleEdit = () => {
    router.push(`/owner/dashboard/tenants/${tenantId}/edit`);
  };

  const handleRenewLease = async () => {
    const newLeaseEnd = prompt(
      'Enter new lease end date (YYYY-MM-DD):',
      new Date(
        new Date(tenant!.lease_end).getTime() + 365 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split('T')[0]
    );

    if (!newLeaseEnd) return;

    const newRentString = prompt(
      'Enter new monthly rent (optional):',
      tenant!.monthly_rent.toString()
    );

    const newRent = newRentString ? parseFloat(newRentString) : undefined;

    try {
      const result = await TenantsAPI.renewLease(
        tenantId,
        newLeaseEnd,
        newRent
      );
      if (result.success) {
        toast.success('Lease renewed successfully');
        setTenant(result.data);
      } else {
        toast.error(result.message || 'Failed to renew lease');
      }
    } catch (error) {
      console.error('Renew lease error:', error);
      toast.error('Failed to renew lease');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-700 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Active
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'terminated':
        return (
          <Badge className="bg-red-100 text-red-700 border-0">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Terminated
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-700 border-0">{status}</Badge>
        );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-700 border-0">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-red-100 text-red-700 border-0">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Overdue
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-0">{status}</Badge>
        );
    }
  };

  const getMaintenanceStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-700 border-0">
            <Activity className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-700 border-0">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-gray-100 text-gray-700 border-0">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-0">{status}</Badge>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <Badge className="bg-red-100 text-red-700 border-0">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-orange-100 text-orange-700 border-0">High</Badge>
        );
      case 'medium':
        return (
          <Badge className="bg-yellow-100 text-yellow-700 border-0">
            Medium
          </Badge>
        );
      case 'low':
        return (
          <Badge className="bg-green-100 text-green-700 border-0">Low</Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-0">
            {priority}
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilLeaseExpiry = () => {
    if (!tenant) return 0;
    const endDate = new Date(tenant.lease_end);
    const now = new Date();
    return Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // Helper: Get current bill (this month's rent + charges)
  const getCurrentBill = () => {
    if (!tenant) return 0;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Find all unpaid/overdue payments for this month
    const currentPayments = payments.filter(
      p =>
        (p.payment_status === 'pending' || p.payment_status === 'overdue') &&
        new Date(p.due_date).getMonth() + 1 === month &&
        new Date(p.due_date).getFullYear() === year
    );

    if (currentPayments.length > 0) {
      return currentPayments.reduce(
        (sum, p) => sum + (p.amount || 0) + (p.late_fee || 0),
        0
      );
    }

    // If no payment record, but lease is active, show expected rent
    const leaseStart = new Date(tenant.lease_start);
    const leaseEnd = new Date(tenant.lease_end);

    console.log({ tenant });
    if (now >= leaseStart && now <= leaseEnd) {
      return tenant.monthly_rent || 0;
    }

    return 0;
  };

  // Helper: Outstanding balance (sum of unpaid/overdue)
  const getOutstandingBalance = () => {
    return payments
      .filter(
        p => p.payment_status === 'pending' || p.payment_status === 'overdue'
      )
      .reduce((sum, p) => sum + (p.amount || 0) + (p.late_fee || 0), 0);
  };

  // Helper: Generate receipt HTML
  const generateReceiptHTML = (payment: Payment) => {
    return `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 400px; margin: 0 auto; border: 1px solid #e3e8f0; border-radius: 12px; padding: 32px; background: #fff;">
        <h2 style="color: #1E88E5; margin-bottom: 8px;">Payment Receipt</h2>
        <p style="margin: 0 0 8px 0; color: #1F2937;">Tenant: <b>${
          tenant?.user.first_name
        } ${tenant?.user.last_name}</b></p>
        <p style="margin: 0 0 8px 0; color: #1F2937;">Property: <b>${
          tenant?.property.name
        }</b></p>
        <p style="margin: 0 0 8px 0; color: #1F2937;">Unit: <b>${
          tenant?.unit_number
        }</b></p>
        <hr style="margin: 16px 0; border: none; border-top: 1px solid #e3e8f0;" />
        <p style="margin: 0 0 8px 0; color: #1F2937;">Amount: <b>₱${formatCurrency(
          payment.amount
        )}</b></p>
        <p style="margin: 0 0 8px 0; color: #1F2937;">Late Fee: <b>₱${formatCurrency(
          payment.late_fee || 0
        )}</b></p>
        <p style="margin: 0 0 8px 0; color: #1F2937;">Total Paid: <b>₱${formatCurrency(
          (payment.amount || 0) + (payment.late_fee || 0)
        )}</b></p>
        <p style="margin: 0 0 8px 0; color: #1F2937;">Due Date: <b>${formatShortDate(
          payment.due_date
        )}</b></p>
        <p style="margin: 0 0 8px 0; color: #1F2937;">Paid Date: <b>${
          payment.payment_date ? formatShortDate(payment.payment_date) : '-'
        }</b></p>
        <p style="margin: 0 0 8px 0; color: #1F2937;">Status: <b>${
          payment.payment_status
        }</b></p>
        <hr style="margin: 16px 0; border: none; border-top: 1px solid #e3e8f0;" />
        <p style="font-size: 12px; color: #888;">Receipt generated by PropertyEase</p>
      </div>
    `;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading tenant details...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Tenant not found
          </h3>
          <p className="text-gray-600 mb-6">
            The tenant you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => router.push('/owner/dashboard/tenants')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-blue-600 hover:bg-blue-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {tenant.user.first_name[0]}
                  {tenant.user.last_name[0]}
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                    {tenant.user.first_name} {tenant.user.last_name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Home className="w-4 h-4 text-blue-600" />
                    <p className="text-blue-600/80 font-medium">
                      {tenant.property.name} - Unit {tenant.unit_number}
                    </p>
                    {getStatusBadge(tenant.status)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleEdit}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                <Edit className="w-4 h-4 mr-2" />
                Edit Tenant
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-200 text-blue-600">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleRenewLease}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renew Lease
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Monthly Rent</p>
                    <p className="text-3xl font-bold">
                      {formatCurrency(tenant.monthly_rent)}
                    </p>
                  </div>
                  <PhilippinePeso className="w-10 h-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm mb-1">
                      Lease Days Left
                    </p>
                    <p className="text-3xl font-bold">
                      {Math.max(0, getDaysUntilLeaseExpiry())}
                    </p>
                    <p className="text-green-200 text-xs">
                      {getDaysUntilLeaseExpiry() <= 30
                        ? 'Expires soon!'
                        : 'Active lease'}
                    </p>
                  </div>
                  <Calendar className="w-10 h-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">
                      Payment Score
                    </p>
                    <p className="text-3xl font-bold">
                      {analytics
                        ? Math.round(
                            (analytics.paidOnTime /
                              Math.max(analytics.totalPayments, 1)) *
                              100
                          )
                        : 0}
                      %
                    </p>
                    <p className="text-purple-200 text-xs">On-time payments</p>
                  </div>
                  <TrendingUp className="w-10 h-10 opacity-80" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm mb-1">Maintenance</p>
                    <p className="text-3xl font-bold">
                      {analytics?.maintenanceRequests || 0}
                    </p>
                    <p className="text-orange-200 text-xs">Total requests</p>
                  </div>
                  <Wrench className="w-10 h-10 opacity-80" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-blue-100">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Payments
              </TabsTrigger>
              <TabsTrigger
                value="maintenance"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Maintenance ({maintenanceRequests.length})
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-blue-600" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">First Name</p>
                        <p className="font-semibold">
                          {tenant.user.first_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Last Name</p>
                        <p className="font-semibold">{tenant.user.last_name}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-semibold">{tenant.user.email}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-semibold">{tenant.user.phone}</p>
                      </div>
                    </div>

                    {(tenant.emergency_contact_name ||
                      tenant.emergency_contact_phone) && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Emergency Contact
                        </p>
                        {tenant.emergency_contact_name && (
                          <p className="font-semibold">
                            {tenant.emergency_contact_name}
                          </p>
                        )}
                        {tenant.emergency_contact_phone && (
                          <p className="text-gray-700">
                            {tenant.emergency_contact_phone}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lease Information */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Lease Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Lease Start</p>
                        <p className="font-semibold">
                          {formatDate(tenant.lease_start)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Lease End</p>
                        <p className="font-semibold">
                          {formatDate(tenant.lease_end)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Monthly Rent</p>
                        <p className="font-semibold">
                          {formatCurrency(tenant.monthly_rent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          Security Deposit
                        </p>
                        <p className="font-semibold">
                          {formatCurrency(tenant.security_deposit)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">
                        Property Details
                      </p>
                      <p className="font-semibold">{tenant.property.name}</p>
                      <p className="text-gray-700">{tenant.property.address}</p>
                      <p className="text-sm text-gray-500">
                        {tenant.property.city}, {tenant.property.province}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Unit {tenant.unit_number} • {tenant.property.type}
                      </p>
                    </div>

                    {tenant.lease_terms && (
                      <div className="border-t pt-4">
                        <p className="text-sm text-gray-600 mb-2">
                          Lease Terms
                        </p>
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {tenant.lease_terms}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Analytics Summary */}
                {analytics && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Tenant Analytics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {analytics.totalPayments}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total Payments
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {analytics.paidOnTime}
                          </p>
                          <p className="text-sm text-gray-600">
                            On-Time Payments
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-orange-600">
                            {analytics.latePayments}
                          </p>
                          <p className="text-sm text-gray-600">Late Payments</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {analytics.tenancyDuration}
                          </p>
                          <p className="text-sm text-gray-600">Months Tenure</p>
                        </div>
                      </div>
                      {analytics.averagePaymentDelay > 0 && (
                        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <p className="text-sm text-orange-700">
                            <AlertTriangle className="w-4 h-4 inline mr-1" />
                            Average payment delay:{' '}
                            {Math.round(analytics.averagePaymentDelay)} days
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {tenant.notes && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {tenant.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="bg-blue-50/60 border border-blue-100 shadow-md rounded-xl">
                  <CardContent className="p-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm mb-1 font-medium">
                          Current Bill
                        </p>
                        <p className="text-3xl font-bold text-blue-900">
                          {formatCurrency(getCurrentBill())}
                        </p>
                      </div>
                      <PhilippinePeso className="w-10 h-10 opacity-80 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50/60 border border-red-100 shadow-md rounded-xl">
                  <CardContent className="p-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-600 text-sm mb-1 font-medium">
                          Outstanding Balance
                        </p>
                        <p className="text-3xl font-bold text-red-900">
                          {formatCurrency(getOutstandingBalance())}
                        </p>
                      </div>
                      <PhilippinePeso className="w-10 h-10 opacity-80 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-green-50/60 border border-green-100 shadow-md rounded-xl">
                  <CardContent className="p-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm mb-1 font-medium">
                          Future Payments
                        </p>
                        <p className="text-3xl font-bold text-green-900">
                          {formatCurrency(
                            futurePayments.reduce(
                              (sum, p) =>
                                sum + (p.amount || 0) + (p.late_fee || 0),
                              0
                            )
                          )}
                        </p>
                      </div>
                      <PhilippinePeso className="w-10 h-10 opacity-80 text-green-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payments Sub-Tabs */}
              <Tabs defaultValue="schedule" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm border border-blue-100 mb-6">
                  <TabsTrigger
                    value="schedule"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-l-xl">
                    Payment Schedule
                  </TabsTrigger>
                  <TabsTrigger
                    value="history"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-r-xl">
                    Payment History
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="schedule">
                  <div className="flex justify-end mb-4">
                    <Button
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg"
                      onClick={() => setShowAddPayment(true)}>
                      + Add Payment
                    </Button>
                  </div>
                  <Dialog
                    open={showAddPayment}
                    onOpenChange={setShowAddPayment}>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Add Payment</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                          </label>
                          <Input
                            type="number"
                            min={0}
                            value={addPaymentAmount}
                            onChange={e =>
                              setAddPaymentAmount(Number(e.target.value))
                            }
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date
                          </label>
                          <Input
                            type="date"
                            value={addPaymentDueDate}
                            onChange={e => setAddPaymentDueDate(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Type
                          </label>
                          <select
                            value={addPaymentType}
                            onChange={e =>
                              setAddPaymentType(e.target.value as any)
                            }
                            className="w-full rounded-lg border border-blue-200 px-3 py-2 bg-white text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="rent">Rent</option>
                            <option value="utility">Utility</option>
                            <option value="deposit">Deposit</option>
                            <option value="penalty">Penalty</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Method
                          </label>
                          <select
                            value={addPaymentMethod}
                            onChange={e =>
                              setAddPaymentMethod(e.target.value as any)
                            }
                            className="w-full rounded-lg border border-blue-200 px-3 py-2 bg-white text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="gcash">GCash</option>
                            <option value="maya">Maya</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cash">Cash</option>
                            <option value="check">Check</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description/Notes
                          </label>
                          <Textarea
                            value={addPaymentDescription}
                            onChange={e =>
                              setAddPaymentDescription(e.target.value)
                            }
                            className="w-full"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="addPaymentXendit"
                            checked={addPaymentXendit}
                            onChange={e =>
                              setAddPaymentXendit(e.target.checked)
                            }
                          />
                          <label
                            htmlFor="addPaymentXendit"
                            className="text-sm text-gray-700">
                            Send Xendit Payment Link
                          </label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={async () => {
                            setAddPaymentLoading(true);
                            try {
                              const result =
                                await PaymentsAPI.createPaymentWithXendit({
                                  tenant_id: tenant.id,
                                  property_id: tenant.property.id,
                                  amount: addPaymentAmount,
                                  payment_type: addPaymentType,
                                  payment_method: addPaymentMethod,
                                  due_date: addPaymentDueDate,
                                  description: addPaymentDescription,
                                  created_by: authState?.user?.id || '',
                                  sendXenditLink: addPaymentXendit
                                });
                              if (result.success) {
                                toast.success('Payment created successfully');
                                setShowAddPayment(false);
                                // Refresh payments
                                const paymentsResult =
                                  await PaymentsAPI.getPayments(tenant.id);
                                if (paymentsResult.success)
                                  setPayments(paymentsResult.data);
                              } else {
                                toast.error(
                                  result.message || 'Failed to create payment'
                                );
                              }
                            } catch (err) {
                              toast.error('Failed to create payment');

                              console.log(err);
                            } finally {
                              setAddPaymentLoading(false);
                            }
                          }}
                          disabled={addPaymentLoading}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                          {addPaymentLoading ? 'Creating...' : 'Create Payment'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Card className="bg-white/95 border border-blue-100 shadow-lg rounded-xl">
                    <CardHeader>
                      <CardTitle>Payment Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Due Date</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Paid Date</TableHead>
                              <TableHead>Receipt</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {/* Generate schedule from now until lease end */}
                            {(() => {
                              if (!tenant) return null;
                              const schedule = [];
                              const now = new Date();
                              const leaseEnd = new Date(tenant.lease_end);
                              const leaseStart = new Date(tenant.lease_start);
                              // Start from this month or lease start, whichever is later
                              let current = new Date(
                                Math.max(now.getTime(), leaseStart.getTime())
                              );
                              current.setDate(1); // always first of month
                              leaseEnd.setDate(1);
                              // Build a map of payments by YYYY-MM
                              const paymentMap = new Map();
                              payments.forEach(p => {
                                const d = new Date(p.due_date);
                                const key = `${d.getFullYear()}-${
                                  d.getMonth() + 1
                                }`;
                                paymentMap.set(key, p);
                              });
                              while (current <= leaseEnd) {
                                const key = `${current.getFullYear()}-${
                                  current.getMonth() + 1
                                }`;
                                const payment = paymentMap.get(key);
                                schedule.push({
                                  due_date: new Date(current),
                                  payment
                                });
                                current.setMonth(current.getMonth() + 1);
                              }
                              return schedule.map(
                                ({ due_date, payment }, idx) => {
                                  const isFuture = due_date > now;
                                  let status = 'scheduled';
                                  let paidDate = '-';
                                  let amount = tenant.monthly_rent;
                                  let receipt = null;
                                  if (payment) {
                                    amount =
                                      (payment.amount || 0) +
                                      (payment.late_fee || 0);
                                    paidDate = payment.payment_date
                                      ? formatShortDate(payment.payment_date)
                                      : '-';
                                    status = payment.payment_status;
                                    if (status === 'completed') {
                                      receipt = (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="border-blue-200 text-blue-600"
                                          onClick={() => {
                                            const html =
                                              generateReceiptHTML(payment);
                                            const blob = new Blob([html], {
                                              type: 'text/html'
                                            });
                                            saveAs(
                                              blob,
                                              `receipt-${payment.id}.html`
                                            );
                                          }}>
                                          <Download className="w-4 h-4" />
                                          Receipt
                                        </Button>
                                      );
                                    }
                                  }
                                  // Status badge
                                  let badge = null;
                                  if (status === 'completed') {
                                    badge = (
                                      <Badge className="bg-green-100 text-green-700 border-0">
                                        Paid
                                      </Badge>
                                    );
                                  } else if (status === 'pending') {
                                    badge = (
                                      <Badge className="bg-yellow-100 text-yellow-700 border-0">
                                        Pending
                                      </Badge>
                                    );
                                  } else if (status === 'overdue') {
                                    badge = (
                                      <Badge className="bg-red-100 text-red-700 border-0">
                                        Overdue
                                      </Badge>
                                    );
                                  } else {
                                    badge = (
                                      <Badge className="bg-gray-100 text-gray-700 border-0">
                                        Scheduled
                                      </Badge>
                                    );
                                  }
                                  return (
                                    <TableRow
                                      key={due_date.toISOString() + idx}>
                                      <TableCell>
                                        {formatShortDate(
                                          due_date.toISOString()
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {formatCurrency(amount)}
                                      </TableCell>
                                      <TableCell>{badge}</TableCell>
                                      <TableCell>{paidDate}</TableCell>
                                      <TableCell>{receipt}</TableCell>
                                    </TableRow>
                                  );
                                }
                              );
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="history">
                  <Card className="bg-white/95 border border-blue-100 shadow-lg rounded-xl">
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Status</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Paid Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Late Fee</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Receipt</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payments.map(payment => (
                            <TableRow key={payment.id}>
                              <TableCell>
                                {getPaymentStatusBadge(payment.payment_status)}
                              </TableCell>
                              <TableCell>
                                {formatShortDate(payment.due_date)}
                              </TableCell>
                              <TableCell>
                                {payment.payment_date
                                  ? formatShortDate(payment.payment_date)
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                ₱{formatCurrency(payment.amount)}
                              </TableCell>
                              <TableCell>
                                ₱{formatCurrency(payment.late_fee || 0)}
                              </TableCell>
                              <TableCell>
                                ₱
                                {formatCurrency(
                                  (payment.amount || 0) +
                                    (payment.late_fee || 0)
                                )}
                              </TableCell>
                              <TableCell>
                                {payment.payment_method || '-'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-blue-200 text-blue-600"
                                  onClick={() => {
                                    const html = generateReceiptHTML(payment);
                                    const blob = new Blob([html], {
                                      type: 'text/html'
                                    });
                                    saveAs(blob, `receipt-${payment.id}.html`);
                                  }}>
                                  <Download className="w-4 h-4" />
                                  Receipt
                                </Button>
                                {payment.reference_number &&
                                  payment.reference_number.startsWith(
                                    'http'
                                  ) && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-blue-200 text-blue-600 ml-2"
                                      onClick={() =>
                                        window.open(
                                          payment.reference_number,
                                          '_blank'
                                        )
                                      }>
                                      Pay Now
                                    </Button>
                                  )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {payments.length === 0 && (
                        <div className="text-center py-8">
                          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">
                            No payment history yet
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                <CardHeader>
                  <CardTitle>Maintenance Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  {maintenanceRequests.length > 0 ? (
                    <div className="space-y-4">
                      {maintenanceRequests.map(request => (
                        <div
                          key={request.id}
                          className="flex items-start justify-between p-4 border border-blue-100 rounded-lg bg-blue-50/50">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white">
                              <Wrench className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-semibold text-gray-900">
                                  {request.title}
                                </p>
                                {getPriorityBadge(request.priority)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {request.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  Created: {formatShortDate(request.created_at)}
                                </span>
                                {request.resolved_at && (
                                  <span>
                                    Resolved:{' '}
                                    {formatShortDate(request.resolved_at)}
                                  </span>
                                )}
                              </div>
                              {(request.estimated_cost ||
                                request.actual_cost) && (
                                <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                                  {request.estimated_cost && (
                                    <span>
                                      Est. Cost:{' '}
                                      {formatCurrency(request.estimated_cost)}
                                    </span>
                                  )}
                                  {request.actual_cost && (
                                    <span>
                                      Actual:{' '}
                                      {formatCurrency(request.actual_cost)}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {getMaintenanceStatusBadge(request.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        No maintenance requests yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <CardTitle>Documents & Files</CardTitle>
                    <div className="flex flex-col md:flex-row gap-2 items-center">
                      <select
                        className="rounded-lg border border-blue-200 px-3 py-2 bg-white text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={selectedCategory}
                        onChange={e =>
                          setSelectedCategory(e.target.value as any)
                        }
                        disabled={uploading}>
                        <option value="lease">Lease Agreement</option>
                        <option value="id">Government ID</option>
                        <option value="payment">Proof of Payment</option>
                        <option value="other">Other</option>
                      </select>
                      <input
                        type="file"
                        id="document-upload"
                        className="hidden"
                        multiple
                        onChange={e => {
                          if (e.target.files) {
                            setUploadFiles(prev => [
                              ...prev,
                              ...Array.from(e.target.files!)
                            ]);
                          }
                        }}
                        accept="image/*,.pdf,.doc,.docx"
                        disabled={uploading}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-blue-200 text-blue-600"
                        onClick={() =>
                          document.getElementById('document-upload')?.click()
                        }
                        disabled={uploading}>
                        <Upload className="w-4 h-4 mr-2" />
                        Add Files
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Drag-and-drop area and file preview */}
                  <div
                    className={
                      'mb-6 rounded-lg border-2 border-dashed ' +
                      (uploadFiles.length === 0
                        ? 'border-blue-200 hover:border-blue-400 bg-blue-50/50'
                        : 'border-blue-100 bg-white')
                    }
                    style={{ transition: 'border-color 0.2s, background 0.2s' }}
                    onDragOver={e => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      const files = Array.from(e.dataTransfer.files).filter(
                        file => file.size <= 10 * 1024 * 1024
                      );
                      setUploadFiles(prev => [...prev, ...files]);
                    }}>
                    {uploadFiles.length === 0 ? (
                      <div
                        className="p-8 text-center cursor-pointer"
                        onClick={() =>
                          document.getElementById('document-upload')?.click()
                        }>
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Upload className="w-8 h-8 text-blue-600" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                          Drop your files here
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                          or{' '}
                          <span className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                            browse from your computer
                          </span>
                        </p>
                        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            Images (JPG, PNG)
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            PDF Documents
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            Word Documents
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded-full">
                            Max 10MB
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        <div className="flex flex-wrap gap-4">
                          {uploadFiles.map((file, idx) => (
                            <div
                              key={file.name + idx}
                              className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                              <div className="h-10 w-10 flex items-center justify-center bg-white rounded-lg border border-gray-200">
                                {file.type.includes('image') ? (
                                  <Image className="w-5 h-5 text-blue-600" />
                                ) : file.type.includes('pdf') ? (
                                  <FileText className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <File className="w-5 h-5 text-blue-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {file.name}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>
                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                                  <span>
                                    {file.type.split('/')[1]?.toUpperCase() ||
                                      'Unknown'}
                                  </span>
                                </div>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                                onClick={() =>
                                  setUploadFiles(prev =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                disabled={uploading}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              {uploading && (
                                <div className="ml-2 w-24">
                                  <div className="h-2 rounded-full bg-blue-100 overflow-hidden">
                                    <div
                                      className="h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                                      style={{
                                        width: `${
                                          uploadProgress[file.name] || 0
                                        }%`
                                      }}></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-200 text-blue-600"
                            onClick={() => setUploadFiles([])}
                            disabled={uploading}>
                            Clear
                          </Button>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                            disabled={uploading || uploadFiles.length === 0}
                            onClick={async () => {
                              setUploading(true);
                              setUploadProgress({});
                              try {
                                const results =
                                  await DocumentsAPI.uploadMultipleDocuments(
                                    tenantId,
                                    uploadFiles,
                                    selectedCategory,
                                    (file, progress) => {
                                      setUploadProgress(prev => ({
                                        ...prev,
                                        [file.name]: progress
                                      }));
                                    }
                                  );
                                const successCount = results.filter(
                                  r => r.success
                                ).length;
                                if (successCount > 0) {
                                  toast.success(
                                    `${successCount} file(s) uploaded successfully`
                                  );
                                  const { data } =
                                    await DocumentsAPI.getTenantDocuments(
                                      tenantId
                                    );
                                  if (data) setDocuments(data);
                                }
                                const failed = results.filter(r => !r.success);
                                if (failed.length > 0) {
                                  toast.error(
                                    `${failed.length} file(s) failed to upload`
                                  );
                                }
                                setUploadFiles([]);
                              } catch (err) {
                                toast.error('Failed to upload files');
                              } finally {
                                setUploading(false);
                              }
                            }}>
                            {uploading ? 'Uploading...' : 'Upload Files'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Document List */}
                  {documents.length > 0 ? (
                    <div className="space-y-4">
                      {documents.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border border-blue-100 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                              {doc.type.includes('image') ? (
                                <Image className="w-6 h-6" />
                              ) : (
                                <File className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {doc.name}
                              </p>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>
                                  {(doc.size / 1024 / 1024).toFixed(2)} MB
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>
                                  {doc.type.split('/')[1]?.toUpperCase() ||
                                    'Unknown'}
                                </span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span>{formatShortDate(doc.uploaded_at)}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <Badge className="bg-blue-100 text-blue-700 border-0">
                                  {doc.category === 'lease'
                                    ? 'Lease Agreement'
                                    : doc.category === 'id'
                                    ? 'Government ID'
                                    : doc.category === 'payment'
                                    ? 'Proof of Payment'
                                    : 'Other'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => window.open(doc.url, '_blank')}>
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={async () => {
                                if (
                                  !confirm(
                                    'Are you sure you want to delete this document?'
                                  )
                                )
                                  return;
                                try {
                                  const result =
                                    await DocumentsAPI.deleteDocument(doc.id);
                                  if (result.success) {
                                    toast.success(
                                      'Document deleted successfully'
                                    );
                                    setDocuments(docs =>
                                      docs.filter(d => d.id !== doc.id)
                                    );
                                  } else {
                                    toast.error(
                                      result.message ||
                                        'Failed to delete document'
                                    );
                                  }
                                } catch (error) {
                                  console.error('Delete error:', error);
                                  toast.error('Failed to delete document');
                                }
                              }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No documents uploaded yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Upload lease agreements, ID copies, and other important
                        documents
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

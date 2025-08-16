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
  DollarSign,
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
  File
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
                  <DollarSign className="w-10 h-10 opacity-80" />
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
            <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-blue-100">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="payments"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                Payments ({payments.length})
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
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Payment History</CardTitle>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Send className="w-4 h-4 mr-2" />
                      Send Invoice
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {payments.length > 0 ? (
                    <div className="space-y-4">
                      {payments.map(payment => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 border border-blue-100 rounded-lg bg-blue-50/50">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white">
                              <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {payment.description}
                              </p>
                              <p className="text-sm text-gray-600">
                                Due: {formatShortDate(payment.due_date)}
                                {payment.payment_date &&
                                  ` • Paid: ${formatShortDate(
                                    payment.payment_date
                                  )}`}
                              </p>
                              {payment.payment_method && (
                                <p className="text-xs text-gray-500">
                                  via {payment.payment_method}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {getPaymentStatusBadge(payment.payment_status)}
                            <p className="text-lg font-bold text-gray-900 mt-1">
                              {formatCurrency(payment.amount)}
                            </p>
                            {payment.late_fee > 0 && (
                              <p className="text-sm text-red-600">
                                +{formatCurrency(payment.late_fee)} late fee
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No payment history yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
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
                  <div className="flex items-center justify-between">
                    <CardTitle>Documents & Files</CardTitle>
                    <input
                      type="file"
                      id="document-upload"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          const result = await DocumentsAPI.uploadDocument(
                            tenantId,
                            file,
                            'other'
                          );

                          if (result.success) {
                            toast.success('Document uploaded successfully');
                            // Refresh documents list
                            const { data } =
                              await DocumentsAPI.getTenantDocuments(tenantId);
                            if (data) setDocuments(data);
                          } else {
                            toast.error(
                              result.message || 'Failed to upload document'
                            );
                          }
                        } catch (error) {
                          console.error('Upload error:', error);
                          toast.error('Failed to upload document');
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-200 text-blue-600"
                      onClick={() =>
                        document.getElementById('document-upload')?.click()
                      }>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
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

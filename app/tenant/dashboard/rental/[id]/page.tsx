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
import { TenantAPI } from '@/lib/api/tenant';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { saveAs } from 'file-saver';
import { generateLeaseAgreementPDF } from '@/lib/pdf/leaseAgreementPDF';
import { generatePaymentSchedulePDF } from '@/lib/pdf/paymentSchedulePDF';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { formatPropertyType } from '@/lib/utils';

interface RentalApplication {
  id: string;
  user_id: string;
  property_id: string;
  unit_type: string;
  unit_number: string;
  move_in_date: string;
  monthly_rent: number;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  updated_at: string;
  notes?: string;
  rejection_reason?: string;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    province: string;
    type: string;
    amenities: string[];
    images: string[];
    thumbnail?: string;
    description?: string;
  };
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  application_documents: Array<{
    id: string;
    name: string;
    type: string;
    url: string;
    uploaded_at: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    due_date: string;
    payment_date?: string;
    payment_status: string;
    payment_method?: string;
    description?: string;
    late_fee?: number;
    created_at: string;
    reference_number?: string;
  }>;
  maintenanceRequests: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
    resolved_at?: string;
    estimated_cost?: number;
    actual_cost?: number;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploaded_at: string;
    category: string;
    description?: string;
    file_url: string;
  }>;
  is_tenant: boolean;
  tenant_id?: string;
}

interface Payment {
  id: string;
  amount?: number;
  due_date: string;
  payment_date?: string;
  payment_status: string;
  payment_method?: string;
  description?: string;
  late_fee?: number;
  created_at: string;
  reference_number?: string;
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

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
  category: string;
  size: number;
}

export default function TenantRentalDetailsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const rentalId = params.id as string;

  const [rental, setRental] = useState<RentalApplication | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<
    MaintenanceRequest[]
  >([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadRentalData = async () => {
      if (!rentalId) return;

      try {
        setIsLoading(true);

        // Load rental application details using the application ID
        const rentalResult = await TenantAPI.getRentalApplicationDetails(
          rentalId
        );
        if (rentalResult.success && rentalResult.data) {
          setRental(rentalResult.data);

          // Set the data from the application details
          setPayments(rentalResult.data.payments || []);
          setMaintenanceRequests(rentalResult.data.maintenanceRequests || []);
          setDocuments(rentalResult.data.documents || []);
        } else {
          toast.error(rentalResult.message || 'Failed to load rental data');
        }
      } catch (error) {
        console.error('Failed to load rental data:', error);
        toast.error('Failed to load rental data');
      } finally {
        setIsLoading(false);
      }
    };

    loadRentalData();
  }, [rentalId]);

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

  const getDaysUntilMoveIn = () => {
    if (!rental) return 0;
    const moveInDate = new Date(rental.move_in_date);
    const now = new Date();
    return Math.ceil(
      (moveInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  const getCurrentBill = () => {
    if (!rental) return 0;
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

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

    // If application is approved and move-in date has passed, show expected rent
    const moveInDate = new Date(rental.move_in_date);
    if (rental.status === 'approved' && now >= moveInDate) {
      return rental.monthly_rent || 0;
    }

    return 0;
  };

  const getOutstandingBalance = () => {
    return payments
      .filter(
        p => p.payment_status === 'pending' || p.payment_status === 'overdue'
      )
      .reduce((sum, p) => sum + (p.amount || 0) + (p.late_fee || 0), 0);
  };

  const handleDownloadLeaseAgreement = () => {
    if (!rental || rental.status !== 'approved') {
      toast.error('Lease agreement is only available for approved applications');
      return;
    }

    // Calculate lease end date (12 months from move-in by default)
    const moveInDate = new Date(rental.move_in_date);
    const leaseEndDate = new Date(moveInDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + 12);

    const leaseData = {
      tenantName: authState.user?.firstName + ' ' + authState.user?.lastName || 'Tenant',
      tenantEmail: authState.user?.email || '',
      tenantPhone: authState.user?.phone || '',
      ownerName: rental.owner.name,
      ownerEmail: rental.owner.email,
      ownerPhone: rental.owner.phone,
      propertyName: rental.property.name,
      propertyAddress: rental.property.address,
      propertyCity: rental.property.city,
      propertyType: rental.property.type,
      unitNumber: rental.unit_number,
      leaseStart: rental.move_in_date,
      leaseEnd: leaseEndDate.toISOString(),
      leaseDuration: 12,
      monthlyRent: rental.monthly_rent,
      securityDeposit: rental.monthly_rent * 2,
      paymentDueDay: 5,
      terms: [
        'Tenant shall pay rent on or before the 5th day of each month.',
        'A late fee of P500 or 5% of the monthly rent (whichever is higher) will be charged after 3 days.',
        'The security deposit will be refunded at the end of the lease term, subject to property inspection.',
        'Tenant is responsible for maintaining the property in good condition.',
        'Tenant must notify the landlord of any maintenance issues promptly.',
        'Subletting is not allowed without prior written consent from the landlord.',
        'Tenant must comply with all building rules and regulations.',
        'Either party may terminate this agreement with 30 days written notice.'
      ],
      amenities: rental.property.amenities || []
    };

    generateLeaseAgreementPDF(leaseData);
    toast.success('Lease agreement downloaded!');
  };

  const handleDownloadPaymentSchedule = () => {
    if (!rental || rental.status !== 'approved' || payments.length === 0) {
      toast.error('Payment schedule is only available for approved applications with payments');
      return;
    }

    const moveInDate = new Date(rental.move_in_date);
    const leaseEndDate = new Date(moveInDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + 12);

    const scheduleData = {
      tenantName: authState.user?.firstName + ' ' + authState.user?.lastName || 'Tenant',
      propertyName: rental.property.name,
      unitNumber: rental.unit_number,
      leaseStart: rental.move_in_date,
      leaseEnd: leaseEndDate.toISOString(),
      monthlyRent: rental.monthly_rent,
      payments: payments.map(p => ({
        id: p.id,
        due_date: p.due_date,
        amount: Number(p.amount || rental.monthly_rent),
        payment_status: p.payment_status,
        payment_type: 'rent',
        paid_date: p.payment_date,
        late_fee: Number(p.late_fee || 0)
      }))
    };

    generatePaymentSchedulePDF(scheduleData);
    toast.success('Payment schedule downloaded!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-sm sm:text-base">
            Loading rental details...
          </p>
        </div>
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Rental not found
          </h3>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            The rental you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={() => router.push('/tenant/dashboard/applications')}
            className="text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-blue-600 hover:bg-blue-50 text-sm sm:text-base">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                  {rental.property.name[0]}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                    {rental.property.name}
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Home className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      <p className="text-blue-600/80 font-medium text-xs sm:text-sm">
                        {rental.property.address} - Unit {rental.unit_number}
                      </p>
                    </div>
                    {getStatusBadge(rental.status)}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {rental.status === 'approved' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="border-blue-600 text-blue-600 hover:bg-blue-50 text-sm sm:text-base">
                      <Download className="w-4 h-4 mr-2" />
                      Downloads
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDownloadLeaseAgreement}>
                      <FileText className="w-4 h-4 mr-2" />
                      Lease Agreement PDF
                    </DropdownMenuItem>
                    {payments.length > 0 && (
                      <DropdownMenuItem onClick={handleDownloadPaymentSchedule}>
                        <Download className="w-4 h-4 mr-2" />
                        Payment Schedule PDF
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <Button
                onClick={() => router.push('/tenant/dashboard/messages')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm sm:text-base">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Owner
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Monthly Rent
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(rental.monthly_rent)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Days Until Move-in
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {Math.max(0, getDaysUntilMoveIn())}
                    </p>
                    <p className="text-xs text-gray-500">
                      {getDaysUntilMoveIn() <= 30
                        ? 'Move-in soon!'
                        : 'Upcoming move-in'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Current Bill
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(getCurrentBill())}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Maintenance
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {maintenanceRequests.length}
                    </p>
                    <p className="text-xs text-gray-500">Total requests</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Information */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 bg-white/80 backdrop-blur-sm border border-blue-100">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm">
                Documents
              </TabsTrigger>
              {rental.is_tenant && (
                <>
                  <TabsTrigger
                    value="payments"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm">
                    Payments
                  </TabsTrigger>
                  <TabsTrigger
                    value="maintenance"
                    className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs sm:text-sm">
                    <span className="hidden sm:inline">Maintenance</span>
                    <span className="sm:hidden">Maint.</span> (
                    {maintenanceRequests.length})
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="overview" className="mt-4 sm:mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Application Information */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Application Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Application Status
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {rental.status.charAt(0).toUpperCase() +
                            rental.status.slice(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Unit Type
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {rental.unit_type}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Unit Number
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {rental.unit_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Move-in Date
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {formatDate(rental.move_in_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Monthly Rent
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {formatCurrency(rental.monthly_rent)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Submitted Date
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {formatDate(rental.submitted_at)}
                        </p>
                      </div>
                    </div>

                    {rental.notes && (
                      <div className="border-t pt-3 sm:pt-4">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          Application Notes
                        </p>
                        <p className="text-gray-900 whitespace-pre-wrap text-sm sm:text-base">
                          {rental.notes}
                        </p>
                      </div>
                    )}

                    {rental.rejection_reason && (
                      <div className="border-t pt-3 sm:pt-4">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          Rejection Reason
                        </p>
                        <p className="text-red-600 whitespace-pre-wrap text-sm sm:text-base">
                          {rental.rejection_reason}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Property Information */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                  <CardHeader className="p-3 sm:p-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Property Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6 pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="sm:col-span-2">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Property Name
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {rental.property.name}
                        </p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Address
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {rental.property.address}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">City</p>
                        <p className="font-semibold text-sm sm:text-base">
                          {rental.property.city}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Province
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {rental.property.province}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Property Type
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {formatPropertyType(rental.property.type)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Monthly Rent
                        </p>
                        <p className="font-semibold text-sm sm:text-base">
                          {formatCurrency(rental.monthly_rent)}
                        </p>
                      </div>
                    </div>

                    {rental.property.description && (
                      <div className="border-t pt-3 sm:pt-4">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2">
                          Property Description
                        </p>
                        <p className="text-gray-900 whitespace-pre-wrap text-sm sm:text-base">
                          {rental.property.description}
                        </p>
                      </div>
                    )}

                    {rental.property.amenities &&
                      rental.property.amenities.length > 0 && (
                        <div className="border-t pt-3 sm:pt-4">
                          <p className="text-xs sm:text-sm text-gray-600 mb-2">
                            Amenities
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {rental.property.amenities.map((amenity, index) => (
                              <Badge
                                key={index}
                                className="bg-blue-100 text-blue-700 border-0 text-xs">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="border-t pt-3 sm:pt-4">
                      <p className="text-xs sm:text-sm text-gray-600 mb-2">
                        Property Owner
                      </p>
                      <p className="font-semibold text-sm sm:text-base">
                        {rental.owner.name}
                      </p>
                      <p className="text-gray-700 text-sm sm:text-base">
                        {rental.owner.email}
                      </p>
                      <p className="text-gray-700 text-sm sm:text-base">
                        {rental.owner.phone}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {rental.notes && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 lg:col-span-2">
                    <CardHeader className="p-3 sm:p-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6 pt-0">
                      <p className="text-gray-900 whitespace-pre-wrap text-sm sm:text-base">
                        {rental.notes}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="payments" className="mt-4 sm:mt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <Card className="bg-blue-50/60 border border-blue-100 shadow-md rounded-xl">
                  <CardContent className="p-4 sm:p-6 lg:p-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-xs sm:text-sm mb-1 font-medium">
                          Current Bill
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-blue-900">
                          {formatCurrency(getCurrentBill())}
                        </p>
                      </div>
                      <PhilippinePeso className="w-8 h-8 sm:w-10 sm:h-10 opacity-80 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50/60 border border-red-100 shadow-md rounded-xl">
                  <CardContent className="p-4 sm:p-6 lg:p-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-600 text-xs sm:text-sm mb-1 font-medium">
                          Outstanding Balance
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold text-red-900">
                          {formatCurrency(getOutstandingBalance())}
                        </p>
                      </div>
                      <PhilippinePeso className="w-8 h-8 sm:w-10 sm:h-10 opacity-80 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white/95 border border-blue-100 shadow-lg rounded-xl">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm">
                            Status
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Due Date
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Paid Date
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Amount
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Late Fee
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Total
                          </TableHead>
                          <TableHead className="text-xs sm:text-sm">
                            Method
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-xs sm:text-sm">
                              {getPaymentStatusBadge(payment.payment_status)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {formatShortDate(payment.due_date)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {payment.payment_date
                                ? formatShortDate(payment.payment_date)
                                : '-'}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              ₱{formatCurrency(payment.amount || 0)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              ₱{formatCurrency(payment.late_fee || 0)}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              ₱
                              {formatCurrency(
                                (payment.amount || 0) + (payment.late_fee || 0)
                              )}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm">
                              {payment.payment_method || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {payments.length === 0 && (
                    <div className="text-center py-6 sm:py-8">
                      <CreditCard className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm sm:text-base">
                        No payment history yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-4 sm:mt-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Maintenance Requests
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  {maintenanceRequests.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {maintenanceRequests.map(request => (
                        <div
                          key={request.id}
                          className="flex flex-col sm:flex-row sm:items-start sm:justify-between p-3 sm:p-4 border border-blue-100 rounded-lg bg-blue-50/50 gap-3 sm:gap-4">
                          <div className="flex items-start gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white">
                              <Wrench className="w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                  {request.title}
                                </p>
                                {getPriorityBadge(request.priority)}
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2">
                                {request.description}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-500">
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
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-600 mt-1">
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
                          <div className="text-left sm:text-right">
                            {getMaintenanceStatusBadge(request.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm sm:text-base">
                        No maintenance requests yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4 sm:mt-6">
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Application Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  {rental.application_documents.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {rental.application_documents.map(doc => (
                        <div
                          key={doc.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-blue-100 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white">
                              {doc.type.includes('image') ? (
                                <Image className="w-5 h-5 sm:w-6 sm:h-6" />
                              ) : (
                                <File className="w-5 h-5 sm:w-6 sm:h-6" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm sm:text-base">
                                {doc.name}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs sm:text-sm text-gray-500">
                                <span>
                                  {doc.type.split('/')[1]?.toUpperCase() ||
                                    'Unknown'}
                                </span>
                                <span className="hidden sm:inline w-1 h-1 rounded-full bg-gray-300" />
                                <span>{formatShortDate(doc.uploaded_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs sm:text-sm"
                              onClick={() => window.open(doc.url, '_blank')}>
                              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="hidden sm:inline ml-1">
                                Download
                              </span>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 sm:py-8">
                      <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm sm:text-base">
                        No application documents uploaded
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400 mt-2">
                        Documents submitted with your rental application
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

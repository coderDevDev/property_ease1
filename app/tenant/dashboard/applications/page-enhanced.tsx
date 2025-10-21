'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  ClipboardList,
  Search,
  Calendar,
  Building,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Grid,
  List,
  Download,
  Eye,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';
import { generateLeaseAgreementPDF } from '@/lib/pdf/leaseAgreementPDF';

interface Application {
  id: string;
  property_id: string;
  property_name: string;
  unit_type: string;
  unit_number?: string;
  monthly_rent: number;
  move_in_date: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  updated_at: string;
  documents: {
    id: string;
    name: string;
    type: string;
    url: string;
  }[];
  notes?: string;
  rejection_reason?: string;
}

export default function ApplicationsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    const fetchApplications = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getApplications(authState.user.id);

        if (result.success && result.data) {
          setApplications(result.data);
        } else {
          toast.error('Failed to load applications');
        }
      } catch (error) {
        console.error('Failed to fetch applications:', error);
        toast.error('Failed to load applications');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [authState.user?.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-700 border-0';
      case 'rejected':
        return 'bg-red-100 text-red-700 border-0';
      default:
        return 'bg-yellow-100 text-yellow-700 border-0';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const filteredApplications = applications.filter(application => {
    const matchesFilter = filter === 'all' || application.status === filter;
    const matchesSearch =
      searchQuery === '' ||
      application.property_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      application.unit_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  };

  const handleDownloadLease = (application: Application, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (application.status !== 'approved') {
      toast.error('Lease agreement is only available for approved applications');
      return;
    }

    const moveInDate = new Date(application.move_in_date);
    const leaseEndDate = new Date(moveInDate);
    leaseEndDate.setMonth(leaseEndDate.getMonth() + 12);

    const leaseData = {
      tenantName:
        authState.user?.firstName + ' ' + authState.user?.lastName || 'Tenant',
      tenantEmail: authState.user?.email || '',
      tenantPhone: authState.user?.phone || '',
      ownerName: 'Property Owner',
      ownerEmail: '',
      ownerPhone: '',
      propertyName: application.property_name,
      propertyAddress: '',
      propertyCity: '',
      propertyType: application.unit_type,
      unitNumber: application.unit_number || application.unit_type,
      leaseStart: application.move_in_date,
      leaseEnd: leaseEndDate.toISOString(),
      leaseDuration: 12,
      monthlyRent: application.monthly_rent,
      securityDeposit: application.monthly_rent * 2,
      paymentDueDay: 5,
      terms: [
        'Tenant shall pay rent on or before the 5th day of each month.',
        'A late fee of ₱500 or 5% of the monthly rent (whichever is higher) will be charged after 3 days.',
        'The security deposit will be refunded at the end of the lease term, subject to property inspection.',
        'Tenant is responsible for maintaining the property in good condition.',
        'Tenant must notify the landlord of any maintenance issues promptly.',
        'Subletting is not allowed without prior written consent from the landlord.',
        'Tenant must comply with all building rules and regulations.',
        'Either party may terminate this agreement with 30 days written notice.'
      ],
      amenities: []
    };

    generateLeaseAgreementPDF(leaseData);
    toast.success('Lease agreement downloaded!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Loading applications...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              My Applications
            </h1>
            <p className="text-blue-600/70 mt-1">
              Track and manage your property rental applications
            </p>
          </div>
          <Button
            onClick={() => router.push('/tenant/dashboard/applications/new')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {stats.pending}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.approved}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">
                    {stats.rejected}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search by property name or unit type..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'card' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('card')}
                    className="h-8 w-8 p-0">
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8 w-8 p-0">
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Applications List - Empty State */}
        {filteredApplications.length === 0 ? (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-12 text-center">
              <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Applications Found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? 'No applications match your search criteria'
                  : "You haven't submitted any rental applications yet"}
              </p>
              <Button
                onClick={() => router.push('/tenant/dashboard/properties')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Browse Properties
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Card View */}
            {viewMode === 'card' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredApplications.map(application => (
                  <Card
                    key={application.id}
                    className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
                    onClick={() =>
                      router.push(`/tenant/dashboard/rental/${application.id}`)
                    }>
                    <CardContent className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {application.property_name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Building className="w-4 h-4" />
                            <span>{application.unit_type}</span>
                          </div>
                        </div>
                        <Badge className={getStatusColor(application.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {application.status.charAt(0).toUpperCase() +
                              application.status.slice(1)}
                          </span>
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Monthly Rent:
                          </span>
                          <span className="font-semibold text-gray-900">
                            ₱{application.monthly_rent.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Move-in Date:
                          </span>
                          <span className="font-medium text-gray-900">
                            {new Date(
                              application.move_in_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Documents:
                          </span>
                          <span className="font-medium text-gray-900">
                            {application.documents.length} files
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Submitted:
                          </span>
                          <span className="font-medium text-gray-900">
                            {new Date(
                              application.submitted_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Rejection Reason */}
                      {application.rejection_reason && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-sm text-red-600">
                            {application.rejection_reason}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={e => {
                            e.stopPropagation();
                            router.push(
                              `/tenant/dashboard/rental/${application.id}`
                            );
                          }}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {application.status === 'approved' && (
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                            onClick={e => handleDownloadLease(application, e)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download Lease
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg">
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-50/50">
                        <TableHead className="font-semibold text-blue-700">
                          Property
                        </TableHead>
                        <TableHead className="font-semibold text-blue-700">
                          Unit Type
                        </TableHead>
                        <TableHead className="font-semibold text-blue-700">
                          Monthly Rent
                        </TableHead>
                        <TableHead className="font-semibold text-blue-700">
                          Move-in Date
                        </TableHead>
                        <TableHead className="font-semibold text-blue-700">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-blue-700">
                          Submitted
                        </TableHead>
                        <TableHead className="font-semibold text-blue-700 text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map(application => (
                        <TableRow
                          key={application.id}
                          className="hover:bg-blue-50/30 cursor-pointer transition-colors"
                          onClick={() =>
                            router.push(
                              `/tenant/dashboard/rental/${application.id}`
                            )
                          }>
                          <TableCell className="font-medium">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {application.property_name}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                <FileText className="w-3 h-3" />
                                {application.documents.length} documents
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4 text-gray-500" />
                              {application.unit_type}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₱{application.monthly_rent.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {new Date(
                              application.move_in_date
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(application.status)}>
                              <span className="flex items-center gap-1">
                                {getStatusIcon(application.status)}
                                {application.status.charAt(0).toUpperCase() +
                                  application.status.slice(1)}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(
                              application.submitted_at
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(
                                    `/tenant/dashboard/rental/${application.id}`
                                  );
                                }}
                                title="View Details">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {application.status === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  onClick={e => handleDownloadLease(application, e)}
                                  title="Download Lease">
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
          </>
        )}
      </div>
    </div>
  );
}

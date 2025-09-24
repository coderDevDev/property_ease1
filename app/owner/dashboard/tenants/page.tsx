'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Users,
  MapPin,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MessageSquare,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  UserPlus,
  FileText,
  Home,
  Table2,
  LayoutGrid,
  PhilippinePeso
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { TenantsAPI, type TenantAnalytics } from '@/lib/api/tenants';
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
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    type: string;
  };
}

export default function TenantsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProperty, setFilterProperty] = useState('all');
  const [expiringTenants, setExpiringTenants] = useState<Tenant[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    const loadTenants = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        const [tenantsResult, expiringResult] = await Promise.all([
          TenantsAPI.getTenants(authState.user.id),
          TenantsAPI.getTenantsExpiringSoon(authState.user.id, 30)
        ]);

        if (tenantsResult.success) {
          setTenants(tenantsResult.data);
        } else {
          toast.error('Failed to load tenants');
        }

        if (expiringResult.success) {
          setExpiringTenants(expiringResult.data);
        }
      } catch (error) {
        console.error('Failed to load tenants:', error);
        toast.error('Failed to load tenants');
      } finally {
        setIsLoading(false);
      }
    };

    loadTenants();
  }, [authState.user?.id]);

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch =
      tenant.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.unit_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.property.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || tenant.status === filterStatus;
    const matchesProperty =
      filterProperty === 'all' || tenant.property_id === filterProperty;

    return matchesSearch && matchesStatus && matchesProperty;
  });

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

  const getLeaseStatusBadge = (leaseEnd: string) => {
    const endDate = new Date(leaseEnd);
    const now = new Date();
    const daysUntilExpiry = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
      return (
        <Badge className="bg-red-100 text-red-700 border-0">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    } else if (daysUntilExpiry <= 30) {
      return (
        <Badge className="bg-orange-100 text-orange-700 border-0">
          <Clock className="w-3 h-3 mr-1" />
          Expires in {daysUntilExpiry}d
        </Badge>
      );
    } else if (daysUntilExpiry <= 90) {
      return (
        <Badge className="bg-yellow-100 text-yellow-700 border-0">
          <Calendar className="w-3 h-3 mr-1" />
          Expires in {Math.ceil(daysUntilExpiry / 30)}m
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-100 text-green-700 border-0">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active Lease
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
      month: 'short',
      day: 'numeric'
    });
  };

  const getUniqueProperties = () => {
    const properties = tenants.map(t => t.property);
    const unique = properties.filter(
      (prop, index, self) => index === self.findIndex(p => p.id === prop.id)
    );
    return unique;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-sm sm:text-base">
            Loading tenants...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Tenants
              </h1>
              <p className="text-blue-600/80 font-medium text-sm sm:text-base">
                Manage your tenant relationships and leases
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => router.push('/owner/dashboard/tenants/new')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
                <UserPlus className="w-4 h-4 mr-2" />
                Add Tenant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {tenants.length}
                  </p>
                  <p className="text-sm text-gray-600">Total Tenants</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {tenants.filter(t => t.status === 'active').length}
                  </p>
                  <p className="text-sm text-gray-600">Active Leases</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {expiringTenants.length}
                  </p>
                  <p className="text-sm text-gray-600">Expiring Soon</p>
                  <div className="flex items-center mt-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                    <span className="text-xs text-orange-600">
                      Next 30 days
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <PhilippinePeso className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      tenants
                        .filter(t => t.status === 'active')
                        .reduce((sum, t) => sum + t.monthly_rent, 0)
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Monthly Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expiring Leases Alert */}
        {expiringTenants.length > 0 && (
          <Card className="mb-4 sm:mb-6 border-orange-200 bg-orange-50/50">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-orange-700 text-base sm:text-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                Leases Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {expiringTenants.map(tenant => (
                  <div
                    key={tenant.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-white rounded-lg border border-orange-200 gap-3">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        {tenant.user.first_name} {tenant.user.last_name}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {tenant.property.name} - Unit {tenant.unit_number}
                      </p>
                      <p className="text-xs text-orange-600">
                        Expires: {formatDate(tenant.lease_end)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(`/owner/dashboard/tenants/${tenant.id}`)
                      }
                      className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs sm:text-sm">
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search tenants, properties, or units..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm sm:text-base"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm sm:text-base">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="terminated">Terminated</option>
              </select>
              <select
                value={filterProperty}
                onChange={e => setFilterProperty(e.target.value)}
                className="px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm text-sm sm:text-base">
                <option value="all">All Properties</option>
                {getUniqueProperties().map(property => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center rounded-lg border border-blue-200 bg-white">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'px-3 rounded-l-md border-r border-blue-200',
                  viewMode === 'grid' && 'bg-blue-50 text-blue-600'
                )}
                onClick={() => setViewMode('grid')}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'px-3 rounded-r-md',
                  viewMode === 'table' && 'bg-blue-50 text-blue-600'
                )}
                onClick={() => setViewMode('table')}>
                <Table2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tenants List */}
        {filteredTenants.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredTenants.map(tenant => (
                <Card
                  key={tenant.id}
                  className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-200 hover:scale-[1.02]">
                  <CardHeader className="pb-3 p-3 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                          {tenant.user.first_name[0]}
                          {tenant.user.last_name[0]}
                        </div>
                        <div>
                          <CardTitle className="text-base sm:text-lg font-bold text-gray-900">
                            {tenant.user.first_name} {tenant.user.last_name}
                          </CardTitle>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 mt-1">
                            {getStatusBadge(tenant.status)}
                            {getLeaseStatusBadge(tenant.lease_end)}
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-50">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/owner/dashboard/tenants/${tenant.id}`
                              )
                            }>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/owner/dashboard/tenants/${tenant.id}/edit`
                              )
                            }>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Tenant
                          </DropdownMenuItem>
                          {/* <DropdownMenuItem>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            Generate Invoice
                          </DropdownMenuItem> */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-3 sm:p-6">
                    <div className="space-y-3">
                      {/* Property Information */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Home className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-gray-600">Property:</span>
                        <span className="font-medium text-gray-900 truncate">
                          {tenant.property.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-gray-600">Unit:</span>
                        <span className="font-medium text-gray-900">
                          {tenant.unit_number}
                        </span>
                      </div>

                      {/* Contact Information */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-gray-600 truncate">
                          {tenant.user.email}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        <span className="text-gray-600">
                          {tenant.user.phone}
                        </span>
                      </div>

                      {/* Financial Information */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-gray-100 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Monthly Rent</p>
                          <p className="font-bold text-base sm:text-lg text-blue-600">
                            {formatCurrency(tenant.monthly_rent)}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs text-gray-500">Lease Period</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {formatDate(tenant.lease_start)} -{' '}
                            {formatDate(tenant.lease_end)}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors text-xs sm:text-sm">
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50/50">
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                        Tenant
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                        Property & Unit
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                        Status
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                        Lease Period
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                        Monthly Rent
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                        Contact
                      </TableHead>
                      <TableHead className="text-right text-blue-700 font-semibold text-xs sm:text-sm">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map(tenant => (
                      <TableRow
                        key={tenant.id}
                        className="hover:bg-blue-50/30 transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                              {tenant.user.first_name[0]}
                              {tenant.user.last_name[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-xs sm:text-sm">
                                {tenant.user.first_name} {tenant.user.last_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 text-xs sm:text-sm">
                              {tenant.property.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Unit {tenant.unit_number}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getStatusBadge(tenant.status)}
                            {getLeaseStatusBadge(tenant.lease_end)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs text-gray-500">
                              Start: {formatDate(tenant.lease_start)}
                            </p>
                            <p className="text-xs text-gray-500">
                              End: {formatDate(tenant.lease_end)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-blue-600 text-xs sm:text-sm">
                            {formatCurrency(tenant.monthly_rent)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-none">
                              {tenant.user.email}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tenant.user.phone}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 hover:bg-blue-50">
                                <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/owner/dashboard/tenants/${tenant.id}`
                                  )
                                }>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/owner/dashboard/tenants/${tenant.id}/edit`
                                  )
                                }>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Tenant
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="w-4 h-4 mr-2" />
                                Generate Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardContent className="text-center py-8 sm:py-12">
              <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ||
                filterStatus !== 'all' ||
                filterProperty !== 'all'
                  ? 'No tenants found'
                  : 'No tenants yet'}
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {searchTerm ||
                filterStatus !== 'all' ||
                filterProperty !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by adding your first tenant to manage leases and relationships.'}
              </p>
              {!searchTerm &&
                filterStatus === 'all' &&
                filterProperty === 'all' && (
                  <Button
                    onClick={() => router.push('/owner/dashboard/tenants/new')}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm sm:text-base">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Your First Tenant
                  </Button>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

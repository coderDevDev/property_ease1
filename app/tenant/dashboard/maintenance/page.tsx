'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Wrench,
  Plus,
  Search,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreVertical,
  User,
  Home,
  Table2,
  LayoutGrid,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2
} from 'lucide-react';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabase';

interface MaintenanceRequest {
  id: string;
  tenant_id: string;
  property_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  images: string[];
  estimated_cost?: number;
  actual_cost?: number;
  assigned_to?: string;
  scheduled_date?: string;
  completed_date?: string;
  tenant_notes?: string;
  owner_notes?: string;
  created_at: string;
  updated_at: string;
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    type: string;
  };
  tenant: {
    id: string;
    user_id: string;
    property_id: string;
    unit_number: string;
    lease_start: string;
    lease_end: string;
    monthly_rent: number;
    deposit: number;
    security_deposit: number;
    status: string;
    documents: string[];
    lease_agreement_url?: string;
    move_in_date?: string;
    move_out_date?: string;
    created_at: string;
    updated_at: string;
    user: {
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
      role: string;
      avatar_url?: string;
      is_verified: boolean;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      last_login?: string;
    };
  };
}

export default function TenantMaintenancePage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [maintenanceRequests, setMaintenanceRequests] = useState<
    MaintenanceRequest[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Load maintenance requests for current tenant
  useEffect(() => {
    const loadMaintenanceRequests = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        
        // First, get the tenant ID(s) for the current user
        const { data: tenants, error: tenantError } = await supabase
          .from('tenants')
          .select('id')
          .eq('user_id', authState.user.id)
          .eq('status', 'active');

        if (tenantError) {
          throw tenantError;
        }

        if (!tenants || tenants.length === 0) {
          setMaintenanceRequests([]);
          return;
        }

        // Optimized: Query maintenance requests with only required fields
        const tenantIds = tenants.map(t => t.id);
        
        const { data: requests, error: requestsError } = await supabase
          .from('maintenance_requests')
          .select('id, tenant_id, property_id, title, description, category, status, estimated_cost, actual_cost, scheduled_date, created_at')
          .in('tenant_id', tenantIds)
          .order('created_at', { ascending: false })
          .limit(50);

        if (requestsError) throw requestsError;
        if (!requests || requests.length === 0) {
          setMaintenanceRequests([]);
          return;
        }

        // Fetch properties separately (lightweight)
        const propertyIds = [...new Set(requests.map(r => r.property_id))];
        const { data: properties } = await supabase
          .from('properties')
          .select('id, name, city')
          .in('id', propertyIds);

        const propertyMap = new Map((properties || []).map(p => [p.id, p]));

        // Merge data client-side
        const allRequests = requests.map(req => ({
          ...req,
          property: propertyMap.get(req.property_id) || {
            id: req.property_id,
            name: 'Unknown',
            address: '',
            city: '',
            type: ''
          },
          tenant: {
            id: tenants.find(t => t.id === req.tenant_id)?.id || '',
            user_id: authState.user.id,
            property_id: req.property_id,
            unit_number: tenants.find(t => t.id === req.tenant_id)?.unit_number || '',
            lease_start: '', lease_end: '', monthly_rent: 0, deposit: 0,
            security_deposit: 0, status: 'active', documents: [],
            created_at: '', updated_at: '',
            user: {
              id: authState.user.id,
              email: authState.user.email || '',
              first_name: authState.user.first_name || '',
              last_name: authState.user.last_name || '',
              phone: authState.user.phone || '',
              role: 'tenant',
              is_verified: true,
              is_active: true,
              created_at: '',
              updated_at: ''
            }
          }
        })) as MaintenanceRequest[];

        setMaintenanceRequests(allRequests);
      } catch (error) {
        console.error('Failed to load maintenance requests:', error);
        toast.error('Failed to load maintenance requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadMaintenanceRequests();
  }, [authState.user?.id]);

  // Filter maintenance requests
  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.property.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || request.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get priority badge variant
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Handle view request
  const handleViewRequest = (request: MaintenanceRequest) => {
    router.push(`/tenant/dashboard/maintenance/${request.id}`);
  };

  // Handle edit request
  const handleEditRequest = (request: MaintenanceRequest) => {
    router.push(`/tenant/dashboard/maintenance/${request.id}/edit`);
  };

  // Handle delete request
  const handleDeleteRequest = async (request: MaintenanceRequest) => {
    if (
      window.confirm(
        'Are you sure you want to delete this maintenance request? This action cannot be undone.'
      )
    ) {
      try {
        const result = await MaintenanceAPI.deleteMaintenanceRequest(
          request.id
        );
        if (result.success) {
          toast.success('Maintenance request deleted successfully');
          // Reload the list
          const result = await MaintenanceAPI.getMaintenanceRequests();
          if (result.success) {
            const tenantRequests = result.data.filter(
              request => request.tenant?.user?.id === authState.user?.id
            );
            setMaintenanceRequests(tenantRequests);
          }
        } else {
          toast.error(result.message || 'Failed to delete maintenance request');
        }
      } catch (error) {
        console.error('Delete maintenance request error:', error);
        toast.error('Failed to delete maintenance request');
      }
    }
  };

  // Statistics
  const stats = {
    total: maintenanceRequests.length,
    pending: maintenanceRequests.filter(r => r.status === 'pending').length,
    inProgress: maintenanceRequests.filter(r => r.status === 'in_progress')
      .length,
    completed: maintenanceRequests.filter(r => r.status === 'completed').length,
    urgent: maintenanceRequests.filter(r => r.priority === 'urgent').length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-sm sm:text-base">
              Loading maintenance requests...
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
              My Maintenance Requests
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Track and manage your maintenance requests
            </p>
          </div>
          <Button
            onClick={() => router.push('/tenant/dashboard/maintenance/new')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
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
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.pending}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.inProgress}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    In Progress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.completed}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.urgent}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                  <Input
                    placeholder="Search maintenance requests..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-8 sm:pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32 sm:w-40 bg-white/50 border-blue-200/50 text-sm sm:text-base">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex bg-white/50 border border-blue-200/50 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className={cn(
                      viewMode === 'table' && 'bg-blue-100 text-blue-700',
                      'h-8 w-8 sm:h-9 sm:w-9'
                    )}>
                    <Table2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      viewMode === 'grid' && 'bg-blue-100 text-blue-700',
                      'h-8 w-8 sm:h-9 sm:w-9'
                    )}>
                    <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600 text-sm sm:text-base">
            Showing {filteredRequests.length} of {maintenanceRequests.length}{' '}
            maintenance requests
          </p>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50/50">
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                        Request
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden sm:table-cell">
                        Property
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden md:table-cell">
                        Category
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                        Status
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden lg:table-cell">
                        Cost
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden md:table-cell">
                        Date
                      </TableHead>
                      <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map(request => (
                      <TableRow
                        key={request.id}
                        className="hover:bg-blue-50/30 transition-colors">
                        <TableCell>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">
                              {request.title}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate max-w-xs">
                              {request.description}
                            </p>
                            <div className="sm:hidden mt-1">
                              <p className="text-xs text-gray-500">
                                {request.property.name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div>
                            <p className="font-medium text-gray-900 text-sm sm:text-base">
                              {request.property.name}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {request.property.city}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200 text-xs sm:text-sm">
                            {request.category.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusBadge(
                              request.status
                            )} text-xs sm:text-sm`}>
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div>
                            {request.actual_cost ? (
                              <p className="font-semibold text-green-600 text-sm sm:text-base">
                                ₱{request.actual_cost.toLocaleString()}
                              </p>
                            ) : request.estimated_cost ? (
                              <p className="text-gray-600 text-sm sm:text-base">
                                ₱{request.estimated_cost.toLocaleString()}
                              </p>
                            ) : (
                              <p className="text-gray-400 text-sm sm:text-base">
                                -
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>
                            <p className="text-xs sm:text-sm text-gray-900">
                              {new Date(
                                request.created_at
                              ).toLocaleDateString()}
                            </p>
                            {request.scheduled_date && (
                              <p className="text-xs text-blue-600">
                                Scheduled:{' '}
                                {new Date(
                                  request.scheduled_date
                                ).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 sm:h-9 sm:w-9">
                                <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleViewRequest(request)}>
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {request.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => handleEditRequest(request)}>
                                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                  Edit Request
                                </DropdownMenuItem>
                              )}
                              {request.status === 'pending' && (
                                <DropdownMenuItem
                                  onClick={() => handleDeleteRequest(request)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                  Delete Request
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredRequests.map(request => (
              <Card
                key={request.id}
                className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-3 p-3 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base sm:text-lg text-gray-900 mb-2">
                        {request.title}
                      </CardTitle>
                      <div className="flex gap-1 sm:gap-2 mb-3">
                        <Badge
                          className={`${getStatusBadge(
                            request.status
                          )} text-xs sm:text-sm`}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 sm:h-9 sm:w-9">
                          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewRequest(request)}>
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {request.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => handleEditRequest(request)}>
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Edit Request
                          </DropdownMenuItem>
                        )}
                        {request.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(request)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Delete Request
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-3 sm:p-6">
                  <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2">
                    {request.description}
                  </p>

                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Home className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {request.property.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Wrench className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="text-gray-600 capitalize">
                        {request.category.replace('_', ' ')}
                      </span>
                    </div>

                    {(request.actual_cost || request.estimated_cost) && (
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {request.actual_cost
                            ? `₱${request.actual_cost.toLocaleString()}`
                            : `₱${request.estimated_cost?.toLocaleString()}`}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredRequests.length === 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-6 sm:p-12 text-center">
              <Wrench className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                No maintenance requests found
              </h3>
              <p className="text-gray-600 mb-6 text-sm sm:text-base">
                {searchTerm ||
                filterStatus !== 'all' ||
                filterPriority !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first maintenance request.'}
              </p>
              <Button
                onClick={() => router.push('/tenant/dashboard/maintenance/new')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Create Maintenance Request
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

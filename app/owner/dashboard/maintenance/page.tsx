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
  Filter,
  Eye,
  Edit,
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
  Trash2,
  PhilippinePeso
} from 'lucide-react';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { PropertiesAPI } from '@/lib/api/properties';
import { TenantsAPI } from '@/lib/api/tenants';
import { toast } from 'sonner';

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
  tenant: {
    id: string;
    user_id: string;
    unit_number: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
    };
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    type: string;
  };
}

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
}

export default function MaintenancePage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [maintenanceRequests, setMaintenanceRequests] = useState<
    MaintenanceRequest[]
  >([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProperty, setFilterProperty] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Load data
  useEffect(() => {
    const loadData = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        const [maintenanceResult, propertiesResult] = await Promise.all([
          MaintenanceAPI.getMaintenanceRequests(),
          PropertiesAPI.getProperties(authState.user.id)
        ]);

        if (maintenanceResult.success) {
          setMaintenanceRequests(maintenanceResult.data);
        }
        if (propertiesResult.success) {
          setProperties(propertiesResult.data);
        }
      } catch (error) {
        console.error('Failed to load maintenance data:', error);
        toast.error('Failed to load maintenance requests');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authState.user?.id]);

  // Filter maintenance requests
  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tenant.user.first_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.tenant.user.last_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.property.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || request.status === filterStatus;
    const matchesPriority =
      filterPriority === 'all' || request.priority === filterPriority;
    const matchesProperty =
      filterProperty === 'all' || request.property_id === filterProperty;

    return matchesSearch && matchesStatus && matchesPriority && matchesProperty;
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

  // Handle actions
  const handleViewRequest = (request: MaintenanceRequest) => {
    router.push(`/owner/dashboard/maintenance/${request.id}`);
  };

  const handleEditRequest = (request: MaintenanceRequest) => {
    router.push(`/owner/dashboard/maintenance/${request.id}`);
  };

  const handleAssignRequest = (request: MaintenanceRequest) => {
    router.push(`/owner/dashboard/maintenance/${request.id}`);
  };

  const handleCompleteRequest = (request: MaintenanceRequest) => {
    router.push(`/owner/dashboard/maintenance/${request.id}`);
  };

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
          const maintenanceResult =
            await MaintenanceAPI.getMaintenanceRequests();
          if (maintenanceResult.success) {
            setMaintenanceRequests(maintenanceResult.data);
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

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const result = await MaintenanceAPI.updateMaintenanceRequest(requestId, {
        status: newStatus as
          | 'pending'
          | 'in_progress'
          | 'completed'
          | 'cancelled'
          | 'rejected',
        ...(newStatus === 'completed' && {
          completed_date: new Date().toISOString()
        })
      });

      if (result.success) {
        toast.success('Maintenance request updated successfully');
        // Refresh data
        const maintenanceResult = await MaintenanceAPI.getMaintenanceRequests();
        if (maintenanceResult.success) {
          setMaintenanceRequests(maintenanceResult.data);
        }
      } else {
        toast.error(result.message || 'Failed to update maintenance request');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update maintenance request');
    }
  };

  // Statistics
  const stats = {
    total: maintenanceRequests.length,
    pending: maintenanceRequests.filter(r => r.status === 'pending').length,
    inProgress: maintenanceRequests.filter(r => r.status === 'in_progress')
      .length,
    completed: maintenanceRequests.filter(r => r.status === 'completed').length,
    urgent: maintenanceRequests.filter(r => r.priority === 'urgent').length,
    totalCost: maintenanceRequests.reduce(
      (sum, r) => sum + (r.actual_cost || r.estimated_cost || 0),
      0
    )
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-sm sm:text-base">
            Loading maintenance requests...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Maintenance Management
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Manage maintenance requests and track repair progress
            </p>
          </div>
          <Button
            onClick={() => router.push('/owner/dashboard/maintenance/new')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base">
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
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
                  <p className="text-xs sm:text-sm text-gray-600">
                    Total Requests
                  </p>
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

          <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    ₱{stats.totalCost.toLocaleString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Total Cost</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardContent className="p-3 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search maintenance requests..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-40 bg-white/50 border-blue-200/50 text-sm sm:text-base">
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

                <Select
                  value={filterPriority}
                  onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-full sm:w-40 bg-white/50 border-blue-200/50 text-sm sm:text-base">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterProperty}
                  onValueChange={setFilterProperty}>
                  <SelectTrigger className="w-full sm:w-48 bg-white/50 border-blue-200/50 text-sm sm:text-base">
                    <SelectValue placeholder="Property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    {properties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex bg-white/50 border border-blue-200/50 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className={cn(
                      viewMode === 'table' && 'bg-blue-100 text-blue-700'
                    )}>
                    <Table2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      viewMode === 'grid' && 'bg-blue-100 text-blue-700'
                    )}>
                    <LayoutGrid className="w-4 h-4" />
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
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50/50">
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                      Request
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                      Tenant
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden sm:table-cell">
                      Property
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm hidden md:table-cell">
                      Category
                    </TableHead>
                    <TableHead className="text-blue-700 font-semibold text-xs sm:text-sm">
                      Priority
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
                      <TableCell className="p-3 sm:p-4">
                        <div>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                            {request.title}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate max-w-xs">
                            {request.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            {request.tenant.user.first_name}{' '}
                            {request.tenant.user.last_name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Unit {request.tenant.unit_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4 hidden sm:table-cell">
                        <div>
                          <p className="font-medium text-gray-900 text-xs sm:text-sm">
                            {request.property.name}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {request.property.city}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4 hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                          {request.category.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4">
                        <Badge className={getPriorityBadge(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4">
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4 hidden lg:table-cell">
                        <div>
                          {request.actual_cost ? (
                            <p className="font-semibold text-green-600 text-xs sm:text-sm">
                              ₱{request.actual_cost.toLocaleString()}
                            </p>
                          ) : request.estimated_cost ? (
                            <p className="text-gray-600 text-xs sm:text-sm">
                              ₱{request.estimated_cost.toLocaleString()}
                            </p>
                          ) : (
                            <p className="text-gray-400 text-xs sm:text-sm">
                              -
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="p-3 sm:p-4 hidden md:table-cell">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-900">
                            {new Date(request.created_at).toLocaleDateString()}
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
                      <TableCell className="p-3 sm:p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8">
                              <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewRequest(request)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditRequest(request)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Request
                            </DropdownMenuItem>
                            {request.status === 'pending' && (
                              <DropdownMenuItem
                                onClick={() => handleAssignRequest(request)}>
                                <User className="w-4 h-4 mr-2" />
                                Assign
                              </DropdownMenuItem>
                            )}
                            {request.status === 'in_progress' && (
                              <DropdownMenuItem
                                onClick={() => handleCompleteRequest(request)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Complete
                              </DropdownMenuItem>
                            )}
                            {(request.status === 'pending' ||
                              request.status === 'cancelled') && (
                              <DropdownMenuItem
                                onClick={() => handleDeleteRequest(request)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4 mr-2" />
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
            </CardContent>
          </Card>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
                      <div className="flex gap-2 mb-3">
                        <Badge className={getPriorityBadge(request.priority)}>
                          {request.priority}
                        </Badge>
                        <Badge className={getStatusBadge(request.status)}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 sm:h-8 sm:w-8">
                          <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewRequest(request)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditRequest(request)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Request
                        </DropdownMenuItem>
                        {request.status === 'pending' && (
                          <DropdownMenuItem
                            onClick={() => handleAssignRequest(request)}>
                            <User className="w-4 h-4 mr-2" />
                            Assign
                          </DropdownMenuItem>
                        )}
                        {request.status === 'in_progress' && (
                          <DropdownMenuItem
                            onClick={() => handleCompleteRequest(request)}>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                          </DropdownMenuItem>
                        )}
                        {(request.status === 'pending' ||
                          request.status === 'cancelled') && (
                          <DropdownMenuItem
                            onClick={() => handleDeleteRequest(request)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4 mr-2" />
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

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="text-gray-600">
                        {request.tenant.user.first_name}{' '}
                        {request.tenant.user.last_name}
                      </span>
                    </div>

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
            <CardContent className="py-8 sm:py-12 text-center">
              <Wrench className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No maintenance requests found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                {searchTerm ||
                filterStatus !== 'all' ||
                filterPriority !== 'all' ||
                filterProperty !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating your first maintenance request.'}
              </p>
              <Button
                onClick={() => router.push('/owner/dashboard/maintenance/new')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base">
                <Plus className="w-4 h-4 mr-2" />
                Create Maintenance Request
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

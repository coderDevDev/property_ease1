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
  Wrench,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Flag,
  User,
  Building2
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category:
    | 'plumbing'
    | 'electrical'
    | 'hvac'
    | 'appliances'
    | 'structural'
    | 'cleaning'
    | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  images?: string[];
  created_at: string;
  updated_at: string;
  tenant_id: string;
  property_id: string;
  assigned_to?: string;
  completion_date?: string;
  notes?: string;
  cost?: number;
}

interface MaintenanceWithDetails extends MaintenanceRequest {
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

export default function MaintenancePage() {
  const [requests, setRequests] = useState<MaintenanceWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadMaintenanceRequests();
  }, [statusFilter, priorityFilter]);

  const loadMaintenanceRequests = async () => {
    try {
      setIsLoading(true);
      const statusParam = statusFilter !== 'all' ? statusFilter : undefined;
      const priorityParam =
        priorityFilter !== 'all' ? priorityFilter : undefined;

      const result = await AdminAPI.getAllMaintenanceRequests(
        statusParam,
        priorityParam
      );
      if (result.success) {
        setRequests(result.data);
      } else {
        toast.error('Failed to load maintenance requests');
      }
    } catch (error) {
      console.error('Failed to load maintenance requests:', error);
      toast.error('Failed to load maintenance requests');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch =
      request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tenant?.first_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.tenant?.last_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      request.property?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || request.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'open':
        return <AlertTriangle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Wrench className="w-4 h-4" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'open':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    return <Flag className={`w-4 h-4 ${getPriorityColor(priority)}`} />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">
            Loading maintenance requests...
          </p>
        </div>
      </div>
    );
  }

  const totalRequests = requests.length;
  const openRequests = requests.filter(r => r.status === 'open');
  const inProgressRequests = requests.filter(r => r.status === 'in_progress');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const urgentRequests = requests.filter(
    r => r.priority === 'urgent' && r.status !== 'completed'
  );

  const totalCost = completedRequests.reduce(
    (sum, r) => sum + (r.cost || 0),
    0
  );
  const avgResolutionTime =
    completedRequests.length > 0
      ? completedRequests.reduce((sum, r) => {
          const created = new Date(r.created_at);
          const completed = new Date(r.completion_date || r.updated_at);
          return sum + (completed.getTime() - created.getTime());
        }, 0) /
        completedRequests.length /
        (1000 * 60 * 60 * 24) // Convert to days
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Maintenance Management
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Monitor and manage maintenance requests
            </p>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 self-start sm:self-auto">
            <Wrench className="w-3 h-3 mr-1" />
            {filteredRequests.length} Requests
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Total */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {totalRequests}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open */}
          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {openRequests.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Open</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {inProgressRequests.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    In Progress
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {completedRequests.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent */}
          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <Flag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {urgentRequests.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Average Resolution Time
              </span>
              <span className="font-medium">
                {avgResolutionTime > 0
                  ? `${avgResolutionTime.toFixed(1)} days`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Completion Rate</span>
              <span className="font-medium">
                {totalRequests > 0
                  ? `${Math.round(
                      (completedRequests.length / totalRequests) * 100
                    )}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Total Maintenance Cost
              </span>
              <span className="font-medium">₱{totalCost.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                'plumbing',
                'electrical',
                'hvac',
                'appliances',
                'structural',
                'cleaning',
                'other'
              ].map(category => {
                const count = requests.filter(
                  r => r.category === category
                ).length;
                const percentage =
                  totalRequests > 0 ? (count / totalRequests) * 100 : 0;

                return (
                  <div
                    key={category}
                    className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {category}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Filters and Table */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <Label htmlFor="search">Search Requests</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Search by title, description, tenant, or property..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div>
                <Label htmlFor="priority-filter">Priority</Label>
                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="plumbing">Plumbing</SelectItem>
                    <SelectItem value="electrical">Electrical</SelectItem>
                    <SelectItem value="hvac">HVAC</SelectItem>
                    <SelectItem value="appliances">Appliances</SelectItem>
                    <SelectItem value="structural">Structural</SelectItem>
                    <SelectItem value="cleaning">Cleaning</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(request => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {request.title}
                          </div>
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {request.description}
                          </div>
                          {request.images && request.images.length > 0 && (
                            <div className="text-xs text-blue-600 mt-1">
                              {request.images.length} image(s) attached
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {request.tenant ? (
                          <div>
                            <div className="font-medium text-gray-900 flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {request.tenant.first_name}{' '}
                              {request.tenant.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.tenant.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No tenant</span>
                        )}
                      </TableCell>

                      <TableCell>
                        {request.property ? (
                          <div>
                            <div className="font-medium text-gray-900 flex items-center">
                              <Building2 className="w-3 h-3 mr-1" />
                              {request.property.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.property.address}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">No property</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {request.category}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getPriorityBadgeColor(
                            request.priority
                          )} capitalize`}>
                          {getPriorityIcon(request.priority)}
                          <span className="ml-1">{request.priority}</span>
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getStatusBadgeColor(
                            request.status
                          )} capitalize`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">
                            {request.status === 'in_progress'
                              ? 'In Progress'
                              : request.status}
                          </span>
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                        {request.completion_date && (
                          <div className="text-xs text-gray-500">
                            Completed:{' '}
                            {new Date(
                              request.completion_date
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        {request.cost ? (
                          <div className="font-medium text-gray-900">
                            ₱{request.cost.toLocaleString()}
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

            {filteredRequests.length === 0 && (
              <div className="text-center py-8">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No maintenance requests found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? 'Try adjusting your search criteria.'
                    : 'No requests match the current filters.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

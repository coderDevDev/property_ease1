'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  AlertTriangle,
  Clock,
  Home,
  Wrench,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  Edit,
  X,
  Eye,
  CheckCircle
} from 'lucide-react';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { ProgressTimeline } from '@/components/ui/progress-timeline';
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

export default function TenantMaintenanceDetailsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const maintenanceId = params.id as string;

  const [maintenanceRequest, setMaintenanceRequest] =
    useState<MaintenanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);

  // Load maintenance request
  useEffect(() => {
    const loadMaintenanceRequest = async () => {
      if (!maintenanceId) return;

      try {
        setIsLoading(true);
        const result = await MaintenanceAPI.getMaintenanceRequest(
          maintenanceId
        );

        if (result.success && result.data) {
          const request = result.data;

          // Verify this request belongs to the current tenant
          if (request.tenant?.user?.id !== authState.user?.id) {
            toast.error('You do not have permission to view this request');
            router.push('/tenant/dashboard/maintenance');
            return;
          }

          setMaintenanceRequest(request);
          generateTimelineEvents(request);
        } else {
          toast.error(result.message || 'Failed to load maintenance request');
          router.push('/tenant/dashboard/maintenance');
        }
      } catch (error) {
        console.error('Failed to load maintenance request:', error);
        toast.error('Failed to load maintenance request');
        router.push('/tenant/dashboard/maintenance');
      } finally {
        setIsLoading(false);
      }
    };

    loadMaintenanceRequest();
  }, [maintenanceId, router, authState.user?.id]);

  // Generate timeline events from maintenance request data
  const generateTimelineEvents = (request: MaintenanceRequest) => {
    const events = [];

    // Created event
    events.push({
      id: 'created',
      type: 'created',
      title: 'Maintenance Request Created',
      description: `Request "${request.title}" was created`,
      timestamp: request.created_at,
      user: {
        name: 'You',
        role: 'Tenant'
      }
    });

    // Assignment event
    if (request.assigned_to) {
      events.push({
        id: 'assigned',
        type: 'assigned',
        title: 'Request Assigned',
        description: `Assigned to ${request.assigned_to}`,
        timestamp: request.updated_at,
        data: {
          assignedTo: request.assigned_to
        }
      });
    }

    // Scheduled event
    if (request.scheduled_date) {
      events.push({
        id: 'scheduled',
        type: 'note',
        title: 'Work Scheduled',
        description: `Scheduled for ${new Date(
          request.scheduled_date
        ).toLocaleDateString()}`,
        timestamp: request.scheduled_date,
        data: {
          scheduledDate: request.scheduled_date
        }
      });
    }

    // Status change events
    if (request.status === 'in_progress') {
      events.push({
        id: 'in_progress',
        type: 'in_progress',
        title: 'Work Started',
        description: 'Maintenance work has begun',
        timestamp: request.updated_at
      });
    }

    if (request.status === 'completed') {
      events.push({
        id: 'completed',
        type: 'completed',
        title: 'Request Completed',
        description: 'Maintenance work has been completed',
        timestamp: request.completed_date || request.updated_at,
        data: {
          cost: request.actual_cost
        }
      });
    }

    if (request.status === 'cancelled') {
      events.push({
        id: 'cancelled',
        type: 'cancelled',
        title: 'Request Cancelled',
        description: 'Maintenance request has been cancelled',
        timestamp: request.updated_at
      });
    }

    // Cost update event
    if (request.actual_cost && request.actual_cost !== request.estimated_cost) {
      events.push({
        id: 'cost_update',
        type: 'cost_update',
        title: 'Cost Updated',
        description: `Final cost: ₱${request.actual_cost.toLocaleString()}`,
        timestamp: request.updated_at,
        data: {
          cost: request.actual_cost
        }
      });
    }

    setTimelineEvents(events);
  };

  const handleCancelRequest = async (request: MaintenanceRequest) => {
    if (
      window.confirm(
        'Are you sure you want to cancel this maintenance request? This action cannot be undone.'
      )
    ) {
      try {
        const result = await MaintenanceAPI.updateMaintenanceRequest(
          request.id,
          {
            status: 'cancelled'
          }
        );

        if (result.success) {
          toast.success('Maintenance request cancelled successfully');
          // Reload the request data
          const updatedResult = await MaintenanceAPI.getMaintenanceRequest(
            maintenanceId
          );
          if (updatedResult.success && updatedResult.data) {
            setMaintenanceRequest(updatedResult.data);
            generateTimelineEvents(updatedResult.data);
          }
        } else {
          toast.error(result.message || 'Failed to cancel maintenance request');
        }
      } catch (error) {
        console.error('Cancel maintenance request error:', error);
        toast.error('Failed to cancel maintenance request');
      }
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">
              Loading maintenance request...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!maintenanceRequest) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Maintenance request not found
            </h3>
            <p className="text-gray-600 mb-6">
              The maintenance request you're looking for doesn't exist.
            </p>
            <Button
              onClick={() => router.push('/tenant/dashboard/maintenance')}>
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/tenant/dashboard/maintenance')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Maintenance Request Details
              </h1>
              <p className="text-blue-600/70 mt-1 text-lg">
                {maintenanceRequest.title}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {maintenanceRequest.status === 'pending' && (
              <Button
                onClick={() =>
                  router.push(
                    `/tenant/dashboard/maintenance/${maintenanceId}/edit`
                  )
                }
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-200">
                <Edit className="w-4 h-4 mr-2" />
                Edit Request
              </Button>
            )}
            {maintenanceRequest.status === 'pending' && (
              <Button
                onClick={() => handleCancelRequest(maintenanceRequest)}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200">
                <X className="w-4 h-4 mr-2" />
                Cancel Request
              </Button>
            )}
          </div>
        </div>

        {/* Enhanced Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    maintenanceRequest.status === 'pending'
                      ? 'bg-yellow-100'
                      : maintenanceRequest.status === 'in_progress'
                      ? 'bg-blue-100'
                      : maintenanceRequest.status === 'completed'
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}>
                  {maintenanceRequest.status === 'pending' ? (
                    <Clock className="w-6 h-6 text-yellow-600" />
                  ) : maintenanceRequest.status === 'in_progress' ? (
                    <AlertTriangle className="w-6 h-6 text-blue-600" />
                  ) : maintenanceRequest.status === 'completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <X className="w-6 h-6 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {maintenanceRequest.status.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Wrench className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Category</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {maintenanceRequest.category.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Request Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Enhanced Request Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5" />
                  </div>
                  Request Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {maintenanceRequest.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {maintenanceRequest.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">
                        Category
                      </Label>
                      <p className="text-gray-900 font-medium capitalize">
                        {maintenanceRequest.category.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">
                        Estimated Cost
                      </Label>
                      <p className="text-gray-900 font-medium">
                        {maintenanceRequest.estimated_cost
                          ? `₱${maintenanceRequest.estimated_cost.toLocaleString()}`
                          : 'Not specified'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600 mb-1 block">
                        Actual Cost
                      </Label>
                      <p className="text-gray-900 font-medium">
                        {maintenanceRequest.actual_cost
                          ? `₱${maintenanceRequest.actual_cost.toLocaleString()}`
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {(maintenanceRequest.scheduled_date ||
                  maintenanceRequest.completed_date) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {maintenanceRequest.scheduled_date && (
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200/50">
                        <Label className="text-sm font-medium text-blue-700 mb-1 block">
                          Scheduled Date
                        </Label>
                        <p className="text-blue-900 font-medium">
                          {new Date(
                            maintenanceRequest.scheduled_date
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {maintenanceRequest.completed_date && (
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200/50">
                        <Label className="text-sm font-medium text-green-700 mb-1 block">
                          Completed Date
                        </Label>
                        <p className="text-green-900 font-medium">
                          {new Date(
                            maintenanceRequest.completed_date
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {(maintenanceRequest.owner_notes ||
                  maintenanceRequest.tenant_notes) && (
                  <div className="space-y-4">
                    {maintenanceRequest.owner_notes && (
                      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200/50">
                        <Label className="text-sm font-medium text-yellow-700 mb-2 block">
                          Owner Notes
                        </Label>
                        <p className="text-yellow-900">
                          {maintenanceRequest.owner_notes}
                        </p>
                      </div>
                    )}
                    {maintenanceRequest.tenant_notes && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200/50">
                        <Label className="text-sm font-medium text-blue-700 mb-2 block">
                          Your Notes
                        </Label>
                        <p className="text-blue-900">
                          {maintenanceRequest.tenant_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Images */}
            {maintenanceRequest.images &&
              maintenanceRequest.images.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-blue-700">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      Attached Images ({maintenanceRequest.images.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {maintenanceRequest.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Maintenance image ${index + 1}`}
                            className="w-full h-40 object-cover rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 hover:bg-white"
                              onClick={() => window.open(image, '_blank')}>
                              <Eye className="w-4 h-4 mr-2" />
                              View Full Size
                            </Button>
                          </div>
                          <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Right Column - Enhanced Progress and Property Info */}
          <div className="space-y-6">
            <ProgressTimeline
              events={timelineEvents}
              currentStatus={maintenanceRequest.status}
            />

            {/* Enhanced Progress Timeline */}
            {/* <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  Resolution Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressTimeline
                  events={timelineEvents}
                  currentStatus={maintenanceRequest.status}
                />
              </CardContent>
            </Card> */}

            {/* Enhanced Property Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {maintenanceRequest.property.name}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {maintenanceRequest.property.address}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">
                        {maintenanceRequest.property.city}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200">
                        {maintenanceRequest.property.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Assigned Personnel */}
            {maintenanceRequest.assigned_to && (
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-blue-700">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    Assigned Personnel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {maintenanceRequest.assigned_to}
                        </h3>
                        <p className="text-gray-600">Maintenance Personnel</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-200">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-200">
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Request Timeline */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  Request Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">
                    Created
                  </Label>
                  <p className="text-gray-900 font-medium">
                    {new Date(maintenanceRequest.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">
                    Last Updated
                  </Label>
                  <p className="text-gray-900 font-medium">
                    {new Date(maintenanceRequest.updated_at).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatPropertyType } from '@/lib/utils';
import {
  isValidScheduledDate,
  getDateValidationError,
  calculateDeadline,
  getMinDateString,
  getMaxDateString
} from '@/lib/utils/priority-validation';
import {
  ArrowLeft,
  Save,
  Edit,
  CheckCircle,
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
  X,
  Eye
} from 'lucide-react';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { ProgressTimeline } from '@/components/ui/progress-timeline';
import { StatusManager } from '@/components/ui/status-manager';
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
  assigned_personnel_phone?: string;
  scheduled_date?: string;
  completed_date?: string;
  tenant_notes?: string;
  owner_notes?: string;
  feedback_rating?: number;
  feedback_comment?: string;
  feedback_submitted_at?: string;
  feedback_required?: boolean;
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

const MAINTENANCE_CATEGORIES = [
  'plumbing',
  'electrical',
  'hvac',
  'appliance',
  'pest_control',
  'cleaning',
  'security',
  'other'
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-600' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-600' },
  { value: 'completed', label: 'Completed', color: 'text-green-600' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-600' }
];

export default function MaintenanceDetailsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const maintenanceId = params.id as string;

  const [maintenanceRequest, setMaintenanceRequest] =
    useState<MaintenanceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [assignPersonnelName, setAssignPersonnelName] = useState('');
  const [assignPersonnelPhone, setAssignPersonnelPhone] = useState('');

  // Form data for editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    status: '',
    estimated_cost: '',
    actual_cost: '',
    owner_notes: '',
    scheduled_date: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
          setMaintenanceRequest(request);
          setFormData({
            title: request.title,
            description: request.description,
            category: request.category,
            priority: request.priority,
            status: request.status,
            estimated_cost: request.estimated_cost?.toString() || '',
            actual_cost: request.actual_cost?.toString() || '',
            owner_notes: request.owner_notes || '',
            scheduled_date: request.scheduled_date
              ? new Date(request.scheduled_date).toISOString().slice(0, 16)
              : ''
          });

          // Generate timeline events
          generateTimelineEvents(request);
        } else {
          toast.error(result.message || 'Failed to load maintenance request');
          router.push('/owner/dashboard/maintenance');
        }
      } catch (error) {
        console.error('Failed to load maintenance request:', error);
        toast.error('Failed to load maintenance request');
        router.push('/owner/dashboard/maintenance');
      } finally {
        setIsLoading(false);
      }
    };

    loadMaintenanceRequest();
  }, [maintenanceId, router]);

  // Revalidate scheduled_date when priority changes
  useEffect(() => {
    if (formData.scheduled_date && formData.priority) {
      const validationError = getDateValidationError(
        formData.priority,
        formData.scheduled_date
      );

      if (validationError) {
        setErrors(prev => ({
          ...prev,
          scheduled_date: validationError
        }));
      } else {
        // Clear error if now valid
        setErrors(prev => {
          const updated = { ...prev };
          delete updated.scheduled_date;
          return updated;
        });
      }
    }
  }, [formData.priority]);

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
        name: `${request.tenant.user.first_name} ${request.tenant.user.last_name}`,
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

  // Handle status change
  const handleStatusChange = async (newStatus: string, data?: any) => {
    try {
      setIsUpdating(true);

      // If changing to in_progress with personnel data, use assignMaintenanceRequest API
      if (
        newStatus === 'in_progress' &&
        data?.personnelName &&
        data?.personnelPhone
      ) {
        const result = await MaintenanceAPI.assignMaintenanceRequest(
          maintenanceId,
          data.personnelName,
          data.scheduledDate || undefined,
          data.personnelPhone
        );

        if (result.success) {
          toast.success('Personnel assigned successfully!');
          // Reload the data
          const reloadResult = await MaintenanceAPI.getMaintenanceRequest(
            maintenanceId
          );
          if (reloadResult.success && reloadResult.data) {
            setMaintenanceRequest(reloadResult.data);
            generateTimelineEvents(reloadResult.data);
          }
        } else {
          toast.error(result.message || 'Failed to assign personnel');
        }
        return;
      }

      const updateData: any = {
        status: newStatus
      };

      // Add specific data based on status
      if (newStatus === 'in_progress') {
        // Fallback if no personnel data - just update status
        if (data?.personnelName)
          updateData.assigned_to = data.personnelName.trim();
        if (data?.personnelPhone)
          updateData.assigned_personnel_phone = data.personnelPhone.trim();
        if (data?.scheduledDate) updateData.scheduled_date = data.scheduledDate;
      }

      if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString();
        if (data?.actualCost) updateData.actual_cost = data.actualCost;
        if (data?.notes) updateData.owner_notes = data.notes;
      }

      const result = await MaintenanceAPI.updateMaintenanceRequest(
        maintenanceId,
        updateData
      );

      if (result.success) {
        toast.success('Status updated successfully!');
        // Reload the data
        const reloadResult = await MaintenanceAPI.getMaintenanceRequest(
          maintenanceId
        );
        if (reloadResult.success && reloadResult.data) {
          setMaintenanceRequest(reloadResult.data);
          generateTimelineEvents(reloadResult.data);
        }
      } else {
        toast.error(result.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Status change error:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.status) newErrors.status = 'Status is required';

    // Validate scheduled_date if it exists
    if (
      formData.scheduled_date &&
      !isValidScheduledDate(formData.priority, formData.scheduled_date)
    ) {
      newErrors.scheduled_date =
        getDateValidationError(formData.priority, formData.scheduled_date) ||
        'Invalid scheduled date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setIsUpdating(true);

      const updateData = {
        title: formData.title,
        description: formData.description,
        category: formData.category as any,
        priority: formData.priority as any,
        status: formData.status as any,
        estimated_cost: formData.estimated_cost
          ? parseFloat(formData.estimated_cost)
          : undefined,
        actual_cost: formData.actual_cost
          ? parseFloat(formData.actual_cost)
          : undefined,
        owner_notes: formData.owner_notes || undefined,
        scheduled_date: formData.scheduled_date || undefined
      };

      const result = await MaintenanceAPI.updateMaintenanceRequest(
        maintenanceId,
        updateData
      );

      if (result.success) {
        toast.success('Maintenance request updated successfully!');
        setIsEditing(false);
        // Reload the data
        const reloadResult = await MaintenanceAPI.getMaintenanceRequest(
          maintenanceId
        );
        if (reloadResult.success && reloadResult.data) {
          setMaintenanceRequest(reloadResult.data);
        }
      } else {
        toast.error(result.message || 'Failed to update maintenance request');
      }
    } catch (error) {
      console.error('Update maintenance request error:', error);
      toast.error('Failed to update maintenance request');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComplete = async () => {
    // REQUIRED: Feedback must be submitted before completion
    if (!maintenanceRequest?.feedback_rating) {
      if (!maintenanceRequest?.feedback_required) {
        // Feedback not yet requested - send request first
        try {
          setIsUpdating(true);
          const feedbackResult = await MaintenanceAPI.requestFeedback(
            maintenanceId
          );
          if (feedbackResult.success) {
            toast.info(
              'Feedback request sent to tenant. You must wait for tenant feedback before completing this request.'
            );
            const reloadResult = await MaintenanceAPI.getMaintenanceRequest(
              maintenanceId
            );
            if (reloadResult.success && reloadResult.data) {
              setMaintenanceRequest(reloadResult.data);
              generateTimelineEvents(reloadResult.data);
            }
            setIsCompleteDialogOpen(false);
            return;
          } else {
            toast.error(feedbackResult.message || 'Failed to request feedback');
            return;
          }
        } catch (error) {
          console.error('Request feedback error:', error);
          toast.error('Failed to request feedback');
          return;
        } finally {
          setIsUpdating(false);
        }
      } else {
        // Feedback already requested but not yet submitted
        toast.error(
          'Tenant feedback is REQUIRED before completion. Please wait for the tenant to submit their feedback.'
        );
        return;
      }
    }

    // Feedback is provided - proceed with completion
    try {
      setIsUpdating(true);

      const result = await MaintenanceAPI.completeMaintenanceRequest(
        maintenanceId,
        formData.actual_cost ? parseFloat(formData.actual_cost) : undefined,
        formData.owner_notes || undefined
      );

      if (result.success) {
        toast.success('Maintenance request completed successfully!');
        setIsCompleteDialogOpen(false);
        // Reload the data
        const reloadResult = await MaintenanceAPI.getMaintenanceRequest(
          maintenanceId
        );
        if (reloadResult.success && reloadResult.data) {
          setMaintenanceRequest(reloadResult.data);
          generateTimelineEvents(reloadResult.data);
        }
      } else {
        toast.error(result.message || 'Failed to complete maintenance request');
      }
    } catch (error) {
      console.error('Complete maintenance request error:', error);
      toast.error('Failed to complete maintenance request');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDeleteRequest = async (request: MaintenanceRequest) => {
    if (
      window.confirm(
        'Are you sure you want to delete this maintenance request? This action cannot be undone.'
      )
    ) {
      try {
        setIsUpdating(true);
        const result = await MaintenanceAPI.deleteMaintenanceRequest(
          request.id
        );
        if (result.success) {
          toast.success('Maintenance request deleted successfully');
          router.push('/owner/dashboard/maintenance');
        } else {
          toast.error(result.message || 'Failed to delete maintenance request');
        }
      } catch (error) {
        console.error('Delete maintenance request error:', error);
        toast.error('Failed to delete maintenance request');
      } finally {
        setIsUpdating(false);
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
            <Button onClick={() => router.push('/owner/dashboard/maintenance')}>
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
              onClick={() => router.push('/owner/dashboard/maintenance')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-0" />
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
            {!isEditing ? (
              <>
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-200">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Request
                </Button>
                {maintenanceRequest.status === 'pending' && (
                  <Button
                    onClick={() => setIsAssignDialogOpen(true)}
                    variant="outline"
                    className="border-green-200 text-green-600 hover:bg-green-50 transition-all duration-200">
                    <User className="w-4 h-4 mr-2" />
                    Assign Personnel
                  </Button>
                )}
                {maintenanceRequest.status === 'in_progress' && (
                  <>
                    {maintenanceRequest.feedback_required &&
                      !maintenanceRequest.feedback_rating && (
                        <Button
                          onClick={async () => {
                            const result = await MaintenanceAPI.requestFeedback(
                              maintenanceId
                            );
                            if (result.success) {
                              toast.success(
                                'Feedback request sent to tenant. Waiting for feedback before completion.'
                              );
                              const reloadResult =
                                await MaintenanceAPI.getMaintenanceRequest(
                                  maintenanceId
                                );
                              if (reloadResult.success && reloadResult.data) {
                                setMaintenanceRequest(reloadResult.data);
                                generateTimelineEvents(reloadResult.data);
                              }
                            } else {
                              toast.error(
                                result.message || 'Failed to request feedback'
                              );
                            }
                          }}
                          variant="outline"
                          className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 transition-all duration-200">
                          Request Feedback
                        </Button>
                      )}
                    <Button
                      onClick={() => setIsCompleteDialogOpen(true)}
                      disabled={!maintenanceRequest.feedback_rating}
                      title={
                        !maintenanceRequest.feedback_rating
                          ? 'Tenant feedback is required before completion'
                          : ''
                      }
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete Request
                    </Button>
                  </>
                )}
                {(maintenanceRequest.status === 'pending' ||
                  maintenanceRequest.status === 'cancelled') && (
                  <Button
                    onClick={() => handleDeleteRequest(maintenanceRequest)}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200">
                    <X className="w-4 h-4 mr-2" />
                    Delete Request
                  </Button>
                )}
              </>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  {isUpdating ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
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
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    maintenanceRequest.priority === 'urgent'
                      ? 'bg-red-100'
                      : maintenanceRequest.priority === 'high'
                      ? 'bg-orange-100'
                      : maintenanceRequest.priority === 'medium'
                      ? 'bg-yellow-100'
                      : 'bg-green-100'
                  }`}>
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      maintenanceRequest.priority === 'urgent'
                        ? 'text-red-600'
                        : maintenanceRequest.priority === 'high'
                        ? 'text-orange-600'
                        : maintenanceRequest.priority === 'medium'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {maintenanceRequest.priority}
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
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="title"
                        className="text-gray-700 font-medium">
                        Title *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={e =>
                          handleInputChange('title', e.target.value)
                        }
                        className={cn(
                          'bg-white/50 border-blue-200/50 focus:border-blue-400',
                          errors.title && 'border-red-300 focus:border-red-400'
                        )}
                      />
                      {errors.title && (
                        <p className="text-red-600 text-sm">{errors.title}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="description"
                        className="text-gray-700 font-medium">
                        Description *
                      </Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={e =>
                          handleInputChange('description', e.target.value)
                        }
                        rows={4}
                        className={cn(
                          'bg-white/50 border-blue-200/50 focus:border-blue-400',
                          errors.description &&
                            'border-red-300 focus:border-red-400'
                        )}
                      />
                      {errors.description && (
                        <p className="text-red-600 text-sm">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="category"
                          className="text-gray-700 font-medium">
                          Category *
                        </Label>
                        <Select
                          value={formData.category}
                          onValueChange={value =>
                            handleInputChange('category', value)
                          }>
                          <SelectTrigger
                            className={cn(
                              'bg-white/50 border-blue-200/50 focus:border-blue-400',
                              errors.category &&
                                'border-red-300 focus:border-red-400'
                            )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MAINTENANCE_CATEGORIES.map(category => (
                              <SelectItem key={category} value={category}>
                                {category
                                  .replace('_', ' ')
                                  .replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.category && (
                          <p className="text-red-600 text-sm">
                            {errors.category}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="priority"
                          className="text-gray-700 font-medium">
                          Priority *
                        </Label>
                        <Select
                          value={formData.priority}
                          onValueChange={value =>
                            handleInputChange('priority', value)
                          }>
                          <SelectTrigger
                            className={cn(
                              'bg-white/50 border-blue-200/50 focus:border-blue-400',
                              errors.priority &&
                                'border-red-300 focus:border-red-400'
                            )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRIORITY_LEVELS.map(priority => (
                              <SelectItem
                                key={priority.value}
                                value={priority.value}>
                                <span className={priority.color}>
                                  {priority.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.priority && (
                          <p className="text-red-600 text-sm">
                            {errors.priority}
                          </p>
                        )}
                      </div>

                      {/* Scheduled Date Field */}
                      <div className="space-y-2">
                        <Label
                          htmlFor="scheduled_date"
                          className="text-gray-700 font-medium">
                          Scheduled Date
                          <span className="text-xs text-gray-500 ml-2">
                            (Deadline:{' '}
                            {calculateDeadline(
                              formData.priority
                            ).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })}
                            )
                          </span>
                        </Label>
                        <Input
                          id="scheduled_date"
                          type="date"
                          value={formData.scheduled_date || ''}
                          onChange={e =>
                            handleInputChange('scheduled_date', e.target.value)
                          }
                          min={getMinDateString()}
                          max={getMaxDateString(formData.priority)}
                          className={cn(
                            'bg-white/50 border-blue-200/50 focus:border-blue-400',
                            errors.scheduled_date &&
                              'border-red-300 focus:border-red-400'
                          )}
                        />
                        {errors.scheduled_date && (
                          <p className="text-red-600 text-sm">
                            {errors.scheduled_date}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="status"
                        className="text-gray-700 font-medium">
                        Status *
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={value =>
                          handleInputChange('status', value)
                        }>
                        <SelectTrigger
                          className={cn(
                            'bg-white/50 border-blue-200/50 focus:border-blue-400',
                            errors.status &&
                              'border-red-300 focus:border-red-400'
                          )}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map(status => (
                            <SelectItem key={status.value} value={status.value}>
                              <span className={status.color}>
                                {status.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.status && (
                        <p className="text-red-600 text-sm">{errors.status}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="estimated_cost"
                          className="text-gray-700 font-medium">
                          Estimated Cost
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="estimated_cost"
                            type="number"
                            value={formData.estimated_cost}
                            onChange={e =>
                              handleInputChange(
                                'estimated_cost',
                                e.target.value
                              )
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="actual_cost"
                          className="text-gray-700 font-medium">
                          Actual Cost
                        </Label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id="actual_cost"
                            type="number"
                            value={formData.actual_cost}
                            onChange={e =>
                              handleInputChange('actual_cost', e.target.value)
                            }
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="scheduled_date"
                        className="text-gray-700 font-medium">
                        Scheduled Date
                      </Label>
                      <Input
                        id="scheduled_date"
                        type="datetime-local"
                        value={formData.scheduled_date}
                        onChange={e =>
                          handleInputChange('scheduled_date', e.target.value)
                        }
                        className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="owner_notes"
                        className="text-gray-700 font-medium">
                        Owner Notes
                      </Label>
                      <Textarea
                        id="owner_notes"
                        value={formData.owner_notes}
                        onChange={e =>
                          handleInputChange('owner_notes', e.target.value)
                        }
                        placeholder="Add any notes or comments..."
                        rows={3}
                        className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                      />
                    </div>

                    <div className="flex gap-4 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="border-blue-200 text-blue-600 hover:bg-blue-50">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleUpdate}
                        disabled={isUpdating}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                        {isUpdating ? (
                          <>
                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Update Request
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {maintenanceRequest.title}
                      </h3>
                      <p className="text-gray-600">
                        {maintenanceRequest.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Category
                        </Label>
                        <p className="text-gray-900 capitalize">
                          {maintenanceRequest.category.replace('_', ' ')}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Priority
                        </Label>
                        <p className="text-gray-900 capitalize">
                          {maintenanceRequest.priority}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Estimated Cost
                        </Label>
                        <p className="text-gray-900">
                          {maintenanceRequest.estimated_cost
                            ? `₱${maintenanceRequest.estimated_cost.toLocaleString()}`
                            : 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Actual Cost
                        </Label>
                        <p className="text-gray-900">
                          {maintenanceRequest.actual_cost
                            ? `₱${maintenanceRequest.actual_cost.toLocaleString()}`
                            : 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {maintenanceRequest.scheduled_date && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Scheduled Date
                        </Label>
                        <p className="text-gray-900">
                          {new Date(
                            maintenanceRequest.scheduled_date
                          ).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}

                    {maintenanceRequest.completed_date && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Completed Date
                        </Label>
                        <p className="text-gray-900">
                          {new Date(
                            maintenanceRequest.completed_date
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {maintenanceRequest.owner_notes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Owner Notes
                        </Label>
                        <p className="text-gray-900">
                          {maintenanceRequest.owner_notes}
                        </p>
                      </div>
                    )}

                    {maintenanceRequest.tenant_notes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Tenant Notes
                        </Label>
                        <p className="text-gray-900">
                          {maintenanceRequest.tenant_notes}
                        </p>
                      </div>
                    )}

                    {maintenanceRequest.feedback_rating && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200/50">
                        <Label className="text-sm font-medium text-green-700 mb-2 block">
                          Tenant Feedback
                        </Label>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-700">Rating:</span>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span
                                key={star}
                                className={
                                  star <=
                                  (maintenanceRequest.feedback_rating || 0)
                                    ? 'text-yellow-400 text-lg'
                                    : 'text-gray-300 text-lg'
                                }>
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-600">
                            ({maintenanceRequest.feedback_rating}/5)
                          </span>
                        </div>
                        {maintenanceRequest.feedback_comment && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-700">
                              "{maintenanceRequest.feedback_comment}"
                            </p>
                          </div>
                        )}
                        {maintenanceRequest.feedback_submitted_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted on{' '}
                            {new Date(
                              maintenanceRequest.feedback_submitted_at
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    )}
                  </>
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

          {/* Right Column - Enhanced Status Management and Info */}
          <div className="space-y-6">
            {/* Enhanced Status Management */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  Status Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusManager
                  currentStatus={maintenanceRequest.status}
                  onStatusChange={handleStatusChange}
                  isLoading={isUpdating}
                  feedbackRating={maintenanceRequest.feedback_rating}
                />
              </CardContent>
            </Card>

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

            <ProgressTimeline
              events={timelineEvents}
              currentStatus={maintenanceRequest.status}
            />

            {/* Enhanced Tenant Information */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  Tenant Information
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
                        {maintenanceRequest.tenant.user.first_name}{' '}
                        {maintenanceRequest.tenant.user.last_name}
                      </h3>
                      <p className="text-gray-600">
                        Unit {maintenanceRequest.tenant.unit_number}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {maintenanceRequest.tenant.user.email}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-700">
                        {maintenanceRequest.tenant.user.phone}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-200">
                      <Mail className="w-4 h-4 mr-2" />
                      Email
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
                        {formatPropertyType(maintenanceRequest.property.type)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full mt-4 border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-200"
                    onClick={() =>
                      router.push(
                        `/owner/dashboard/properties/${maintenanceRequest.property.id}`
                      )
                    }>
                    <MapPin className="w-4 h-4 mr-2" />
                    View Property Details
                  </Button>
                </div>
              </CardContent>
            </Card>

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
                {maintenanceRequest.assigned_to && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200/50">
                    <Label className="text-sm font-medium text-green-700 mb-1 block">
                      Assigned To
                    </Label>
                    <p className="text-green-900 font-medium">
                      {maintenanceRequest.assigned_to}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Assign Dialog */}
        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Personnel</DialogTitle>
              <DialogDescription>
                Assign a maintenance personnel to handle this request.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="assign_personnel"
                  className="text-gray-700 font-medium">
                  Personnel Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="assign_personnel"
                  value={assignPersonnelName}
                  onChange={e => setAssignPersonnelName(e.target.value)}
                  placeholder="Enter personnel name..."
                  className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="assign_personnel_phone"
                  className="text-gray-700 font-medium">
                  Contact Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="assign_personnel_phone"
                  value={assignPersonnelPhone}
                  onChange={e => setAssignPersonnelPhone(e.target.value)}
                  placeholder="Enter contact number..."
                  className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="assign_schedule"
                  className="text-gray-700 font-medium">
                  Schedule Date
                </Label>
                <Input
                  id="assign_schedule"
                  type="datetime-local"
                  className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="assign_notes"
                  className="text-gray-700 font-medium">
                  Assignment Notes
                </Label>
                <Textarea
                  id="assign_notes"
                  placeholder="Add any specific instructions..."
                  rows={3}
                  className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAssignDialogOpen(false)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!assignPersonnelName.trim()) {
                    toast.error('Please enter personnel name');
                    return;
                  }
                  if (!assignPersonnelPhone.trim()) {
                    toast.error('Please enter contact number');
                    return;
                  }

                  try {
                    const result =
                      await MaintenanceAPI.assignMaintenanceRequest(
                        maintenanceId,
                        assignPersonnelName.trim(),
                        undefined,
                        assignPersonnelPhone.trim()
                      );

                    if (result.success) {
                      toast.success('Personnel assigned successfully!');
                      setIsAssignDialogOpen(false);
                      setAssignPersonnelName('');
                      setAssignPersonnelPhone('');
                      // Reload the data
                      const reloadResult =
                        await MaintenanceAPI.getMaintenanceRequest(
                          maintenanceId
                        );
                      if (reloadResult.success && reloadResult.data) {
                        setMaintenanceRequest(reloadResult.data);
                        generateTimelineEvents(reloadResult.data);
                      }
                    } else {
                      toast.error(
                        result.message || 'Failed to assign personnel'
                      );
                    }
                  } catch (error) {
                    console.error('Assign personnel error:', error);
                    toast.error('Failed to assign personnel');
                  }
                }}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white">
                <User className="w-4 h-4 mr-2" />
                Assign Personnel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Complete Dialog */}
        <Dialog
          open={isCompleteDialogOpen}
          onOpenChange={setIsCompleteDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Complete Maintenance Request</DialogTitle>
              <DialogDescription>
                Mark this maintenance request as completed. Tenant feedback is
                required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!maintenanceRequest?.feedback_rating && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ <strong>Feedback Required:</strong> Tenant feedback has
                    not been submitted yet.
                  </p>
                  <p className="text-sm text-red-700 mt-2">
                    You cannot complete this request without tenant feedback.
                    Please request feedback from the tenant first.
                  </p>
                </div>
              )}
              {maintenanceRequest?.feedback_rating && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 mb-2">
                    <strong>✓ Tenant Feedback Received:</strong>
                  </p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span
                          key={star}
                          className={
                            star <= (maintenanceRequest.feedback_rating || 0)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }>
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm">
                      ({maintenanceRequest.feedback_rating}/5)
                    </span>
                  </div>
                  {maintenanceRequest.feedback_comment && (
                    <p className="text-sm text-gray-700">
                      "{maintenanceRequest.feedback_comment}"
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label
                  htmlFor="complete_actual_cost"
                  className="text-gray-700 font-medium">
                  Actual Cost
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="complete_actual_cost"
                    type="number"
                    value={formData.actual_cost}
                    onChange={e =>
                      handleInputChange('actual_cost', e.target.value)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="complete_owner_notes"
                  className="text-gray-700 font-medium">
                  Completion Notes
                </Label>
                <Textarea
                  id="complete_owner_notes"
                  value={formData.owner_notes}
                  onChange={e =>
                    handleInputChange('owner_notes', e.target.value)
                  }
                  placeholder="Add completion notes..."
                  rows={3}
                  className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCompleteDialogOpen(false)}
                className="border-blue-200 text-blue-600 hover:bg-blue-50">
                Cancel
              </Button>
              <Button
                onClick={handleComplete}
                disabled={isUpdating || !maintenanceRequest?.feedback_rating}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white disabled:opacity-50 disabled:cursor-not-allowed">
                {isUpdating ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Request
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

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
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
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
  X
} from 'lucide-react';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { PropertiesAPI } from '@/lib/api/properties';
import { ImageUpload } from '@/components/ui/image-upload';
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
  assigned_to?: string;
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

const MAINTENANCE_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

interface MaintenanceFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  estimated_cost: string;
  tenant_notes: string;
  images: string[];
}

export default function EditMaintenancePage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const maintenanceId = params.id as string;

  const [maintenanceRequest, setMaintenanceRequest] =
    useState<MaintenanceRequest | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<MaintenanceFormData>({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    estimated_cost: '',
    tenant_notes: '',
    images: []
  });

  // Load maintenance request and properties
  useEffect(() => {
    const loadData = async () => {
      if (!authState.user?.id || !maintenanceId) return;

      try {
        setIsLoading(true);
        const [maintenanceResult, propertiesResult] = await Promise.all([
          MaintenanceAPI.getMaintenanceRequest(maintenanceId),
          PropertiesAPI.getTenantProperties(authState.user.id)
        ]);

        if (maintenanceResult.success && maintenanceResult.data) {
          const request = maintenanceResult.data;

          // Verify this request belongs to the current tenant
          if (request.tenant?.user?.id !== authState.user?.id) {
            toast.error('You do not have permission to edit this request');
            router.push('/tenant/dashboard/maintenance');
            return;
          }

          setMaintenanceRequest(request);
          setFormData({
            title: request.title,
            description: request.description,
            category: request.category,
            priority: request.priority,
            estimated_cost: request.estimated_cost?.toString() || '',
            tenant_notes: request.tenant_notes || '',
            images: request.images || []
          });
        } else {
          toast.error('Failed to load maintenance request');
          router.push('/tenant/dashboard/maintenance');
        }

        if (propertiesResult.success) {
          setProperties(propertiesResult.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load maintenance request');
        router.push('/tenant/dashboard/maintenance');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authState.user?.id, maintenanceId, router]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.priority) {
      newErrors.priority = 'Priority is required';
    }

    if (formData.estimated_cost && isNaN(parseFloat(formData.estimated_cost))) {
      newErrors.estimated_cost = 'Estimated cost must be a valid number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    try {
      setIsUpdating(true);

      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        estimated_cost: formData.estimated_cost
          ? parseFloat(formData.estimated_cost)
          : null,
        tenant_notes: formData.tenant_notes.trim(),
        images: formData.images
      };

      const result = await MaintenanceAPI.updateMaintenanceRequest(
        maintenanceId,
        updateData
      );

      if (result.success) {
        toast.success('Maintenance request updated successfully!');
        router.push(`/tenant/dashboard/maintenance/${maintenanceId}`);
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() =>
              router.push(`/tenant/dashboard/maintenance/${maintenanceId}`)
            }
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Request
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Edit Maintenance Request
            </h1>
            <p className="text-blue-600/70 mt-1">{maintenanceRequest.title}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() =>
                router.push(`/tenant/dashboard/maintenance/${maintenanceId}`)
              }
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
        </div>

        {/* Status Badge */}
        <div className="flex gap-4">
          <Badge
            className={
              maintenanceRequest.status === 'pending'
                ? 'bg-yellow-100 text-yellow-700'
                : maintenanceRequest.status === 'in_progress'
                ? 'bg-blue-100 text-blue-700'
                : maintenanceRequest.status === 'completed'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }>
            {maintenanceRequest.status.replace('_', ' ')}
          </Badge>
          <Badge
            className={
              maintenanceRequest.priority === 'urgent'
                ? 'bg-red-100 text-red-700'
                : maintenanceRequest.priority === 'high'
                ? 'bg-orange-100 text-orange-700'
                : maintenanceRequest.priority === 'medium'
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-green-100 text-green-700'
            }>
            {maintenanceRequest.priority}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Information */}
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Wrench className="w-5 h-5" />
                  Request Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-700 font-medium">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
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
                    <p className="text-red-600 text-sm">{errors.description}</p>
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
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {MAINTENANCE_CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.category && (
                      <p className="text-red-600 text-sm">{errors.category}</p>
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
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {MAINTENANCE_PRIORITIES.map(priority => (
                          <SelectItem key={priority} value={priority}>
                            {priority}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.priority && (
                      <p className="text-red-600 text-sm">{errors.priority}</p>
                    )}
                  </div>
                </div>

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
                        handleInputChange('estimated_cost', e.target.value)
                      }
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      className={cn(
                        'pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400',
                        errors.estimated_cost &&
                          'border-red-300 focus:border-red-400'
                      )}
                    />
                  </div>
                  {errors.estimated_cost && (
                    <p className="text-red-600 text-sm">
                      {errors.estimated_cost}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="tenant_notes"
                    className="text-gray-700 font-medium">
                    Additional Notes
                  </Label>
                  <Textarea
                    id="tenant_notes"
                    value={formData.tenant_notes}
                    onChange={e =>
                      handleInputChange('tenant_notes', e.target.value)
                    }
                    rows={3}
                    placeholder="Add any additional information..."
                    className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Image Attachments */}
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <ImageIcon className="w-5 h-5" />
                  Image Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  images={formData.images}
                  onImagesChange={images => handleInputChange('images', images)}
                  maxImages={5}
                  disabled={isUpdating}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Property Info */}
          <div className="space-y-6">
            {/* Property Information */}
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Home className="w-5 h-5" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Property Name
                  </Label>
                  <p className="text-gray-900 font-semibold">
                    {maintenanceRequest.property.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Address
                  </Label>
                  <p className="text-gray-900">
                    {maintenanceRequest.property.address}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    City
                  </Label>
                  <p className="text-gray-900">
                    {maintenanceRequest.property.city}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Type
                  </Label>
                  <p className="text-gray-900 capitalize">
                    {maintenanceRequest.property.type}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Request Timeline */}
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Clock className="w-5 h-5" />
                  Request Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Created
                  </Label>
                  <p className="text-gray-900">
                    {new Date(maintenanceRequest.created_at).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Last Updated
                  </Label>
                  <p className="text-gray-900">
                    {new Date(maintenanceRequest.updated_at).toLocaleString()}
                  </p>
                </div>
                {maintenanceRequest.assigned_to && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      Assigned To
                    </Label>
                    <p className="text-gray-900">
                      {maintenanceRequest.assigned_to}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

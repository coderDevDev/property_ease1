'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Upload,
  Wrench,
  AlertTriangle,
  Home,
  User,
  DollarSign
} from 'lucide-react';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { PropertiesAPI } from '@/lib/api/properties';
import { ImageUpload } from '@/components/ui/image-upload';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
}

interface MaintenanceFormData {
  property_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  tenant_notes?: string;
  images: string[];
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

export default function TenantNewMaintenancePage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenantId, setTenantId] = useState<string>('');
  const [formData, setFormData] = useState<MaintenanceFormData>({
    property_id: '',
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    tenant_notes: '',
    images: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load tenant's properties and tenant ID
  useEffect(() => {
    const loadProperties = async () => {
      if (!authState.user?.id) return;

      try {
        // Get tenant record and properties where the current user is a tenant
        const { data: tenantData, error } = await supabase
          .from('tenants')
          .select(
            `
            id,
            property:properties(*)
          `
          )
          .eq('user_id', authState.user.id)
          .eq('status', 'active')
          .single();

        if (error) {
          throw new Error(error.message);
        }

        if (tenantData) {
          setTenantId(tenantData.id);
          setProperties(
            tenantData.property
              ? [tenantData.property as unknown as Property]
              : []
          );
        }
      } catch (error) {
        console.error('Failed to load tenant data:', error);
        toast.error('Failed to load tenant information');
      }
    };

    loadProperties();
  }, [authState.user?.id]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.property_id) newErrors.property_id = 'Property is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!tenantId) {
      toast.error('Unable to identify tenant information. Please try again.');
      return;
    }

    try {
      setIsLoading(true);

      const requestData = {
        ...formData,
        tenant_id: tenantId,
        category: formData.category as
          | 'plumbing'
          | 'electrical'
          | 'hvac'
          | 'appliance'
          | 'pest_control'
          | 'cleaning'
          | 'security'
          | 'other',
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        tenant_notes: formData.tenant_notes || undefined
      };

      const result = await MaintenanceAPI.createMaintenanceRequest(requestData);

      if (result.success) {
        toast.success('Maintenance request created successfully!');
        router.push('/tenant/dashboard/maintenance');
      } else {
        toast.error(result.message || 'Failed to create maintenance request');
      }
    } catch (error) {
      console.error('Create maintenance request error:', error);
      toast.error('Failed to create maintenance request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof MaintenanceFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedProperty = properties.find(p => p.id === formData.property_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Create Maintenance Request
            </h1>
            <p className="text-blue-600/70 mt-1">
              Submit a maintenance request for your property
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Wrench className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-700 font-medium">
                    Request Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Leaky faucet in kitchen"
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
                        errors.category && 'border-red-300 focus:border-red-400'
                      )}>
                      <SelectValue placeholder="Select category" />
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
                    <p className="text-red-600 text-sm">{errors.category}</p>
                  )}
                </div>
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
                  placeholder="Provide detailed description of the maintenance issue..."
                  rows={4}
                  className={cn(
                    'bg-white/50 border-blue-200/50 focus:border-blue-400',
                    errors.description && 'border-red-300 focus:border-red-400'
                  )}
                />
                {errors.description && (
                  <p className="text-red-600 text-sm">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        errors.priority && 'border-red-300 focus:border-red-400'
                      )}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITY_LEVELS.map(priority => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <span className={priority.color}>
                            {priority.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-red-600 text-sm">{errors.priority}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="property_id"
                    className="text-gray-700 font-medium">
                    Property *
                  </Label>
                  <Select
                    value={formData.property_id}
                    onValueChange={value =>
                      handleInputChange('property_id', value)
                    }>
                    <SelectTrigger
                      className={cn(
                        'bg-white/50 border-blue-200/50 focus:border-blue-400',
                        errors.property_id &&
                          'border-red-300 focus:border-red-400'
                      )}>
                      <SelectValue placeholder="Select property" />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>
                          <div>
                            <p className="font-medium">{property.name}</p>
                            <p className="text-sm text-gray-600">
                              {property.city}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.property_id && (
                    <p className="text-red-600 text-sm">{errors.property_id}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Image Attachments */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Upload className="w-5 h-5" />
                Image Attachments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ImageUpload
                images={formData.images}
                onImagesChange={images => handleInputChange('images', images)}
                maxImages={5}
                disabled={isLoading}
              />
              <p className="text-sm text-gray-500 mt-2">
                Upload photos of the issue to help with diagnosis and repair
              </p>
            </CardContent>
          </Card>

          {/* Selected Property Info */}
          {selectedProperty && (
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Home className="w-5 h-5" />
                  Selected Property
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <div className="text-sm text-gray-700">
                    <p className="font-medium">{selectedProperty.name}</p>
                    <p>{selectedProperty.address}</p>
                    <p>{selectedProperty.city}</p>
                    <p className="capitalize">{selectedProperty.type}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Notes */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <AlertTriangle className="w-5 h-5" />
                Additional Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="tenant_notes"
                  className="text-gray-700 font-medium">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="tenant_notes"
                  value={formData.tenant_notes}
                  onChange={e =>
                    handleInputChange('tenant_notes', e.target.value)
                  }
                  placeholder="Any additional information, special instructions, or context that might help with the repair..."
                  rows={3}
                  className="bg-white/50 border-blue-200/50 focus:border-blue-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-blue-200 text-blue-600 hover:bg-blue-50">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
              {isLoading ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

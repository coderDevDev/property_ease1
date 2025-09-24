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
  X,
  Wrench,
  AlertTriangle,
  Home,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { PropertiesAPI } from '@/lib/api/properties';
import { TenantsAPI } from '@/lib/api/tenants';
import { ImageUpload } from '@/components/ui/image-upload';
import { toast } from 'sonner';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
}

interface Tenant {
  id: string;
  user_id: string;
  property_id: string;
  unit_number: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
}

interface MaintenanceFormData {
  tenant_id: string;
  property_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  estimated_cost?: number;
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

export default function NewMaintenancePage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    tenant_id: '',
    property_id: '',
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    estimated_cost: undefined,
    tenant_notes: '',
    images: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load properties and tenants
  useEffect(() => {
    const loadData = async () => {
      if (!authState.user?.id) return;

      try {
        const [propertiesResult, tenantsResult] = await Promise.all([
          PropertiesAPI.getProperties(authState.user.id),
          TenantsAPI.getTenants(authState.user.id)
        ]);

        if (propertiesResult.success) {
          setProperties(propertiesResult.data);
        }
        if (tenantsResult.success) {
          setTenants(tenantsResult.data);
          setFilteredTenants(tenantsResult.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load properties and tenants');
      }
    };

    loadData();
  }, [authState.user?.id]);

  // Filter tenants when property changes
  useEffect(() => {
    if (formData.property_id) {
      const filtered = tenants.filter(
        tenant => tenant.property_id === formData.property_id
      );
      setFilteredTenants(filtered);
      // Reset tenant selection if current tenant is not in filtered list
      if (
        formData.tenant_id &&
        !filtered.find(t => t.id === formData.tenant_id)
      ) {
        setFormData(prev => ({ ...prev, tenant_id: '' }));
      }
    } else {
      setFilteredTenants(tenants);
    }
  }, [formData.property_id, tenants]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.property_id) newErrors.property_id = 'Property is required';
    if (!formData.tenant_id) newErrors.tenant_id = 'Tenant is required';
    if (formData.estimated_cost && formData.estimated_cost < 0) {
      newErrors.estimated_cost = 'Estimated cost must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);

      const requestData = {
        ...formData,
        estimated_cost: formData.estimated_cost || null,
        tenant_notes: formData.tenant_notes || null
      };

      const result = await MaintenanceAPI.createMaintenanceRequest(requestData);

      if (result.success) {
        toast.success('Maintenance request created successfully!');
        router.push('/owner/dashboard/maintenance');
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
  const selectedTenant = filteredTenants.find(t => t.id === formData.tenant_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
            <ArrowLeft className="w-4 h-4 mr-0" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Create Maintenance Request
            </h1>
            <p className="text-blue-600/70 mt-1">
              Submit a new maintenance request for a tenant
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
                    htmlFor="estimated_cost"
                    className="text-gray-700 font-medium">
                    Estimated Cost (Optional)
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="estimated_cost"
                      type="number"
                      value={formData.estimated_cost || ''}
                      onChange={e =>
                        handleInputChange(
                          'estimated_cost',
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
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
              </div>
            </CardContent>
          </Card>

          {/* Property and Tenant Selection */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Home className="w-5 h-5" />
                Property & Tenant Selection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label
                    htmlFor="tenant_id"
                    className="text-gray-700 font-medium">
                    Tenant *
                  </Label>
                  <Select
                    value={formData.tenant_id}
                    onValueChange={value =>
                      handleInputChange('tenant_id', value)
                    }
                    disabled={!formData.property_id}>
                    <SelectTrigger
                      className={cn(
                        'bg-white/50 border-blue-200/50 focus:border-blue-400',
                        errors.tenant_id &&
                          'border-red-300 focus:border-red-400',
                        !formData.property_id && 'opacity-50 cursor-not-allowed'
                      )}>
                      <SelectValue
                        placeholder={
                          formData.property_id
                            ? 'Select tenant'
                            : 'Select property first'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredTenants.map(tenant => (
                        <SelectItem key={tenant.id} value={tenant.id}>
                          <div>
                            <p className="font-medium">
                              {tenant.user.first_name} {tenant.user.last_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Unit {tenant.unit_number}
                            </p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.tenant_id && (
                    <p className="text-red-600 text-sm">{errors.tenant_id}</p>
                  )}
                </div>
              </div>

              {/* Selected Property and Tenant Info */}
              {(selectedProperty || selectedTenant) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  {selectedProperty && (
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Selected Property
                      </h4>
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">{selectedProperty.name}</p>
                        <p>{selectedProperty.address}</p>
                        <p>{selectedProperty.city}</p>
                        <p className="capitalize">{selectedProperty.type}</p>
                      </div>
                    </div>
                  )}

                  {selectedTenant && (
                    <div>
                      <h4 className="font-semibold text-blue-700 mb-2 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Selected Tenant
                      </h4>
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">
                          {selectedTenant.user.first_name}{' '}
                          {selectedTenant.user.last_name}
                        </p>
                        <p>Unit {selectedTenant.unit_number}</p>
                        <p>{selectedTenant.user.email}</p>
                        <p>{selectedTenant.user.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
            </CardContent>
          </Card>

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
                  Tenant Notes (Optional)
                </Label>
                <Textarea
                  id="tenant_notes"
                  value={formData.tenant_notes}
                  onChange={e =>
                    handleInputChange('tenant_notes', e.target.value)
                  }
                  placeholder="Any additional notes or special instructions..."
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
                  Create Request
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

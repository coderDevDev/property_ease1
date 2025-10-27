'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  Edit,
  Home,
  Calendar,
  FileText,
  Shield,
  Save,
  User,
  PhilippinePeso
} from 'lucide-react';
import { TenantsAPI, type TenantFormData } from '@/lib/api/tenants';
import { PropertiesAPI } from '@/lib/api/properties';
import { toast } from 'sonner';

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  type: string;
  total_units: number;
  occupied_units: number;
}

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

export default function EditTenantPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [isLoading, setIsLoading] = useState(false);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<Partial<TenantFormData>>({
    unit_number: '',
    lease_start: '',
    lease_end: '',
    monthly_rent: 0,
    security_deposit: 0,
    status: 'active',
    lease_terms: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!tenantId || !authState.user?.id) return;

      try {
        setLoadingData(true);
        const [tenantResult, propertiesResult] = await Promise.all([
          TenantsAPI.getTenant(tenantId),
          PropertiesAPI.getProperties(authState.user.id)
        ]);

        if (tenantResult.success) {
          const tenantData = tenantResult.data;
          setTenant(tenantData);
          setFormData({
            property_id: tenantData.property_id,
            unit_number: tenantData.unit_number,
            lease_start: tenantData.lease_start.split('T')[0], // Extract date part
            lease_end: tenantData.lease_end.split('T')[0],
            monthly_rent: tenantData.monthly_rent,
            security_deposit: tenantData.security_deposit,
            status: tenantData.status as 'active' | 'pending' | 'terminated',
            lease_terms: tenantData.lease_terms || '',
            emergency_contact_name: tenantData.emergency_contact_name || '',
            emergency_contact_phone: tenantData.emergency_contact_phone || '',
            notes: tenantData.notes || ''
          });
        } else {
          toast.error('Failed to load tenant details');
          router.push('/owner/dashboard/tenants');
          return;
        }

        if (propertiesResult.success) {
          setProperties(propertiesResult.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load tenant data');
        router.push('/owner/dashboard/tenants');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, [tenantId, authState.user?.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.unit_number?.trim()) {
      toast.error('Please enter a unit number');
      return;
    }

    if (!formData.lease_start || !formData.lease_end) {
      toast.error('Please enter lease start and end dates');
      return;
    }

    if (new Date(formData.lease_start) >= new Date(formData.lease_end)) {
      toast.error('Lease end date must be after start date');
      return;
    }

    if (!formData.monthly_rent || formData.monthly_rent <= 0) {
      toast.error('Please enter a valid monthly rent amount');
      return;
    }

    try {
      setIsLoading(true);
      const result = await TenantsAPI.updateTenant(tenantId, formData as any);

      if (result.success) {
        toast.success('Tenant updated successfully');
        router.push(`/owner/dashboard/tenants/${tenantId}`);
      } else {
        toast.error(result.message || 'Failed to update tenant');
      }
    } catch (error) {
      console.error('Update tenant error:', error);
      toast.error('Failed to update tenant');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof TenantFormData,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getSelectedProperty = () => {
    return (
      properties.find(p => p.id === formData.property_id) || tenant?.property
    );
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-sm sm:text-base">
            Loading tenant data...
          </p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Tenant not found
          </h3>
          <Button
            onClick={() => router.push('/owner/dashboard/tenants')}
            className="text-sm sm:text-base">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Tenants
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-blue-600 hover:bg-blue-50 text-sm sm:text-base">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Edit Tenant
              </h1>
              <p className="text-blue-600/80 font-medium text-sm sm:text-base">
                Update lease and tenant information for {tenant.user.first_name}{' '}
                {tenant.user.last_name}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
            {/* Tenant Information (Read-only) */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Tenant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="p-3 sm:p-4 bg-gray-50/50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-600">Name:</span>
                      <span className="ml-2 font-medium">
                        {tenant.user.first_name} {tenant.user.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 font-medium">
                        {tenant.user.email}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 font-medium">
                        {tenant.user.phone}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    To change tenant personal information, the tenant must
                    update their profile directly.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Property & Unit Details */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Property & Unit Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-0">
                <div>
                  <Label
                    htmlFor="property_id"
                    className="text-sm font-medium text-gray-700">
                    Property
                  </Label>
                  <select
                    id="property_id"
                    value={formData.property_id}
                    onChange={e =>
                      handleInputChange('property_id', e.target.value)
                    }
                    className="mt-1 w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base">
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name} - {property.address}
                      </option>
                    ))}
                  </select>
                </div>

                {getSelectedProperty() && (
                  <div className="p-3 sm:p-4 bg-green-50/50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                      Property Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedProperty()!.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium capitalize">
                          {getSelectedProperty()!.type}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-gray-600">Address:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedProperty()!.address},{' '}
                          {getSelectedProperty()!.city}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <Label
                    htmlFor="unit_number"
                    className="text-sm font-medium text-gray-700">
                    Unit Number *
                  </Label>
                  <Input
                    id="unit_number"
                    type="text"
                    value={formData.unit_number}
                    onChange={e =>
                      handleInputChange('unit_number', e.target.value)
                    }
                    placeholder="e.g., 101, A-1, Suite 5"
                    className="mt-1 text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="status"
                    className="text-sm font-medium text-gray-700">
                    Tenant Status
                  </Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={e =>
                      handleInputChange(
                        'status',
                        e.target.value as 'active' | 'pending' | 'terminated'
                      )
                    }
                    className="mt-1 w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base">
                    <option value="pending">Pending (Awaiting move-in)</option>
                    <option value="active">Active (Currently occupied)</option>
                    <option value="terminated">Terminated (Lease ended)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Lease Terms */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Lease Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label
                      htmlFor="lease_start"
                      className="text-sm font-medium text-gray-700">
                      Lease Start Date *
                    </Label>
                    <Input
                      id="lease_start"
                      type="date"
                      value={formData.lease_start}
                      onChange={e =>
                        handleInputChange('lease_start', e.target.value)
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="lease_end"
                      className="text-sm font-medium text-gray-700">
                      Lease End Date *
                    </Label>
                    <Input
                      id="lease_end"
                      type="date"
                      value={formData.lease_end}
                      onChange={e =>
                        handleInputChange('lease_end', e.target.value)
                      }
                      className="mt-1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="lease_terms"
                    className="text-sm font-medium text-gray-700">
                    Lease Terms & Conditions
                  </Label>
                  <Textarea
                    id="lease_terms"
                    value={formData.lease_terms}
                    onChange={e =>
                      handleInputChange('lease_terms', e.target.value)
                    }
                    placeholder="Enter specific lease terms, conditions, and agreements..."
                    className="mt-1"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financial Details */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PhilippinePeso className="w-5 h-5 text-blue-600" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label
                      htmlFor="monthly_rent"
                      className="text-sm font-medium text-gray-700">
                      Monthly Rent (PHP) *
                    </Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      value={formData.monthly_rent || ''}
                      onChange={e =>
                        handleInputChange(
                          'monthly_rent',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="15000"
                      className="mt-1"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="security_deposit"
                      className="text-sm font-medium text-gray-700">
                      Security Deposit (PHP)
                    </Label>
                    <Input
                      id="security_deposit"
                      type="number"
                      value={formData.security_deposit || ''}
                      onChange={e =>
                        handleInputChange(
                          'security_deposit',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="30000"
                      className="mt-1"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label
                      htmlFor="emergency_contact_name"
                      className="text-sm font-medium text-gray-700">
                      Contact Name
                    </Label>
                    <Input
                      id="emergency_contact_name"
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={e =>
                        handleInputChange(
                          'emergency_contact_name',
                          e.target.value
                        )
                      }
                      placeholder="Juan Dela Cruz"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="emergency_contact_phone"
                      className="text-sm font-medium text-gray-700">
                      Contact Phone
                    </Label>
                    <Input
                      id="emergency_contact_phone"
                      type="tel"
                      value={formData.emergency_contact_phone}
                      onChange={e =>
                        handleInputChange(
                          'emergency_contact_phone',
                          e.target.value
                        )
                      }
                      placeholder="+63 912 345 6789"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Notes */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Additional Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label
                    htmlFor="notes"
                    className="text-sm font-medium text-gray-700">
                    Internal Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={e => handleInputChange('notes', e.target.value)}
                    placeholder="Any additional notes, special arrangements, or important information about this tenant..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 sm:pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="px-4 sm:px-6 text-sm sm:text-base">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 sm:px-6 text-sm sm:text-base">
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Tenant
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

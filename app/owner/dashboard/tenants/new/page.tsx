'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import {
  ArrowLeft,
  UserPlus,
  Home,
  Calendar,
  DollarSign,
  FileText,
  Shield,
  Phone,
  Save,
  User
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

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
}

export default function NewTenantPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [formData, setFormData] = useState<TenantFormData>({
    user_id: '',
    property_id: '',
    unit_number: '',
    lease_start: '',
    lease_end: '',
    monthly_rent: 0,
    security_deposit: 0,
    status: 'pending',
    lease_terms: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  });

  useEffect(() => {
    const loadInitialData = async () => {
      if (!authState.user?.id) return;

      try {
        setLoadingData(true);
        const [propertiesResult, usersResult] = await Promise.all([
          PropertiesAPI.getProperties(authState.user.id),
          TenantsAPI.getAvailableUsers()
        ]);

        if (propertiesResult.success) {
          setProperties(propertiesResult.data);
        }

        if (usersResult.success) {
          setAvailableUsers(usersResult.data);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
        toast.error('Failed to load form data');
      } finally {
        setLoadingData(false);
      }
    };

    loadInitialData();
  }, [authState.user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id) {
      toast.error('Please select a tenant');
      return;
    }

    if (!formData.property_id) {
      toast.error('Please select a property');
      return;
    }

    if (!formData.unit_number.trim()) {
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

    if (formData.monthly_rent <= 0) {
      toast.error('Please enter a valid monthly rent amount');
      return;
    }

    try {
      setIsLoading(true);
      const result = await TenantsAPI.createTenant(formData);

      if (result.success) {
        toast.success('Tenant added successfully');
        router.push('/owner/dashboard/tenants');
      } else {
        toast.error(result.message || 'Failed to add tenant');
      }
    } catch (error) {
      console.error('Create tenant error:', error);
      toast.error('Failed to add tenant');
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
    return properties.find(p => p.id === formData.property_id);
  };

  const getSelectedUser = () => {
    return availableUsers.find(u => u.id === formData.user_id);
  };

  const getAvailableUnits = () => {
    const property = getSelectedProperty();
    if (!property) return 0;
    return property.total_units - property.occupied_units;
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium">Loading form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-white to-blue-50/50 shadow-sm border-b border-blue-100">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="text-blue-600 hover:bg-blue-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Add New Tenant
              </h1>
              <p className="text-blue-600/80 font-medium">
                Create a new tenant lease agreement
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Tenant Selection */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Tenant Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label
                    htmlFor="user_id"
                    className="text-sm font-medium text-gray-700">
                    Select Tenant *
                  </Label>
                  <select
                    id="user_id"
                    value={formData.user_id}
                    onChange={e => handleInputChange('user_id', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required>
                    <option value="">Choose a registered user...</option>
                    {availableUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.first_name} {user.last_name} ({user.email})
                      </option>
                    ))}
                  </select>
                  {availableUsers.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      No available users found. Users must register as tenants
                      first.
                    </p>
                  )}
                </div>

                {getSelectedUser() && (
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Selected Tenant Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Name:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedUser()!.first_name}{' '}
                          {getSelectedUser()!.last_name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedUser()!.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedUser()!.phone}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Registered:</span>
                        <span className="ml-2 font-medium">
                          {new Date(
                            getSelectedUser()!.created_at
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Selection */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  Property & Unit Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label
                    htmlFor="property_id"
                    className="text-sm font-medium text-gray-700">
                    Select Property *
                  </Label>
                  <select
                    id="property_id"
                    value={formData.property_id}
                    onChange={e =>
                      handleInputChange('property_id', e.target.value)
                    }
                    className="mt-1 w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    required>
                    <option value="">Choose a property...</option>
                    {properties.map(property => (
                      <option key={property.id} value={property.id}>
                        {property.name} - {property.address} (
                        {property.total_units - property.occupied_units} units
                        available)
                      </option>
                    ))}
                  </select>
                </div>

                {getSelectedProperty() && (
                  <div className="p-4 bg-green-50/50 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Selected Property Details
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                      <div>
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedProperty()!.address},{' '}
                          {getSelectedProperty()!.city}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Available Units:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {getAvailableUnits()} of{' '}
                          {getSelectedProperty()!.total_units}
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
                    className="mt-1"
                    required
                  />
                </div>

                <div>
                  <Label
                    htmlFor="status"
                    className="text-sm font-medium text-gray-700">
                    Initial Status
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
                    className="mt-1 w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                    <option value="pending">Pending (Awaiting move-in)</option>
                    <option value="active">Active (Currently occupied)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Lease Terms */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Lease Terms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <DollarSign className="w-5 h-5 text-blue-600" />
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
                  Emergency Contact (Optional)
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
            <div className="flex items-center justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="px-6">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6">
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Adding Tenant...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Add Tenant
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







'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Camera,
  AlertCircle,
  CheckCircle,
  Building,
  CreditCard,
  FileText,
  Key,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';

interface TenantProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  avatar_url?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  is_verified: boolean;
  created_at: string;
  current_lease?: {
    property_name: string;
    unit_number: string;
    lease_start: Date;
    lease_end: Date;
    monthly_rent: number;
    status: string;
  };
}

export default function TenantProfilePage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<TenantProfile | null>(null);
  const [formData, setFormData] = useState<Partial<TenantProfile>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getTenantProfile(authState.user.id);

        if (result.success && result.data) {
          setProfile(result.data);
          setFormData(result.data);
        } else {
          toast.error('Failed to load profile');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [authState.user?.id]);

  const handleSave = async () => {
    if (!authState.user?.id || !formData) return;

    try {
      setSaving(true);
      const result = await TenantAPI.updateTenantProfile(authState.user.id, formData);

      if (result.success) {
        setProfile({ ...profile!, ...formData });
        setIsEditing(false);
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setIsEditing(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Profile Not Found
          </h3>
          <p className="text-gray-600">
            We couldn't load your profile information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">
            Manage your personal information and account settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={saving}
                className="border-gray-300">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
              <Edit className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm border border-blue-100">
          <TabsTrigger
            value="personal"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Personal Info
          </TabsTrigger>
          <TabsTrigger
            value="emergency"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Emergency Contact
          </TabsTrigger>
          <TabsTrigger
            value="lease"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Current Lease
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-4 border-blue-200">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-2xl font-bold">
                      {profile.first_name?.[0]}{profile.last_name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <Button
                      size="sm"
                      className="absolute -bottom-2 -right-2 w-8 h-8 p-0 bg-blue-600 hover:bg-blue-700 rounded-full">
                      <Camera className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {profile.first_name} {profile.last_name}
                  </h3>
                  <p className="text-gray-600 mb-2">{profile.email}</p>
                  <div className="flex items-center gap-2">
                    {profile.is_verified ? (
                      <Badge className="bg-green-100 text-green-700 border-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge className="bg-orange-100 text-orange-700 border-0">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Unverified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="first_name" className="text-sm font-medium text-gray-700 mb-2 block">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={formData.first_name || ''}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    disabled={!isEditing}
                    className="focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name" className="text-sm font-medium text-gray-700 mb-2 block">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={formData.last_name || ''}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    disabled={!isEditing}
                    className="focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={!isEditing}
                      className="pl-10 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      disabled={!isEditing}
                      className="pl-10 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Account Information</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Member Since
                    </Label>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Account Status
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-700 border-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Emergency Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="emergency_contact_name" className="text-sm font-medium text-gray-700 mb-2 block">
                    Contact Name
                  </Label>
                  <Input
                    id="emergency_contact_name"
                    value={formData.emergency_contact_name || ''}
                    onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Enter emergency contact name"
                    className="focus:border-blue-500"
                  />
                </div>
                <div>
                  <Label htmlFor="emergency_contact_phone" className="text-sm font-medium text-gray-700 mb-2 block">
                    Contact Phone
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="emergency_contact_phone"
                      value={formData.emergency_contact_phone || ''}
                      onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter phone number"
                      className="pl-10 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="emergency_contact_relationship" className="text-sm font-medium text-gray-700 mb-2 block">
                    Relationship
                  </Label>
                  <Input
                    id="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship || ''}
                    onChange={(e) => handleInputChange('emergency_contact_relationship', e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g., Spouse, Parent, Sibling"
                    className="focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lease" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-600" />
                Current Lease Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile.current_lease ? (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Property
                      </Label>
                      <p className="text-gray-900 font-semibold">{profile.current_lease.property_name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Unit Number
                      </Label>
                      <p className="text-gray-900">{profile.current_lease.unit_number}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Lease Start
                      </Label>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{profile.current_lease.lease_start.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Lease End
                      </Label>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{profile.current_lease.lease_end.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Monthly Rent
                      </Label>
                      <div className="flex items-center gap-2 text-gray-900 font-semibold">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span>₱{profile.current_lease.monthly_rent.toLocaleString()}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Status
                      </Label>
                      <Badge className="bg-green-100 text-green-700 border-0">
                        {profile.current_lease.status.charAt(0).toUpperCase() + profile.current_lease.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Active Lease
                  </h3>
                  <p className="text-gray-600 mb-4">
                    You don't currently have an active lease agreement.
                  </p>
                  <Button
                    onClick={() => window.location.href = '/tenant/dashboard/properties'}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                    Browse Properties
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-600" />
                  Password & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Password</h4>
                    <p className="text-sm text-gray-600">Last updated 3 months ago</p>
                  </div>
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    Change Password
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Manage how you receive updates</p>
                  </div>
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    Configure
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Data Export</h4>
                    <p className="text-sm text-gray-600">Download your account data</p>
                  </div>
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    Export Data
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <h4 className="font-medium text-red-900">Delete Account</h4>
                    <p className="text-sm text-red-600">Permanently delete your account and data</p>
                  </div>
                  <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}


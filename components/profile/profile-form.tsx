'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  ProfileAPI,
  type ProfileFormData,
  type UserProfile
} from '@/lib/api/profile';
import { toast } from 'sonner';
import {
  User,
  Mail,
  Phone,
  Building,
  FileText,
  UserCheck,
  PhoneCall,
  Users,
  Camera,
  Trash2,
  Save,
  X
} from 'lucide-react';

interface ProfileFormProps {
  profile: UserProfile;
  role: 'owner' | 'tenant';
  onSave: (updatedProfile: UserProfile) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProfileForm({
  profile,
  role,
  onSave,
  onCancel,
  isLoading = false
}: ProfileFormProps) {
  const { authState } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: '',
    company_name: '',
    business_license: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Initialize form data
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || '',
        company_name: profile.company_name || '',
        business_license: profile.business_license || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        emergency_contact_relationship:
          profile.emergency_contact_relationship || ''
      });
      setAvatarPreview(profile.avatar_url || '');
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData(prev => ({
      ...prev,
      avatar_url: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authState.user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setIsSubmitting(true);

      let updatedProfileData = { ...formData };

      // Upload avatar if changed
      if (avatarFile) {
        const uploadResult = await ProfileAPI.uploadAvatar(
          authState.user.id,
          avatarFile
        );
        if (uploadResult.success && uploadResult.data) {
          updatedProfileData.avatar_url = uploadResult.data.url;
        } else {
          toast.error(uploadResult.message || 'Failed to upload avatar');
          return;
        }
      }

      // Update profile
      const result = await ProfileAPI.updateProfile(
        authState.user.id,
        updatedProfileData
      );

      if (result.success && result.data) {
        toast.success('Profile updated successfully');
        onSave(result.data);

        // Dispatch custom event to notify other components
        window.dispatchEvent(
          new CustomEvent('profileUpdated', {
            detail: result.data
          })
        );
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = () => {
    return `${formData.first_name?.[0] || ''}${
      formData.last_name?.[0] || ''
    }`.toUpperCase();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Section */}
      <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Profile Picture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview} alt="Profile" />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                  onClick={handleRemoveAvatar}>
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-sm font-medium">
                Upload new photo
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500">
                JPG, PNG or GIF. Max size 5MB.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <User className="w-5 h-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-sm font-medium">
                First Name *
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={e => handleInputChange('first_name', e.target.value)}
                required
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-sm font-medium">
                Last Name *
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={e => handleInputChange('last_name', e.target.value)}
                required
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number *
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              required
              className="border-blue-200 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={profile.email}
              disabled
              className="bg-gray-50 border-gray-200"
            />
            <p className="text-xs text-gray-500">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Information */}
      {role === 'owner' && (
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Building className="w-5 h-5" />
              Business Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-medium">
                Company Name
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={e =>
                  handleInputChange('company_name', e.target.value)
                }
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_license" className="text-sm font-medium">
                Business License Number
              </Label>
              <Input
                id="business_license"
                value={formData.business_license}
                onChange={e =>
                  handleInputChange('business_license', e.target.value)
                }
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {role === 'tenant' && (
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Emergency Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="emergency_contact_name"
                className="text-sm font-medium">
                Emergency Contact Name
              </Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={e =>
                  handleInputChange('emergency_contact_name', e.target.value)
                }
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="emergency_contact_phone"
                className="text-sm font-medium">
                Emergency Contact Phone
              </Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={e =>
                  handleInputChange('emergency_contact_phone', e.target.value)
                }
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="emergency_contact_relationship"
                className="text-sm font-medium">
                Relationship
              </Label>
              <Input
                id="emergency_contact_relationship"
                value={formData.emergency_contact_relationship}
                onChange={e =>
                  handleInputChange(
                    'emergency_contact_relationship',
                    e.target.value
                  )
                }
                placeholder="e.g., Spouse, Parent, Sibling"
                className="border-blue-200 focus:border-blue-500"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
          className="border-gray-200 text-gray-600 hover:bg-gray-50">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
          {isSubmitting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

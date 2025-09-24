'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { ProfileAPI, type UserProfile } from '@/lib/api/profile';
import { ProfileForm } from './profile-form';
import { PasswordForm } from './password-form';
import { ProfileStats } from './profile-stats';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Settings,
  AlertTriangle,
  CheckCircle,
  Edit,
  Key,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface ProfileDashboardProps {
  role: 'owner' | 'tenant';
  className?: string;
}

export function ProfileDashboard({ role, className }: ProfileDashboardProps) {
  const { authState } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        const result = await ProfileAPI.getProfile(authState.user?.id || '');

        if (result.success && result.data) {
          setProfile(result.data);
        } else {
          toast.error(result.message || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [authState.user?.id]);

  const handleRefresh = () => {
    if (authState.user?.id) {
      const loadProfile = async () => {
        try {
          setIsLoading(true);
          const result = await ProfileAPI.getProfile(authState.user?.id || '');

          if (result.success && result.data) {
            setProfile(result.data);
            toast.success('Profile refreshed');
          } else {
            toast.error(result.message || 'Failed to refresh profile');
          }
        } catch (error) {
          console.error('Failed to refresh profile:', error);
          toast.error('Failed to refresh profile');
        } finally {
          setIsLoading(false);
        }
      };

      loadProfile();
    }
  };

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    setIsEditDialogOpen(false);
  };

  const handlePasswordChange = () => {
    setIsPasswordDialogOpen(false);
    toast.success('Password changed successfully');
  };

  const handleVerifyEmail = async () => {
    if (!authState.user?.id) return;

    try {
      const result = await ProfileAPI.verifyEmail(authState.user.id);
      if (result.success) {
        toast.success('Verification email sent');
      } else {
        toast.error(result.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Verify email error:', error);
      toast.error('Failed to send verification email');
    }
  };

  const handleDeactivateAccount = async () => {
    if (!authState.user?.id) return;

    if (
      window.confirm(
        'Are you sure you want to deactivate your account? This action can be reversed by contacting support.'
      )
    ) {
      try {
        const result = await ProfileAPI.deactivateAccount(authState.user.id);
        if (result.success) {
          toast.success('Account deactivated successfully');
          // Redirect to login or show deactivated message
        } else {
          toast.error(result.message || 'Failed to deactivate account');
        }
      } catch (error) {
        console.error('Deactivate account error:', error);
        toast.error('Failed to deactivate account');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-sm sm:text-base">
              Loading profile...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2">
              Profile not found
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Unable to load your profile information.
            </p>
            <Button
              onClick={handleRefresh}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Profile Management
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Manage your account settings and preferences
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50 text-sm sm:text-base">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => setIsEditDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base">
              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Profile Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
              <span className="sm:hidden">Edit</span>
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              <Lock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <ProfileStats
              profile={profile}
              role={role}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="text-blue-700 flex items-center gap-2 text-base sm:text-lg">
                  <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-blue-50/50 rounded-lg border border-blue-200/50 gap-3 sm:gap-0">
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm sm:text-base">
                        Personal Information
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Update your basic profile details
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsEditDialogOpen(true)}
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50 text-xs sm:text-sm">
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Edit
                    </Button>
                  </div>

                  {role === 'owner' && (
                    <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-lg border border-green-200/50">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Business Information
                        </h3>
                        <p className="text-sm text-gray-600">
                          Manage your business details
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsEditDialogOpen(true)}
                        variant="outline"
                        size="sm"
                        className="border-green-200 text-green-600 hover:bg-green-50">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  )}

                  {role === 'tenant' && (
                    <div className="flex items-center justify-between p-4 bg-purple-50/50 rounded-lg border border-purple-200/50">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          Emergency Contact
                        </h3>
                        <p className="text-sm text-gray-600">
                          Update your emergency contact information
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsEditDialogOpen(true)}
                        variant="outline"
                        size="sm"
                        className="border-purple-200 text-purple-600 hover:bg-purple-50">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-blue-700 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                    <div>
                      <h3 className="font-medium text-gray-900">Password</h3>
                      <p className="text-sm text-gray-600">
                        Change your account password
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsPasswordDialogOpen(true)}
                      variant="outline"
                      size="sm"
                      className="border-blue-200 text-blue-600 hover:bg-blue-50">
                      <Key className="w-4 h-4 mr-2" />
                      Change
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-yellow-50/50 rounded-lg border border-yellow-200/50">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Email Verification
                      </h3>
                      <p className="text-sm text-gray-600">
                        {profile.is_verified
                          ? 'Your email is verified'
                          : 'Verify your email address'}
                      </p>
                    </div>
                    {!profile.is_verified && (
                      <Button
                        onClick={handleVerifyEmail}
                        variant="outline"
                        size="sm"
                        className="border-yellow-200 text-yellow-600 hover:bg-yellow-50">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50/50 rounded-lg border border-red-200/50">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        Account Deactivation
                      </h3>
                      <p className="text-sm text-gray-600">
                        Deactivate your account (reversible)
                      </p>
                    </div>
                    <Button
                      onClick={handleDeactivateAccount}
                      variant="outline"
                      size="sm"
                      className="border-red-200 text-red-600 hover:bg-red-50">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Deactivate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Profile Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            {profile && (
              <ProfileForm
                profile={profile}
                role={role}
                onSave={handleProfileUpdate}
                onCancel={() => setIsEditDialogOpen(false)}
                isLoading={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Change Password Dialog */}
        <Dialog
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <PasswordForm
              onCancel={() => setIsPasswordDialogOpen(false)}
              onSuccess={handlePasswordChange}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

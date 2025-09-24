'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ProfileAPI, type UserProfile } from '@/lib/api/profile';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Building,
  Users,
  PhilippinePeso,
  Wrench,
  MessageSquare,
  Mail,
  Shield,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface ProfileStatsProps {
  profile: UserProfile;
  role: 'owner' | 'tenant';
  onRefresh?: () => void;
}

interface ProfileStatsData {
  accountAge: number;
  lastLogin: string;
  totalProperties?: number;
  totalTenants?: number;
  totalPayments?: number;
  totalMaintenance?: number;
  totalMessages?: number;
}

export function ProfileStats({ profile, role, onRefresh }: ProfileStatsProps) {
  const [stats, setStats] = useState<ProfileStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = async () => {
    if (!profile.id) return;

    try {
      setIsLoading(true);
      const result = await ProfileAPI.getProfileStats(profile.id, role);

      if (result.success && result.data) {
        setStats(result.data);
      } else {
        toast.error(result.message || 'Failed to load profile statistics');
      }
    } catch (error) {
      console.error('Load profile stats error:', error);
      toast.error('Failed to load profile statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [profile.id, role]);

  const formatAccountAge = (days: number) => {
    if (days < 30) {
      return `${days} days`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(days / 365);
      const remainingMonths = Math.floor((days % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''}${
        remainingMonths > 0
          ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
          : ''
      }`;
    }
  };

  const formatLastLogin = (lastLogin: string) => {
    if (lastLogin === 'Never') return 'Never';

    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const getInitials = () => {
    return `${profile.first_name?.[0] || ''}${
      profile.last_name?.[0] || ''
    }`.toUpperCase();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'tenant':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadgeColor = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'bg-red-100 text-red-700 border-red-200';
    if (!isVerified) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const getStatusText = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) return 'Inactive';
    if (!isVerified) return 'Unverified';
    return 'Active';
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Profile Overview
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              disabled={isLoading}
              className="border-blue-200 text-blue-600 hover:bg-blue-50">
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url} alt="Profile" />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-2xl">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile.first_name} {profile.last_name}
                </h2>
                <Badge className={getRoleBadgeColor(profile.role)}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </Badge>
                {/* <Badge
                  className={getStatusBadgeColor(
                    profile.is_active,
                    profile.is_verified
                  )}>
                  {getStatusText(profile.is_active, profile.is_verified)}
                </Badge> */}
              </div>
              <div className="space-y-1">
                <p className="text-gray-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {profile.email}
                </p>
                <p className="text-gray-600 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member since{' '}
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
                {stats && (
                  <p className="text-gray-600 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Last login: {formatLastLogin(stats.lastLogin)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Account Age */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAccountAge(stats.accountAge)}
                  </p>
                  <p className="text-sm text-gray-600">Account Age</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Role-specific Stats */}
          {role === 'owner' && (
            <>
              {stats.totalProperties !== undefined && (
                <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                        <Building className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalProperties}
                        </p>
                        <p className="text-sm text-gray-600">Properties</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {stats.totalTenants !== undefined && (
                <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalTenants}
                        </p>
                        <p className="text-sm text-gray-600">Tenants</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Common Stats */}
          {stats.totalPayments !== undefined && (
            <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <PhilippinePeso className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalPayments}
                    </p>
                    <p className="text-sm text-gray-600">Payments</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.totalMaintenance !== undefined && (
            <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalMaintenance}
                    </p>
                    <p className="text-sm text-gray-600">Maintenance</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {stats.totalMessages !== undefined && (
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalMessages}
                    </p>
                    <p className="text-sm text-gray-600">Messages</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Account Status */}
      <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-700 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                {profile.is_verified ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Email Verification</p>
                <p className="text-sm text-gray-600">
                  {profile.is_verified ? 'Verified' : 'Pending verification'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                {profile.is_active ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Account Status</p>
                <p className="text-sm text-gray-600">
                  {profile.is_active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

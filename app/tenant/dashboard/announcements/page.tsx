'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  Megaphone,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  RefreshCw,
  Calendar,
  Users,
  FileText,
  Home,
  User
} from 'lucide-react';
import { AnnouncementsAPI, type Announcement } from '@/lib/api/announcements';
import { AnnouncementCard } from '@/components/announcements/announcement-card';
import { AnnouncementFilters } from '@/components/announcements/announcement-filters';
import { toast } from 'sonner';

export default function TenantAnnouncementsPage() {
  const { authState } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Get tenant ID from user
  const getTenantId = async (userId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Failed to get tenant ID:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Failed to get tenant ID:', error);
      return null;
    }
  };

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        const tenantId = await getTenantId(authState.user.id);

        if (tenantId) {
          const result = await AnnouncementsAPI.getTenantAnnouncements(
            tenantId
          );
          if (result.success) {
            setAnnouncements(result.data || []);
          } else {
            toast.error(result.message || 'Failed to load announcements');
          }
        }
      } catch (error) {
        console.error('Failed to load announcements:', error);
        toast.error('Failed to load announcements');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnnouncements();
  }, [authState.user?.id]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    if (!authState.user?.id) return;

    const pollAnnouncements = async () => {
      try {
        const tenantId = await getTenantId(authState.user?.id || '');
        if (tenantId) {
          const result = await AnnouncementsAPI.getTenantAnnouncements(
            tenantId
          );
          if (result.success) {
            setAnnouncements(result.data || []);
          }
        }
      } catch (error) {
        console.error('Failed to poll announcements:', error);
      }
    };

    const interval = setInterval(pollAnnouncements, 10000);
    return () => clearInterval(interval);
  }, [authState.user?.id]);

  // Filter announcements
  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch =
      announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.property?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType =
      filterType === 'all' || announcement.type === filterType;
    const matchesPriority =
      filterPriority === 'all' || announcement.priority === filterPriority;

    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus =
        announcement.is_published &&
        (!announcement.expires_at ||
          new Date(announcement.expires_at) > new Date());
    } else if (filterStatus === 'expired') {
      matchesStatus = announcement.expires_at
        ? new Date(announcement.expires_at) < new Date()
        : false;
    }

    return matchesSearch && matchesType && matchesPriority && matchesStatus;
  });

  const handleRefresh = async () => {
    if (!authState.user?.id) return;

    try {
      const tenantId = await getTenantId(authState.user.id);
      if (tenantId) {
        const result = await AnnouncementsAPI.getTenantAnnouncements(tenantId);
        if (result.success) {
          setAnnouncements(result.data || []);
          toast.success('Announcements refreshed');
        } else {
          toast.error(result.message || 'Failed to refresh announcements');
        }
      }
    } catch (error) {
      console.error('Failed to refresh announcements:', error);
      toast.error('Failed to refresh announcements');
    }
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    router.push(`/tenant/dashboard/announcements/${announcement.id}`);
  };

  // Statistics
  const stats = {
    total: announcements.length,
    active: announcements.filter(
      a =>
        a.is_published && (!a.expires_at || new Date(a.expires_at) > new Date())
    ).length,
    urgent: announcements.filter(a => a.priority === 'urgent').length,
    expired: announcements.filter(
      a => a.expires_at && new Date(a.expires_at) < new Date()
    ).length
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">
              Loading announcements...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Announcements
            </h1>
            <p className="text-blue-600/70 mt-1">
              Stay updated with important announcements from your property
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-blue-200 text-blue-600 hover:bg-blue-50">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                  <p className="text-sm text-gray-600">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.active}
                  </p>
                  <p className="text-sm text-gray-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.urgent}
                  </p>
                  <p className="text-sm text-gray-600">Urgent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.expired}
                  </p>
                  <p className="text-sm text-gray-600">Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <AnnouncementFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filterType={filterType}
          onTypeChange={setFilterType}
          filterPriority={filterPriority}
          onPriorityChange={setFilterPriority}
          filterStatus={filterStatus}
          onStatusChange={setFilterStatus}
          role="tenant"
          onRefresh={handleRefresh}
        />

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Showing {filteredAnnouncements.length} of {announcements.length}{' '}
            announcements
          </p>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardContent className="p-12 text-center">
                <Megaphone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No announcements found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm ||
                  filterType !== 'all' ||
                  filterPriority !== 'all' ||
                  filterStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No announcements have been posted yet.'}
                </p>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAnnouncements.map(announcement => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                role="tenant"
                onView={handleViewAnnouncement}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  Megaphone,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  Send,
  Archive,
  RefreshCw,
  Calendar,
  Users,
  FileText
} from 'lucide-react';
import {
  AnnouncementsAPI,
  type Announcement,
  type AnnouncementStats
} from '@/lib/api/announcements';
import { AnnouncementCard } from '@/components/announcements/announcement-card';
import { AnnouncementFilters } from '@/components/announcements/announcement-filters';
import { AnnouncementForm } from '@/components/announcements/announcement-form';
import { useRealtimeAnnouncements } from '@/hooks/useRealtimeAnnouncements';
import { toast } from 'sonner';

export default function OwnerAnnouncementsPage() {
  const { authState } = useAuth();
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState<AnnouncementStats>({
    total_announcements: 0,
    published_announcements: 0,
    draft_announcements: 0,
    urgent_announcements: 0,
    expired_announcements: 0
  });
  const [propertyIds, setPropertyIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  // Load announcements and stats
  useEffect(() => {
    const loadData = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);
        const [announcementsResult, statsResult] = await Promise.all([
          AnnouncementsAPI.getOwnerAnnouncements(authState.user.id),
          AnnouncementsAPI.getAnnouncementStats(authState.user.id)
        ]);

        if (announcementsResult.success) {
          setAnnouncements(announcementsResult.data || []);

          // Extract property IDs for real-time subscription
          const ids = (announcementsResult.data || [])
            .map(a => a.property_id)
            .filter((id): id is string => id !== undefined && id !== null);
          setPropertyIds([...new Set(ids)]); // Remove duplicates
        }

        if (statsResult.success) {
          setStats(statsResult.data || stats);
        }
      } catch (error) {
        console.error('Failed to load announcements data:', error);
        toast.error('Failed to load announcements');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [authState.user?.id]);

  // Real-time announcements updates
  useRealtimeAnnouncements({
    propertyIds,
    onAnnouncementUpdate: updatedAnnouncement => {
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === updatedAnnouncement.id ? updatedAnnouncement : a
        )
      );
    },
    onAnnouncementCreate: newAnnouncement => {
      setAnnouncements(prev => [newAnnouncement, ...prev]);
    },
    onAnnouncementDelete: deletedId => {
      setAnnouncements(prev => prev.filter(a => a.id !== deletedId));
    }
  });

  // Poll for updates every 10 seconds
  useEffect(() => {
    if (!authState.user?.id) return;

    const pollAnnouncements = async () => {
      try {
        const result = await AnnouncementsAPI.getOwnerAnnouncements(
          authState.user?.id || ''
        );
        if (result.success) {
          setAnnouncements(result.data || []);
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
    if (filterStatus === 'published') {
      matchesStatus = announcement.is_published;
    } else if (filterStatus === 'draft') {
      matchesStatus = !announcement.is_published;
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
      const [announcementsResult, statsResult] = await Promise.all([
        AnnouncementsAPI.getOwnerAnnouncements(authState.user.id),
        AnnouncementsAPI.getAnnouncementStats(authState.user.id)
      ]);

      if (announcementsResult.success) {
        setAnnouncements(announcementsResult.data || []);
      }

      if (statsResult.success) {
        setStats(statsResult.data || stats);
      }

      toast.success('Announcements refreshed');
    } catch (error) {
      console.error('Failed to refresh announcements:', error);
      toast.error('Failed to refresh announcements');
    }
  };

  const handleViewAnnouncement = (announcement: Announcement) => {
    router.push(`/owner/dashboard/announcements/${announcement.id}`);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowNewForm(true);
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    if (
      window.confirm(
        'Are you sure you want to delete this announcement? This action cannot be undone.'
      )
    ) {
      try {
        const result = await AnnouncementsAPI.deleteAnnouncement(
          announcement.id
        );
        if (result.success) {
          toast.success('Announcement deleted successfully');
          setAnnouncements(prev => prev.filter(a => a.id !== announcement.id));
          // Refresh stats
          const statsResult = await AnnouncementsAPI.getAnnouncementStats(
            authState.user?.id || ''
          );
          if (statsResult.success) {
            setStats(statsResult.data || stats);
          }
        } else {
          toast.error(result.message || 'Failed to delete announcement');
        }
      } catch (error) {
        console.error('Delete announcement error:', error);
        toast.error('Failed to delete announcement');
      }
    }
  };

  const handleTogglePublish = async (announcement: Announcement) => {
    try {
      const result = await AnnouncementsAPI.toggleAnnouncementPublish(
        announcement.id,
        !announcement.is_published
      );

      if (result.success && result.data) {
        toast.success(
          result.data.is_published
            ? 'Announcement published successfully'
            : 'Announcement unpublished successfully'
        );
        setAnnouncements(prev =>
          prev.map(a => (a.id === announcement.id ? result.data! : a))
        );
        // Refresh stats
        const statsResult = await AnnouncementsAPI.getAnnouncementStats(
          authState.user?.id || ''
        );
        if (statsResult.success) {
          setStats(statsResult.data || stats);
        }
      } else {
        toast.error(result.message || 'Failed to toggle publish status');
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      toast.error('Failed to toggle publish status');
    }
  };

  const handleSaveAnnouncement = (announcement: Announcement) => {
    if (editingAnnouncement) {
      setAnnouncements(prev =>
        prev.map(a => (a.id === announcement.id ? announcement : a))
      );
      setEditingAnnouncement(null);
    } else {
      setAnnouncements(prev => [announcement, ...prev]);
    }
    setShowNewForm(false);

    // Refresh stats
    AnnouncementsAPI.getAnnouncementStats(authState.user?.id || '').then(
      result => {
        if (result.success) {
          setStats(result.data || stats);
        }
      }
    );
  };

  const handleCancelForm = () => {
    setShowNewForm(false);
    setEditingAnnouncement(null);
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
              Create and manage announcements for your properties
            </p>
          </div>
          <Button
            onClick={() => setShowNewForm(true)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="w-4 h-4 mr-2" />
            New Announcement
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total_announcements}
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
                    {stats.published_announcements}
                  </p>
                  <p className="text-sm text-gray-600">Published</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.draft_announcements}
                  </p>
                  <p className="text-sm text-gray-600">Drafts</p>
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
                    {stats.urgent_announcements}
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
                    {stats.expired_announcements}
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
          role="owner"
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
                    : 'Get started by creating your first announcement.'}
                </p>
                <Button
                  onClick={() => setShowNewForm(true)}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Announcement
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredAnnouncements.map(announcement => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
                role="owner"
                onView={handleViewAnnouncement}
                onEdit={handleEditAnnouncement}
                onDelete={handleDeleteAnnouncement}
                onTogglePublish={handleTogglePublish}
              />
            ))
          )}
        </div>

        {/* New/Edit Form Modal */}
        <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              {/* <DialogTitle>
                {editingAnnouncement
                  ? 'Edit Announcement'
                  : 'Create New Announcement'}
              </DialogTitle> */}
            </DialogHeader>
            <AnnouncementForm
              announcement={editingAnnouncement || undefined}
              creatorId={authState.user?.id || ''}
              role="owner"
              onSave={handleSaveAnnouncement}
              onCancel={handleCancelForm}
              isEditing={!!editingAnnouncement}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { cn, formatPropertyType } from '@/lib/utils';
import {
  ArrowLeft,
  Megaphone,
  Calendar,
  User,
  Home,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  FileText,
  Target,
  Users,
  ExternalLink
} from 'lucide-react';
import { AnnouncementsAPI, type Announcement } from '@/lib/api/announcements';
import { toast } from 'sonner';

export default function TenantAnnouncementDetailsPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const params = useParams();
  const announcementId = params.id as string;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load announcement
  useEffect(() => {
    const loadAnnouncement = async () => {
      if (!announcementId) return;

      try {
        setIsLoading(true);
        const result = await AnnouncementsAPI.getAnnouncement(announcementId);

        if (result.success && result.data) {
          setAnnouncement(result.data);
        } else {
          toast.error(result.message || 'Failed to load announcement');
          router.push('/tenant/dashboard/announcements');
        }
      } catch (error) {
        console.error('Failed to load announcement:', error);
        toast.error('Failed to load announcement');
        router.push('/tenant/dashboard/announcements');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnnouncement();
  }, [announcementId, router]);

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'emergency':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'maintenance':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'policy':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'event':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'general':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadAttachment = (attachment: string, index: number) => {
    try {
      // Check if it's a base64 data URL
      if (attachment.startsWith('data:')) {
        // Create a link element and trigger download
        const link = document.createElement('a');
        link.href = attachment;
        link.download = `announcement-attachment-${index + 1}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Download started');
      } else if (attachment.startsWith('blob:')) {
        // Old blob URLs won't work, show error
        toast.error(
          'This file is no longer available. Please ask the owner to re-upload it.'
        );
      } else {
        // Try to open as URL
        window.open(attachment, '_blank');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">Loading announcement...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Announcement not found
            </h3>
            <p className="text-gray-600 mb-6">
              The announcement you're looking for doesn't exist.
            </p>
            <Button
              onClick={() => router.push('/tenant/dashboard/announcements')}>
              Back to Announcements
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isExpired =
    announcement.expires_at && new Date(announcement.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/tenant/dashboard/announcements')}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Announcements
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
                Announcement Details
              </h1>
              <p className="text-blue-600/70 mt-1 text-lg">
                {announcement.title}
              </p>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex gap-4">
          <Badge className={getPriorityBadge(announcement.priority)}>
            {announcement.priority}
          </Badge>
          <Badge className={getTypeBadge(announcement.type)}>
            {announcement.type}
          </Badge>
          {isExpired && (
            <Badge className="bg-red-100 text-red-700 border-red-200">
              Expired
            </Badge>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Announcement Content */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  Announcement Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    {announcement.title}
                  </h3>
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {announcement.content}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attachments */}
            {announcement.attachments &&
              announcement.attachments.length > 0 && (
                <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-blue-700">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      Attachments ({announcement.attachments.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {announcement.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-gray-500" />
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                Attachment {index + 1}
                              </p>
                              <p className="text-sm text-gray-600">
                                Click to download
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleDownloadAttachment(attachment, index)
                              }
                              className="border-blue-200 text-blue-600 hover:bg-blue-50">
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Announcement Info */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5" />
                  </div>
                  Announcement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">
                    Published
                  </Label>
                  <p className="text-gray-900 font-medium">
                    {formatDate(
                      announcement.published_at || announcement.created_at
                    )}
                  </p>
                </div>

                {announcement.expires_at && (
                  <div
                    className={cn(
                      'p-3 rounded-lg border',
                      isExpired
                        ? 'bg-red-50 border-red-200/50'
                        : 'bg-blue-50 border-blue-200/50'
                    )}>
                    <Label
                      className={cn(
                        'text-sm font-medium mb-1 block',
                        isExpired ? 'text-red-700' : 'text-blue-700'
                      )}>
                      Expires
                    </Label>
                    <p
                      className={cn(
                        'font-medium',
                        isExpired ? 'text-red-900' : 'text-blue-900'
                      )}>
                      {formatDate(announcement.expires_at)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Information */}
            {announcement.property && (
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-blue-700">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                    Property Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {announcement.property.name}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-700">
                          {announcement.property.address}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">
                          {announcement.property.city}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-blue-50 text-blue-700 border-blue-200">
                          {formatPropertyType(announcement.property.type)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Creator Information */}
            {announcement.creator && (
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-blue-700">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    Posted By
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={announcement.creator.avatar_url} />
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {announcement.creator.first_name[0]}
                          {announcement.creator.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {announcement.creator.first_name}{' '}
                          {announcement.creator.last_name}
                        </h3>
                        <p className="text-gray-600 capitalize">
                          {announcement.creator.role}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {announcement.creator.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Target Audience */}
            <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-blue-700">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5" />
                  </div>
                  Target Audience
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium text-gray-600 mb-1 block">
                    Audience Type
                  </Label>
                  <Badge variant="outline" className="text-sm">
                    {announcement.target_audience === 'all' && 'All Users'}
                    {announcement.target_audience === 'tenants' &&
                      'Tenants Only'}
                    {announcement.target_audience === 'owners' && 'Owners Only'}
                    {announcement.target_audience === 'specific' &&
                      'Specific Users'}
                  </Badge>
                </div>

                {/* Specific Target Users */}
                {announcement.target_audience === 'specific' &&
                  announcement.target_users_data && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">
                        Targeted Users ({announcement.target_users_data.length})
                      </Label>
                      <div className="space-y-2">
                        {announcement.target_users_data.map(user => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback className="text-xs">
                                {user.first_name[0]}
                                {user.last_name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {user.first_name} {user.last_name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

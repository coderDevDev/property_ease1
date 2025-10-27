'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Megaphone,
  Calendar,
  User,
  Home,
  Clock,
  AlertTriangle,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  Users,
  Target,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Announcement } from '@/lib/api/announcements';

interface AnnouncementCardProps {
  announcement: Announcement;
  role: 'owner' | 'tenant';
  onView?: (announcement: Announcement) => void;
  onEdit?: (announcement: Announcement) => void;
  onDelete?: (announcement: Announcement) => void;
  onTogglePublish?: (announcement: Announcement) => void;
  className?: string;
}

export function AnnouncementCard({
  announcement,
  role,
  onView,
  onEdit,
  onDelete,
  onTogglePublish,
  className
}: AnnouncementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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

  const getStatusBadge = (isPublished: boolean, expiresAt?: string) => {
    if (!isPublished) {
      return 'bg-gray-100 text-gray-700 border-gray-200';
    }

    if (expiresAt && new Date(expiresAt) < new Date()) {
      return 'bg-red-100 text-red-700 border-red-200';
    }

    return 'bg-green-100 text-green-700 border-green-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired =
    announcement.expires_at && new Date(announcement.expires_at) < new Date();

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200',
        isExpired && 'opacity-60',
        className
      )}>
      <CardHeader className="pb-3 sm:pb-4 p-3 sm:p-6">
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
              <CardTitle className="text-base sm:text-lg text-gray-900 line-clamp-2">
                {announcement.title}
              </CardTitle>
            </div>

            <div className="flex flex-wrap gap-1 sm:gap-2 mb-3">
              <Badge
                className={`${getPriorityBadge(
                  announcement.priority
                )} text-xs sm:text-sm`}>
                {announcement.priority}
              </Badge>
              <Badge
                className={`${getTypeBadge(
                  announcement.type
                )} text-xs sm:text-sm`}>
                {announcement.type}
              </Badge>
              {role === 'owner' && (
                <Badge
                  className={`${getStatusBadge(
                    announcement.is_published,
                    announcement.expires_at
                  )} text-xs sm:text-sm`}>
                  {announcement.is_published ? 'Published' : 'Draft'}
                  {isExpired && ' (Expired)'}
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">
                  {formatDate(announcement.created_at)}
                </span>
              </div>

              {announcement.property && (
                <div className="flex items-center gap-1">
                  <Home className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{announcement.property.name}</span>
                </div>
              )}

              {announcement.creator && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">
                    {announcement.creator.first_name}{' '}
                    {announcement.creator.last_name}
                  </span>
                </div>
              )}

              {announcement.expires_at && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">
                    Expires: {formatDate(announcement.expires_at)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                <MoreVertical className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onView && (
                <DropdownMenuItem onClick={() => onView(announcement)}>
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  View Details
                </DropdownMenuItem>
              )}
              {role === 'owner' && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(announcement)}>
                  <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              )}
              {role === 'owner' && onTogglePublish && (
                <DropdownMenuItem onClick={() => onTogglePublish(announcement)}>
                  {announcement.is_published ? (
                    <>
                      <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                      Publish
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {role === 'owner' && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(announcement)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0 p-3 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Content Preview */}
          <div className="text-gray-700 text-sm sm:text-base">
            {isExpanded ? (
              <div className="whitespace-pre-wrap">{announcement.content}</div>
            ) : (
              <p className="line-clamp-3">{announcement.content}</p>
            )}

            {announcement.content.length > 150 && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-0 h-auto text-blue-600 hover:text-blue-700 text-xs sm:text-sm">
                {isExpanded ? 'Show less' : 'Read more'}
              </Button>
            )}
          </div>

          {/* Target Audience */}
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">Target: </span>
            <Badge variant="outline" className="text-xs">
              {announcement.target_audience === 'all' && 'All Users'}
              {announcement.target_audience === 'tenants' && 'Tenants Only'}
              {announcement.target_audience === 'owners' && 'Owners Only'}
              {announcement.target_audience === 'specific' && 'Specific Users'}
            </Badge>
          </div>

          {/* Attachments */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                <FileText className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Attachments ({announcement.attachments.length})</span>
              </div>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {announcement.attachments.map((attachment, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 sm:h-8"
                    onClick={() => window.open(attachment, '_blank')}>
                    <Download className="w-3 h-3 mr-1" />
                    Attachment {index + 1}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Target Users (for specific announcements) */}
          {announcement.target_audience === 'specific' &&
            announcement.target_users_data && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>
                    Targeted Users ({announcement.target_users_data.length})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {announcement.target_users_data.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 sm:px-3 py-1 sm:py-2">
                      <Avatar className="w-5 h-5 sm:w-6 sm:h-6">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {user.first_name[0]}
                          {user.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs sm:text-sm text-gray-700 truncate">
                        {user.first_name} {user.last_name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}

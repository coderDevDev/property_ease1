'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Clock,
  User,
  Home,
  MoreVertical,
  Reply,
  Trash2,
  Archive,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Message } from '@/lib/api/messages';

interface MessageCardProps {
  message: Message;
  isOwnMessage: boolean;
  role: 'owner' | 'tenant';
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onArchive?: (conversationId: string) => void;
  className?: string;
}

export function MessageCard({
  message,
  isOwnMessage,
  role,
  onReply,
  onDelete,
  onArchive,
  className
}: MessageCardProps) {
  const [showFullContent, setShowFullContent] = useState(false);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'payment':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'general':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance':
        return '🔧';
      case 'payment':
        return '💰';
      case 'general':
        return '💬';
      default:
        return '📧';
    }
  };

  const shouldTruncate = message.content.length > 200;
  const displayContent =
    shouldTruncate && !showFullContent
      ? message.content.substring(0, 200) + '...'
      : message.content;

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200',
        isOwnMessage ? 'ml-8 bg-blue-50/50' : 'mr-8',
        !message.is_read && !isOwnMessage && 'border-blue-300 bg-blue-50/70',
        className
      )}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className="w-10 h-10 flex-shrink-0">
            <AvatarImage
              src={message.sender.avatar_url}
              alt={`${message.sender.first_name} ${message.sender.last_name}`}
            />
            <AvatarFallback className="bg-blue-100 text-blue-700">
              {message.sender.first_name[0]}
              {message.sender.last_name[0]}
            </AvatarFallback>
          </Avatar>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">
                  {message.sender.first_name} {message.sender.last_name}
                </h4>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    getMessageTypeColor(message.message_type)
                  )}>
                  {getMessageTypeIcon(message.message_type)}{' '}
                  {message.message_type}
                </Badge>
                {message.sender.role === 'owner' && (
                  <Badge
                    variant="outline"
                    className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                    Owner
                  </Badge>
                )}
                {message.sender.role === 'tenant' && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-200 text-xs">
                    Tenant
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(message.created_at)}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {!isOwnMessage && (
                      <DropdownMenuItem onClick={() => onReply?.(message)}>
                        <Reply className="w-4 h-4 mr-2" />
                        Reply
                      </DropdownMenuItem>
                    )}
                    {isOwnMessage && (
                      <DropdownMenuItem
                        onClick={() => onDelete?.(message.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onArchive?.(message.conversation_id)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Subject */}
            {message.subject && (
              <h5 className="font-medium text-gray-800 mb-2">
                {message.subject}
              </h5>
            )}

            {/* Property Context */}
            {message.property && (
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                <Home className="w-4 h-4" />
                <span>{message.property.name}</span>
              </div>
            )}

            {/* Message Content */}
            <div className="text-gray-700 leading-relaxed">
              <p className="whitespace-pre-wrap">{displayContent}</p>

              {shouldTruncate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFullContent(!showFullContent)}
                  className="mt-2 p-0 h-auto text-blue-600 hover:text-blue-700">
                  {showFullContent ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      Show More
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Attachments:</p>
                <div className="flex flex-wrap gap-2">
                  {message.attachments.map((attachment, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(attachment, '_blank')}
                      className="text-xs">
                      📎 Attachment {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Unread Indicator */}
            {!message.is_read && !isOwnMessage && (
              <div className="mt-2">
                <Badge className="bg-blue-100 text-blue-700 text-xs">New</Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


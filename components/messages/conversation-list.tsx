'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Search,
  Plus,
  MoreVertical,
  Archive,
  Trash2,
  Clock,
  Home,
  User,
  RefreshCw
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { Conversation } from '@/lib/api/messages';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  role: 'owner' | 'tenant';
  currentUserId: string;
  onSelectConversation: (conversation: Conversation) => void;
  onNewMessage: () => void;
  onArchiveConversation?: (conversationId: string) => void;
  onDeleteConversation?: (conversationId: string) => void;
  onRefresh?: () => void;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedConversationId,
  role,
  currentUserId,
  onSelectConversation,
  onNewMessage,
  onArchiveConversation,
  onDeleteConversation,
  onRefresh,
  className
}: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';

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

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants_data.find(p => p.id !== currentUserId);
  };

  const filteredConversations = conversations.filter(conversation => {
    const otherParticipant = getOtherParticipant(conversation);
    const searchLower = searchTerm.toLowerCase();

    return (
      conversation.property?.name.toLowerCase().includes(searchLower) ||
      otherParticipant?.first_name.toLowerCase().includes(searchLower) ||
      otherParticipant?.last_name.toLowerCase().includes(searchLower) ||
      conversation.last_message?.content.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg',
        className
      )}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <MessageSquare className="w-5 h-5" />
            Conversations
          </CardTitle>
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                size="sm"
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={onNewMessage}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/50 border-blue-200/50 focus:border-blue-400"
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No conversations found</p>
              <p className="text-sm text-gray-400">
                {searchTerm
                  ? 'Try adjusting your search terms.'
                  : 'Start a new conversation to get started.'}
              </p>
            </div>
          ) : (
            filteredConversations.map(conversation => {
              const otherParticipant = getOtherParticipant(conversation);
              const isSelected = selectedConversationId === conversation.id;
              const hasUnread = conversation.unread_count > 0;

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    'p-4 border-b border-gray-100 cursor-pointer hover:bg-blue-50/50 transition-all duration-200',
                    isSelected && 'bg-blue-50 border-blue-200',
                    hasUnread && 'bg-blue-50/30'
                  )}
                  onClick={() => onSelectConversation(conversation)}>
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <Avatar className="w-12 h-12 flex-shrink-0">
                      <AvatarImage
                        src={otherParticipant?.avatar_url}
                        alt={`${otherParticipant?.first_name} ${otherParticipant?.last_name}`}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {otherParticipant?.first_name[0]}
                        {otherParticipant?.last_name[0]}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {otherParticipant?.first_name}{' '}
                            {otherParticipant?.last_name}
                          </h4>
                          {otherParticipant?.role === 'owner' && (
                            <Badge
                              variant="outline"
                              className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                              Owner
                            </Badge>
                          )}
                          {otherParticipant?.role === 'tenant' && (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-700 border-green-200 text-xs">
                              Tenant
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {hasUnread && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              {conversation.unread_count}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(conversation.last_message_at)}
                          </span>
                        </div>
                      </div>

                      {/* Property Context */}
                      {conversation.property && (
                        <div className="flex items-center gap-1 mb-1 text-xs text-gray-600">
                          <Home className="w-3 h-3" />
                          <span className="truncate">
                            {conversation.property.name}
                          </span>
                        </div>
                      )}

                      {/* Last Message Preview */}
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.last_message?.content ||
                          'No messages yet'}
                      </p>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={e => e.stopPropagation()}>
                          <MoreVertical className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            onArchiveConversation?.(conversation.id)
                          }>
                          <Archive className="w-4 h-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onDeleteConversation?.(conversation.id)
                          }
                          className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

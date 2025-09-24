'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileAPI, type UserProfile } from '@/lib/api/profile';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { cn } from '@/lib/utils';
import {
  Bell,
  MessageSquare,
  Home,
  User,
  Settings,
  LogOut,
  Check,
  X,
  MoreVertical,
  AlertTriangle,
  Megaphone,
  Wrench,
  CreditCard,
  Calendar,
  Clock,
  ExternalLink
} from 'lucide-react';
import { NotificationsAPI, type Notification } from '@/lib/api/notifications';
import { MessagesAPI, type Message } from '@/lib/api/messages';
import { toast } from 'sonner';

interface TopNavbarProps {
  role: 'owner' | 'tenant';
  className?: string;
}

export function TopNavbar({ role, className }: TopNavbarProps) {
  const { authState, logout } = useAuth();
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [recentMessages, setRecentMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const {
    notifications,
    stats: notificationStats,
    isConnected: notificationsConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useRealtimeNotifications({
    userId: authState.user?.id || '',
    onNewNotification: notification => {
      // Show toast for urgent notifications
      if (notification.priority === 'high') {
        toast.info(notification.title, {
          description: notification.message,
          action: {
            label: 'View',
            onClick: () => {
              if (notification.action_url) {
                router.push(notification.action_url);
              }
            }
          }
        });
      }
    }
  });

  // Load user profile
  const loadUserProfile = async () => {
    if (!authState.user?.id) return;

    try {
      const result = await ProfileAPI.getProfile(authState.user.id);
      if (result.success && result.data) {
        setUserProfile(result.data);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  // Load recent messages
  const loadRecentMessages = async () => {
    if (!authState.user?.id) return;

    setLoadingMessages(true);
    try {
      const result = await MessagesAPI.getRecentMessages(authState.user.id, 5);
      if (result.success && result.data) {
        setRecentMessages(result.data);
      }
    } catch (error) {
      console.error('Failed to load recent messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const {
    unreadCount: messageUnreadCount,
    isConnected: messagesConnected,
    markAsRead: markMessageAsRead,
    markAllAsRead: markAllMessagesAsRead
  } = useRealtimeMessages({
    userId: authState.user?.id || '',
    onNewMessage: message => {
      // Show toast for new messages
      toast.info('New Message', {
        description: `You have a new message from ${
          message.sender?.first_name || 'someone'
        }`,
        action: {
          label: 'View',
          onClick: () => {
            router.push(getMessagesPath());
          }
        }
      });

      // Refresh recent messages
      loadRecentMessages();
    }
  });

  // Load recent messages when component mounts
  useEffect(() => {
    loadRecentMessages();
  }, [authState.user?.id]);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, [authState.user?.id]);

  // Set up profile update listener
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadUserProfile();
    };

    // Listen for custom profile update events
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  // Load messages when popover opens
  useEffect(() => {
    if (messagesOpen) {
      loadRecentMessages();
    }
  }, [messagesOpen]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      router.push(notification.action_url);
    }

    setNotificationsOpen(false);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-4 h-4" />;
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      case 'lease':
        return <Calendar className="w-4 h-4" />;
      case 'reminder':
        return <Clock className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-blue-600 bg-blue-50';
      case 'low':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleMessageClick = async (message: Message) => {
    if (!message.is_read) {
      await markMessageAsRead(message.id);
    }

    router.push(getMessagesPath());
    setMessagesOpen(false);
  };

  const getDashboardPath = () => {
    return role === 'owner' ? '/owner/dashboard' : '/tenant/dashboard';
  };

  const getMessagesPath = () => {
    return role === 'owner'
      ? '/owner/dashboard/messages'
      : '/tenant/dashboard/messages';
  };

  const getNotificationsPath = () => {
    return role === 'owner'
      ? '/owner/dashboard/notifications'
      : '/tenant/dashboard/notifications';
  };

  return (
    <nav
      className={cn(
        'bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm',
        className
      )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push(getDashboardPath())}
              className="flex items-center gap-2 text-lg font-bold text-blue-700 hover:text-blue-800">
              <Home className="w-6 h-6" />
              <span className="text-lg font-bold ml-4">PropertyEase</span>
            </Button>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-4">
            {/* Real-time Status Indicator */}
            {/* <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  notificationsConnected && messagesConnected
                    ? 'bg-green-500'
                    : 'bg-red-500'
                )}
              />
              <span className="text-xs text-gray-500">
                {notificationsConnected && messagesConnected
                  ? 'Live'
                  : 'Offline'}
              </span>
            </div> */}

            {/* Messages */}
            <Popover open={messagesOpen} onOpenChange={setMessagesOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                  <MessageSquare className="w-5 h-5" />
                  {messageUnreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-blue-500 text-white">
                      {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-80 max-w-[calc(100vw-2rem)] p-0"
                align="end"
                side="bottom">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Messages</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          router.push(getMessagesPath());
                          setMessagesOpen(false);
                        }}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-96">
                      {loadingMessages ? (
                        <div className="text-center py-8 text-gray-500">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                          <p>Loading messages...</p>
                        </div>
                      ) : recentMessages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No messages yet</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {recentMessages.map(message => {
                            const isFromCurrentUser =
                              message.sender_id === authState.user?.id;
                            const otherUser = isFromCurrentUser
                              ? message.recipient
                              : message.sender;

                            return (
                              <div
                                key={message.id}
                                className={cn(
                                  'p-3 hover:bg-gray-50 cursor-pointer transition-colors',
                                  !message.is_read &&
                                    !isFromCurrentUser &&
                                    'bg-blue-50/50'
                                )}
                                onClick={() => handleMessageClick(message)}>
                                <div className="flex items-start gap-3">
                                  <div className="relative">
                                    <Avatar className="w-8 h-8 flex-shrink-0">
                                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                        {otherUser?.first_name?.[0]}
                                        {otherUser?.last_name?.[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    {!message.is_read && !isFromCurrentUser && (
                                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <h4
                                        className={cn(
                                          'text-sm font-medium text-gray-900',
                                          !message.is_read &&
                                            !isFromCurrentUser &&
                                            'font-semibold'
                                        )}>
                                        {isFromCurrentUser
                                          ? 'You'
                                          : `${otherUser?.first_name} ${otherUser?.last_name}`}
                                      </h4>
                                      <span className="text-xs text-gray-400">
                                        {formatMessageTime(message.created_at)}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                      {message.content}
                                    </p>
                                    {message.property && (
                                      <p className="text-xs text-gray-400 mt-1">
                                        {message.property.name}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                    {recentMessages.length > 0 && (
                      <div className="border-t p-3">
                        <div className="flex items-center justify-between gap-2">
                          {messageUnreadCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={markAllMessagesAsRead}
                              className="text-xs">
                              Mark all read
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              router.push(getMessagesPath());
                              setMessagesOpen(false);
                            }}>
                            View All Messages
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>

            {/* Notifications */}
            <Popover
              open={notificationsOpen}
              onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative text-gray-600 hover:text-blue-600 hover:bg-blue-50">
                  <Bell className="w-5 h-5" />
                  {notificationStats.unread > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white">
                      {notificationStats.unread > 99
                        ? '99+'
                        : notificationStats.unread}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-96 max-w-[calc(100vw-2rem)] p-0"
                align="end"
                side="bottom">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Notifications</CardTitle>
                      <div className="flex items-center gap-2">
                        {notificationStats.unread > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="text-xs">
                            Mark all read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            router.push(getNotificationsPath());
                            setNotificationsOpen(false);
                          }}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-96">
                      {notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {notifications.slice(0, 10).map(notification => (
                            <div
                              key={notification.id}
                              className={cn(
                                'p-3 hover:bg-gray-50 cursor-pointer transition-colors',
                                !notification.is_read && 'bg-blue-50/50'
                              )}
                              onClick={() =>
                                handleNotificationClick(notification)
                              }>
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                    getNotificationColor(notification.priority)
                                  )}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <h4
                                      className={cn(
                                        'text-sm font-medium text-gray-900',
                                        !notification.is_read && 'font-semibold'
                                      )}>
                                      {notification.title}
                                    </h4>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                          onClick={e => e.stopPropagation()}>
                                          <MoreVertical className="w-3 h-3" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        {!notification.is_read && (
                                          <DropdownMenuItem
                                            onClick={e => {
                                              e.stopPropagation();
                                              markAsRead(notification.id);
                                            }}>
                                            <Check className="w-4 h-4 mr-2" />
                                            Mark as read
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={e => {
                                            e.stopPropagation();
                                            deleteNotification(notification.id);
                                          }}
                                          className="text-red-600">
                                          <X className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-2">
                                    {formatNotificationTime(
                                      notification.created_at
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                    {notifications.length > 0 && (
                      <div className="border-t p-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            router.push(getNotificationsPath());
                            setNotificationsOpen(false);
                          }}>
                          View All Notifications
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </PopoverContent>
            </Popover>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                        {userProfile?.first_name?.[0] ||
                          authState.user?.firstName?.[0]}
                        {userProfile?.last_name?.[0] ||
                          authState.user?.lastName?.[0]}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {userProfile?.first_name || authState.user?.firstName}{' '}
                      {userProfile?.last_name || authState.user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{authState.user?.email}</p>
                  <p className="text-xs text-gray-500 capitalize">{role}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push(getDashboardPath())}>
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/dashboard/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                {/* <DropdownMenuItem
                  onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem> */}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}

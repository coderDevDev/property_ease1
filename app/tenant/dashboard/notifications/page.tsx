'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { cn } from '@/lib/utils';
import {
  Bell,
  Check,
  X,
  MoreVertical,
  AlertTriangle,
  Megaphone,
  Wrench,
  CreditCard,
  Calendar,
  Clock,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { NotificationsAPI, type Notification } from '@/lib/api/notifications';
import { toast } from 'sonner';

export default function TenantNotificationsPage() {
  const { authState } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  const {
    notifications,
    stats,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useRealtimeNotifications({
    userId: authState.user?.id || '',
    onNewNotification: notification => {
      toast.info(notification.title, {
        description: notification.message
      });
    }
  });

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-5 h-5" />;
      case 'maintenance':
        return <Wrench className="w-5 h-5" />;
      case 'payment':
        return <CreditCard className="w-5 h-5" />;
      case 'lease':
        return <Calendar className="w-5 h-5" />;
      case 'reminder':
        return <Clock className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium">
              Loading notifications...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Notifications
            </h1>
            <p className="text-blue-600/70 mt-1">
              Stay updated with important updates and alerts
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                )}
              />
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live Updates' : 'Offline'}
              </span>
            </div>
            {stats.unread > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="outline"
                size="sm"
                className="border-blue-200 text-blue-600 hover:bg-blue-50">
                <Check className="w-4 h-4 mr-2" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
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

          <Card className="bg-white/70 backdrop-blur-sm border-yellow-200/50 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.unread}
                  </p>
                  <p className="text-sm text-gray-600">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-200/50 shadow-lg">
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
        </div>

        {/* Notifications List */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Bell className="w-5 h-5" />
              All Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No notifications
                  </h3>
                  <p className="text-gray-600">
                    You're all caught up! New notifications will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4',
                        !notification.is_read &&
                          'bg-blue-50/50 border-l-blue-500',
                        notification.is_read && 'border-l-transparent'
                      )}
                      onClick={() => handleNotificationClick(notification)}>
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border',
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
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">
                                {formatNotificationTime(
                                  notification.created_at
                                )}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                                onClick={e => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          {notification.action_url && (
                            <div className="flex items-center gap-1 mt-2">
                              <ExternalLink className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600">
                                Click to view
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

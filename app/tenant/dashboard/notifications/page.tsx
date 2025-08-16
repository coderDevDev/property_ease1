'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Bell,
  Search,
  Calendar,
  CheckCircle,
  AlertCircle,
  Info,
  Mail,
  MessageSquare,
  Wrench,
  CreditCard,
  Settings,
  Trash2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';
import { Input } from '@/components/ui/input';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  category: string;
  created_at: string;
  is_read: boolean;
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  categories: {
    maintenance: boolean;
    payments: boolean;
    messages: boolean;
    lease: boolean;
    announcements: boolean;
  };
}

export default function NotificationsPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    categories: {
      maintenance: true,
      payments: true,
      messages: true,
      lease: true,
      announcements: true
    }
  });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingPreferences, setSavingPreferences] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const [notificationsResult, preferencesResult] = await Promise.all([
          TenantAPI.getNotifications(authState.user.id),
          TenantAPI.getNotificationPreferences(authState.user.id)
        ]);

        if (notificationsResult.success && notificationsResult.data) {
          setNotifications(notificationsResult.data);
        } else {
          toast.error('Failed to load notifications');
        }

        if (preferencesResult.success && preferencesResult.data) {
          setPreferences(preferencesResult.data);
        } else {
          toast.error('Failed to load notification preferences');
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authState.user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await TenantAPI.markNotificationAsRead(notificationId);
      if (result.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, is_read: true }
              : notification
          )
        );
      } else {
        toast.error(result.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await TenantAPI.markAllNotificationsAsRead();
      if (result.success) {
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            is_read: true
          }))
        );
        toast.success('All notifications marked as read');
      } else {
        toast.error(
          result.message || 'Failed to mark all notifications as read'
        );
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const result = await TenantAPI.deleteNotification(notificationId);
      if (result.success) {
        setNotifications(prev =>
          prev.filter(notification => notification.id !== notificationId)
        );
        toast.success('Notification deleted');
      } else {
        toast.error(result.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSavingPreferences(true);
      const result = await TenantAPI.updateNotificationPreferences(preferences);
      if (result.success) {
        toast.success('Notification preferences updated');
      } else {
        toast.error(result.message || 'Failed to update preferences');
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'maintenance':
        return <Wrench className="w-4 h-4" />;
      case 'payments':
        return <CreditCard className="w-4 h-4" />;
      case 'messages':
        return <MessageSquare className="w-4 h-4" />;
      case 'lease':
        return <FileText className="w-4 h-4" />;
      case 'announcements':
        return <Bell className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || notification.category === filter;
    const matchesSearch =
      searchQuery === '' ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Notifications</h1>
        <p className="text-gray-600">
          Manage your notifications and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Notifications List */}
        <div className="md:col-span-2 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="messages">Messages</SelectItem>
                  <SelectItem value="lease">Lease</SelectItem>
                  <SelectItem value="announcements">Announcements</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
              </div>
            </div>
            <Button
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={handleMarkAllAsRead}>
              Mark All as Read
            </Button>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Recent Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Notifications Found
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery
                        ? 'No notifications match your search criteria'
                        : 'You have no notifications'}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${
                        notification.is_read ? 'bg-gray-50' : 'bg-blue-50'
                      }`}>
                      <div
                        className={`p-2 rounded-full ${
                          notification.type === 'success'
                            ? 'bg-green-100'
                            : notification.type === 'warning'
                            ? 'bg-yellow-100'
                            : 'bg-blue-100'
                        }`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <p
                              className={`font-medium ${
                                notification.is_read
                                  ? 'text-gray-900'
                                  : 'text-gray-900'
                              }`}>
                              {notification.title}
                            </p>
                            <Badge className="bg-gray-100 text-gray-700 border-0">
                              <span className="flex items-center gap-1">
                                {getCategoryIcon(notification.category)}
                                {notification.category.charAt(0).toUpperCase() +
                                  notification.category.slice(1)}
                              </span>
                            </Badge>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(
                              notification.created_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <p
                          className={`mt-1 ${
                            notification.is_read
                              ? 'text-gray-700'
                              : 'text-gray-900'
                          }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => handleMarkAsRead(notification.id)}>
                              Mark as Read
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-red-200 text-red-700 hover:bg-red-50"
                            onClick={() =>
                              handleDeleteNotification(notification.id)
                            }>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preferences */}
        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.email_notifications}
                    onCheckedChange={checked =>
                      setPreferences(prev => ({
                        ...prev,
                        email_notifications: checked
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-600">
                      Receive push notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.push_notifications}
                    onCheckedChange={checked =>
                      setPreferences(prev => ({
                        ...prev,
                        push_notifications: checked
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900">Categories</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-gray-600" />
                      <Label>Maintenance Updates</Label>
                    </div>
                    <Switch
                      checked={preferences.categories.maintenance}
                      onCheckedChange={checked =>
                        setPreferences(prev => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            maintenance: checked
                          }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-600" />
                      <Label>Payment Reminders</Label>
                    </div>
                    <Switch
                      checked={preferences.categories.payments}
                      onCheckedChange={checked =>
                        setPreferences(prev => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            payments: checked
                          }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                      <Label>New Messages</Label>
                    </div>
                    <Switch
                      checked={preferences.categories.messages}
                      onCheckedChange={checked =>
                        setPreferences(prev => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            messages: checked
                          }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <Label>Lease Updates</Label>
                    </div>
                    <Switch
                      checked={preferences.categories.lease}
                      onCheckedChange={checked =>
                        setPreferences(prev => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            lease: checked
                          }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-600" />
                      <Label>Announcements</Label>
                    </div>
                    <Switch
                      checked={preferences.categories.announcements}
                      onCheckedChange={checked =>
                        setPreferences(prev => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            announcements: checked
                          }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={handleSavePreferences}
                disabled={savingPreferences}>
                {savingPreferences ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Preferences'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

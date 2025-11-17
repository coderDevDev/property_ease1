'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Home,
  Building,
  CreditCard,
  Wrench,
  MessageSquare,
  Bell,
  Calendar,
  AlertCircle,
  Clock,
  MapPin,
  CheckCircle,
  FileText,
  TrendingUp,
  Search,
  Plus,
  PhilippinePeso
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TenantAPI, type TenantDashboardStats } from '@/lib/api/tenant';

// DashboardStats is now imported as TenantDashboardStats from TenantAPI

export default function TenantDashboardPage() {
  const { authState } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TenantDashboardStats>({
    currentLease: null,
    upcomingPayments: [],
    maintenanceRequests: [],
    recentMessages: [],
    notifications: [],
    quickStats: {
      totalPayments: 0,
      activeRequests: 0,
      unreadMessages: 0,
      documentsCount: 0
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);

        const result = await TenantAPI.getDashboardStats(authState.user.id);

        if (result.success && result.data) {
          setStats(result.data);
        } else {
          console.error('Failed to fetch dashboard data:', result.message);
          // Keep default empty stats on error
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Keep default empty stats on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authState.user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-sm sm:text-base">
              Loading your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      icon: CreditCard,
      label: 'Pay Rent',
      color: 'from-green-500 to-green-600',
      action: () => router.push('/tenant/dashboard/payments'),
      urgent: stats.upcomingPayments.some(p => p.status === 'overdue')
    },
    {
      icon: Wrench,
      label: 'Maintenance',
      color: 'from-orange-500 to-orange-600',
      action: () => router.push('/tenant/dashboard/maintenance'),
      count: stats.quickStats.activeRequests
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      color: 'from-blue-500 to-blue-600',
      action: () => router.push('/tenant/dashboard/messages'),
      count: stats.quickStats.unreadMessages
    },
    // {
    //   icon: FileText,
    //   label: 'Documents',
    //   color: 'from-purple-500 to-purple-600',
    //   action: () => router.push('/tenant/dashboard/documents'),
    //   count: stats.quickStats.documentsCount
    // },
    {
      icon: Search,
      label: 'Find Properties',
      color: 'from-indigo-500 to-indigo-600',
      action: () => router.push('/tenant/dashboard/properties')
    },
    {
      icon: Bell,
      label: 'Notifications',
      color: 'from-red-500 to-red-600',
      action: () => router.push('/tenant/dashboard/notifications'),
      count: stats.notifications.length
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">
                Welcome back, {authState.user?.firstName}!
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                Here's your rental dashboard overview
              </p>
            </div>
            <div className="flex items-center gap-2 text-blue-100">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Current Lease Info */}
        {stats.currentLease && (
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                Current Residence
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                    {stats.currentLease.propertyName}
                  </h3>
                  <p className="text-blue-600 font-medium mb-2 text-sm sm:text-base">
                    {stats.currentLease.unitNumber}
                  </p>
                  <div className="flex items-center gap-1 text-gray-600 mb-4">
                    <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="text-xs sm:text-sm">
                      {stats.currentLease.address}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Monthly Rent
                      </p>
                      <p className="text-lg sm:text-xl font-bold text-gray-900">
                        ₱{stats.currentLease.monthlyRent.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="mb-4">
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Lease Progress
                    </p>
                    <Progress value={75} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.currentLease.daysRemaining} days remaining
                    </p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-blue-800">
                        Lease End Date
                      </span>
                    </div>
                    <p className="text-blue-700 text-sm sm:text-base">
                      {stats.currentLease.leaseEnd.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="h-auto p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 hover:bg-blue-50 hover:shadow-md transition-all duration-200"
                  onClick={action.action}>
                  <div className="relative">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center shadow-md`}>
                      <action.icon className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                    </div>
                    {action.count && action.count > 0 && (
                      <Badge className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 h-4 w-4 sm:h-5 sm:w-5 px-1 sm:px-1.5 text-xs bg-red-500 text-white flex items-center justify-center">
                        {action.count}
                      </Badge>
                    )}
                    {action.urgent && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 text-center">
                    {action.label}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Alerts & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Payment Alerts */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {stats.upcomingPayments.length > 0 ? (
                <div className="space-y-3">
                  {stats.upcomingPayments.map(payment => (
                    <div
                      key={payment.id}
                      className={`p-3 sm:p-4 rounded-lg border ${
                        payment.status === 'overdue'
                          ? 'bg-red-50 border-red-200'
                          : payment.status === 'pending'
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-green-50 border-green-200'
                      }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                        <div className="flex items-center gap-2">
                          {payment.status === 'overdue' ? (
                            <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
                          ) : payment.status === 'pending' ? (
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600 flex-shrink-0" />
                          ) : (
                            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
                          )}
                          <span className="font-medium text-gray-900 text-sm sm:text-base">
                            {payment.type}
                          </span>
                        </div>
                        <Badge
                          className={`text-xs sm:text-sm ${
                            payment.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : payment.status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                        <span className="text-base sm:text-lg font-bold text-gray-900">
                          ₱{payment.amount.toLocaleString()}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          Due: {payment.dueDate.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  <Button
                    className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-sm sm:text-base"
                    onClick={() => router.push('/tenant/dashboard/payments')}>
                    <PhilippinePeso className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    View All Payments
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 text-sm sm:text-base">
                    All payments are up to date!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Bell className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              <div className="space-y-3 sm:space-y-4">
                {/* Recent Messages */}
                {stats.recentMessages.slice(0, 2).map(message => (
                  <div
                    key={message.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                    <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {message.from}
                        </span>
                        {!message.isRead && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-800 font-medium mb-1">
                        {message.subject}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {message.preview}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {message.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                ))}

                {/* Recent Maintenance */}
                {stats.maintenanceRequests.slice(0, 1).map(request => (
                  <div
                    key={request.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer">
                    <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-medium text-gray-900">
                          {request.title}
                        </span>
                        <Badge
                          className={`text-xs ${
                            request.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : request.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}>
                          {request.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600">
                        Created: {request.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  className="w-full mt-4 border-blue-200 text-blue-700 hover:bg-blue-50 text-sm sm:text-base"
                  onClick={() =>
                    router.push('/tenant/dashboard/notifications')
                  }>
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.quickStats.totalPayments}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Total Payments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.quickStats.activeRequests}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Active Requests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.quickStats.unreadMessages}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    New Messages
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">
                    {stats.quickStats.documentsCount}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

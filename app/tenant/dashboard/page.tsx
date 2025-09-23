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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
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
    {
      icon: FileText,
      label: 'Documents',
      color: 'from-purple-500 to-purple-600',
      action: () => router.push('/tenant/dashboard/documents'),
      count: stats.quickStats.documentsCount
    },
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
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {authState.user?.firstName}!
            </h1>
            <p className="text-blue-100">
              Here's your rental dashboard overview
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-blue-100">
            <Clock className="w-5 h-5" />
            <span className="text-sm">
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
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Home className="w-5 h-5 text-blue-600" />
              Current Residence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {stats.currentLease.propertyName}
                </h3>
                <p className="text-blue-600 font-medium mb-2">
                  {stats.currentLease.unitNumber}
                </p>
                <div className="flex items-center gap-1 text-gray-600 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{stats.currentLease.address}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Rent</p>
                    <p className="text-xl font-bold text-gray-900">
                      ₱{stats.currentLease.monthlyRent.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Lease Progress</p>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.currentLease.daysRemaining} days remaining
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      Lease End Date
                    </span>
                  </div>
                  <p className="text-blue-700">
                    {stats.currentLease.leaseEnd.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
        <CardHeader>
          <CardTitle className="text-gray-900">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="ghost"
                className="h-auto p-4 flex flex-col items-center gap-3 hover:bg-blue-50 hover:shadow-md transition-all duration-200"
                onClick={action.action}>
                <div className="relative">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center shadow-md`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  {action.count && action.count > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 px-1.5 text-xs bg-red-500 text-white">
                      {action.count}
                    </Badge>
                  )}
                  {action.urgent && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {action.label}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Alerts & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Payment Alerts */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.upcomingPayments.length > 0 ? (
              <div className="space-y-3">
                {stats.upcomingPayments.map(payment => (
                  <div
                    key={payment.id}
                    className={`p-4 rounded-lg border ${
                      payment.status === 'overdue'
                        ? 'bg-red-50 border-red-200'
                        : payment.status === 'pending'
                        ? 'bg-orange-50 border-orange-200'
                        : 'bg-green-50 border-green-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {payment.status === 'overdue' ? (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        ) : payment.status === 'pending' ? (
                          <Clock className="w-4 h-4 text-orange-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        <span className="font-medium text-gray-900">
                          {payment.type}
                        </span>
                      </div>
                      <Badge
                        className={
                          payment.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : payment.status === 'pending'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800'
                        }>
                        {payment.status.charAt(0).toUpperCase() +
                          payment.status.slice(1)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        ₱{payment.amount.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-600">
                        Due: {payment.dueDate.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
                <Button
                  className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  onClick={() => router.push('/tenant/dashboard/payments')}>
                  <PhilippinePeso className="w-4 h-4 mr-2" />
                  View All Payments
                </Button>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600">All payments are up to date!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Bell className="w-5 h-5 text-blue-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Recent Messages */}
              {stats.recentMessages.slice(0, 2).map(message => (
                <div
                  key={message.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {message.from}
                      </span>
                      {!message.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-gray-800 font-medium mb-1">
                      {message.subject}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {message.preview}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {message.createdAt.toLocaleDateString()}
                  </span>
                </div>
              ))}

              {/* Recent Maintenance */}
              {stats.maintenanceRequests.slice(0, 1).map(request => (
                <div
                  key={request.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer">
                  <Wrench className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {request.title}
                      </span>
                      <Badge
                        className={
                          request.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-800'
                            : request.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }>
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
                className="w-full mt-4 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => router.push('/tenant/dashboard/notifications')}>
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
          <CardContent className="p-6 text-center">
            <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-80" />
            <div className="text-2xl font-bold mb-1">
              {stats.quickStats.totalPayments}
            </div>
            <p className="text-blue-100 text-sm">Total Payments</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg">
          <CardContent className="p-6 text-center">
            <Wrench className="w-8 h-8 mx-auto mb-3 opacity-80" />
            <div className="text-2xl font-bold mb-1">
              {stats.quickStats.activeRequests}
            </div>
            <p className="text-orange-100 text-sm">Active Requests</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-6 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-80" />
            <div className="text-2xl font-bold mb-1">
              {stats.quickStats.unreadMessages}
            </div>
            <p className="text-purple-100 text-sm">New Messages</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
          <CardContent className="p-6 text-center">
            <FileText className="w-8 h-8 mx-auto mb-3 opacity-80" />
            <div className="text-2xl font-bold mb-1">
              {stats.quickStats.documentsCount}
            </div>
            <p className="text-green-100 text-sm">Documents</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

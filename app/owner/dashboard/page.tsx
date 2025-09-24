'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import {
  Bell,
  Building,
  Users,
  Wrench,
  TrendingUp,
  BarChart3,
  Plus,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  PhilippinePeso,
  List
} from 'lucide-react';
import { PropertiesAPI } from '@/lib/api/properties';
import { TenantsAPI } from '@/lib/api/tenants';
import { PaymentsAPI } from '@/lib/api/payments';
import { MaintenanceAPI } from '@/lib/api/maintenance';
import { MessagesAPI } from '@/lib/api/messages';
import { toast } from 'sonner';

interface DashboardData {
  properties: any[];
  tenants: any[];
  payments: any[];
  maintenance: any[];
  recentActivity: any[];
  stats: {
    totalRevenue: number;
    monthlyRevenue: number;
    activeProperties: number;
    activeTenants: number;
    pendingMaintenance: number;
    unreadMessages: number;
    occupancyRate: number;
    revenueGrowth: number;
  };
}

export default function OwnerDashboard() {
  const { authState } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    properties: [],
    tenants: [],
    payments: [],
    maintenance: [],
    recentActivity: [],
    stats: {
      totalRevenue: 0,
      monthlyRevenue: 0,
      activeProperties: 0,
      activeTenants: 0,
      pendingMaintenance: 0,
      unreadMessages: 0,
      occupancyRate: 0,
      revenueGrowth: 0
    }
  });
  const [currentTime] = useState(
    new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  );

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!authState.user?.id) return;

      try {
        setIsLoading(true);

        // Fetch all data in parallel
        const [
          propertiesResult,
          tenantsResult,
          paymentsResult,
          maintenanceResult,
          messagesResult
        ] = await Promise.all([
          PropertiesAPI.getProperties(authState.user.id),
          TenantsAPI.getTenants(authState.user.id),
          PaymentsAPI.getOwnerPayments(authState.user.id),
          MaintenanceAPI.getMaintenanceRequests(authState.user.id),
          MessagesAPI.getUnreadMessagesCount(authState.user.id)
        ]);

        const properties = propertiesResult.success
          ? propertiesResult.data || []
          : [];
        const tenants = tenantsResult.success ? tenantsResult.data || [] : [];
        const payments = paymentsResult.success
          ? paymentsResult.data || []
          : [];
        const maintenance = maintenanceResult.success
          ? maintenanceResult.data || []
          : [];
        const unreadMessages = messagesResult.success
          ? typeof messagesResult.data === 'number'
            ? messagesResult.data
            : messagesResult.data?.count || 0
          : 0;

        // Calculate statistics
        const activeProperties = properties.filter(
          (p: any) => p.status === 'active'
        ).length;
        const activeTenants = tenants.filter(
          (t: any) => t.status === 'active'
        ).length;
        const pendingMaintenance = maintenance.filter(
          (m: any) => m.status === 'pending' || m.status === 'in_progress'
        ).length;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyRevenue = payments
          .filter((p: any) => {
            const paymentDate = new Date(p.paid_date || p.created_at);
            return (
              p.payment_status === 'paid' &&
              paymentDate.getMonth() === currentMonth &&
              paymentDate.getFullYear() === currentYear
            );
          })
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        const totalRevenue = payments
          .filter((p: any) => p.payment_status === 'paid')
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const previousMonthRevenue = payments
          .filter((p: any) => {
            const paymentDate = new Date(p.paid_date || p.created_at);
            return (
              p.payment_status === 'paid' &&
              paymentDate.getMonth() === previousMonth &&
              paymentDate.getFullYear() === previousYear
            );
          })
          .reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        const revenueGrowth =
          previousMonthRevenue > 0
            ? ((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) *
              100
            : 0;

        const totalUnits = properties.reduce(
          (sum: number, p: any) => sum + (p.total_units || 1),
          0
        );
        const occupancyRate =
          totalUnits > 0 ? (activeTenants / totalUnits) * 100 : 0;

        // Create recent activity
        const recentActivity = [
          ...maintenance.slice(0, 2).map((m: any) => ({
            type: 'maintenance',
            title: 'Maintenance Request',
            description: m.description || 'New maintenance request',
            time: new Date(m.created_at).toLocaleDateString(),
            status: m.status,
            priority: m.priority
          })),
          ...payments.slice(0, 2).map((p: any) => ({
            type: 'payment',
            title: 'Payment Received',
            description: `Payment of ${formatCurrency(p.amount)}`,
            time: new Date(p.created_at).toLocaleDateString(),
            status: p.payment_status
          }))
        ]
          .sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
          )
          .slice(0, 5);

        setDashboardData({
          properties,
          tenants,
          payments,
          maintenance,
          recentActivity,
          stats: {
            totalRevenue,
            monthlyRevenue,
            activeProperties,
            activeTenants,
            pendingMaintenance,
            unreadMessages,
            occupancyRate,
            revenueGrowth
          }
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [authState.user?.id]);

  // Helper functions
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (growth < 0)
      return <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />;
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const quickActions = [
    {
      icon: Building,
      label: 'Properties',
      color: 'from-blue-500 to-blue-600',
      route: '/owner/dashboard/properties',
      count: dashboardData.stats.activeProperties.toString(),
      description: 'Manage properties'
    },
    {
      icon: Users,
      label: 'Tenants',
      color: 'from-purple-500 to-purple-600',
      route: '/owner/dashboard/tenants',
      count: dashboardData.stats.activeTenants.toString(),
      description: 'Tenant management'
    },
    {
      icon: Wrench,
      label: 'Maintenance',
      color: 'from-orange-500 to-orange-600',
      route: '/owner/dashboard/maintenance',
      count: dashboardData.stats.pendingMaintenance.toString(),
      description: 'Pending requests'
    },
    {
      icon: PhilippinePeso,
      label: 'Payments',
      color: 'from-green-500 to-green-600',
      route: '/owner/dashboard/payments',
      count: '',
      description: 'Payment tracking'
    },
    {
      icon: Plus,
      label: 'Add Property',
      color: 'from-cyan-500 to-cyan-600',
      route: '/owner/dashboard/properties/new',
      count: '',
      description: 'Create new property'
    }
  ];

  const handleActionClick = (route: string) => {
    router.push(route);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-blue-600 font-medium text-sm sm:text-base">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Welcome back, {authState.user?.firstName}! Here's your property
              overview.
            </p>
          </div>
          <div className="text-xs sm:text-sm text-gray-600">
            Last updated: {currentTime}
          </div>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {dashboardData.stats.activeProperties}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Active Properties
                  </p>
                  <div className="flex items-center mt-1">
                    <MapPin className="w-3 h-3 mr-1 text-blue-500 flex-shrink-0" />
                    <span className="text-xs text-blue-600 truncate">
                      {Math.round(dashboardData.stats.occupancyRate)}% occupied
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {dashboardData.stats.activeTenants}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Active Tenants
                  </p>
                  <div className="flex items-center mt-1">
                    <CheckCircle className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" />
                    <span className="text-xs text-green-600 truncate">
                      {dashboardData.tenants.length} total
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {dashboardData.stats.pendingMaintenance}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Maintenance
                  </p>
                  <div className="flex items-center mt-1">
                    {dashboardData.stats.pendingMaintenance > 0 ? (
                      <>
                        <AlertTriangle className="w-3 h-3 mr-1 text-orange-500 flex-shrink-0" />
                        <span className="text-xs text-orange-600 truncate">
                          Pending requests
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1 text-green-500 flex-shrink-0" />
                        <span className="text-xs text-green-600 truncate">
                          All up to date
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                    {formatCurrency(dashboardData.stats.monthlyRevenue)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Monthly Revenue
                  </p>
                  <div className="flex items-center mt-1">
                    {getGrowthIcon(dashboardData.stats.revenueGrowth)}
                    <span
                      className={`text-xs ml-1 truncate ${
                        dashboardData.stats.revenueGrowth > 0
                          ? 'text-green-600'
                          : dashboardData.stats.revenueGrowth < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                      {dashboardData.stats.revenueGrowth > 0 ? '+' : ''}
                      {Math.round(dashboardData.stats.revenueGrowth * 100) /
                        100}
                      % vs last month
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <CardTitle className="text-blue-700 flex items-center gap-2 text-lg sm:text-xl">
          <List className="w-4 h-4 sm:w-5 sm:h-5" />
          Quick Actions
        </CardTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {quickActions.map((action, index) => (
            <Card
              key={index}
              className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer"
              onClick={() => handleActionClick(action.route)}>
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="relative mb-2 sm:mb-3">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mx-auto shadow-md`}>
                    <action.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  {action.count && parseInt(action.count) > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {action.count}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-gray-800 text-xs sm:text-sm font-semibold leading-tight">
                  {action.label}
                </p>
                <p className="text-gray-500 text-xs mt-1 hidden sm:block">
                  {action.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardHeader className="p-3 sm:p-6">
            <CardTitle className="text-blue-700 flex items-center gap-2 text-lg sm:text-xl">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0">
            {dashboardData.recentActivity.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {dashboardData.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 sm:p-4 rounded-lg bg-blue-50/50 border border-blue-200/50 hover:bg-blue-50 transition-colors">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 ${
                        activity.type === 'maintenance'
                          ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                          : activity.type === 'payment'
                          ? 'bg-gradient-to-r from-green-500 to-green-600'
                          : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}>
                      {activity.type === 'maintenance' ? (
                        <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : activity.type === 'payment' ? (
                        <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-semibold text-xs sm:text-sm">
                        {activity.title}
                      </p>
                      <p className="text-gray-600 text-xs truncate">
                        {activity.description}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {activity.time}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs border-0 flex-shrink-0 ${
                        activity.status === 'completed' ||
                        activity.status === 'paid'
                          ? 'bg-green-100 text-green-700'
                          : activity.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : activity.priority === 'high'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                      {activity.status || activity.priority || 'New'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No recent activity</p>
                <p className="text-gray-400 text-xs">
                  Check back later for updates
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

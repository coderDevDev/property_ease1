'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  Wrench,
  BarChart3,
  Settings,
  Shield,
  AlertCircle,
  TrendingUp,
  Activity,
  FileText,
  Database,
  Server,
  CreditCard,
  PhilippinePeso
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { useAuth } from '@/hooks/useAuth';

interface SystemStats {
  users: {
    total: number;
    active: number;
    owners: number;
    tenants: number;
    admins: number;
    newThisMonth: number;
  };
  properties: {
    total: number;
    active: number;
    maintenance: number;
    inactive: number;
    newThisMonth: number;
  };
  tenants: {
    total: number;
    active: number;
    pending: number;
    terminated: number;
    newThisMonth: number;
  };
  payments: {
    total: number;
    paid: number;
    pending: number;
    failed: number;
    totalAmount: number;
    thisMonthAmount: number;
  };
}

export function AdminDashboard() {
  const { authState } = useAuth();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setIsLoading(true);
      const result = await AdminAPI.getSystemStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load system stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Quick action navigation
  const handleQuickAction = (route: string) => {
    window.location.href = route;
  };

  const quickActions = [
    {
      icon: Users,
      label: 'Users',
      color: 'from-blue-500 to-blue-600',
      route: '/dashboard/users',
      count: stats?.users.total.toString() || '0',
      description: 'Manage users'
    },
    {
      icon: Building2,
      label: 'Properties',
      color: 'from-purple-500 to-purple-600',
      route: '/dashboard/properties',
      count: stats?.properties.total.toString() || '0',
      description: 'Property oversight'
    },
    {
      icon: PhilippinePeso,
      label: 'Payments',
      color: 'from-green-500 to-green-600',
      route: '/dashboard/payments',
      count: formatCurrency(stats?.payments.thisMonthAmount || 0),
      description: 'This month'
    },
    {
      icon: Wrench,
      label: 'Maintenance',
      color: 'from-orange-500 to-orange-600',
      route: '/dashboard/maintenance',
      count: '0',
      description: 'Track requests'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      color: 'from-cyan-500 to-cyan-600',
      route: '/dashboard/analytics',
      count: '',
      description: 'System insights'
    },
    {
      icon: Settings,
      label: 'Settings',
      color: 'from-gray-500 to-gray-600',
      route: '/dashboard/settings',
      count: '',
      description: 'Configuration'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Welcome back, {authState.user?.firstName}!
              </h1>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            </div>
            <p className="text-gray-600">Here's your system overview for today.</p>
          </div>

          {/* Overview Section */}
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.users.total || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    +{stats?.users.newThisMonth || 0} this month
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Properties
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.properties.total || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.properties.active || 0} active
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Monthly Revenue
                  </CardTitle>
                  <PhilippinePeso className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stats?.payments.thisMonthAmount || 0)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.payments.paid || 0} payments processed
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Active Tenants
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats?.tenants.active || 0}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {stats?.tenants.pending || 0} pending approval
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Card
                      key={action.label}
                      className="cursor-pointer hover:shadow-lg transition-all duration-200 border-blue-100 hover:border-blue-300"
                      onClick={() => handleQuickAction(action.route)}
                    >
                      <CardContent className="p-6 text-center">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${action.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                        {action.count && (
                          <p className="text-lg font-bold text-blue-600 mb-1">{action.count}</p>
                        )}
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* User Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    User Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Property Owners
                    </span>
                    <Badge variant="outline">{stats?.users.owners || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tenants</span>
                    <Badge variant="outline">{stats?.users.tenants || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Administrators
                    </span>
                    <Badge variant="outline">{stats?.users.admins || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <Badge className="bg-green-100 text-green-700">
                      {stats?.users.active || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Database Status
                    </span>
                    <Badge className="bg-green-100 text-green-700">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Storage Status
                    </span>
                    <Badge className="bg-green-100 text-green-700">
                      Healthy
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">API Status</span>
                    <Badge className="bg-green-100 text-green-700">
                      Operational
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Last Backup</span>
                    <span className="text-sm text-gray-500">2 hours ago</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Remove unused tab sections below
/*
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <p className="text-sm text-gray-600">
                  Manage all user accounts and permissions
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    User Management Interface
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Advanced user management features coming soon
                  </p>
                  <Button variant="outline">View All Users</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Property Oversight</CardTitle>
                <p className="text-sm text-gray-600">
                  Monitor all properties across the platform
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Building2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.properties.active || 0}
                    </div>
                    <p className="text-sm text-gray-600">Active Properties</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Wrench className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.properties.maintenance || 0}
                    </div>
                    <p className="text-sm text-gray-600">Under Maintenance</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <AlertCircle className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">
                      {stats?.properties.inactive || 0}
                    </div>
                    <p className="text-sm text-gray-600">Inactive Properties</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
                <p className="text-sm text-gray-600">
                  Monitor payment transactions and revenue
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-700">
                      {stats?.payments.paid || 0}
                    </div>
                    <p className="text-sm text-gray-600">Paid</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-700">
                      {stats?.payments.pending || 0}
                    </div>
                    <p className="text-sm text-gray-600">Pending</p>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-700">
                      {stats?.payments.failed || 0}
                    </div>
                    <p className="text-sm text-gray-600">Failed</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-700">
                      {formatCurrency(stats?.payments.totalAmount || 0)}
                    </div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Overview</CardTitle>
                <p className="text-sm text-gray-600">
                  System-wide maintenance request monitoring
                </p>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Maintenance Management
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Advanced maintenance tracking coming soon
                  </p>
                  <Button variant="outline">View All Requests</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    System Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Database Configuration
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Server className="h-4 w-4 mr-2" />
                    API Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Audit Logs
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    System Maintenance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start">
                    Cleanup Expired Data
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Generate System Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Backup Database
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Run Health Check
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
*/

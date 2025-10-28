'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  Calendar,
  Download,
  RefreshCw,
  PieChart,
  Activity,
  Target,
  PhilippinePeso
} from 'lucide-react';
import { AdminAPI } from '@/lib/api/admin';
import { toast } from 'sonner';

interface AnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  };
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
    breakdown: {
      owners: number;
      tenants: number;
      admins: number;
    };
  };
  properties: {
    total: number;
    active: number;
    occupancyRate: number;
    averageRent: number;
    growth: number;
  };
  payments: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    successRate: number;
    averageAmount: number;
  };
  maintenance: {
    total: number;
    completed: number;
    pending: number;
    averageResolutionTime: number;
    totalCost: number;
  };
  geographic: {
    topCities: Array<{
      city: string;
      properties: number;
      revenue: number;
    }>;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Loading analytics for time range:', timeRange);

      // Fetch real data from the database
      const result = await AdminAPI.getSystemAnalytics(timeRange);

      if (result.success && result.data) {
        console.log('✅ Analytics data loaded successfully:', result.data);
        setAnalytics(result.data);
        toast.success('Analytics data refreshed successfully');
      } else {
        console.warn(
          '⚠️ Analytics API returned error, using fallback data:',
          result.message
        );

        // Fallback to mock data if API fails
        const fallbackAnalytics: AnalyticsData = {
          revenue: {
            total: 0,
            monthly: 0,
            growth: 0,
            trend: 'stable'
          },
          users: {
            total: 0,
            active: 0,
            newThisMonth: 0,
            growth: 0,
            breakdown: {
              owners: 0,
              tenants: 0,
              admins: 0
            }
          },
          properties: {
            total: 0,
            active: 0,
            occupancyRate: 0,
            averageRent: 0,
            growth: 0
          },
          payments: {
            total: 0,
            successful: 0,
            failed: 0,
            pending: 0,
            successRate: 0,
            averageAmount: 0
          },
          maintenance: {
            total: 0,
            completed: 0,
            pending: 0,
            averageResolutionTime: 0,
            totalCost: 0
          },
          geographic: {
            topCities: []
          }
        };

        setAnalytics(fallbackAnalytics);
        toast.error(result.message || 'Failed to load analytics data');
      }
    } catch (error) {
      console.error('💥 Failed to load analytics:', error);
      toast.error('Failed to load analytics data');

      // Set empty analytics on error
      const emptyAnalytics: AnalyticsData = {
        revenue: {
          total: 0,
          monthly: 0,
          growth: 0,
          trend: 'stable'
        },
        users: {
          total: 0,
          active: 0,
          newThisMonth: 0,
          growth: 0,
          breakdown: {
            owners: 0,
            tenants: 0,
            admins: 0
          }
        },
        properties: {
          total: 0,
          active: 0,
          occupancyRate: 0,
          averageRent: 0,
          growth: 0
        },
        payments: {
          total: 0,
          successful: 0,
          failed: 0,
          pending: 0,
          successRate: 0,
          averageAmount: 0
        },
        maintenance: {
          total: 0,
          completed: 0,
          pending: 0,
          averageResolutionTime: 0,
          totalCost: 0
        },
        geographic: {
          topCities: []
        }
      };

      setAnalytics(emptyAnalytics);
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

  const getTrendIcon = (trend: 'up' | 'down' | 'stable', growth: number) => {
    if (trend === 'up' || growth > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (trend === 'down' || growth < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No analytics data available
          </h3>
          <p className="text-gray-600">Please try again later.</p>
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
              Analytics & Reporting
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Comprehensive system analytics and insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={loadAnalytics}
              variant="outline"
              size="sm"
              disabled={isLoading}
              className="bg-white/70 backdrop-blur-sm border-blue-200/50 hover:bg-white">
              <RefreshCw
                className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`}
              />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => toast.info('Export functionality coming soon!')}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4 sm:space-y-6">
        <TabsList className="bg-white/70 backdrop-blur-sm border-blue-200/50 grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Revenue
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Users
          </TabsTrigger>
          <TabsTrigger value="properties" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Properties
          </TabsTrigger>
          <TabsTrigger value="operations" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
            Operations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <PhilippinePeso className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      ₱{(analytics.revenue.total / 1000).toFixed(0)}K
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Total Revenue</p>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  {getTrendIcon(
                    analytics.revenue.trend,
                    analytics.revenue.growth
                  )}
                  <span
                    className={`text-xs ml-1 ${getTrendColor(
                      analytics.revenue.growth
                    )}`}>
                    {analytics.revenue.growth > 0 ? '+' : ''}
                    {analytics.revenue.growth}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {analytics.users.active.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Active Users</p>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  {getTrendIcon('up', analytics.users.growth)}
                  <span
                    className={`text-xs ml-1 ${getTrendColor(
                      analytics.users.growth
                    )}`}>
                    +{analytics.users.growth}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {analytics.properties.occupancyRate}%
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Occupancy</p>
                  </div>
                </div>
                <div className="flex items-center mt-2">
                  {getTrendIcon('up', analytics.properties.growth)}
                  <span
                    className={`text-xs ml-1 ${getTrendColor(
                      analytics.properties.growth
                    )}`}>
                    +{analytics.properties.growth}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-cyan-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {analytics.payments.successRate}%
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Success Rate</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {analytics.payments.successful} of {analytics.payments.total}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <PieChart className="w-5 h-5" />
                  User Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tenants</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (analytics.users.breakdown.tenants /
                                analytics.users.total) *
                              100
                            }%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">
                        {analytics.users.breakdown.tenants}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Property Owners
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (analytics.users.breakdown.owners /
                                analytics.users.total) *
                              100
                            }%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">
                        {analytics.users.breakdown.owners}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Administrators
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (analytics.users.breakdown.admins /
                                analytics.users.total) *
                              100
                            }%`
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">
                        {analytics.users.breakdown.admins}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <BarChart3 className="w-5 h-5" />
                  Top Performing Cities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.geographic.topCities.length > 0 ? (
                    analytics.geographic.topCities.map((city, index) => (
                      <div
                        key={city.city}
                        className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {city.city}
                          </div>
                          <div className="text-sm text-gray-500">
                            {city.properties} properties
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(city.revenue)}
                          </div>
                          <div className="text-sm text-gray-500">
                            #{index + 1} by revenue
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Building2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        No geographic data available
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Add properties with city information to see geographic
                        analytics
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.revenue.total)}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  All-time revenue from all properties
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.revenue.monthly)}
                </div>
                <div className="flex items-center mt-2">
                  {getTrendIcon(
                    analytics.revenue.trend,
                    analytics.revenue.growth
                  )}
                  <span
                    className={`text-sm ml-1 ${getTrendColor(
                      analytics.revenue.growth
                    )}`}>
                    {analytics.revenue.growth > 0 ? '+' : ''}
                    {analytics.revenue.growth}% vs last month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.payments.averageAmount)}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Per successful payment
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {analytics.users.total.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  All registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  {analytics.users.active.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {Math.round(
                    (analytics.users.active / analytics.users.total) * 100
                  )}
                  % of total users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>New This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">
                  {analytics.users.newThisMonth}
                </div>
                <div className="flex items-center mt-2">
                  {getTrendIcon('up', analytics.users.growth)}
                  <span className="text-sm text-green-600 ml-1">
                    +{analytics.users.growth}% growth
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">
                  +{analytics.users.growth}%
                </div>
                <p className="text-sm text-gray-600 mt-2">Month over month</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Properties Tab */}
        <TabsContent value="properties" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {analytics.properties.total}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {analytics.properties.active} active properties
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Occupancy Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-700">
                  {analytics.properties.occupancyRate}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Above industry average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Average Rent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-700">
                  {formatCurrency(analytics.properties.averageRent)}
                </div>
                <p className="text-sm text-gray-600 mt-2">Per unit per month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-700">
                  +{analytics.properties.growth}%
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  New properties this period
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="font-medium text-green-700">
                    {analytics.payments.successRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Successful</span>
                  <span className="font-medium">
                    {analytics.payments.successful}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Failed</span>
                  <span className="font-medium text-red-700">
                    {analytics.payments.failed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending</span>
                  <span className="font-medium text-yellow-700">
                    {analytics.payments.pending}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Analytics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-medium text-green-700">
                    {Math.round(
                      (analytics.maintenance.completed /
                        analytics.maintenance.total) *
                        100
                    )}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Avg Resolution Time
                  </span>
                  <span className="font-medium">
                    {analytics.maintenance.averageResolutionTime} days
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Cost</span>
                  <span className="font-medium">
                    {formatCurrency(analytics.maintenance.totalCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Pending Requests
                  </span>
                  <span className="font-medium text-yellow-700">
                    {analytics.maintenance.pending}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

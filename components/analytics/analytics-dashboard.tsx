'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from './stat-card';
import { Chart } from './chart';
import { AnalyticsFilters } from './analytics-filters';
import {
  AnalyticsAPI,
  type AnalyticsOverview,
  type RevenueAnalytics,
  type PropertyAnalytics,
  type MaintenanceAnalytics
} from '@/lib/api/analytics';
import { PropertiesAPI } from '@/lib/api/properties';
import { TenantsAPI } from '@/lib/api/tenants';
import { useAuth } from '@/hooks/useAuth';
import {
  Building2,
  Users,
  DollarSign,
  Wrench,
  TrendingUp,
  BarChart3,
  PieChart,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsDashboardProps {
  role: 'owner' | 'tenant';
  className?: string;
}

export function AnalyticsDashboard({
  role,
  className
}: AnalyticsDashboardProps) {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [revenueAnalytics, setRevenueAnalytics] =
    useState<RevenueAnalytics | null>(null);
  const [propertyAnalytics, setPropertyAnalytics] =
    useState<PropertyAnalytics | null>(null);
  const [maintenanceAnalytics, setMaintenanceAnalytics] =
    useState<MaintenanceAnalytics | null>(null);
  const [properties, setProperties] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [tenants, setTenants] = useState<Array<{ id: string; name: string }>>(
    []
  );
  const [filters, setFilters] = useState<any>({});

  const loadData = async () => {
    if (!authState.user?.id) return;

    setLoading(true);
    try {
      // Load overview data
      const overviewResult = await AnalyticsAPI.getOverview(
        authState.user.id,
        role,
        filters
      );
      if (overviewResult.success && overviewResult.data) {
        setOverview(overviewResult.data);
      }

      // Load revenue analytics
      const revenueResult = await AnalyticsAPI.getRevenueAnalytics(
        authState.user.id,
        role,
        filters
      );
      if (revenueResult.success && revenueResult.data) {
        setRevenueAnalytics(revenueResult.data);
      }

      // Load property analytics
      const propertyResult = await AnalyticsAPI.getPropertyAnalytics(
        authState.user.id,
        role,
        filters
      );
      if (propertyResult.success && propertyResult.data) {
        setPropertyAnalytics(propertyResult.data);
      }

      // Load maintenance analytics
      const maintenanceResult = await AnalyticsAPI.getMaintenanceAnalytics(
        authState.user.id,
        role,
        filters
      );
      if (maintenanceResult.success && maintenanceResult.data) {
        setMaintenanceAnalytics(maintenanceResult.data);
      }

      // Load properties and tenants for filters
      if (role === 'owner') {
        const propertiesResult = await PropertiesAPI.getProperties(
          authState.user.id
        );
        if (propertiesResult.success && propertiesResult.data) {
          setProperties(
            propertiesResult.data.map(p => ({ id: p.id, name: p.name }))
          );
        }
      } else {
        const tenantResult = await TenantsAPI.getTenantByUserId(
          authState.user.id
        );
        if (tenantResult.success && tenantResult.data) {
          setProperties([
            {
              id: tenantResult.data.property.id,
              name: tenantResult.data.property.name
            }
          ]);
          setTenants([
            {
              id: tenantResult.data.id,
              name: `${tenantResult.data.user?.first_name} ${tenantResult.data.user?.last_name}`
            }
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [authState.user?.id, role, filters]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-100 p-3 sm:p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-blue-600 font-medium text-sm sm:text-base">Loading analytics...</p>
          </div>
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
              Analytics Dashboard
            </h1>
            <p className="text-blue-600/70 mt-1 text-sm sm:text-base">
              Insights and reports for your properties
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 transition-all duration-200 text-sm sm:text-base">
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <StatCard
              title="Total Properties"
              value={overview.totalProperties}
              icon={Building2}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Active Tenants"
              value={overview.totalTenants}
              icon={Users}
              iconColor="text-green-600"
            />
            <StatCard
              title="Total Revenue"
              value={`₱${overview.totalRevenue.toLocaleString()}`}
              icon={DollarSign}
              iconColor="text-green-600"
            />
            <StatCard
              title="Occupancy Rate"
              value={`${overview.occupancyRate}%`}
              icon={TrendingUp}
              iconColor="text-purple-600"
            />
          </div>
        )}

        {/* Additional Stats */}
        {overview && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <StatCard
              title="Maintenance Requests"
              value={overview.totalMaintenanceRequests}
              icon={Wrench}
              iconColor="text-orange-600"
            />
            <StatCard
              title="Average Rent"
              value={`₱${overview.averageRent.toLocaleString()}`}
              icon={DollarSign}
              iconColor="text-blue-600"
            />
            <StatCard
              title="Pending Payments"
              value={`₱${overview.pendingPayments.toLocaleString()}`}
              icon={DollarSign}
              iconColor="text-red-600"
            />
            <StatCard
              title="Completed Maintenance"
              value={overview.completedMaintenance}
              icon={Wrench}
              iconColor="text-green-600"
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 sm:mb-6">
          <AnalyticsFilters
            onFiltersChange={handleFiltersChange}
            properties={properties}
            tenants={tenants}
          />
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="revenue" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg">
            <TabsTrigger
              value="revenue"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              Revenue
            </TabsTrigger>
            <TabsTrigger
              value="properties"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              Properties
            </TabsTrigger>
            <TabsTrigger
              value="maintenance"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              Maintenance
            </TabsTrigger>
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              Overview
            </TabsTrigger>
          </TabsList>

          {/* Revenue Analytics */}
          <TabsContent value="revenue" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {revenueAnalytics?.monthlyRevenue && (
                <Chart
                  title="Monthly Revenue Trend"
                  data={revenueAnalytics.monthlyRevenue.map(item => ({
                    label: item.month,
                    value: item.revenue
                  }))}
                  type="line"
                />
              )}
              {revenueAnalytics?.paymentTypes && (
                <Chart
                  title="Revenue by Payment Type"
                  data={revenueAnalytics.paymentTypes.map(item => ({
                    label: item.type,
                    value: item.amount
                  }))}
                  type="doughnut"
                />
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {revenueAnalytics?.paymentStatus && (
                <Chart
                  title="Payment Status Distribution"
                  data={revenueAnalytics.paymentStatus.map(item => ({
                    label: item.status,
                    value: item.count
                  }))}
                  type="pie"
                />
              )}
            </div>
          </TabsContent>

          {/* Property Analytics */}
          <TabsContent value="properties" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {propertyAnalytics?.propertiesByType && (
                <Chart
                  title="Properties by Type"
                  data={propertyAnalytics.propertiesByType.map(item => ({
                    label: item.type,
                    value: item.count
                  }))}
                  type="bar"
                />
              )}
              {propertyAnalytics?.propertiesByStatus && (
                <Chart
                  title="Properties by Status"
                  data={propertyAnalytics.propertiesByStatus.map(item => ({
                    label: item.status,
                    value: item.count
                  }))}
                  type="pie"
                />
              )}
            </div>
            {propertyAnalytics?.topPerformingProperties && (
              <Card className="bg-white/70 backdrop-blur-sm border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-200">
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="text-blue-700 text-base sm:text-lg">
                    Top Performing Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    {propertyAnalytics.topPerformingProperties.map(
                      (property, index) => (
                        <div
                          key={property.propertyId}
                          className="flex items-center justify-between p-3 sm:p-4 bg-blue-50/50 rounded-lg border border-blue-200/50 hover:bg-blue-50 transition-colors">
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-xs sm:text-sm font-semibold text-white">
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm sm:text-base">
                                {property.propertyName}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600">
                                {property.tenantCount} tenants •{' '}
                                {property.occupancy}% occupancy
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600 text-sm sm:text-base">
                              ₱{property.revenue.toLocaleString()}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">Revenue</div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Maintenance Analytics */}
          <TabsContent value="maintenance" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {maintenanceAnalytics?.maintenanceByCategory && (
                <Chart
                  title="Maintenance by Category"
                  data={maintenanceAnalytics.maintenanceByCategory.map(
                    item => ({
                      label: item.category,
                      value: item.count
                    })
                  )}
                  type="bar"
                />
              )}
              {maintenanceAnalytics?.maintenanceByStatus && (
                <Chart
                  title="Maintenance by Status"
                  data={maintenanceAnalytics.maintenanceByStatus.map(item => ({
                    label: item.status,
                    value: item.count
                  }))}
                  type="pie"
                />
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {maintenanceAnalytics?.maintenanceByPriority && (
                <Chart
                  title="Maintenance by Priority"
                  data={maintenanceAnalytics.maintenanceByPriority.map(
                    item => ({
                      label: item.priority,
                      value: item.count
                    })
                  )}
                  type="doughnut"
                />
              )}
              {maintenanceAnalytics?.maintenanceTrends && (
                <Chart
                  title="Maintenance Trends"
                  data={maintenanceAnalytics.maintenanceTrends.map(item => ({
                    label: item.month,
                    value: item.requests
                  }))}
                  type="line"
                />
              )}
            </div>
          </TabsContent>

          {/* Overview Analytics */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {overview && (
                <>
                  <Chart
                    title="Property Distribution"
                    data={[
                      { label: 'Occupied', value: overview.totalTenants },
                      {
                        label: 'Available',
                        value: overview.totalProperties - overview.totalTenants
                      }
                    ]}
                    type="doughnut"
                  />
                  <Chart
                    title="Revenue vs Pending"
                    data={[
                      { label: 'Collected', value: overview.totalRevenue },
                      { label: 'Pending', value: overview.pendingPayments }
                    ]}
                    type="pie"
                  />
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

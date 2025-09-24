import { supabase } from '@/lib/supabase';

export interface AnalyticsOverview {
  totalProperties: number;
  totalTenants: number;
  totalRevenue: number;
  totalMaintenanceRequests: number;
  occupancyRate: number;
  averageRent: number;
  pendingPayments: number;
  completedMaintenance: number;
}

export interface RevenueAnalytics {
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    payments: number;
  }>;
  paymentTypes: Array<{
    type: string;
    amount: number;
    count: number;
  }>;
  paymentStatus: Array<{
    status: string;
    amount: number;
    count: number;
  }>;
}

export interface PropertyAnalytics {
  propertiesByType: Array<{
    type: string;
    count: number;
    occupancy: number;
  }>;
  propertiesByStatus: Array<{
    status: string;
    count: number;
  }>;
  topPerformingProperties: Array<{
    propertyId: string;
    propertyName: string;
    revenue: number;
    occupancy: number;
    tenantCount: number;
  }>;
}

export interface MaintenanceAnalytics {
  maintenanceByCategory: Array<{
    category: string;
    count: number;
    avgCost: number;
  }>;
  maintenanceByStatus: Array<{
    status: string;
    count: number;
  }>;
  maintenanceByPriority: Array<{
    priority: string;
    count: number;
  }>;
  maintenanceTrends: Array<{
    month: string;
    requests: number;
    completed: number;
    avgCost: number;
  }>;
}

export interface TenantAnalytics {
  tenantsByStatus: Array<{
    status: string;
    count: number;
  }>;
  leaseExpirations: Array<{
    month: string;
    expiring: number;
    renewed: number;
  }>;
  tenantRetention: {
    totalTenants: number;
    activeTenants: number;
    retentionRate: number;
  };
}

export interface CommunicationAnalytics {
  messagesByType: Array<{
    type: string;
    count: number;
  }>;
  announcementsByType: Array<{
    type: string;
    count: number;
  }>;
  communicationTrends: Array<{
    month: string;
    messages: number;
    announcements: number;
  }>;
}

export interface AnalyticsFilters {
  dateRange?: {
    start: string;
    end: string;
  };
  propertyIds?: string[];
  tenantIds?: string[];
}

export class AnalyticsAPI {
  // Get overview statistics
  static async getOverview(
    userId: string,
    role: 'owner' | 'tenant',
    filters?: AnalyticsFilters
  ): Promise<{
    success: boolean;
    data?: AnalyticsOverview;
    message?: string;
  }> {
    try {
      const baseQuery =
        role === 'owner'
          ? supabase.from('properties').select('id').eq('owner_id', userId)
          : supabase
              .from('tenants')
              .select('property_id')
              .eq('user_id', userId);

      const { data: userData } = await baseQuery;
      const propertyIds =
        role === 'owner'
          ? userData?.map(p => p.id) || []
          : userData?.map(t => t.property_id) || [];

      if (propertyIds.length === 0) {
        return {
          success: true,
          data: {
            totalProperties: 0,
            totalTenants: 0,
            totalRevenue: 0,
            totalMaintenanceRequests: 0,
            occupancyRate: 0,
            averageRent: 0,
            pendingPayments: 0,
            completedMaintenance: 0
          }
        };
      }

      // Get properties count
      const { count: propertiesCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .in('id', propertyIds);

      // Get tenants count
      const { count: tenantsCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('status', 'active');

      // Get revenue data
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, payment_status')
        .in('property_id', propertyIds);

      const totalRevenue =
        paymentsData
          ?.filter(p => p.payment_status === 'paid')
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const pendingPayments =
        paymentsData
          ?.filter(p => p.payment_status === 'pending')
          .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get maintenance data
      const { count: maintenanceCount } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds);

      const { count: completedMaintenance } = await supabase
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('status', 'completed');

      // Get occupancy rate
      const { data: propertiesData } = await supabase
        .from('properties')
        .select('total_units, occupied_units')
        .in('id', propertyIds);

      const totalUnits =
        propertiesData?.reduce((sum, p) => sum + p.total_units, 0) || 0;
      const occupiedUnits =
        propertiesData?.reduce((sum, p) => sum + p.occupied_units, 0) || 0;
      const occupancyRate =
        totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

      // Get average rent
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('monthly_rent')
        .in('property_id', propertyIds)
        .eq('status', 'active');

      const averageRent =
        tenantsData?.length > 0
          ? tenantsData.reduce((sum, t) => sum + Number(t.monthly_rent), 0) /
            tenantsData.length
          : 0;

      return {
        success: true,
        data: {
          totalProperties: propertiesCount || 0,
          totalTenants: tenantsCount || 0,
          totalRevenue,
          totalMaintenanceRequests: maintenanceCount || 0,
          occupancyRate: Math.round(occupancyRate * 100) / 100,
          averageRent: Math.round(averageRent * 100) / 100,
          pendingPayments,
          completedMaintenance: completedMaintenance || 0
        }
      };
    } catch (error) {
      console.error('Get analytics overview error:', error);
      return {
        success: false,
        message: 'Failed to get analytics overview'
      };
    }
  }

  // Get revenue analytics
  static async getRevenueAnalytics(
    userId: string,
    role: 'owner' | 'tenant',
    filters?: AnalyticsFilters
  ): Promise<{
    success: boolean;
    data?: RevenueAnalytics;
    message?: string;
  }> {
    try {
      const baseQuery =
        role === 'owner'
          ? supabase.from('properties').select('id').eq('owner_id', userId)
          : supabase
              .from('tenants')
              .select('property_id')
              .eq('user_id', userId);

      const { data: userData } = await baseQuery;
      const propertyIds =
        role === 'owner'
          ? userData?.map(p => p.id) || []
          : userData?.map(t => t.property_id) || [];

      if (propertyIds.length === 0) {
        return {
          success: true,
          data: {
            monthlyRevenue: [],
            paymentTypes: [],
            paymentStatus: []
          }
        };
      }

      // Get payments data
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount, payment_type, payment_status, paid_date, created_at')
        .in('property_id', propertyIds);

      if (!paymentsData) {
        return {
          success: true,
          data: {
            monthlyRevenue: [],
            paymentTypes: [],
            paymentStatus: []
          }
        };
      }

      // Monthly revenue trends
      const monthlyRevenue = this.calculateMonthlyRevenue(paymentsData);

      // Payment types breakdown
      const paymentTypes = this.calculatePaymentTypes(paymentsData);

      // Payment status breakdown
      const paymentStatus = this.calculatePaymentStatus(paymentsData);

      return {
        success: true,
        data: {
          monthlyRevenue,
          paymentTypes,
          paymentStatus
        }
      };
    } catch (error) {
      console.error('Get revenue analytics error:', error);
      return {
        success: false,
        message: 'Failed to get revenue analytics'
      };
    }
  }

  // Get property analytics
  static async getPropertyAnalytics(
    userId: string,
    role: 'owner' | 'tenant',
    filters?: AnalyticsFilters
  ): Promise<{
    success: boolean;
    data?: PropertyAnalytics;
    message?: string;
  }> {
    try {
      const baseQuery =
        role === 'owner'
          ? supabase.from('properties').select('id').eq('owner_id', userId)
          : supabase
              .from('tenants')
              .select('property_id')
              .eq('user_id', userId);

      const { data: userData } = await baseQuery;
      const propertyIds =
        role === 'owner'
          ? userData?.map(p => p.id) || []
          : userData?.map(t => t.property_id) || [];

      if (propertyIds.length === 0) {
        return {
          success: true,
          data: {
            propertiesByType: [],
            propertiesByStatus: [],
            topPerformingProperties: []
          }
        };
      }

      // Get properties data
      const { data: propertiesData } = await supabase
        .from('properties')
        .select(
          `
          id,
          name,
          type,
          status,
          total_units,
          occupied_units,
          monthly_rent
        `
        )
        .in('id', propertyIds);

      if (!propertiesData) {
        return {
          success: true,
          data: {
            propertiesByType: [],
            propertiesByStatus: [],
            topPerformingProperties: []
          }
        };
      }

      // Properties by type
      const propertiesByType = this.calculatePropertiesByType(propertiesData);

      // Properties by status
      const propertiesByStatus =
        this.calculatePropertiesByStatus(propertiesData);

      // Top performing properties
      const topPerformingProperties =
        await this.calculateTopPerformingProperties(
          propertyIds,
          propertiesData
        );

      return {
        success: true,
        data: {
          propertiesByType,
          propertiesByStatus,
          topPerformingProperties
        }
      };
    } catch (error) {
      console.error('Get property analytics error:', error);
      return {
        success: false,
        message: 'Failed to get property analytics'
      };
    }
  }

  // Get maintenance analytics
  static async getMaintenanceAnalytics(
    userId: string,
    role: 'owner' | 'tenant',
    filters?: AnalyticsFilters
  ): Promise<{
    success: boolean;
    data?: MaintenanceAnalytics;
    message?: string;
  }> {
    try {
      const baseQuery =
        role === 'owner'
          ? supabase.from('properties').select('id').eq('owner_id', userId)
          : supabase
              .from('tenants')
              .select('property_id')
              .eq('user_id', userId);

      const { data: userData } = await baseQuery;
      const propertyIds =
        role === 'owner'
          ? userData?.map(p => p.id) || []
          : userData?.map(t => t.property_id) || [];

      if (propertyIds.length === 0) {
        return {
          success: true,
          data: {
            maintenanceByCategory: [],
            maintenanceByStatus: [],
            maintenanceByPriority: [],
            maintenanceTrends: []
          }
        };
      }

      // Get maintenance data
      const { data: maintenanceData } = await supabase
        .from('maintenance_requests')
        .select(
          'category, status, priority, estimated_cost, actual_cost, created_at, completed_date'
        )
        .in('property_id', propertyIds);

      if (!maintenanceData) {
        return {
          success: true,
          data: {
            maintenanceByCategory: [],
            maintenanceByStatus: [],
            maintenanceByPriority: [],
            maintenanceTrends: []
          }
        };
      }

      // Maintenance by category
      const maintenanceByCategory =
        this.calculateMaintenanceByCategory(maintenanceData);

      // Maintenance by status
      const maintenanceByStatus =
        this.calculateMaintenanceByStatus(maintenanceData);

      // Maintenance by priority
      const maintenanceByPriority =
        this.calculateMaintenanceByPriority(maintenanceData);

      // Maintenance trends
      const maintenanceTrends =
        this.calculateMaintenanceTrends(maintenanceData);

      return {
        success: true,
        data: {
          maintenanceByCategory,
          maintenanceByStatus,
          maintenanceByPriority,
          maintenanceTrends
        }
      };
    } catch (error) {
      console.error('Get maintenance analytics error:', error);
      return {
        success: false,
        message: 'Failed to get maintenance analytics'
      };
    }
  }

  // Helper methods for calculations
  private static calculateMonthlyRevenue(
    paymentsData: any[]
  ): Array<{ month: string; revenue: number; payments: number }> {
    const monthlyData = new Map<
      string,
      { revenue: number; payments: number }
    >();

    paymentsData.forEach(payment => {
      if (payment.payment_status === 'paid' && payment.paid_date) {
        const month = new Date(payment.paid_date).toISOString().slice(0, 7); // YYYY-MM
        const existing = monthlyData.get(month) || { revenue: 0, payments: 0 };
        existing.revenue += Number(payment.amount);
        existing.payments += 1;
        monthlyData.set(month, existing);
      }
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  private static calculatePaymentTypes(
    paymentsData: any[]
  ): Array<{ type: string; amount: number; count: number }> {
    const typeData = new Map<string, { amount: number; count: number }>();

    paymentsData.forEach(payment => {
      const type = payment.payment_type;
      const existing = typeData.get(type) || { amount: 0, count: 0 };
      existing.amount += Number(payment.amount);
      existing.count += 1;
      typeData.set(type, existing);
    });

    return Array.from(typeData.entries()).map(([type, data]) => ({
      type,
      ...data
    }));
  }

  private static calculatePaymentStatus(
    paymentsData: any[]
  ): Array<{ status: string; amount: number; count: number }> {
    const statusData = new Map<string, { amount: number; count: number }>();

    paymentsData.forEach(payment => {
      const status = payment.payment_status;
      const existing = statusData.get(status) || { amount: 0, count: 0 };
      existing.amount += Number(payment.amount);
      existing.count += 1;
      statusData.set(status, existing);
    });

    return Array.from(statusData.entries()).map(([status, data]) => ({
      status,
      ...data
    }));
  }

  private static calculatePropertiesByType(
    propertiesData: any[]
  ): Array<{ type: string; count: number; occupancy: number }> {
    const typeData = new Map<
      string,
      { count: number; totalUnits: number; occupiedUnits: number }
    >();

    propertiesData.forEach(property => {
      const type = property.type;
      const existing = typeData.get(type) || {
        count: 0,
        totalUnits: 0,
        occupiedUnits: 0
      };
      existing.count += 1;
      existing.totalUnits += property.total_units;
      existing.occupiedUnits += property.occupied_units;
      typeData.set(type, existing);
    });

    return Array.from(typeData.entries()).map(([type, data]) => ({
      type,
      count: data.count,
      occupancy:
        data.totalUnits > 0
          ? Math.round((data.occupiedUnits / data.totalUnits) * 100 * 100) / 100
          : 0
    }));
  }

  private static calculatePropertiesByStatus(
    propertiesData: any[]
  ): Array<{ status: string; count: number }> {
    const statusData = new Map<string, number>();

    propertiesData.forEach(property => {
      const status = property.status;
      statusData.set(status, (statusData.get(status) || 0) + 1);
    });

    return Array.from(statusData.entries()).map(([status, count]) => ({
      status,
      count
    }));
  }

  private static async calculateTopPerformingProperties(
    propertyIds: string[],
    propertiesData: any[]
  ): Promise<
    Array<{
      propertyId: string;
      propertyName: string;
      revenue: number;
      occupancy: number;
      tenantCount: number;
    }>
  > {
    const topProperties = [];

    for (const property of propertiesData) {
      // Get revenue for this property
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount')
        .eq('property_id', property.id)
        .eq('payment_status', 'paid');

      const revenue =
        paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Get tenant count
      const { count: tenantCount } = await supabase
        .from('tenants')
        .select('*', { count: 'exact', head: true })
        .eq('property_id', property.id)
        .eq('status', 'active');

      const occupancy =
        property.total_units > 0
          ? Math.round(
              (property.occupied_units / property.total_units) * 100 * 100
            ) / 100
          : 0;

      topProperties.push({
        propertyId: property.id,
        propertyName: property.name,
        revenue,
        occupancy,
        tenantCount: tenantCount || 0
      });
    }

    return topProperties.sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }

  private static calculateMaintenanceByCategory(
    maintenanceData: any[]
  ): Array<{ category: string; count: number; avgCost: number }> {
    const categoryData = new Map<
      string,
      { count: number; totalCost: number; costCount: number }
    >();

    maintenanceData.forEach(request => {
      const category = request.category;
      const existing = categoryData.get(category) || {
        count: 0,
        totalCost: 0,
        costCount: 0
      };
      existing.count += 1;

      const cost = request.actual_cost || request.estimated_cost;
      if (cost) {
        existing.totalCost += Number(cost);
        existing.costCount += 1;
      }

      categoryData.set(category, existing);
    });

    return Array.from(categoryData.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      avgCost:
        data.costCount > 0
          ? Math.round((data.totalCost / data.costCount) * 100) / 100
          : 0
    }));
  }

  private static calculateMaintenanceByStatus(
    maintenanceData: any[]
  ): Array<{ status: string; count: number }> {
    const statusData = new Map<string, number>();

    maintenanceData.forEach(request => {
      const status = request.status;
      statusData.set(status, (statusData.get(status) || 0) + 1);
    });

    return Array.from(statusData.entries()).map(([status, count]) => ({
      status,
      count
    }));
  }

  private static calculateMaintenanceByPriority(
    maintenanceData: any[]
  ): Array<{ priority: string; count: number }> {
    const priorityData = new Map<string, number>();

    maintenanceData.forEach(request => {
      const priority = request.priority;
      priorityData.set(priority, (priorityData.get(priority) || 0) + 1);
    });

    return Array.from(priorityData.entries()).map(([priority, count]) => ({
      priority,
      count
    }));
  }

  private static calculateMaintenanceTrends(
    maintenanceData: any[]
  ): Array<{
    month: string;
    requests: number;
    completed: number;
    avgCost: number;
  }> {
    const monthlyData = new Map<
      string,
      {
        requests: number;
        completed: number;
        totalCost: number;
        costCount: number;
      }
    >();

    maintenanceData.forEach(request => {
      const month = new Date(request.created_at).toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyData.get(month) || {
        requests: 0,
        completed: 0,
        totalCost: 0,
        costCount: 0
      };
      existing.requests += 1;

      if (request.status === 'completed') {
        existing.completed += 1;
      }

      const cost = request.actual_cost || request.estimated_cost;
      if (cost) {
        existing.totalCost += Number(cost);
        existing.costCount += 1;
      }

      monthlyData.set(month, existing);
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        requests: data.requests,
        completed: data.completed,
        avgCost:
          data.costCount > 0
            ? Math.round((data.totalCost / data.costCount) * 100) / 100
            : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }
}

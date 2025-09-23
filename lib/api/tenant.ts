import { supabase } from '@/lib/supabase';
import type {
  Property,
  Tenant,
  Payment,
  MaintenanceRequest,
  Message,
  Notification,
  Document
} from '@/types/property';

export interface TenantDashboardStats {
  currentLease: {
    propertyName: string;
    unitNumber: string;
    address: string;
    monthlyRent: number;
    leaseEnd: Date;
    daysRemaining: number;
    propertyId: string;
    tenantId: string;
  } | null;
  upcomingPayments: Array<{
    id: string;
    amount: number;
    dueDate: Date;
    type: string;
    status: 'pending' | 'overdue' | 'paid';
  }>;
  maintenanceRequests: Array<{
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
    priority: 'low' | 'medium' | 'high';
    createdAt: Date;
  }>;
  recentMessages: Array<{
    id: string;
    from: string;
    subject: string;
    preview: string;
    createdAt: Date;
    isRead: boolean;
  }>;
  notifications: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success';
    createdAt: Date;
  }>;
  quickStats: {
    totalPayments: number;
    activeRequests: number;
    unreadMessages: number;
    documentsCount: number;
  };
}

export interface PropertyListing {
  id: string;
  owner_id: string;
  name: string;
  type: 'residential' | 'commercial' | 'dormitory';
  address: string;
  city: string;
  province: string;
  postal_code?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  total_units: number;
  occupied_units: number;
  monthly_rent: number;
  status: 'active' | 'maintenance' | 'inactive';
  description?: string;
  amenities: string[];
  images?: string[];
  thumbnail?: string;
  floor_plan?: string;
  property_rules?: string;
  created_at: string;
  updated_at: string;
  // Additional fields for tenant view
  owner_name: string;
  owner_email: string;
  owner_phone: string;
  rating: number;
  reviewCount: number;
  available_units: number;
  featured_amenities: string[];
  is_favorited?: boolean;
}

export class TenantAPI {
  static async getDashboardStats(userId: string): Promise<{
    success: boolean;
    data?: TenantDashboardStats;
    message?: string;
  }> {
    try {
      // Get tenant record for current user
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select(
          `
          id,
          property_id,
          unit_number,
          lease_start,
          lease_end,
          monthly_rent,
          properties (
            id,
            name,
            address,
            city,
            province
          )
        `
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (tenantError && tenantError.code !== 'PGRST116') {
        throw tenantError;
      }

      let currentLease = null;
      if (tenant) {
        const leaseEnd = new Date(tenant.lease_end);
        const today = new Date();
        const daysRemaining = Math.ceil(
          (leaseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        currentLease = {
          propertyName: (tenant.properties as any).name,
          unitNumber: tenant.unit_number,
          address: `${(tenant.properties as any).address}, ${
            (tenant.properties as any).city
          }, ${(tenant.properties as any).province}`,
          monthlyRent: parseFloat(tenant.monthly_rent),
          leaseEnd: leaseEnd,
          daysRemaining: daysRemaining,
          propertyId: tenant.property_id,
          tenantId: tenant.id
        };
      }

      // Get upcoming payments
      const upcomingPayments = tenant
        ? await this.getUpcomingPayments(tenant.id)
        : [];

      // Get maintenance requests
      const maintenanceResult = tenant
        ? await this.getMaintenanceRequests(userId)
        : {
            success: false,
            data: {
              requests: [],
              stats: { total: 0, pending: 0, in_progress: 0, completed: 0 }
            }
          };
      const maintenanceRequests =
        maintenanceResult.success && maintenanceResult.data
          ? maintenanceResult.data.requests.slice(0, 5).map(request => ({
              id: request.id,
              title: request.title,
              status: request.status,
              priority: request.priority,
              createdAt: new Date(request.created_at)
            }))
          : [];

      // Get recent messages
      const recentMessages = await this.getRecentMessages(userId);

      // Get notifications
      const notificationsResult = await this.getNotifications(userId);
      const notifications =
        notificationsResult.success && notificationsResult.data
          ? notificationsResult.data.slice(0, 5).map(notification => ({
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type:
                notification.type === 'warning'
                  ? ('warning' as const)
                  : notification.type === 'info'
                  ? ('info' as const)
                  : ('success' as const),
              createdAt: new Date(notification.created_at)
            }))
          : [];

      // Get documents count
      const documentsCount = tenant
        ? await this.getDocumentsCount(tenant.id)
        : 0;

      // Calculate quick stats
      const quickStats = {
        totalPayments: tenant ? await this.getTotalPaymentsCount(tenant.id) : 0,
        activeRequests: maintenanceRequests.filter(
          r => r.status === 'pending' || r.status === 'in_progress'
        ).length,
        unreadMessages: recentMessages.filter(m => !m.isRead).length,
        documentsCount: documentsCount
      };

      const dashboardStats: TenantDashboardStats = {
        currentLease,
        upcomingPayments,
        maintenanceRequests,
        recentMessages,
        notifications,
        quickStats
      };

      return { success: true, data: dashboardStats };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch dashboard stats'
      };
    }
  }

  static async hasPendingApplication(
    userId: string,
    propertyId: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('rental_applications')
        .select('id')
        .eq('user_id', userId)
        .eq('property_id', propertyId)
        .eq('status', 'pending')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Check pending application error:', error);
      }

      return !!data;
    } catch (error) {
      console.error('Check pending application error:', error);
      return false;
    }
  }

  static async getAvailableProperties(): Promise<{
    success: boolean;
    data?: PropertyListing[];
    message?: string;
  }> {
    try {
      const { data: properties, error } = await supabase
        .from('properties')
        .select(
          `
          id,
          owner_id,
          name,
          type,
          address,
          city,
          province,
          postal_code,
          coordinates,
          total_units,
          occupied_units,
          monthly_rent,
          status,
          description,
          amenities,
          images,
          thumbnail,
          floor_plan,
          property_rules,
          created_at,
          updated_at,
          users!properties_owner_id_fkey (
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .eq('status', 'active');

      if (error) throw error;

      const propertyListings: PropertyListing[] = properties
        .filter(property => property.total_units > property.occupied_units) // Only show properties with available units
        .map(property => ({
          ...property,
          available_units: property.total_units - property.occupied_units,
          owner_name: `${(property.users as any).first_name} ${
            (property.users as any).last_name
          }`,
          owner_email: (property.users as any).email,
          owner_phone: (property.users as any).phone,
          rating: 4.5 + Math.random() * 0.5, // Mock rating for now
          reviewCount: Math.floor(Math.random() * 30) + 5, // Mock review count
          featured_amenities: property.amenities?.slice(0, 4) || [],
          amenities: property.amenities || [],
          images: property.images || []
        }));

      return { success: true, data: propertyListings };
    } catch (error) {
      console.error('Get available properties error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch properties'
      };
    }
  }

  static async getProperty(
    propertyId: string
  ): Promise<{ success: boolean; data?: PropertyListing; message?: string }> {
    try {
      const { data: property, error } = await supabase
        .from('properties')
        .select(
          `
          id,
          owner_id,
          name,
          type,
          address,
          city,
          province,
          postal_code,
          coordinates,
          total_units,
          occupied_units,
          monthly_rent,
          status,
          description,
          amenities,
          images,
          thumbnail,
          floor_plan,
          property_rules,
          created_at,
          updated_at,
          users!properties_owner_id_fkey (
            first_name,
            last_name,
            email,
            phone
          )
        `
        )
        .eq('id', propertyId)
        .single();

      if (error) throw error;

      const propertyListing: PropertyListing = {
        ...property,
        available_units: property.total_units - property.occupied_units,
        owner_name: `${(property.users as any).first_name} ${
          (property.users as any).last_name
        }`,
        owner_email: (property.users as any).email,
        owner_phone: (property.users as any).phone,
        rating: 4.5 + Math.random() * 0.5, // Mock rating for now
        reviewCount: Math.floor(Math.random() * 30) + 5, // Mock review count
        featured_amenities: property.amenities.slice(0, 4),
        amenities: property.amenities || [],
        images: property.images || []
      };

      return { success: true, data: propertyListing };
    } catch (error) {
      console.error('Get property error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch property'
      };
    }
  }

  private static async getUpcomingPayments(tenantId: string) {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('payment_status', ['pending'])
        .order('due_date', { ascending: true })
        .limit(5);

      if (error) throw error;

      return payments.map(payment => ({
        id: payment.id,
        amount: parseFloat(payment.amount),
        dueDate: new Date(payment.due_date),
        type:
          payment.payment_type.charAt(0).toUpperCase() +
          payment.payment_type.slice(1).replace('_', ' '),
        status:
          payment.payment_status === 'pending' &&
          new Date(payment.due_date) < new Date()
            ? 'overdue'
            : payment.payment_status
      }));
    } catch (error) {
      console.error('Get upcoming payments error:', error);
      return [];
    }
  }

  private static async getRecentMessages(userId: string) {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(
          `
          id,
          subject,
          content,
          is_read,
          created_at,
          users!messages_sender_id_fkey (
            first_name,
            last_name
          )
        `
        )
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      return messages.map(message => ({
        id: message.id,
        from: `${(message.users as any).first_name} ${
          (message.users as any).last_name
        }`,
        subject: message.subject || 'No Subject',
        preview:
          message.content.substring(0, 100) +
          (message.content.length > 100 ? '...' : ''),
        createdAt: new Date(message.created_at),
        isRead: message.is_read
      }));
    } catch (error) {
      console.error('Get recent messages error:', error);
      return [];
    }
  }

  private static async getDocumentsCount(tenantId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Get documents count error:', error);
      return 0;
    }
  }

  private static async getTotalPaymentsCount(
    tenantId: string
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('payment_status', 'paid');

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Get total payments count error:', error);
      return 0;
    }
  }

  static async getTenantProfile(userId: string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      // Get user profile
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get current lease info if exists
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select(
          `
          *,
          properties(name)
        `
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      let currentLease = null;
      if (!tenantError && tenant) {
        currentLease = {
          property_name: (tenant.properties as any).name,
          unit_number: tenant.unit_number,
          lease_start: new Date(tenant.lease_start),
          lease_end: new Date(tenant.lease_end),
          monthly_rent: parseFloat(tenant.monthly_rent),
          status: tenant.status
        };
      }

      return {
        success: true,
        data: {
          ...user,
          current_lease: currentLease
        }
      };
    } catch (error) {
      console.error('Get tenant profile error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch profile'
      };
    }
  }

  static async updateTenantProfile(
    userId: string,
    profileData: any
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          phone: profileData.phone,
          emergency_contact_name: profileData.emergency_contact_name,
          emergency_contact_phone: profileData.emergency_contact_phone,
          emergency_contact_relationship:
            profileData.emergency_contact_relationship,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update tenant profile error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update profile'
      };
    }
  }

  static async getLeaseDetails(userId: string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      // Get active lease details
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select(
          `
          *,
          properties(
            name,
            address,
            type,
            amenities,
            users!properties_owner_id_fkey(
              first_name,
              last_name,
              phone
            )
          )
        `
        )
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (tenantError) throw tenantError;
      if (!tenant) return { success: false, message: 'No active lease found' };

      // Get lease documents
      const { data: documents, error: documentsError } = await supabase
        .from('lease_documents')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('uploaded_at', { ascending: false });

      if (documentsError) throw documentsError;

      // Get lease payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('due_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Format the response
      const property = tenant.properties;
      const owner = property.users[0];

      return {
        success: true,
        data: {
          id: tenant.id,
          property_name: property.name,
          unit_number: tenant.unit_number,
          lease_start: new Date(tenant.lease_start),
          lease_end: new Date(tenant.lease_end),
          monthly_rent: parseFloat(tenant.monthly_rent),
          security_deposit: parseFloat(tenant.security_deposit),
          status: tenant.status,
          documents: documents || [],
          payments: (payments || []).map((payment: any) => ({
            id: payment.id,
            amount: parseFloat(payment.amount),
            due_date: payment.due_date,
            paid_date: payment.paid_date,
            status: payment.status,
            payment_method: payment.payment_method,
            transaction_id: payment.transaction_id
          })),
          terms_and_conditions: tenant.terms_and_conditions || [],
          property_details: {
            address: property.address,
            type: property.type,
            amenities: property.amenities || [],
            owner_name: `${owner.first_name} ${owner.last_name}`,
            owner_contact: owner.phone
          }
        }
      };
    } catch (error) {
      console.error('Get lease details error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch lease details'
      };
    }
  }

  static async downloadLeaseDocument(documentId: string): Promise<{
    success: boolean;
    url?: string;
    message?: string;
  }> {
    try {
      // Get document details first
      const { data: document, error: documentError } = await supabase
        .from('lease_documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (documentError) throw documentError;
      if (!document) return { success: false, message: 'Document not found' };

      // Get download URL from Supabase Storage
      const { data, error: downloadError } = await supabase.storage
        .from('lease-documents')
        .createSignedUrl(document.file_path, 60); // URL valid for 60 seconds

      if (downloadError) throw downloadError;

      return {
        success: true,
        url: data?.signedUrl
      };
    } catch (error) {
      console.error('Download lease document error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to download document'
      };
    }
  }

  static async getPayments(userId: string): Promise<{
    success: boolean;
    data?: {
      payments: any[];
      stats: {
        total_paid: number;
        total_pending: number;
        next_payment_date?: string;
        next_payment_amount?: number;
      };
    };
    message?: string;
  }> {
    try {
      // Get tenant ID first
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (tenantError) throw tenantError;
      if (!tenant) return { success: false, message: 'No active lease found' };

      // Get all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('due_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Calculate stats
      const total_paid =
        payments
          ?.filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

      const total_pending =
        payments
          ?.filter(p => p.status === 'pending')
          .reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0;

      const nextPayment = payments
        ?.filter(p => p.status === 'pending')
        .sort(
          (a, b) =>
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        )[0];

      return {
        success: true,
        data: {
          payments:
            payments?.map(payment => ({
              id: payment.id,
              amount: parseFloat(payment.amount),
              due_date: payment.due_date,
              paid_date: payment.paid_date,
              status: payment.status,
              payment_method: payment.payment_method,
              transaction_id: payment.transaction_id,
              description: payment.description,
              receipt_url: payment.receipt_url
            })) || [],
          stats: {
            total_paid,
            total_pending,
            next_payment_date: nextPayment?.due_date,
            next_payment_amount: nextPayment
              ? parseFloat(nextPayment.amount)
              : undefined
          }
        }
      };
    } catch (error) {
      console.error('Get payments error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch payments'
      };
    }
  }

  static async processPayment(paymentId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // In a real implementation, this would integrate with a payment gateway
      // For now, we'll just mark the payment as paid
      const { error } = await supabase
        .from('payments')
        .update({
          status: 'paid',
          paid_date: new Date().toISOString(),
          payment_method: 'card', // This would come from the actual payment
          transaction_id: 'DEMO-' + Math.random().toString(36).substr(2, 9),
          receipt_url: 'https://example.com/receipt.pdf' // This would be generated after payment
        })
        .eq('id', paymentId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Process payment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to process payment'
      };
    }
  }

  static async downloadReceipt(paymentId: string): Promise<{
    success: boolean;
    url?: string;
    message?: string;
  }> {
    try {
      // Get payment details first
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('receipt_url')
        .eq('id', paymentId)
        .single();

      if (paymentError) throw paymentError;
      if (!payment?.receipt_url)
        return { success: false, message: 'Receipt not found' };

      // Get download URL from Supabase Storage
      const { data, error: downloadError } = await supabase.storage
        .from('payment-receipts')
        .createSignedUrl(payment.receipt_url, 60); // URL valid for 60 seconds

      if (downloadError) throw downloadError;

      return {
        success: true,
        url: data?.signedUrl
      };
    } catch (error) {
      console.error('Download receipt error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to download receipt'
      };
    }
  }

  static async getMaintenanceRequests(userId: string): Promise<{
    success: boolean;
    data?: {
      requests: any[];
      stats: {
        total: number;
        pending: number;
        in_progress: number;
        completed: number;
      };
    };
    message?: string;
  }> {
    try {
      // Get tenant ID first
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (tenantError) throw tenantError;
      if (!tenant) return { success: false, message: 'No active lease found' };

      // Get all maintenance requests
      const { data: requests, error: requestsError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (requestsError) throw requestsError;

      // Format the requests
      const formattedRequests =
        requests?.map(request => ({
          id: request.id,
          title: request.title,
          description: request.description,
          type: request.type,
          priority: request.priority,
          status: request.status,
          created_at: request.created_at,
          updated_at: request.updated_at,
          scheduled_date: request.scheduled_date,
          completed_date: request.completed_date,
          images: request.images || [],
          comments: request.comments?.map((comment: any) => ({
            id: comment.id,
            user_id: comment.user_id,
            user_name: `${(comment.users as any).first_name} ${
              (comment.users as any).last_name
            }`,
            message: comment.message,
            created_at: comment.created_at
          }))
        })) || [];

      // Calculate stats
      const stats = {
        total: formattedRequests.length,
        pending: formattedRequests.filter(r => r.status === 'pending').length,
        in_progress: formattedRequests.filter(r => r.status === 'in_progress')
          .length,
        completed: formattedRequests.filter(r => r.status === 'completed')
          .length
      };

      return {
        success: true,
        data: {
          requests: formattedRequests,
          stats
        }
      };
    } catch (error) {
      console.error('Get maintenance requests error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch maintenance requests'
      };
    }
  }

  static async createMaintenanceRequest(
    userId: string,
    data: {
      title: string;
      description: string;
      type: string;
      priority: string;
      images?: File[];
    }
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      // Get tenant ID first
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (tenantError) throw tenantError;
      if (!tenant) return { success: false, message: 'No active lease found' };

      // Upload images if any
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        for (const image of data.images) {
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from('maintenance-images')
              .upload(`${tenant.id}/${fileName}`, image);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl }
          } = supabase.storage
            .from('maintenance-images')
            .getPublicUrl(`${tenant.id}/${fileName}`);

          imageUrls.push(publicUrl);
        }
      }

      // Create the maintenance request
      const { data: request, error: requestError } = await supabase
        .from('maintenance_requests')
        .insert({
          tenant_id: tenant.id,
          title: data.title,
          description: data.description,
          type: data.type,
          priority: data.priority,
          status: 'pending',
          images: imageUrls,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (requestError) throw requestError;

      return {
        success: true,
        data: {
          ...request,
          comments: []
        }
      };
    } catch (error) {
      console.error('Create maintenance request error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create maintenance request'
      };
    }
  }

  static async addMaintenanceComment(
    requestId: string,
    message: string
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    // Maintenance comments functionality is not implemented yet
    // This would require a maintenance_comments table in the database
    return {
      success: false,
      message: 'Maintenance comments functionality is not available yet'
    };
  }

  static async getMessages(userId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(
            first_name,
            last_name
          ),
          recipient:users!messages_recipient_id_fkey(
            first_name,
            last_name
          )
        `
        )
        .or(`recipient_id.eq.${userId},sender_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: messages.map(message => ({
          id: message.id,
          subject: message.subject,
          content: message.content,
          sender_id: message.sender_id,
          sender_name: `${(message.sender as any).first_name} ${
            (message.sender as any).last_name
          }`,
          recipient_id: message.recipient_id,
          recipient_name: `${(message.recipient as any).first_name} ${
            (message.recipient as any).last_name
          }`,
          created_at: message.created_at,
          is_read: message.is_read,
          is_archived: message.is_archived,
          is_starred: message.is_starred
        }))
      };
    } catch (error) {
      console.error('Get messages error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch messages'
      };
    }
  }

  static async getAvailableRecipients(): Promise<{
    success: boolean;
    data?: Array<{
      id: string;
      name: string;
      role: string;
    }>;
    message?: string;
  }> {
    try {
      // Get property owner and staff
      const { data: users, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, role')
        .in('role', ['owner', 'staff'])
        .eq('is_active', true);

      if (error) throw error;

      return {
        success: true,
        data: users.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role.charAt(0).toUpperCase() + user.role.slice(1)
        }))
      };
    } catch (error) {
      console.error('Get available recipients error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch recipients'
      };
    }
  }

  static async sendMessage(
    recipientId: string,
    subject: string,
    content: string
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          recipient_id: recipientId,
          subject,
          content,
          created_at: new Date().toISOString(),
          is_read: false,
          is_archived: false,
          is_starred: false
        })
        .select(
          `
          *,
          sender:users!messages_sender_id_fkey(
            first_name,
            last_name
          ),
          recipient:users!messages_recipient_id_fkey(
            first_name,
            last_name
          )
        `
        )
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: message.id,
          subject: message.subject,
          content: message.content,
          sender_id: message.sender_id,
          sender_name: `${(message.sender as any).first_name} ${
            (message.sender as any).last_name
          }`,
          recipient_id: message.recipient_id,
          recipient_name: `${(message.recipient as any).first_name} ${
            (message.recipient as any).last_name
          }`,
          created_at: message.created_at,
          is_read: message.is_read,
          is_archived: message.is_archived,
          is_starred: message.is_starred
        }
      };
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  static async updateMessage(
    messageId: string,
    action: 'star' | 'archive' | 'unarchive' | 'delete'
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      if (action === 'delete') {
        const { error } = await supabase
          .from('messages')
          .delete()
          .eq('id', messageId);

        if (error) throw error;
      } else {
        const updates =
          action === 'star'
            ? { is_starred: true }
            : action === 'archive'
            ? { is_archived: true }
            : { is_archived: false };

        const { error } = await supabase
          .from('messages')
          .update(updates)
          .eq('id', messageId);

        if (error) throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Update message error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update message'
      };
    }
  }

  static async markMessageAsRead(messageId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark message as read error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark message as read'
      };
    }
  }

  static async getDocuments(userId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      // Get tenant ID first
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (tenantError) throw tenantError;
      if (!tenant) return { success: false, message: 'No active lease found' };

      // Get all documents
      const { data: documents, error: documentsError } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('uploaded_at', { ascending: false });

      if (documentsError) throw documentsError;

      return {
        success: true,
        data:
          documents?.map(doc => ({
            id: doc.id,
            name: doc.name,
            type: doc.type,
            size: doc.size,
            uploaded_at: doc.uploaded_at,
            category: doc.category,
            description: doc.description,
            file_url: doc.file_url
          })) || []
      };
    } catch (error) {
      console.error('Get documents error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch documents'
      };
    }
  }

  static async uploadDocument(
    file: File,
    category: string,
    name?: string,
    description?: string
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      // Get tenant ID first
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (tenantError) throw tenantError;
      if (!tenant) return { success: false, message: 'No active lease found' };

      // Upload file to storage
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tenant-documents')
        .upload(`${tenant.id}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl }
      } = supabase.storage
        .from('tenant-documents')
        .getPublicUrl(`${tenant.id}/${fileName}`);

      // Create document record
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .insert({
          tenant_id: tenant.id,
          name: name || file.name,
          type: file.type,
          size: file.size,
          category,
          description,
          file_url: publicUrl,
          file_path: `${tenant.id}/${fileName}`,
          uploaded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (documentError) throw documentError;

      return {
        success: true,
        data: {
          id: document.id,
          name: document.name,
          type: document.type,
          size: document.size,
          uploaded_at: document.uploaded_at,
          category: document.category,
          description: document.description,
          file_url: document.file_url
        }
      };
    } catch (error) {
      console.error('Upload document error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to upload document'
      };
    }
  }

  static async downloadDocument(documentId: string): Promise<{
    success: boolean;
    url?: string;
    message?: string;
  }> {
    try {
      // Get document details first
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (documentError) throw documentError;
      if (!document) return { success: false, message: 'Document not found' };

      // Get download URL from Supabase Storage
      const { data, error: downloadError } = await supabase.storage
        .from('tenant-documents')
        .createSignedUrl(document.file_path, 60); // URL valid for 60 seconds

      if (downloadError) throw downloadError;

      return {
        success: true,
        url: data?.signedUrl
      };
    } catch (error) {
      console.error('Download document error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to download document'
      };
    }
  }

  static async deleteDocument(documentId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Get document details first
      const { data: document, error: documentError } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', documentId)
        .single();

      if (documentError) throw documentError;
      if (!document) return { success: false, message: 'Document not found' };

      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('tenant-documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete document record
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId);

      if (deleteError) throw deleteError;

      return { success: true };
    } catch (error) {
      console.error('Delete document error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete document'
      };
    }
  }

  static async getNotifications(userId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data:
          notifications?.map(notification => ({
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            category: notification.category,
            created_at: notification.created_at,
            is_read: notification.is_read
          })) || []
      };
    } catch (error) {
      console.error('Get notifications error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch notifications'
      };
    }
  }

  static async getNotificationPreferences(userId: string): Promise<{
    success: boolean;
    data?: {
      email_notifications: boolean;
      push_notifications: boolean;
      categories: {
        maintenance: boolean;
        payments: boolean;
        messages: boolean;
        lease: boolean;
        announcements: boolean;
      };
    };
    message?: string;
  }> {
    try {
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      // If no preferences exist, create default preferences
      if (!preferences) {
        const defaultPreferences = {
          user_id: userId,
          email_notifications: true,
          push_notifications: true,
          categories: {
            maintenance: true,
            payments: true,
            messages: true,
            lease: true,
            announcements: true
          }
        };

        const { error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPreferences);

        if (insertError) throw insertError;

        return {
          success: true,
          data: {
            email_notifications: defaultPreferences.email_notifications,
            push_notifications: defaultPreferences.push_notifications,
            categories: defaultPreferences.categories
          }
        };
      }

      return {
        success: true,
        data: {
          email_notifications: preferences.email_notifications,
          push_notifications: preferences.push_notifications,
          categories: preferences.categories
        }
      };
    } catch (error) {
      console.error('Get notification preferences error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch notification preferences'
      };
    }
  }

  static async updateNotificationPreferences(preferences: {
    email_notifications: boolean;
    push_notifications: boolean;
    categories: {
      maintenance: boolean;
      payments: boolean;
      messages: boolean;
      lease: boolean;
      announcements: boolean;
    };
  }): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notification_preferences')
        .update({
          email_notifications: preferences.email_notifications,
          push_notifications: preferences.push_notifications,
          categories: preferences.categories,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update notification preferences error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update notification preferences'
      };
    }
  }

  static async markNotificationAsRead(notificationId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark notification as read error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark notification as read'
      };
    }
  }

  static async markAllNotificationsAsRead(): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Mark all notifications as read error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to mark all notifications as read'
      };
    }
  }

  static async deleteNotification(notificationId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete notification error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to delete notification'
      };
    }
  }

  static async getCommunityPosts(userId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      // Get tenant's property ID first
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('property_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (tenantError && tenantError.code !== 'PGRST116') throw tenantError;

      // Get all posts from the same property
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select(
          `
          *,
          users!community_posts_user_id_fkey(
            first_name,
            last_name
          ),
          properties!community_posts_property_id_fkey(
            name
          ),
          likes:community_post_likes(count),
          user_like:community_post_likes!community_post_likes_post_id_fkey(
            id
          )
        `
        )
        .eq(
          tenant ? 'property_id' : 'is_public',
          tenant ? tenant.property_id : true
        )
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Get comments count for each post
      const postIds = posts?.map(post => post.id) || [];
      // Get comments count using a custom SQL query
      const { data: comments, error: commentsError } = await supabase.rpc(
        'get_post_comments_count',
        { post_ids: postIds }
      );

      if (commentsError) throw commentsError;

      const commentsMap = new Map(
        (comments as Array<{ post_id: string; count: number }>)?.map(c => [
          c.post_id,
          c.count
        ]) || []
      );

      return {
        success: true,
        data:
          posts?.map(post => ({
            id: post.id,
            user_id: post.user_id,
            user_name: `${(post.users as any).first_name} ${
              (post.users as any).last_name
            }`,
            property_id: post.property_id,
            property_name: (post.properties as any).name,
            title: post.title,
            content: post.content,
            category: post.category,
            images: post.images || [],
            likes: parseInt((post.likes as any)[0]?.count || '0'),
            comments_count: commentsMap.get(post.id) || 0,
            is_liked: (post.user_like as any[])?.length > 0,
            is_reported: post.is_reported,
            created_at: post.created_at
          })) || []
      };
    } catch (error) {
      console.error('Get community posts error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch community posts'
      };
    }
  }

  static async createCommunityPost(
    title: string,
    content: string,
    category: string,
    images?: File[]
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      // Get user and tenant info
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('property_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (tenantError) throw tenantError;

      // Upload images if any
      let imageUrls: string[] = [];
      if (images && images.length > 0) {
        for (const image of images) {
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from('community-images')
              .upload(`${tenant.property_id}/${fileName}`, image);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl }
          } = supabase.storage
            .from('community-images')
            .getPublicUrl(`${tenant.property_id}/${fileName}`);

          imageUrls.push(publicUrl);
        }
      }

      // Create the post
      const { data: post, error: postError } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          property_id: tenant.property_id,
          title,
          content,
          category,
          images: imageUrls,
          created_at: new Date().toISOString()
        })
        .select(
          `
          *,
          users!community_posts_user_id_fkey(
            first_name,
            last_name
          ),
          properties!community_posts_property_id_fkey(
            name
          )
        `
        )
        .single();

      if (postError) throw postError;

      return {
        success: true,
        data: {
          id: post.id,
          user_id: post.user_id,
          user_name: `${(post.users as any).first_name} ${
            (post.users as any).last_name
          }`,
          property_id: post.property_id,
          property_name: (post.properties as any).name,
          title: post.title,
          content: post.content,
          category: post.category,
          images: post.images || [],
          likes: 0,
          comments_count: 0,
          is_liked: false,
          is_reported: false,
          created_at: post.created_at
        }
      };
    } catch (error) {
      console.error('Create community post error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create community post'
      };
    }
  }

  static async likeCommunityPost(postId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already liked
      const { data: existingLike, error: likeError } = await supabase
        .from('community_post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();

      if (likeError && likeError.code !== 'PGRST116') throw likeError;

      if (existingLike) {
        // Unlike
        const { error: unlikeError } = await supabase
          .from('community_post_likes')
          .delete()
          .eq('id', existingLike.id);

        if (unlikeError) throw unlikeError;
      } else {
        // Like
        const { error: likeError } = await supabase
          .from('community_post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (likeError) throw likeError;
      }

      return { success: true };
    } catch (error) {
      console.error('Like community post error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to like community post'
      };
    }
  }

  static async reportCommunityPost(postId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('community_posts')
        .update({
          is_reported: true,
          reported_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Report community post error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to report community post'
      };
    }
  }

  static async getCommunityPostComments(postId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const { data: comments, error } = await supabase
        .from('community_post_comments')
        .select(
          `
          *,
          users!community_post_comments_user_id_fkey(
            first_name,
            last_name
          )
        `
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data:
          comments?.map(comment => ({
            id: comment.id,
            user_id: comment.user_id,
            user_name: `${(comment.users as any).first_name} ${
              (comment.users as any).last_name
            }`,
            content: comment.content,
            created_at: comment.created_at
          })) || []
      };
    } catch (error) {
      console.error('Get community post comments error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch comments'
      };
    }
  }

  static async addCommunityPostComment(
    postId: string,
    content: string
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: comment, error } = await supabase
        .from('community_post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
          created_at: new Date().toISOString()
        })
        .select(
          `
          *,
          users!community_post_comments_user_id_fkey(
            first_name,
            last_name
          )
        `
        )
        .single();

      if (error) throw error;

      return {
        success: true,
        data: {
          id: comment.id,
          user_id: comment.user_id,
          user_name: `${(comment.users as any).first_name} ${
            (comment.users as any).last_name
          }`,
          content: comment.content,
          created_at: comment.created_at
        }
      };
    } catch (error) {
      console.error('Add community post comment error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to add comment'
      };
    }
  }

  static async getSupportTickets(userId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const { data: tickets, error: ticketsError } = await supabase
        .from('support_tickets')
        .select(
          `
          *,
          messages:support_ticket_messages(
            id,
            user_id,
            content,
            created_at,
            is_staff,
            users!support_ticket_messages_user_id_fkey(
              first_name,
              last_name
            )
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      return {
        success: true,
        data:
          tickets?.map(ticket => ({
            id: ticket.id,
            title: ticket.title,
            description: ticket.description,
            category: ticket.category,
            priority: ticket.priority,
            status: ticket.status,
            created_at: ticket.created_at,
            updated_at: ticket.updated_at,
            messages:
              (ticket.messages as any[])?.map(message => ({
                id: message.id,
                user_id: message.user_id,
                user_name: `${(message.users as any).first_name} ${
                  (message.users as any).last_name
                }`,
                content: message.content,
                created_at: message.created_at,
                is_staff: message.is_staff
              })) || []
          })) || []
      };
    } catch (error) {
      console.error('Get support tickets error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch support tickets'
      };
    }
  }

  static async createSupportTicket(
    title: string,
    description: string,
    category: string,
    priority: string
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: ticket, error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          title,
          description,
          category,
          priority,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      return {
        success: true,
        data: {
          ...ticket,
          messages: []
        }
      };
    } catch (error) {
      console.error('Create support ticket error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to create support ticket'
      };
    }
  }

  static async addSupportTicketMessage(
    ticketId: string,
    content: string
  ): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create message
      const { data: message, error: messageError } = await supabase
        .from('support_ticket_messages')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
          content,
          is_staff: false,
          created_at: new Date().toISOString()
        })
        .select(
          `
          *,
          users!support_ticket_messages_user_id_fkey(
            first_name,
            last_name
          )
        `
        )
        .single();

      if (messageError) throw messageError;

      // Update ticket's updated_at
      const { error: updateError } = await supabase
        .from('support_tickets')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      return {
        success: true,
        data: {
          id: message.id,
          user_id: message.user_id,
          user_name: `${(message.users as any).first_name} ${
            (message.users as any).last_name
          }`,
          content: message.content,
          created_at: message.created_at,
          is_staff: message.is_staff
        }
      };
    } catch (error) {
      console.error('Add support ticket message error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to add message'
      };
    }
  }

  static async closeSupportTicket(ticketId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Close support ticket error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to close ticket'
      };
    }
  }

  static async getFAQs(): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const { data: faqs, error } = await supabase
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data:
          faqs?.map(faq => ({
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
            category: faq.category
          })) || []
      };
    } catch (error) {
      console.error('Get FAQs error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch FAQs'
      };
    }
  }

  static async getApplications(userId: string): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const { data: applications, error } = await supabase
        .from('rental_applications')
        .select(
          `
          *,
          properties(
            name
          ),
          documents:application_documents(
            id,
            name,
            type,
            url
          )
        `
        )
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data:
          applications?.map(application => ({
            id: application.id,
            property_id: application.property_id,
            property_name: (application.properties as any).name,
            unit_type: application.unit_type,
            monthly_rent: parseFloat(application.monthly_rent),
            move_in_date: application.move_in_date,
            status: application.status,
            submitted_at: application.submitted_at,
            updated_at: application.updated_at,
            documents: application.documents || [],
            notes: application.notes,
            rejection_reason: application.rejection_reason
          })) || []
      };
    } catch (error) {
      console.error('Get applications error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch applications'
      };
    }
  }

  static async getAvailableUnits(propertyId: string): Promise<{
    success: boolean;
    data?: { unit_number: string }[];
    message?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('get_available_unit_numbers', {
        property_id: propertyId
      });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };
    } catch (error) {
      console.error('Get available units error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch available units'
      };
    }
  }

  static async submitApplication(data: {
    userId: string;
    propertyId: string;
    unitType: string;
    unitNumber: string;
    moveInDate: Date;
    message?: string;
    documents: File[];
  }): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    try {
      // Create the application first
      // Check if unit is available
      const { data: isAvailable, error: availabilityError } =
        await supabase.rpc('is_unit_available', {
          p_property_id: data.propertyId,
          p_unit_number: data.unitNumber
        });

      if (availabilityError) throw availabilityError;
      if (!isAvailable) {
        return {
          success: false,
          message:
            'This unit is no longer available. Please select a different unit.'
        };
      }

      const { data: application, error: applicationError } = await supabase
        .from('rental_applications')
        .insert({
          user_id: data.userId,
          property_id: data.propertyId,
          unit_type: data.unitType,
          unit_number: data.unitNumber,
          move_in_date: data.moveInDate.toISOString(),
          monthly_rent: 0, // Will be updated after fetching from property
          status: 'pending',
          notes: data.message,
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (applicationError) throw applicationError;

      // Get property details to update monthly rent
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('monthly_rent')
        .eq('id', data.propertyId)
        .single();

      if (propertyError) throw propertyError;

      // Update application with correct monthly rent
      const { error: updateError } = await supabase
        .from('rental_applications')
        .update({
          monthly_rent: property.monthly_rent
        })
        .eq('id', application.id);

      if (updateError) throw updateError;

      // Upload documents
      const uploadedDocs = await Promise.all(
        data.documents.map(async file => {
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from('application-documents')
              .upload(`${application.id}/${fileName}`, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl }
          } = supabase.storage
            .from('application-documents')
            .getPublicUrl(`${application.id}/${fileName}`);

          // Create document record
          const { data: document, error: documentError } = await supabase
            .from('application_documents')
            .insert({
              application_id: application.id,
              name: file.name,
              type: file.type,
              url: publicUrl,
              uploaded_at: new Date().toISOString()
            })
            .select()
            .single();

          if (documentError) throw documentError;

          return {
            id: document.id,
            name: document.name,
            type: document.type,
            url: document.url
          };
        })
      );

      return {
        success: true,
        data: {
          id: application.id,
          property_id: application.property_id,
          unit_type: application.unit_type,
          monthly_rent: parseFloat(property.monthly_rent),
          move_in_date: application.move_in_date,
          status: application.status,
          submitted_at: application.submitted_at,
          updated_at: application.updated_at,
          documents: uploadedDocs,
          notes: application.notes
        }
      };
    } catch (error) {
      console.error('Submit application error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to submit application'
      };
    }
  }

  static async uploadApplicationDocuments(
    applicationId: string,
    files: File[]
  ): Promise<{
    success: boolean;
    data?: any[];
    message?: string;
  }> {
    try {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload files to storage
      const uploadedDocs = await Promise.all(
        files.map(async file => {
          const fileName = `${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from('application-documents')
              .upload(`${applicationId}/${fileName}`, file);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl }
          } = supabase.storage
            .from('application-documents')
            .getPublicUrl(`${applicationId}/${fileName}`);

          // Create document record
          const { data: document, error: documentError } = await supabase
            .from('application_documents')
            .insert({
              application_id: applicationId,
              name: file.name,
              type: file.type,
              url: publicUrl,
              uploaded_at: new Date().toISOString()
            })
            .select()
            .single();

          if (documentError) throw documentError;

          return {
            id: document.id,
            name: document.name,
            type: document.type,
            url: document.url
          };
        })
      );

      // Update application's updated_at
      const { error: updateError } = await supabase
        .from('rental_applications')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      return {
        success: true,
        data: uploadedDocs
      };
    } catch (error) {
      console.error('Upload application documents error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to upload documents'
      };
    }
  }
}

import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export interface PropertyAnalytics {
  totalRevenue: number;
  occupancyRate: number;
  averageRent: number;
  maintenanceCosts: number;
  tenantCount: number;
  recentActivity: Array<{
    type: string;
    description: string;
    date: string;
  }>;
}

export interface PropertyFormData {
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
  monthly_rent: number;
  status: 'active' | 'maintenance' | 'inactive';
  description?: string;
  amenities?: string[];
  images?: string[];
  thumbnail?: string;
  floor_plan?: string;
  property_rules?: string;
}

export class PropertiesAPI {
  static async getProperties(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get properties error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch properties',
        data: []
      };
    }
  }

  static async getProperty(id: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get property error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch property',
        data: null
      };
    }
  }

  static async createProperty(
    property: Omit<PropertyInsert, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .insert([property])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Property created successfully',
        data
      };
    } catch (error) {
      console.error('Create property error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to create property',
        data: null
      };
    }
  }

  static async updateProperty(id: string, updates: PropertyUpdate) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Property updated successfully',
        data
      };
    } catch (error) {
      console.error('Update property error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update property',
        data: null
      };
    }
  }

  static async deleteProperty(id: string) {
    try {
      const { error } = await supabase.from('properties').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Property deleted successfully'
      };
    } catch (error) {
      console.error('Delete property error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete property'
      };
    }
  }

  static async getPropertyTenants(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(
          `
          *,
          user:users(*)
        `
        )
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get property tenants error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch tenants',
        data: []
      };
    }
  }

  static async getPropertyAnalytics(
    propertyId: string
  ): Promise<{ success: boolean; data?: PropertyAnalytics; message?: string }> {
    try {
      // Get property details
      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single();

      if (propertyError) throw new Error(propertyError.message);

      // Get tenants for this property
      const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .eq('property_id', propertyId);

      if (tenantsError) throw new Error(tenantsError.message);

      // Get payments for this property
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .in('tenant_id', tenants?.map(t => t.id) || [])
        .eq('payment_status', 'paid');

      if (paymentsError) throw new Error(paymentsError.message);

      // Get maintenance requests
      const { data: maintenance, error: maintenanceError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('property_id', propertyId);

      if (maintenanceError) throw new Error(maintenanceError.message);

      // Calculate analytics
      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
      const occupancyRate =
        property.total_units > 0
          ? (property.occupied_units / property.total_units) * 100
          : 0;
      const averageRent = property.monthly_rent;
      const maintenanceCosts =
        maintenance?.reduce((sum, m) => sum + (m.estimated_cost || 0), 0) || 0;
      const tenantCount = tenants?.length || 0;

      // Create recent activity
      const recentActivity = [
        ...(maintenance?.slice(0, 3).map(m => ({
          type: 'maintenance',
          description: `Maintenance: ${m.description}`,
          date: m.created_at
        })) || []),
        ...(payments?.slice(0, 3).map(p => ({
          type: 'payment',
          description: `Payment received: ₱${p.amount.toLocaleString()}`,
          date: p.created_at
        })) || [])
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      return {
        success: true,
        data: {
          totalRevenue,
          occupancyRate,
          averageRent,
          maintenanceCosts,
          tenantCount,
          recentActivity
        }
      };
    } catch (error) {
      console.error('Get property analytics error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch analytics'
      };
    }
  }

  static async searchProperties(
    ownerId: string,
    searchTerm: string,
    filters?: {
      type?: string;
      status?: string;
      city?: string;
    }
  ) {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .eq('owner_id', ownerId);

      // Apply search term
      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`
        );
      }

      // Apply filters
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.city && filters.city !== 'all') {
        query = query.eq('city', filters.city);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Search properties error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to search properties',
        data: []
      };
    }
  }

  static async duplicateProperty(id: string, newName: string) {
    try {
      // Get original property
      const { data: original, error: fetchError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw new Error(fetchError.message);

      // Create duplicate with new name
      const duplicate = {
        ...original,
        name: newName,
        occupied_units: 0 // Reset occupancy for new property
      };
      delete duplicate.id;
      delete duplicate.created_at;
      delete duplicate.updated_at;

      const { data, error } = await supabase
        .from('properties')
        .insert([duplicate])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Property duplicated successfully',
        data
      };
    } catch (error) {
      console.error('Duplicate property error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to duplicate property',
        data: null
      };
    }
  }

  static async bulkUpdateStatus(
    propertyIds: string[],
    status: 'active' | 'maintenance' | 'inactive'
  ) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', propertyIds)
        .select();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: `${data.length} properties updated successfully`,
        data
      };
    } catch (error) {
      console.error('Bulk update properties error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update properties',
        data: null
      };
    }
  }

  static async getPropertySummary(ownerId: string) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('id, name, status, total_units, occupied_units, monthly_rent')
        .eq('owner_id', ownerId);

      if (error) {
        throw new Error(error.message);
      }

      const summary = {
        totalProperties: data.length,
        activeProperties: data.filter(p => p.status === 'active').length,
        totalUnits: data.reduce((sum, p) => sum + p.total_units, 0),
        occupiedUnits: data.reduce((sum, p) => sum + p.occupied_units, 0),
        totalRevenue: data.reduce(
          (sum, p) => sum + p.monthly_rent * p.occupied_units,
          0
        ),
        averageOccupancy:
          data.length > 0
            ? data.reduce(
                (sum, p) => sum + (p.occupied_units / p.total_units) * 100,
                0
              ) / data.length
            : 0
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error('Get property summary error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch summary',
        data: null
      };
    }
  }

  // Image upload methods for Supabase Storage
  static async uploadPropertyImage(
    propertyId: string,
    file: File,
    imageType: 'property' | 'thumbnail' | 'floor_plan' = 'property'
  ): Promise<{ success: boolean; url?: string; message?: string }> {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${imageType}_${Date.now()}.${fileExt}`;
      const filePath = `properties/${fileName}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('property-images')
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        message: 'Image uploaded successfully'
      };
    } catch (error) {
      console.error('Upload property image error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to upload image'
      };
    }
  }

  static async uploadMultiplePropertyImages(
    propertyId: string,
    files: File[]
  ): Promise<{ success: boolean; urls?: string[]; message?: string }> {
    try {
      const uploadPromises = files.map(file =>
        this.uploadPropertyImage(propertyId, file, 'property')
      );

      const results = await Promise.all(uploadPromises);
      const failedUploads = results.filter(r => !r.success);

      if (failedUploads.length > 0) {
        return {
          success: false,
          message: `${failedUploads.length} images failed to upload`
        };
      }

      const urls = results.map(r => r.url).filter(Boolean) as string[];

      return {
        success: true,
        urls,
        message: `${urls.length} images uploaded successfully`
      };
    } catch (error) {
      console.error('Upload multiple images error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to upload images'
      };
    }
  }

  static async deletePropertyImage(
    imageUrl: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const propertyId = urlParts[urlParts.length - 2];
      const filePath = `properties/${propertyId}/${fileName}`;

      const { error } = await supabase.storage
        .from('property-images')
        .remove([filePath]);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Image deleted successfully'
      };
    } catch (error) {
      console.error('Delete property image error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete image'
      };
    }
  }

  static async updatePropertyImages(
    propertyId: string,
    newImageUrls: string[],
    thumbnailUrl?: string,
    floorPlanUrl?: string
  ) {
    try {
      const updateData: any = {
        images: newImageUrls,
        updated_at: new Date().toISOString()
      };

      if (thumbnailUrl !== undefined) {
        updateData.thumbnail = thumbnailUrl;
      }

      if (floorPlanUrl !== undefined) {
        updateData.floor_plan = floorPlanUrl;
      }

      const { data, error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', propertyId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Property images updated successfully',
        data
      };
    } catch (error) {
      console.error('Update property images error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to update property images',
        data: null
      };
    }
  }
}

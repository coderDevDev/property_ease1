import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Document = Database['public']['Tables']['documents']['Row'];
type DocumentInsert = Database['public']['Tables']['documents']['Insert'];
type DocumentUpdate = Database['public']['Tables']['documents']['Update'];

export class DocumentsAPI {
  static async getDocuments(
    propertyId?: string,
    tenantId?: string,
    category?: string
  ) {
    try {
      let query = supabase
        .from('documents')
        .select(
          `
          *,
          property:properties(*),
          tenant:tenants(*),
          uploader:users!uploaded_by(*)
        `
        )
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get documents error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch documents',
        data: []
      };
    }
  }

  static async getDocument(id: string) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select(
          `
          *,
          property:properties(*),
          tenant:tenants(*),
          uploader:users!uploaded_by(*)
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Get document error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch document',
        data: null
      };
    }
  }

  static async uploadDocument(
    file: File,
    document: Omit<
      DocumentInsert,
      'id' | 'file_url' | 'file_size' | 'created_at' | 'updated_at'
    >
  ) {
    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      // Create document record
      const { data, error } = await supabase
        .from('documents')
        .insert([
          {
            ...document,
            file_url: urlData.publicUrl,
            file_size: file.size
          }
        ])
        .select(
          `
          *,
          property:properties(*),
          tenant:tenants(*),
          uploader:users!uploaded_by(*)
        `
        )
        .single();

      if (error) {
        // If database insert fails, delete the uploaded file
        await supabase.storage.from('documents').remove([filePath]);
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Document uploaded successfully',
        data
      };
    } catch (error) {
      console.error('Upload document error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to upload document',
        data: null
      };
    }
  }

  static async updateDocument(id: string, updates: DocumentUpdate) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .update(updates)
        .eq('id', id)
        .select(
          `
          *,
          property:properties(*),
          tenant:tenants(*),
          uploader:users!uploaded_by(*)
        `
        )
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Document updated successfully',
        data
      };
    } catch (error) {
      console.error('Update document error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to update document',
        data: null
      };
    }
  }

  static async deleteDocument(id: string) {
    try {
      // Get document to find file path
      const { data: document } = await supabase
        .from('documents')
        .select('file_url')
        .eq('id', id)
        .single();

      // Delete from database
      const { error } = await supabase.from('documents').delete().eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Delete file from storage if exists
      if (document?.file_url) {
        try {
          const filePath = document.file_url.split('/').pop();
          if (filePath) {
            await supabase.storage
              .from('documents')
              .remove([`documents/${filePath}`]);
          }
        } catch (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
        }
      }

      return {
        success: true,
        message: 'Document deleted successfully'
      };
    } catch (error) {
      console.error('Delete document error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to delete document'
      };
    }
  }

  static async getDocumentsByCategory(category: string, propertyId?: string) {
    try {
      let query = supabase
        .from('documents')
        .select(
          `
          *,
          property:properties(*),
          tenant:tenants(*),
          uploader:users!uploaded_by(*)
        `
        )
        .eq('category', category)
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get documents by category error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch documents',
        data: []
      };
    }
  }

  static async getPublicDocuments(propertyId?: string) {
    try {
      let query = supabase
        .from('documents')
        .select(
          `
          *,
          property:properties(*),
          uploader:users!uploaded_by(*)
        `
        )
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get public documents error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch public documents',
        data: []
      };
    }
  }

  static async searchDocuments(
    query: string,
    propertyId?: string,
    category?: string
  ) {
    try {
      let dbQuery = supabase
        .from('documents')
        .select(
          `
          *,
          property:properties(*),
          tenant:tenants(*),
          uploader:users!uploaded_by(*)
        `
        )
        .textSearch('name', query)
        .order('created_at', { ascending: false })
        .limit(20);

      if (propertyId) {
        dbQuery = dbQuery.eq('property_id', propertyId);
      }
      if (category) {
        dbQuery = dbQuery.eq('category', category);
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Search documents error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to search documents',
        data: []
      };
    }
  }

  static async cleanupExpiredDocuments() {
    try {
      // Get expired documents
      const { data: expiredDocs } = await supabase
        .from('documents')
        .select('id, file_url')
        .lt('expires_at', new Date().toISOString());

      if (expiredDocs && expiredDocs.length > 0) {
        // Delete files from storage
        const filePaths = expiredDocs
          .map(doc => doc.file_url?.split('/').pop())
          .filter(Boolean)
          .map(fileName => `documents/${fileName}`);

        if (filePaths.length > 0) {
          await supabase.storage.from('documents').remove(filePaths);
        }

        // Delete from database
        const { error } = await supabase
          .from('documents')
          .delete()
          .lt('expires_at', new Date().toISOString());

        if (error) {
          throw new Error(error.message);
        }
      }

      return {
        success: true,
        message: `${
          expiredDocs?.length || 0
        } expired documents cleaned up successfully`
      };
    } catch (error) {
      console.error('Cleanup expired documents error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to cleanup expired documents'
      };
    }
  }

  static async getStorageUsage(propertyId?: string, tenantId?: string) {
    try {
      let query = supabase.from('documents').select('file_size');

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      const totalSize =
        data?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;
      const totalSizeMB = Math.round((totalSize / (1024 * 1024)) * 100) / 100;

      return {
        success: true,
        data: {
          totalFiles: data?.length || 0,
          totalSizeBytes: totalSize,
          totalSizeMB
        }
      };
    } catch (error) {
      console.error('Get storage usage error:', error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to get storage usage',
        data: null
      };
    }
  }
}

import { supabase } from '@/lib/supabase';

export interface Document {
  id: string;
  tenant_id: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploaded_at: string;
  category: 'lease' | 'id' | 'payment' | 'other';
}

// Property Document Interfaces
export interface DocumentRequirement {
  id: string;
  document_type: string;
  display_name: string;
  description: string;
  is_required: boolean;
  max_file_size: number;
  allowed_mime_types: string[];
  display_order: number;
}

export interface PropertyDocument {
  id: string;
  property_id: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  uploaded_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export class DocumentsAPI {
  static async getTenantDocuments(tenantId: string) {
    try {
      const { data, error } = await supabase
        .from('tenant_documents')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Failed to get tenant documents:', error);
      return { success: false, message: 'Failed to get tenant documents' };
    }
  }

  static async uploadDocument(
    tenantId: string,
    file: File,
    category: Document['category']
  ) {
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenantId}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('tenant-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = await supabase.storage
        .from('tenant-documents')
        .getPublicUrl(fileName);

      if (!urlData?.publicUrl) throw new Error('Failed to get public URL');

      // Create document record
      const { data, error } = await supabase.from('tenant_documents').insert({
        tenant_id: tenantId,
        name: file.name,
        type: file.type,
        size: file.size,
        url: urlData.publicUrl,
        category
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Failed to upload document:', error);
      return { success: false, message: 'Failed to upload document' };
    }
  }

  static async uploadMultipleDocuments(
    tenantId: string,
    files: File[],
    category: Document['category'],
    onProgress?: (file: File, progress: number) => void
  ) {
    const results = [];
    for (const file of files) {
      try {
        // Use XMLHttpRequest for progress
        const fileExt = file.name.split('.').pop();
        const fileName = `${tenantId}/${Date.now()}_${file.name.replace(
          /[^a-zA-Z0-9.]/g,
          '_'
        )}`;
        const { data: urlData } = await supabase.storage
          .from('tenant-documents')
          .createSignedUploadUrl(fileName);
        if (!urlData?.signedUrl)
          throw new Error('Failed to get signed upload URL');

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', urlData.signedUrl, true);
          xhr.upload.onprogress = event => {
            if (onProgress && event.lengthComputable) {
              onProgress(file, Math.round((event.loaded / event.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status === 200) {
              resolve();
            } else {
              reject(new Error('Upload failed'));
            }
          };
          xhr.onerror = () => reject(new Error('Upload failed'));
          xhr.send(file);
        });

        // Get public URL
        const { data: publicUrlData } = await supabase.storage
          .from('tenant-documents')
          .getPublicUrl(fileName);
        if (!publicUrlData?.publicUrl)
          throw new Error('Failed to get public URL');

        // Create document record
        const { data, error } = await supabase.from('tenant_documents').insert({
          tenant_id: tenantId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: publicUrlData.publicUrl,
          category
        });
        if (error) throw error;
        results.push({ success: true, data, file });
      } catch (error) {
        results.push({ success: false, error, file });
      }
    }
    return results;
  }

  static async deleteDocument(documentId: string) {
    try {
      // Get document to get file path
      const { data: doc, error: getError } = await supabase
        .from('tenant_documents')
        .select('url')
        .eq('id', documentId)
        .single();

      if (getError) throw getError;

      // Delete from storage
      const fileName = doc.url.split('/').pop();
      const { error: storageError } = await supabase.storage
        .from('tenant-documents')
        .remove([fileName]);

      if (storageError) throw storageError;

      // Delete record
      const { error } = await supabase
        .from('tenant_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Failed to delete document:', error);
      return { success: false, message: 'Failed to delete document' };
    }
  }

  // ============================================================================
  // PROPERTY DOCUMENT VERIFICATION FUNCTIONS
  // ============================================================================

  /**
   * Get all document requirements
   */
  static async getDocumentRequirements() {
    try {
      const { data, error } = await supabase
        .from('document_requirements')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get requirements error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get requirements',
        data: []
      };
    }
  }

  /**
   * Get documents for a property
   */
  static async getPropertyDocuments(propertyId: string) {
    try {
      const { data, error } = await supabase
        .from('property_documents')
        .select('*')
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Get documents error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get documents',
        data: []
      };
    }
  }

  /**
   * Upload a property document
   */
  static async uploadPropertyDocument(
    propertyId: string,
    documentType: string,
    file: File
  ) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate file size (10MB)
      if (file.size > 10485760) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PDF, JPG, and PNG are allowed');
      }

      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${propertyId}/${documentType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('property-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-documents')
        .getPublicUrl(fileName);

      // Create document record
      const { data, error } = await supabase
        .from('property_documents')
        .insert({
          property_id: propertyId,
          document_type: documentType,
          document_name: file.name,
          file_url: publicUrl,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        message: 'Document uploaded successfully',
        data
      };
    } catch (error) {
      console.error('Upload document error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to upload document',
        data: null
      };
    }
  }

  /**
   * Delete a property document
   */
  static async deletePropertyDocument(documentId: string) {
    try {
      // Get document info first
      const { data: doc, error: fetchError } = await supabase
        .from('property_documents')
        .select('file_url, property_id, document_type')
        .eq('id', documentId)
        .single();

      if (fetchError) throw fetchError;

      // Extract file path from URL
      const urlParts = doc.file_url.split('/property-documents/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];

        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('property-documents')
          .remove([filePath]);

        if (storageError) console.error('Storage delete error:', storageError);
      }

      // Delete database record
      const { error } = await supabase
        .from('property_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      return {
        success: true,
        message: 'Document deleted successfully'
      };
    } catch (error) {
      console.error('Delete document error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete document'
      };
    }
  }

  /**
   * Approve a document (Admin only)
   */
  static async approveDocument(documentId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.rpc('approve_document', {
        p_document_id: documentId,
        p_admin_id: user.id
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Document approved successfully',
        data
      };
    } catch (error) {
      console.error('Approve document error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve document',
        data: null
      };
    }
  }

  /**
   * Reject a document (Admin only)
   */
  static async rejectDocument(documentId: string, reason: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!reason || reason.trim().length === 0) {
        throw new Error('Rejection reason is required');
      }

      const { data, error } = await supabase.rpc('reject_document', {
        p_document_id: documentId,
        p_admin_id: user.id,
        p_reason: reason
      });

      if (error) throw error;

      return {
        success: true,
        message: 'Document rejected successfully',
        data
      };
    } catch (error) {
      console.error('Reject document error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to reject document',
        data: null
      };
    }
  }
}

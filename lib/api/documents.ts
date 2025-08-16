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
}

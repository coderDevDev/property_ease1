-- Create tenant documents table
CREATE TABLE IF NOT EXISTS public.tenant_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  size INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('lease', 'id', 'payment', 'other')),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.tenant_documents ENABLE ROW LEVEL SECURITY;

-- Allow tenants to view their own documents
CREATE POLICY tenant_documents_select ON public.tenant_documents
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.tenants WHERE id = tenant_id
    )
  );

-- Allow property owners to view documents of their tenants
CREATE POLICY owner_documents_select ON public.tenant_documents
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT o.user_id 
      FROM public.owners o
      JOIN public.properties p ON p.owner_id = o.id
      JOIN public.tenants t ON t.property_id = p.id
      WHERE t.id = tenant_documents.tenant_id
    )
  );

-- Allow tenants to upload their own documents
CREATE POLICY tenant_documents_insert ON public.tenant_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.tenants WHERE id = tenant_id
    )
  );

-- Allow property owners to upload documents for their tenants
CREATE POLICY owner_documents_insert ON public.tenant_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT o.user_id 
      FROM public.owners o
      JOIN public.properties p ON p.owner_id = o.id
      JOIN public.tenants t ON t.property_id = p.id
      WHERE t.id = tenant_documents.tenant_id
    )
  );

-- Allow tenants to delete their own documents
CREATE POLICY tenant_documents_delete ON public.tenant_documents
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.tenants WHERE id = tenant_id
    )
  );

-- Allow property owners to delete documents of their tenants
CREATE POLICY owner_documents_delete ON public.tenant_documents
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT o.user_id 
      FROM public.owners o
      JOIN public.properties p ON p.owner_id = o.id
      JOIN public.tenants t ON t.property_id = p.id
      WHERE t.id = tenant_documents.tenant_id
    )
  );

-- Create indexes
CREATE INDEX tenant_documents_tenant_id_idx ON public.tenant_documents(tenant_id);
CREATE INDEX tenant_documents_category_idx ON public.tenant_documents(category);

-- Add trigger for updated_at
CREATE TRIGGER set_tenant_documents_updated_at
  BEFORE UPDATE ON public.tenant_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

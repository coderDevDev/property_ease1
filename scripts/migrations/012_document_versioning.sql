-- =====================================================
-- Migration: Document Versioning System
-- Version: 012
-- Date: November 18, 2025
-- Description: Add version tracking to property_documents
--              NO BREAKING CHANGES
-- =====================================================

-- Add versioning columns
ALTER TABLE property_documents 
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_document_id UUID REFERENCES property_documents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_latest BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS superseded_by UUID REFERENCES property_documents(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_documents_parent 
  ON property_documents(parent_document_id);
  
CREATE INDEX IF NOT EXISTS idx_property_documents_latest 
  ON property_documents(property_id, document_type, is_latest) 
  WHERE is_latest = TRUE;

-- Function to get version history
CREATE OR REPLACE FUNCTION get_document_version_history(p_document_id UUID)
RETURNS TABLE (
  id UUID,
  version INTEGER,
  status TEXT,
  rejection_reason TEXT,
  document_name TEXT,
  file_url TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  is_latest BOOLEAN
) AS $$
DECLARE
  v_property_id UUID;
  v_document_type TEXT;
BEGIN
  -- Get property and document type
  SELECT property_id, document_type
  INTO v_property_id, v_document_type
  FROM property_documents
  WHERE id = p_document_id;

  -- Return all versions
  RETURN QUERY
  SELECT 
    pd.id,
    pd.version,
    pd.status,
    pd.rejection_reason,
    pd.document_name,
    pd.file_url,
    pd.uploaded_at,
    pd.reviewed_at,
    pd.is_latest
  FROM property_documents pd
  WHERE pd.property_id = v_property_id
    AND pd.document_type = v_document_type
  ORDER BY pd.version DESC;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION get_document_version_history(UUID) TO authenticated;
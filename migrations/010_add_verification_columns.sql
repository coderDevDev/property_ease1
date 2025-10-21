-- Migration: Add verification and approval columns for admin features
-- Date: October 21, 2025
-- Purpose: Enable Property Approval and User Verification (KYC)

-- ============================================================================
-- PROPERTIES TABLE: Add approval/verification columns
-- ============================================================================

-- Add verification columns to properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS featured_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS featured_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;

-- Create index for faster querying of unverified properties
CREATE INDEX IF NOT EXISTS idx_properties_verified ON properties(is_verified);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(is_featured);

-- Add comment
COMMENT ON COLUMN properties.is_verified IS 'Whether property has been verified by admin';
COMMENT ON COLUMN properties.verified_by IS 'Admin user who verified the property';
COMMENT ON COLUMN properties.verified_at IS 'Timestamp when property was verified';
COMMENT ON COLUMN properties.rejection_reason IS 'Reason for rejection if property was not approved';
COMMENT ON COLUMN properties.is_featured IS 'Whether property is featured/highlighted';
COMMENT ON COLUMN properties.featured_by IS 'Admin user who featured the property';
COMMENT ON COLUMN properties.featured_at IS 'Timestamp when property was featured';
COMMENT ON COLUMN properties.featured_until IS 'Expiry date for featured status';

-- ============================================================================
-- USERS TABLE: Add verification columns (if not exists)
-- ============================================================================

-- Add verification columns to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster querying of unverified users
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);

-- Add comment
COMMENT ON COLUMN users.is_verified IS 'Whether user has been verified by admin (KYC)';
COMMENT ON COLUMN users.verified_by IS 'Admin user who verified the user';
COMMENT ON COLUMN users.verified_at IS 'Timestamp when user was verified';
COMMENT ON COLUMN users.verification_requested_at IS 'Timestamp when verification documents were requested';

-- ============================================================================
-- PROPERTY MODERATION LOG TABLE: Track all property approval actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS property_moderation_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'featured', 'unfeatured'
  reason TEXT,
  previous_status JSONB,
  new_status JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_property_moderation_property ON property_moderation_log(property_id);
CREATE INDEX IF NOT EXISTS idx_property_moderation_admin ON property_moderation_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_property_moderation_created ON property_moderation_log(created_at DESC);

-- Add comment
COMMENT ON TABLE property_moderation_log IS 'Audit trail for all property approval/moderation actions';

-- ============================================================================
-- USER VERIFICATION LOG TABLE: Track all user verification actions
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_verification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL, -- 'verified', 'documents_requested', 'rejected'
  reason TEXT,
  documents_requested TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_verification_user ON user_verification_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_admin ON user_verification_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_user_verification_created ON user_verification_log(created_at DESC);

-- Add comment
COMMENT ON TABLE user_verification_log IS 'Audit trail for all user verification actions';

-- ============================================================================
-- FUNCTIONS: Helper functions for approval workflow
-- ============================================================================

-- Function to approve a property
CREATE OR REPLACE FUNCTION approve_property(
  p_property_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_property RECORD;
BEGIN
  -- Get current property
  SELECT * INTO v_property FROM properties WHERE id = p_property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Property not found'
    );
  END IF;

  -- Update property
  UPDATE properties
  SET 
    is_verified = true,
    verified_by = p_admin_id,
    verified_at = NOW(),
    rejection_reason = NULL
  WHERE id = p_property_id;

  -- Log the action
  INSERT INTO property_moderation_log (
    property_id,
    admin_id,
    action,
    previous_status,
    new_status
  ) VALUES (
    p_property_id,
    p_admin_id,
    'approved',
    jsonb_build_object('is_verified', v_property.is_verified),
    jsonb_build_object('is_verified', true)
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Property approved successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a property
CREATE OR REPLACE FUNCTION reject_property(
  p_property_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_property RECORD;
BEGIN
  -- Get current property
  SELECT * INTO v_property FROM properties WHERE id = p_property_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Property not found'
    );
  END IF;

  -- Update property
  UPDATE properties
  SET 
    is_verified = false,
    rejection_reason = p_reason
  WHERE id = p_property_id;

  -- Log the action
  INSERT INTO property_moderation_log (
    property_id,
    admin_id,
    action,
    reason
  ) VALUES (
    p_property_id,
    p_admin_id,
    'rejected',
    p_reason
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Property rejected successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify a user
CREATE OR REPLACE FUNCTION verify_user(
  p_user_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Update user
  UPDATE users
  SET 
    is_verified = true,
    verified_by = p_admin_id,
    verified_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;

  -- Log the action
  INSERT INTO user_verification_log (
    user_id,
    admin_id,
    action
  ) VALUES (
    p_user_id,
    p_admin_id,
    'verified'
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User verified successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to request verification documents
CREATE OR REPLACE FUNCTION request_verification_documents(
  p_user_id UUID,
  p_admin_id UUID,
  p_documents TEXT[]
)
RETURNS JSONB AS $$
BEGIN
  -- Update user
  UPDATE users
  SET verification_requested_at = NOW()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User not found'
    );
  END IF;

  -- Log the action
  INSERT INTO user_verification_log (
    user_id,
    admin_id,
    action,
    documents_requested
  ) VALUES (
    p_user_id,
    p_admin_id,
    'documents_requested',
    p_documents
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Document request sent successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES: Row Level Security
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE property_moderation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verification_log ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all logs
CREATE POLICY "Admins can view property moderation logs"
ON property_moderation_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can view user verification logs"
ON user_verification_log FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT ON property_moderation_log TO authenticated;
GRANT SELECT, INSERT ON user_verification_log TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration
INSERT INTO migrations (name, executed_at)
VALUES ('010_add_verification_columns', NOW())
ON CONFLICT (name) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 010_add_verification_columns completed successfully';
  RAISE NOTICE 'Added: Property approval/verification columns';
  RAISE NOTICE 'Added: User verification columns';
  RAISE NOTICE 'Added: Moderation and verification log tables';
  RAISE NOTICE 'Added: Helper functions for approval workflow';
END $$;

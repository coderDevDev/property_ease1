-- =====================================================
-- Migration: Lease Renewals
-- Version: 021
-- Date: October 26, 2025
-- Description: Add lease renewal requests system
-- =====================================================

-- Create lease_renewals table
CREATE TABLE IF NOT EXISTS lease_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Current Lease Info
  current_lease_end DATE NOT NULL,
  current_rent DECIMAL(10,2) NOT NULL,
  
  -- Proposed New Lease
  proposed_lease_start DATE NOT NULL,
  proposed_lease_end DATE NOT NULL,
  proposed_rent DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL,
  
  -- Notes
  tenant_notes TEXT,
  owner_notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  
  -- Review Info
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_proposed_dates CHECK (proposed_lease_end > proposed_lease_start),
  CONSTRAINT valid_duration CHECK (duration_months > 0),
  CONSTRAINT valid_rent CHECK (proposed_rent > 0)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_lease_renewals_tenant ON lease_renewals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_lease_renewals_property ON lease_renewals(property_id);
CREATE INDEX IF NOT EXISTS idx_lease_renewals_status ON lease_renewals(status);
CREATE INDEX IF NOT EXISTS idx_lease_renewals_created ON lease_renewals(created_at);

-- Enable RLS
ALTER TABLE lease_renewals ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Tenants can view their own renewal requests
CREATE POLICY "Tenants can view own renewals"
  ON lease_renewals FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Tenants can create renewal requests
CREATE POLICY "Tenants can create renewals"
  ON lease_renewals FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Tenants can update their pending renewals (cancel)
CREATE POLICY "Tenants can update own pending renewals"
  ON lease_renewals FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
    AND status = 'pending'
  );

-- Owners can view renewals for their properties
CREATE POLICY "Owners can view property renewals"
  ON lease_renewals FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owners can update renewals for their properties
CREATE POLICY "Owners can update property renewals"
  ON lease_renewals FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_lease_renewal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lease_renewal_timestamp
  BEFORE UPDATE ON lease_renewals
  FOR EACH ROW
  EXECUTE FUNCTION update_lease_renewal_updated_at();

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 021 completed!';
  RAISE NOTICE 'Created lease_renewals table';
  RAISE NOTICE 'Added RLS policies';
  RAISE NOTICE 'Lease renewal system ready';
END $$;

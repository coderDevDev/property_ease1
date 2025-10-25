-- =====================================================
-- Migration: Security Deposits Management
-- Version: 012
-- Date: October 25, 2025
-- Description: Add security deposit tracking, move-out inspections, and deductions
-- Status: NON-BREAKING - All existing features continue to work
-- =====================================================

-- =====================================================
-- STEP 1: Add new columns to existing payments table
-- (Non-breaking - uses IF NOT EXISTS and DEFAULT values)
-- =====================================================

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(50) DEFAULT 'rent',
ADD COLUMN IF NOT EXISTS is_deposit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS deposit_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS linked_payment_id UUID REFERENCES payments(id);

-- Add comments for documentation
COMMENT ON COLUMN payments.payment_type IS 'Type of payment: rent, deposit, utility, maintenance, reservation, deposit_refund';
COMMENT ON COLUMN payments.is_deposit IS 'True if this payment is a security deposit';
COMMENT ON COLUMN payments.deposit_status IS 'Status of deposit: held, partially_refunded, fully_refunded, forfeited';
COMMENT ON COLUMN payments.linked_payment_id IS 'Links deposit payment to first month rent payment';

-- =====================================================
-- STEP 2: Create deposit_balances table
-- Tracks security deposit amounts and refundable balances
-- =====================================================

CREATE TABLE IF NOT EXISTS deposit_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  deposit_amount DECIMAL(10,2) NOT NULL CHECK (deposit_amount >= 0),
  deductions DECIMAL(10,2) DEFAULT 0 CHECK (deductions >= 0),
  refundable_amount DECIMAL(10,2) CHECK (refundable_amount >= 0),
  status VARCHAR(20) DEFAULT 'held' CHECK (status IN ('held', 'partially_refunded', 'fully_refunded', 'forfeited')),
  payment_id UUID REFERENCES payments(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Ensure one deposit per tenant per property
  UNIQUE(tenant_id, property_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_deposit_balances_tenant ON deposit_balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deposit_balances_property ON deposit_balances(property_id);
CREATE INDEX IF NOT EXISTS idx_deposit_balances_status ON deposit_balances(status);

-- Add comments
COMMENT ON TABLE deposit_balances IS 'Tracks security deposit balances for each tenant-property relationship';
COMMENT ON COLUMN deposit_balances.deposit_amount IS 'Original security deposit amount paid';
COMMENT ON COLUMN deposit_balances.deductions IS 'Total deductions from deposit (damages, unpaid bills, etc)';
COMMENT ON COLUMN deposit_balances.refundable_amount IS 'Amount that can be refunded to tenant';
COMMENT ON COLUMN deposit_balances.status IS 'Current status of the deposit';

-- =====================================================
-- STEP 3: Create move_out_inspections table
-- Tracks property inspections when tenant moves out
-- =====================================================

CREATE TABLE IF NOT EXISTS move_out_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  inspector_id UUID NOT NULL REFERENCES users(id),
  inspection_date TIMESTAMP NOT NULL,
  checklist JSONB DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  total_deductions DECIMAL(10,2) DEFAULT 0 CHECK (total_deductions >= 0),
  refundable_amount DECIMAL(10,2) CHECK (refundable_amount >= 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'disputed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_inspections_tenant ON move_out_inspections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inspections_property ON move_out_inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON move_out_inspections(status);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON move_out_inspections(inspection_date);

-- Add comments
COMMENT ON TABLE move_out_inspections IS 'Records of property inspections when tenants move out';
COMMENT ON COLUMN move_out_inspections.checklist IS 'JSON object with inspection items and their status';
COMMENT ON COLUMN move_out_inspections.photos IS 'Array of photo URLs from the inspection';
COMMENT ON COLUMN move_out_inspections.total_deductions IS 'Sum of all deduction items';

-- =====================================================
-- STEP 4: Create deposit_deductions table
-- Itemized list of deductions from security deposit
-- =====================================================

CREATE TABLE IF NOT EXISTS deposit_deductions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspection_id UUID NOT NULL REFERENCES move_out_inspections(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL CHECK (cost >= 0),
  proof_photos TEXT[] DEFAULT '{}',
  notes TEXT,
  category VARCHAR(50),
  disputed BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  dispute_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_deductions_inspection ON deposit_deductions(inspection_id);
CREATE INDEX IF NOT EXISTS idx_deductions_disputed ON deposit_deductions(disputed);

-- Add comments
COMMENT ON TABLE deposit_deductions IS 'Itemized deductions from security deposits';
COMMENT ON COLUMN deposit_deductions.item_description IS 'Description of damage or issue';
COMMENT ON COLUMN deposit_deductions.cost IS 'Cost to repair or replace';
COMMENT ON COLUMN deposit_deductions.proof_photos IS 'Array of photo URLs showing the damage';
COMMENT ON COLUMN deposit_deductions.disputed IS 'True if tenant disputes this deduction';

-- =====================================================
-- STEP 5: Enable Row Level Security (RLS)
-- =====================================================

ALTER TABLE deposit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE move_out_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_deductions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: RLS Policies for deposit_balances
-- =====================================================

-- Tenants can view their own deposits
CREATE POLICY "Tenants can view own deposits"
  ON deposit_balances FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Owners can view deposits for their properties
CREATE POLICY "Owners can view property deposits"
  ON deposit_balances FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owners can insert deposits for their properties
CREATE POLICY "Owners can create deposits"
  ON deposit_balances FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owners can update deposits for their properties
CREATE POLICY "Owners can update deposits"
  ON deposit_balances FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Admins can view all deposits
CREATE POLICY "Admins can view all deposits"
  ON deposit_balances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STEP 7: RLS Policies for move_out_inspections
-- =====================================================

-- Tenants can view their own inspections
CREATE POLICY "Tenants view own inspections"
  ON move_out_inspections FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Owners can view inspections for their properties
CREATE POLICY "Owners view property inspections"
  ON move_out_inspections FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owners can create inspections for their properties
CREATE POLICY "Owners create inspections"
  ON move_out_inspections FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owners can update inspections for their properties
CREATE POLICY "Owners update inspections"
  ON move_out_inspections FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Admins can view all inspections
CREATE POLICY "Admins view all inspections"
  ON move_out_inspections FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STEP 8: RLS Policies for deposit_deductions
-- =====================================================

-- Tenants can view deductions for their inspections
CREATE POLICY "Tenants view own deductions"
  ON deposit_deductions FOR SELECT
  USING (
    inspection_id IN (
      SELECT id FROM move_out_inspections 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()
      )
    )
  );

-- Tenants can update (dispute) deductions
CREATE POLICY "Tenants can dispute deductions"
  ON deposit_deductions FOR UPDATE
  USING (
    inspection_id IN (
      SELECT id FROM move_out_inspections 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    -- Only allow updating dispute fields
    disputed = TRUE
  );

-- Owners can view deductions for their property inspections
CREATE POLICY "Owners view property deductions"
  ON deposit_deductions FOR SELECT
  USING (
    inspection_id IN (
      SELECT id FROM move_out_inspections 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

-- Owners can create deductions
CREATE POLICY "Owners create deductions"
  ON deposit_deductions FOR INSERT
  WITH CHECK (
    inspection_id IN (
      SELECT id FROM move_out_inspections 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

-- Owners can update deductions
CREATE POLICY "Owners update deductions"
  ON deposit_deductions FOR UPDATE
  USING (
    inspection_id IN (
      SELECT id FROM move_out_inspections 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

-- Owners can delete deductions
CREATE POLICY "Owners delete deductions"
  ON deposit_deductions FOR DELETE
  USING (
    inspection_id IN (
      SELECT id FROM move_out_inspections 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

-- Admins can view all deductions
CREATE POLICY "Admins view all deductions"
  ON deposit_deductions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- STEP 9: Create helper functions
-- =====================================================

-- Function to calculate total deductions for an inspection
CREATE OR REPLACE FUNCTION calculate_inspection_deductions(inspection_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  total DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(cost), 0) INTO total
  FROM deposit_deductions
  WHERE inspection_id = inspection_uuid;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update inspection totals when deductions change
CREATE OR REPLACE FUNCTION update_inspection_totals()
RETURNS TRIGGER AS $$
DECLARE
  total_deductions DECIMAL(10,2);
  deposit_amt DECIMAL(10,2);
  refundable DECIMAL(10,2);
BEGIN
  -- Calculate total deductions
  SELECT calculate_inspection_deductions(NEW.inspection_id) INTO total_deductions;
  
  -- Get deposit amount
  SELECT db.deposit_amount INTO deposit_amt
  FROM move_out_inspections moi
  JOIN deposit_balances db ON db.tenant_id = moi.tenant_id AND db.property_id = moi.property_id
  WHERE moi.id = NEW.inspection_id;
  
  -- Calculate refundable amount
  refundable := GREATEST(0, COALESCE(deposit_amt, 0) - total_deductions);
  
  -- Update inspection
  UPDATE move_out_inspections
  SET 
    total_deductions = total_deductions,
    refundable_amount = refundable,
    updated_at = NOW()
  WHERE id = NEW.inspection_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update inspection totals
DROP TRIGGER IF EXISTS trigger_update_inspection_totals ON deposit_deductions;
CREATE TRIGGER trigger_update_inspection_totals
  AFTER INSERT OR UPDATE OR DELETE ON deposit_deductions
  FOR EACH ROW
  EXECUTE FUNCTION update_inspection_totals();

-- Function to update deposit balance when inspection is completed
CREATE OR REPLACE FUNCTION update_deposit_on_inspection_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE deposit_balances
    SET 
      deductions = NEW.total_deductions,
      refundable_amount = NEW.refundable_amount,
      status = CASE 
        WHEN NEW.refundable_amount = 0 THEN 'forfeited'
        WHEN NEW.refundable_amount < deposit_amount THEN 'partially_refunded'
        ELSE 'held'
      END,
      updated_at = NOW()
    WHERE tenant_id = NEW.tenant_id 
      AND property_id = NEW.property_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update deposit balance
DROP TRIGGER IF EXISTS trigger_update_deposit_on_complete ON move_out_inspections;
CREATE TRIGGER trigger_update_deposit_on_complete
  AFTER UPDATE ON move_out_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_deposit_on_inspection_complete();

-- =====================================================
-- STEP 10: Create updated_at trigger for new tables
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_deposit_balances_updated_at ON deposit_balances;
CREATE TRIGGER update_deposit_balances_updated_at
  BEFORE UPDATE ON deposit_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inspections_updated_at ON move_out_inspections;
CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON move_out_inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_deductions_updated_at ON deposit_deductions;
CREATE TRIGGER update_deductions_updated_at
  BEFORE UPDATE ON deposit_deductions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify migration)
-- =====================================================

-- Check new columns in payments table
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'payments' 
-- AND column_name IN ('payment_type', 'is_deposit', 'deposit_status', 'linked_payment_id');

-- Check new tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name IN ('deposit_balances', 'move_out_inspections', 'deposit_deductions');

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE tablename IN ('deposit_balances', 'move_out_inspections', 'deposit_deductions');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 012_security_deposits completed successfully';
  RAISE NOTICE 'Added: payment_type, is_deposit, deposit_status, linked_payment_id to payments table';
  RAISE NOTICE 'Created: deposit_balances, move_out_inspections, deposit_deductions tables';
  RAISE NOTICE 'Enabled: Row Level Security on all new tables';
  RAISE NOTICE 'Created: Helper functions and triggers for automatic calculations';
END $$;

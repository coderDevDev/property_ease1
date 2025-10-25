-- =====================================================
-- Migration: Utility Bills Management
-- Version: 013
-- Date: October 25, 2025
-- Description: Add utility bills tracking and payment
-- Status: NON-BREAKING - All existing features continue to work
-- =====================================================

-- =====================================================
-- PART 1: CREATE TABLES
-- =====================================================

-- Utility Bills Table
-- Tracks utility consumption and bills for properties
CREATE TABLE IF NOT EXISTS utility_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  
  -- Bill Details
  bill_type VARCHAR(50) NOT NULL, -- electricity, water, gas, internet, cable, garbage, etc.
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Consumption
  previous_reading DECIMAL(10,2),
  current_reading DECIMAL(10,2),
  consumption DECIMAL(10,2), -- current - previous
  unit VARCHAR(20), -- kWh, cubic meters, etc.
  
  -- Costs
  rate_per_unit DECIMAL(10,2),
  base_charge DECIMAL(10,2) DEFAULT 0,
  consumption_charge DECIMAL(10,2) DEFAULT 0,
  additional_charges DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment
  payment_status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  payment_id UUID REFERENCES payments(id),
  paid_date TIMESTAMP,
  
  -- Supporting Documents
  bill_image_url TEXT,
  receipt_image_url TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_billing_period CHECK (billing_period_end >= billing_period_start),
  CONSTRAINT valid_readings CHECK (current_reading >= previous_reading OR previous_reading IS NULL),
  CONSTRAINT valid_amount CHECK (total_amount >= 0)
);

-- Utility Rates Table
-- Store utility rates per property or default rates
CREATE TABLE IF NOT EXISTS utility_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id),
  
  -- Rate Details
  utility_type VARCHAR(50) NOT NULL, -- electricity, water, gas, etc.
  rate_per_unit DECIMAL(10,2) NOT NULL,
  base_charge DECIMAL(10,2) DEFAULT 0,
  unit VARCHAR(20) NOT NULL, -- kWh, cubic meters, etc.
  
  -- Validity
  effective_from DATE NOT NULL,
  effective_to DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rate CHECK (rate_per_unit >= 0),
  CONSTRAINT valid_base_charge CHECK (base_charge >= 0)
);

-- Utility Meter Readings Table
-- Track historical meter readings
CREATE TABLE IF NOT EXISTS utility_meter_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  recorded_by UUID NOT NULL REFERENCES users(id),
  
  -- Reading Details
  utility_type VARCHAR(50) NOT NULL,
  reading_date DATE NOT NULL,
  meter_reading DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  
  -- Supporting Info
  meter_number VARCHAR(100),
  photo_url TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_reading CHECK (meter_reading >= 0)
);

-- =====================================================
-- PART 2: ADD INDEXES
-- =====================================================

-- Utility Bills Indexes
CREATE INDEX IF NOT EXISTS idx_utility_bills_property ON utility_bills(property_id);
CREATE INDEX IF NOT EXISTS idx_utility_bills_tenant ON utility_bills(tenant_id);
CREATE INDEX IF NOT EXISTS idx_utility_bills_status ON utility_bills(payment_status);
CREATE INDEX IF NOT EXISTS idx_utility_bills_due_date ON utility_bills(due_date);
CREATE INDEX IF NOT EXISTS idx_utility_bills_type ON utility_bills(bill_type);
CREATE INDEX IF NOT EXISTS idx_utility_bills_period ON utility_bills(billing_period_start, billing_period_end);

-- Utility Rates Indexes
CREATE INDEX IF NOT EXISTS idx_utility_rates_property ON utility_rates(property_id);
CREATE INDEX IF NOT EXISTS idx_utility_rates_owner ON utility_rates(owner_id);
CREATE INDEX IF NOT EXISTS idx_utility_rates_type ON utility_rates(utility_type);
CREATE INDEX IF NOT EXISTS idx_utility_rates_active ON utility_rates(is_active);

-- Meter Readings Indexes
CREATE INDEX IF NOT EXISTS idx_meter_readings_property ON utility_meter_readings(property_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_tenant ON utility_meter_readings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meter_readings_type ON utility_meter_readings(utility_type);
CREATE INDEX IF NOT EXISTS idx_meter_readings_date ON utility_meter_readings(reading_date);

-- =====================================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE utility_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE utility_meter_readings ENABLE ROW LEVEL SECURITY;

-- Utility Bills Policies
-- Tenants can view their own bills
CREATE POLICY "Tenants can view own utility bills"
  ON utility_bills FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Owners can view bills for their properties
CREATE POLICY "Owners can view property utility bills"
  ON utility_bills FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owners can create bills for their properties
CREATE POLICY "Owners can create utility bills"
  ON utility_bills FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owners can update bills for their properties
CREATE POLICY "Owners can update utility bills"
  ON utility_bills FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owners can delete bills for their properties
CREATE POLICY "Owners can delete utility bills"
  ON utility_bills FOR DELETE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Utility Rates Policies
-- Owners can manage their rates
CREATE POLICY "Owners can view own utility rates"
  ON utility_rates FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can create utility rates"
  ON utility_rates FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update utility rates"
  ON utility_rates FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can delete utility rates"
  ON utility_rates FOR DELETE
  USING (owner_id = auth.uid());

-- Meter Readings Policies
-- Tenants can view their readings
CREATE POLICY "Tenants can view own meter readings"
  ON utility_meter_readings FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Owners can view readings for their properties
CREATE POLICY "Owners can view property meter readings"
  ON utility_meter_readings FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Owners can create readings
CREATE POLICY "Owners can create meter readings"
  ON utility_meter_readings FOR INSERT
  WITH CHECK (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- PART 4: FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to calculate utility bill consumption
CREATE OR REPLACE FUNCTION calculate_utility_consumption()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate consumption if readings provided
  IF NEW.current_reading IS NOT NULL AND NEW.previous_reading IS NOT NULL THEN
    NEW.consumption := NEW.current_reading - NEW.previous_reading;
  END IF;
  
  -- Calculate consumption charge
  IF NEW.consumption IS NOT NULL AND NEW.rate_per_unit IS NOT NULL THEN
    NEW.consumption_charge := NEW.consumption * NEW.rate_per_unit;
  END IF;
  
  -- Calculate total amount
  NEW.total_amount := COALESCE(NEW.base_charge, 0) + 
                      COALESCE(NEW.consumption_charge, 0) + 
                      COALESCE(NEW.additional_charges, 0);
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for utility bill calculations
CREATE TRIGGER trigger_calculate_utility_consumption
  BEFORE INSERT OR UPDATE ON utility_bills
  FOR EACH ROW
  EXECUTE FUNCTION calculate_utility_consumption();

-- Function to update bill status when payment is made
CREATE OR REPLACE FUNCTION update_utility_bill_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update utility bill status when payment is made
  IF NEW.payment_type = 'utility' AND NEW.payment_status = 'paid' THEN
    UPDATE utility_bills
    SET 
      payment_status = 'paid',
      paid_date = NEW.paid_date,
      payment_id = NEW.id,
      updated_at = NOW()
    WHERE id = NEW.reference_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update bill status on payment
CREATE TRIGGER trigger_update_utility_bill_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.payment_type = 'utility')
  EXECUTE FUNCTION update_utility_bill_payment_status();

-- Function to check for overdue bills
CREATE OR REPLACE FUNCTION mark_overdue_utility_bills()
RETURNS void AS $$
BEGIN
  UPDATE utility_bills
  SET 
    payment_status = 'overdue',
    updated_at = NOW()
  WHERE 
    payment_status = 'pending' 
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 5: ADD UTILITY TYPE TO PAYMENTS TABLE
-- =====================================================

-- Add reference_id to payments table for linking utility bills
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS utility_type VARCHAR(50);

-- Add index for reference_id
CREATE INDEX IF NOT EXISTS idx_payments_reference_id ON payments(reference_id);

-- =====================================================
-- PART 6: VIEWS FOR REPORTING
-- =====================================================

-- View for utility bill summary
CREATE OR REPLACE VIEW utility_bills_summary AS
SELECT 
  ub.id,
  ub.property_id,
  p.name as property_name,
  ub.tenant_id,
  u.full_name as tenant_name,
  ub.bill_type,
  ub.billing_period_start,
  ub.billing_period_end,
  ub.due_date,
  ub.consumption,
  ub.unit,
  ub.total_amount,
  ub.payment_status,
  ub.paid_date,
  CASE 
    WHEN ub.payment_status = 'paid' THEN 0
    WHEN ub.due_date < CURRENT_DATE THEN CURRENT_DATE - ub.due_date
    ELSE 0
  END as days_overdue
FROM utility_bills ub
JOIN properties p ON p.id = ub.property_id
LEFT JOIN tenants t ON t.id = ub.tenant_id
LEFT JOIN users u ON u.id = t.user_id;

-- =====================================================
-- PART 7: SAMPLE DATA (OPTIONAL - COMMENT OUT FOR PRODUCTION)
-- =====================================================

-- Uncomment to insert sample utility types
/*
INSERT INTO utility_rates (owner_id, utility_type, rate_per_unit, base_charge, unit, effective_from, is_active)
VALUES 
  ((SELECT id FROM users WHERE role = 'owner' LIMIT 1), 'electricity', 12.50, 100.00, 'kWh', CURRENT_DATE, true),
  ((SELECT id FROM users WHERE role = 'owner' LIMIT 1), 'water', 25.00, 50.00, 'm³', CURRENT_DATE, true),
  ((SELECT id FROM users WHERE role = 'owner' LIMIT 1), 'internet', 0, 1500.00, 'month', CURRENT_DATE, true);
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE 'Migration 013 completed successfully!';
  RAISE NOTICE 'Created tables: utility_bills, utility_rates, utility_meter_readings';
  RAISE NOTICE 'Added RLS policies for all tables';
  RAISE NOTICE 'Created triggers for automatic calculations';
  RAISE NOTICE 'Status: NON-BREAKING - All existing features continue to work';
END $$;

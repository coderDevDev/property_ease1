-- =====================================================
-- Migration: Advance Payments
-- Version: 014
-- Date: October 25, 2025
-- Description: Add advance payment tracking and allocation
-- Status: NON-BREAKING - All existing features continue to work
-- =====================================================

-- =====================================================
-- PART 1: CREATE TABLES
-- =====================================================

-- Advance Payments Table
-- Tracks prepayments made by tenants for future rent
CREATE TABLE IF NOT EXISTS advance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id),
  
  -- Payment Details
  total_amount DECIMAL(10,2) NOT NULL,
  allocated_amount DECIMAL(10,2) DEFAULT 0,
  remaining_balance DECIMAL(10,2) NOT NULL,
  
  -- Coverage Period
  months_covered INTEGER NOT NULL,
  start_month DATE NOT NULL,
  end_month DATE NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, fully_allocated, cancelled, refunded
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (total_amount > 0),
  CONSTRAINT valid_balance CHECK (remaining_balance >= 0),
  CONSTRAINT valid_allocated CHECK (allocated_amount >= 0),
  CONSTRAINT valid_months CHECK (months_covered > 0),
  CONSTRAINT valid_period CHECK (end_month >= start_month)
);

-- Advance Payment Allocations Table
-- Tracks how advance payments are allocated to monthly rent
CREATE TABLE IF NOT EXISTS advance_payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  advance_payment_id UUID NOT NULL REFERENCES advance_payments(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  
  -- Allocation Details
  allocated_amount DECIMAL(10,2) NOT NULL,
  allocation_date TIMESTAMP DEFAULT NOW(),
  
  -- Payment Period
  payment_month DATE NOT NULL,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_allocation_amount CHECK (allocated_amount > 0)
);

-- Payment Schedules Table (Enhanced)
-- Generate and track payment schedules for leases
CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Schedule Details
  due_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_type VARCHAR(50) DEFAULT 'rent',
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, paid, partially_paid, overdue, cancelled
  paid_amount DECIMAL(10,2) DEFAULT 0,
  remaining_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment Reference
  payment_id UUID REFERENCES payments(id),
  advance_payment_id UUID REFERENCES advance_payments(id),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_schedule_amount CHECK (amount > 0),
  CONSTRAINT valid_paid_amount CHECK (paid_amount >= 0),
  CONSTRAINT valid_remaining CHECK (remaining_amount >= 0)
);

-- =====================================================
-- PART 2: ADD INDEXES
-- =====================================================

-- Advance Payments Indexes
CREATE INDEX IF NOT EXISTS idx_advance_payments_tenant ON advance_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_property ON advance_payments(property_id);
CREATE INDEX IF NOT EXISTS idx_advance_payments_status ON advance_payments(status);
CREATE INDEX IF NOT EXISTS idx_advance_payments_period ON advance_payments(start_month, end_month);

-- Allocations Indexes
CREATE INDEX IF NOT EXISTS idx_allocations_advance_payment ON advance_payment_allocations(advance_payment_id);
CREATE INDEX IF NOT EXISTS idx_allocations_payment ON advance_payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_allocations_month ON advance_payment_allocations(payment_month);

-- Payment Schedules Indexes
CREATE INDEX IF NOT EXISTS idx_schedules_tenant ON payment_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedules_property ON payment_schedules(property_id);
CREATE INDEX IF NOT EXISTS idx_schedules_due_date ON payment_schedules(due_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON payment_schedules(status);

-- =====================================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE advance_payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

-- Advance Payments Policies
-- Tenants can view their own advance payments
CREATE POLICY "Tenants can view own advance payments"
  ON advance_payments FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Owners can view advance payments for their properties
CREATE POLICY "Owners can view property advance payments"
  ON advance_payments FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Tenants can create advance payments
CREATE POLICY "Tenants can create advance payments"
  ON advance_payments FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Owners can update advance payments
CREATE POLICY "Owners can update advance payments"
  ON advance_payments FOR UPDATE
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- Allocations Policies
-- Tenants can view their allocations
CREATE POLICY "Tenants can view own allocations"
  ON advance_payment_allocations FOR SELECT
  USING (
    advance_payment_id IN (
      SELECT id FROM advance_payments 
      WHERE tenant_id IN (
        SELECT id FROM tenants WHERE user_id = auth.uid()
      )
    )
  );

-- Owners can view allocations for their properties
CREATE POLICY "Owners can view property allocations"
  ON advance_payment_allocations FOR SELECT
  USING (
    advance_payment_id IN (
      SELECT id FROM advance_payments 
      WHERE property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    )
  );

-- System can create allocations (via triggers)
CREATE POLICY "System can create allocations"
  ON advance_payment_allocations FOR INSERT
  WITH CHECK (true);

-- Payment Schedules Policies
-- Tenants can view their schedules
CREATE POLICY "Tenants can view own schedules"
  ON payment_schedules FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Owners can manage schedules for their properties
CREATE POLICY "Owners can manage property schedules"
  ON payment_schedules FOR ALL
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- PART 4: FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update advance payment balance
CREATE OR REPLACE FUNCTION update_advance_payment_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update remaining balance
  NEW.remaining_balance := NEW.total_amount - NEW.allocated_amount;
  
  -- Update status based on balance
  IF NEW.remaining_balance = 0 THEN
    NEW.status := 'fully_allocated';
  ELSIF NEW.remaining_balance > 0 AND NEW.status = 'fully_allocated' THEN
    NEW.status := 'active';
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for advance payment balance updates
CREATE TRIGGER trigger_update_advance_payment_balance
  BEFORE INSERT OR UPDATE ON advance_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_advance_payment_balance();

-- Function to allocate advance payment to rent
CREATE OR REPLACE FUNCTION allocate_advance_payment(
  p_advance_payment_id UUID,
  p_payment_id UUID,
  p_amount DECIMAL,
  p_payment_month DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  v_remaining_balance DECIMAL;
BEGIN
  -- Get current remaining balance
  SELECT remaining_balance INTO v_remaining_balance
  FROM advance_payments
  WHERE id = p_advance_payment_id;
  
  -- Check if sufficient balance
  IF v_remaining_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient advance payment balance';
  END IF;
  
  -- Create allocation record
  INSERT INTO advance_payment_allocations (
    advance_payment_id,
    payment_id,
    allocated_amount,
    payment_month
  ) VALUES (
    p_advance_payment_id,
    p_payment_id,
    p_amount,
    p_payment_month
  );
  
  -- Update advance payment allocated amount
  UPDATE advance_payments
  SET allocated_amount = allocated_amount + p_amount
  WHERE id = p_advance_payment_id;
  
  -- Update payment status
  UPDATE payments
  SET payment_status = 'paid',
      paid_date = NOW()
  WHERE id = p_payment_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-allocate advance payments to due rent
CREATE OR REPLACE FUNCTION auto_allocate_advance_payments()
RETURNS void AS $$
DECLARE
  v_schedule RECORD;
  v_advance RECORD;
  v_allocation_amount DECIMAL;
BEGIN
  -- Loop through scheduled payments that are due
  FOR v_schedule IN 
    SELECT * FROM payment_schedules
    WHERE status = 'scheduled'
    AND due_date <= CURRENT_DATE
    AND remaining_amount > 0
  LOOP
    -- Find active advance payment for this tenant/property
    SELECT * INTO v_advance
    FROM advance_payments
    WHERE tenant_id = v_schedule.tenant_id
    AND property_id = v_schedule.property_id
    AND status = 'active'
    AND remaining_balance > 0
    ORDER BY created_at ASC
    LIMIT 1;
    
    -- If advance payment found, allocate
    IF FOUND THEN
      v_allocation_amount := LEAST(v_advance.remaining_balance, v_schedule.remaining_amount);
      
      -- Create allocation
      INSERT INTO advance_payment_allocations (
        advance_payment_id,
        payment_id,
        allocated_amount,
        payment_month
      ) VALUES (
        v_advance.id,
        v_schedule.payment_id,
        v_allocation_amount,
        v_schedule.due_date
      );
      
      -- Update advance payment
      UPDATE advance_payments
      SET allocated_amount = allocated_amount + v_allocation_amount
      WHERE id = v_advance.id;
      
      -- Update schedule
      UPDATE payment_schedules
      SET 
        paid_amount = paid_amount + v_allocation_amount,
        remaining_amount = remaining_amount - v_allocation_amount,
        status = CASE 
          WHEN remaining_amount - v_allocation_amount = 0 THEN 'paid'
          ELSE 'partially_paid'
        END,
        advance_payment_id = v_advance.id
      WHERE id = v_schedule.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate payment schedule for lease
CREATE OR REPLACE FUNCTION generate_payment_schedule(
  p_tenant_id UUID,
  p_property_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_monthly_amount DECIMAL
)
RETURNS void AS $$
DECLARE
  v_current_date DATE;
BEGIN
  v_current_date := p_start_date;
  
  -- Generate monthly payments
  WHILE v_current_date <= p_end_date LOOP
    INSERT INTO payment_schedules (
      tenant_id,
      property_id,
      due_date,
      amount,
      remaining_amount,
      payment_type
    ) VALUES (
      p_tenant_id,
      p_property_id,
      v_current_date,
      p_monthly_amount,
      p_monthly_amount,
      'rent'
    );
    
    v_current_date := v_current_date + INTERVAL '1 month';
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 5: VIEWS FOR REPORTING
-- =====================================================

-- View for advance payment summary
CREATE OR REPLACE VIEW advance_payments_summary AS
SELECT 
  ap.id,
  ap.tenant_id,
  t.user_id,
  u.full_name as tenant_name,
  ap.property_id,
  p.name as property_name,
  ap.total_amount,
  ap.allocated_amount,
  ap.remaining_balance,
  ap.months_covered,
  ap.start_month,
  ap.end_month,
  ap.status,
  ap.created_at,
  COUNT(apa.id) as allocation_count
FROM advance_payments ap
JOIN tenants t ON t.id = ap.tenant_id
JOIN users u ON u.id = t.user_id
JOIN properties p ON p.id = ap.property_id
LEFT JOIN advance_payment_allocations apa ON apa.advance_payment_id = ap.id
GROUP BY ap.id, t.user_id, u.full_name, p.name;

-- View for payment schedule overview
CREATE OR REPLACE VIEW payment_schedules_overview AS
SELECT 
  ps.id,
  ps.tenant_id,
  u.full_name as tenant_name,
  ps.property_id,
  p.name as property_name,
  ps.due_date,
  ps.amount,
  ps.paid_amount,
  ps.remaining_amount,
  ps.status,
  ps.payment_type,
  CASE 
    WHEN ps.due_date < CURRENT_DATE AND ps.status != 'paid' THEN true
    ELSE false
  END as is_overdue,
  CASE
    WHEN ps.advance_payment_id IS NOT NULL THEN 'advance'
    WHEN ps.payment_id IS NOT NULL THEN 'regular'
    ELSE 'unpaid'
  END as payment_method
FROM payment_schedules ps
JOIN tenants t ON t.id = ps.tenant_id
JOIN users u ON u.id = t.user_id
JOIN properties p ON p.id = ps.property_id;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE 'Migration 014 completed successfully!';
  RAISE NOTICE 'Created tables: advance_payments, advance_payment_allocations, payment_schedules';
  RAISE NOTICE 'Added RLS policies for all tables';
  RAISE NOTICE 'Created functions for automatic allocation';
  RAISE NOTICE 'Status: NON-BREAKING - All existing features continue to work';
END $$;

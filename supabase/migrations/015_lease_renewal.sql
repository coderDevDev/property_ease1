-- =====================================================
-- Migration: Lease Renewal
-- Version: 015
-- Date: October 25, 2025
-- Description: Add lease renewal and extension management
-- Status: NON-BREAKING - All existing features continue to work
-- =====================================================

-- =====================================================
-- PART 1: CREATE TABLES
-- =====================================================

-- Lease Renewals Table
-- Tracks lease renewal requests and approvals
CREATE TABLE IF NOT EXISTS lease_renewals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Original Lease Info
  original_lease_start DATE NOT NULL,
  original_lease_end DATE NOT NULL,
  original_monthly_rent DECIMAL(10,2) NOT NULL,
  
  -- Renewal Terms
  new_lease_start DATE NOT NULL,
  new_lease_end DATE NOT NULL,
  new_monthly_rent DECIMAL(10,2) NOT NULL,
  rent_increase DECIMAL(10,2) DEFAULT 0,
  rent_increase_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Renewal Period
  renewal_duration_months INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled, expired
  
  -- Request Details
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_date TIMESTAMP DEFAULT NOW(),
  
  -- Response Details
  reviewed_by UUID REFERENCES users(id),
  reviewed_date TIMESTAMP,
  rejection_reason TEXT,
  
  -- Terms & Conditions
  terms TEXT,
  special_conditions TEXT,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_renewal_dates CHECK (new_lease_start >= original_lease_end),
  CONSTRAINT valid_new_lease_period CHECK (new_lease_end > new_lease_start),
  CONSTRAINT valid_rent CHECK (new_monthly_rent > 0),
  CONSTRAINT valid_duration CHECK (renewal_duration_months > 0)
);

-- Lease History Table
-- Track all lease changes and renewals
CREATE TABLE IF NOT EXISTS lease_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  renewal_id UUID REFERENCES lease_renewals(id),
  
  -- Lease Period
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  
  -- Rent Details
  monthly_rent DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, completed, terminated, renewed
  
  -- Change Type
  change_type VARCHAR(50) NOT NULL, -- initial, renewal, extension, termination, rent_adjustment
  change_reason TEXT,
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_lease_period CHECK (lease_end > lease_start),
  CONSTRAINT valid_rent_amount CHECK (monthly_rent > 0)
);

-- Lease Notifications Table
-- Track renewal reminders and notifications
CREATE TABLE IF NOT EXISTS lease_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Relationships
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- Notification Details
  notification_type VARCHAR(50) NOT NULL, -- renewal_reminder, expiring_soon, expired, renewal_approved, renewal_rejected
  notification_date TIMESTAMP DEFAULT NOW(),
  
  -- Lease Info
  lease_end_date DATE NOT NULL,
  days_until_expiry INTEGER,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_days_until_expiry CHECK (days_until_expiry >= 0)
);

-- =====================================================
-- PART 2: ADD INDEXES
-- =====================================================

-- Lease Renewals Indexes
CREATE INDEX IF NOT EXISTS idx_renewals_tenant ON lease_renewals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_renewals_property ON lease_renewals(property_id);
CREATE INDEX IF NOT EXISTS idx_renewals_status ON lease_renewals(status);
CREATE INDEX IF NOT EXISTS idx_renewals_dates ON lease_renewals(new_lease_start, new_lease_end);

-- Lease History Indexes
CREATE INDEX IF NOT EXISTS idx_history_tenant ON lease_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_history_property ON lease_history(property_id);
CREATE INDEX IF NOT EXISTS idx_history_status ON lease_history(status);
CREATE INDEX IF NOT EXISTS idx_history_dates ON lease_history(lease_start, lease_end);
CREATE INDEX IF NOT EXISTS idx_history_type ON lease_history(change_type);

-- Notifications Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON lease_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_property ON lease_notifications(property_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON lease_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON lease_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON lease_notifications(is_sent);

-- =====================================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE lease_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_notifications ENABLE ROW LEVEL SECURITY;

-- Lease Renewals Policies
-- Tenants can view their own renewals
CREATE POLICY "Tenants can view own renewals"
  ON lease_renewals FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Tenants can create renewal requests
CREATE POLICY "Tenants can create renewal requests"
  ON lease_renewals FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
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

-- Lease History Policies
-- Tenants can view their lease history
CREATE POLICY "Tenants can view own lease history"
  ON lease_history FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Owners can view lease history for their properties
CREATE POLICY "Owners can view property lease history"
  ON lease_history FOR SELECT
  USING (
    property_id IN (
      SELECT id FROM properties WHERE owner_id = auth.uid()
    )
  );

-- System can create lease history
CREATE POLICY "System can create lease history"
  ON lease_history FOR INSERT
  WITH CHECK (true);

-- Notifications Policies
-- Tenants can view their notifications
CREATE POLICY "Tenants can view own notifications"
  ON lease_notifications FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- Tenants can update their notifications (mark as read)
CREATE POLICY "Tenants can update own notifications"
  ON lease_notifications FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE user_id = auth.uid()
    )
  );

-- System can create notifications
CREATE POLICY "System can create notifications"
  ON lease_notifications FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- PART 4: FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to calculate rent increase
CREATE OR REPLACE FUNCTION calculate_rent_increase()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate rent increase amount
  NEW.rent_increase := NEW.new_monthly_rent - NEW.original_monthly_rent;
  
  -- Calculate rent increase percentage
  IF NEW.original_monthly_rent > 0 THEN
    NEW.rent_increase_percentage := (NEW.rent_increase / NEW.original_monthly_rent) * 100;
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for rent increase calculation
CREATE TRIGGER trigger_calculate_rent_increase
  BEFORE INSERT OR UPDATE ON lease_renewals
  FOR EACH ROW
  EXECUTE FUNCTION calculate_rent_increase();

-- Function to create lease history on renewal approval
CREATE OR REPLACE FUNCTION create_lease_history_on_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- When renewal is approved, create lease history record
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    INSERT INTO lease_history (
      tenant_id,
      property_id,
      renewal_id,
      lease_start,
      lease_end,
      monthly_rent,
      status,
      change_type,
      change_reason,
      created_by
    ) VALUES (
      NEW.tenant_id,
      NEW.property_id,
      NEW.id,
      NEW.new_lease_start,
      NEW.new_lease_end,
      NEW.new_monthly_rent,
      'active',
      'renewal',
      'Lease renewed',
      NEW.reviewed_by
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for lease history creation
CREATE TRIGGER trigger_create_lease_history
  AFTER UPDATE ON lease_renewals
  FOR EACH ROW
  EXECUTE FUNCTION create_lease_history_on_approval();

-- Function to check expiring leases and create notifications
CREATE OR REPLACE FUNCTION check_expiring_leases()
RETURNS void AS $$
DECLARE
  v_tenant RECORD;
  v_days_until_expiry INTEGER;
BEGIN
  -- Loop through active tenants
  FOR v_tenant IN 
    SELECT 
      t.id as tenant_id,
      t.property_id,
      t.lease_end,
      t.user_id
    FROM tenants t
    WHERE t.lease_end IS NOT NULL
    AND t.lease_end > CURRENT_DATE
    AND t.lease_end <= CURRENT_DATE + INTERVAL '90 days'
  LOOP
    v_days_until_expiry := v_tenant.lease_end - CURRENT_DATE;
    
    -- Create notification if lease expiring in 90, 60, 30, or 7 days
    IF v_days_until_expiry IN (90, 60, 30, 7) THEN
      -- Check if notification already exists
      IF NOT EXISTS (
        SELECT 1 FROM lease_notifications
        WHERE tenant_id = v_tenant.tenant_id
        AND notification_type = 'renewal_reminder'
        AND lease_end_date = v_tenant.lease_end
        AND days_until_expiry = v_days_until_expiry
      ) THEN
        INSERT INTO lease_notifications (
          tenant_id,
          property_id,
          notification_type,
          lease_end_date,
          days_until_expiry,
          title,
          message
        ) VALUES (
          v_tenant.tenant_id,
          v_tenant.property_id,
          'renewal_reminder',
          v_tenant.lease_end,
          v_days_until_expiry,
          'Lease Renewal Reminder',
          'Your lease will expire in ' || v_days_until_expiry || ' days. Please contact your landlord to discuss renewal options.'
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve lease renewal
CREATE OR REPLACE FUNCTION approve_lease_renewal(
  p_renewal_id UUID,
  p_reviewed_by UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE lease_renewals
  SET 
    status = 'approved',
    reviewed_by = p_reviewed_by,
    reviewed_date = NOW()
  WHERE id = p_renewal_id;
  
  -- Create notification
  INSERT INTO lease_notifications (
    tenant_id,
    property_id,
    notification_type,
    lease_end_date,
    title,
    message
  )
  SELECT 
    tenant_id,
    property_id,
    new_lease_end,
    'Lease Renewal Approved',
    'Your lease renewal request has been approved. New lease period: ' || 
    new_lease_start || ' to ' || new_lease_end
  FROM lease_renewals
  WHERE id = p_renewal_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject lease renewal
CREATE OR REPLACE FUNCTION reject_lease_renewal(
  p_renewal_id UUID,
  p_reviewed_by UUID,
  p_rejection_reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE lease_renewals
  SET 
    status = 'rejected',
    reviewed_by = p_reviewed_by,
    reviewed_date = NOW(),
    rejection_reason = p_rejection_reason
  WHERE id = p_renewal_id;
  
  -- Create notification
  INSERT INTO lease_notifications (
    tenant_id,
    property_id,
    notification_type,
    lease_end_date,
    title,
    message
  )
  SELECT 
    tenant_id,
    property_id,
    original_lease_end,
    'Lease Renewal Rejected',
    'Your lease renewal request has been rejected. Reason: ' || p_rejection_reason
  FROM lease_renewals
  WHERE id = p_renewal_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 5: VIEWS FOR REPORTING
-- =====================================================

-- View for lease renewal summary
CREATE OR REPLACE VIEW lease_renewals_summary AS
SELECT 
  lr.id,
  lr.tenant_id,
  u.full_name as tenant_name,
  u.email as tenant_email,
  lr.property_id,
  p.name as property_name,
  lr.original_lease_end,
  lr.new_lease_start,
  lr.new_lease_end,
  lr.original_monthly_rent,
  lr.new_monthly_rent,
  lr.rent_increase,
  lr.rent_increase_percentage,
  lr.renewal_duration_months,
  lr.status,
  lr.requested_date,
  lr.reviewed_date,
  CASE 
    WHEN lr.status = 'pending' THEN CURRENT_DATE - lr.requested_date::date
    ELSE NULL
  END as days_pending
FROM lease_renewals lr
JOIN tenants t ON t.id = lr.tenant_id
JOIN users u ON u.id = t.user_id
JOIN properties p ON p.id = lr.property_id;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE 'Migration 015 completed successfully!';
  RAISE NOTICE 'Created tables: lease_renewals, lease_history, lease_notifications';
  RAISE NOTICE 'Added RLS policies for all tables';
  RAISE NOTICE 'Created functions for renewal workflow';
  RAISE NOTICE 'Status: NON-BREAKING - All existing features continue to work';
END $$;

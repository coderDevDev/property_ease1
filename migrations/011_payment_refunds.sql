-- Migration: Payment Refund Management System
-- Date: October 21, 2025
-- Purpose: Enable refund requests and approval workflow

-- ============================================================================
-- PAYMENT REFUNDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- 'pending', 'approved', 'rejected', 'processed'
  
  -- Approval tracking
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Processing tracking
  processed_at TIMESTAMP WITH TIME ZONE,
  refund_method VARCHAR(50),
  refund_reference VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amount CHECK (amount > 0),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'approved', 'rejected', 'processed'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_refunds_payment ON payment_refunds(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON payment_refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_requested_by ON payment_refunds(requested_by);
CREATE INDEX IF NOT EXISTS idx_refunds_created ON payment_refunds(created_at DESC);

-- Add comments
COMMENT ON TABLE payment_refunds IS 'Tracks all payment refund requests and their approval status';
COMMENT ON COLUMN payment_refunds.status IS 'pending, approved, rejected, processed';
COMMENT ON COLUMN payment_refunds.amount IS 'Refund amount in Philippine Pesos';

-- ============================================================================
-- ADD REFUND TRACKING TO PAYMENTS TABLE
-- ============================================================================

-- Add optional fields to track refund status
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS is_refunded BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS refund_id UUID REFERENCES payment_refunds(id),
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10, 2);

-- Add index
CREATE INDEX IF NOT EXISTS idx_payments_refunded ON payments(is_refunded);

-- Add comment
COMMENT ON COLUMN payments.is_refunded IS 'Whether this payment has been refunded';

-- ============================================================================
-- FUNCTIONS FOR REFUND WORKFLOW
-- ============================================================================

-- Function to request a refund
CREATE OR REPLACE FUNCTION request_payment_refund(
  p_payment_id UUID,
  p_user_id UUID,
  p_amount DECIMAL,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_payment RECORD;
  v_refund_id UUID;
BEGIN
  -- Get payment details
  SELECT * INTO v_payment FROM payments WHERE id = p_payment_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Payment not found'
    );
  END IF;
  
  -- Validate amount
  IF p_amount > v_payment.amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Refund amount cannot exceed payment amount'
    );
  END IF;
  
  -- Check if already refunded
  IF v_payment.is_refunded THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Payment already refunded'
    );
  END IF;
  
  -- Create refund request
  INSERT INTO payment_refunds (
    payment_id,
    requested_by,
    amount,
    reason,
    status
  ) VALUES (
    p_payment_id,
    p_user_id,
    p_amount,
    p_reason,
    'pending'
  ) RETURNING id INTO v_refund_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Refund request submitted successfully',
    'refund_id', v_refund_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a refund
CREATE OR REPLACE FUNCTION approve_payment_refund(
  p_refund_id UUID,
  p_admin_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_refund RECORD;
BEGIN
  -- Get refund details
  SELECT * INTO v_refund FROM payment_refunds WHERE id = p_refund_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Refund request not found'
    );
  END IF;
  
  IF v_refund.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Refund request already processed'
    );
  END IF;
  
  -- Update refund status
  UPDATE payment_refunds
  SET 
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    review_notes = p_notes
  WHERE id = p_refund_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Refund approved successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject a refund
CREATE OR REPLACE FUNCTION reject_payment_refund(
  p_refund_id UUID,
  p_admin_id UUID,
  p_notes TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_refund RECORD;
BEGIN
  -- Get refund details
  SELECT * INTO v_refund FROM payment_refunds WHERE id = p_refund_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Refund request not found'
    );
  END IF;
  
  IF v_refund.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Refund request already processed'
    );
  END IF;
  
  -- Update refund status
  UPDATE payment_refunds
  SET 
    status = 'rejected',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    review_notes = p_notes
  WHERE id = p_refund_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Refund rejected successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark refund as processed
CREATE OR REPLACE FUNCTION process_payment_refund(
  p_refund_id UUID,
  p_refund_method VARCHAR,
  p_refund_reference VARCHAR
)
RETURNS JSONB AS $$
DECLARE
  v_refund RECORD;
BEGIN
  -- Get refund details
  SELECT * INTO v_refund FROM payment_refunds WHERE id = p_refund_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Refund request not found'
    );
  END IF;
  
  IF v_refund.status != 'approved' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Refund must be approved first'
    );
  END IF;
  
  -- Update refund as processed
  UPDATE payment_refunds
  SET 
    status = 'processed',
    processed_at = NOW(),
    refund_method = p_refund_method,
    refund_reference = p_refund_reference
  WHERE id = p_refund_id;
  
  -- Update payment record
  UPDATE payments
  SET 
    is_refunded = true,
    refund_id = p_refund_id,
    refund_amount = v_refund.amount,
    payment_status = 'refunded'
  WHERE id = v_refund.payment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Refund processed successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own refund requests
CREATE POLICY "tenants_view_own_refunds"
ON payment_refunds FOR SELECT
TO authenticated
USING (
  requested_by = auth.uid()
);

-- Tenants can create refund requests for their payments
CREATE POLICY "tenants_create_refunds"
ON payment_refunds FOR INSERT
TO authenticated
WITH CHECK (
  requested_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM payments p
    JOIN tenants t ON t.id = p.tenant_id
    WHERE p.id = payment_id
    AND t.user_id = auth.uid()
  )
);

-- Admins can view all refund requests
CREATE POLICY "admins_view_all_refunds"
ON payment_refunds FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admins can update refund status
CREATE POLICY "admins_update_refunds"
ON payment_refunds FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Owners can view refunds for their properties
CREATE POLICY "owners_view_property_refunds"
ON payment_refunds FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM payments p
    JOIN properties prop ON prop.id = p.property_id
    WHERE p.id = payment_id
    AND prop.owner_id = auth.uid()
  )
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_refund_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_refund_timestamp
BEFORE UPDATE ON payment_refunds
FOR EACH ROW
EXECUTE FUNCTION update_refund_timestamp();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON payment_refunds TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log migration
INSERT INTO migrations (name, executed_at)
VALUES ('011_payment_refunds', NOW())
ON CONFLICT (name) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration 011_payment_refunds completed successfully';
  RAISE NOTICE 'Added: payment_refunds table';
  RAISE NOTICE 'Added: refund workflow functions';
  RAISE NOTICE 'Added: RLS policies for refunds';
  RAISE NOTICE 'Added: refund tracking fields to payments';
END $$;

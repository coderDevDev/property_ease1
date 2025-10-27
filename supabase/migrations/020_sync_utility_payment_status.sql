-- =====================================================
-- Migration: Sync Utility Bill Payment Status
-- Version: 020
-- Date: October 26, 2025
-- Description: Auto-sync utility_bills status when payment is made
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_utility_bill_payment ON payments;
DROP FUNCTION IF EXISTS sync_utility_bill_payment_status();

-- Create function to sync utility bill status when payment is made
CREATE OR REPLACE FUNCTION sync_utility_bill_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process utility payments
  IF NEW.payment_type = 'utility' THEN
    
    -- When payment is marked as paid
    IF NEW.payment_status = 'paid' AND (OLD IS NULL OR OLD.payment_status != 'paid') THEN
      
      -- Find matching utility bill and update it
      UPDATE utility_bills
      SET 
        payment_status = 'paid',
        paid_date = NEW.paid_date,
        payment_id = NEW.id,
        updated_at = NOW()
      WHERE 
        tenant_id = NEW.tenant_id
        AND property_id = NEW.property_id
        AND payment_status = 'pending'
        AND due_date = NEW.due_date
        AND ABS(total_amount - NEW.amount) < 1; -- Match amount (allow small difference)
      
      RAISE NOTICE 'Synced utility bill payment for payment_id: %', NEW.id;
    END IF;
    
    -- When payment is marked as failed
    IF NEW.payment_status = 'failed' THEN
      UPDATE utility_bills
      SET 
        payment_status = 'pending',
        updated_at = NOW()
      WHERE payment_id = NEW.id;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER trigger_sync_utility_bill_payment
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION sync_utility_bill_payment_status();

-- Also create reverse sync (when utility bill is manually marked as paid)
CREATE OR REPLACE FUNCTION sync_payment_from_utility_bill()
RETURNS TRIGGER AS $$
BEGIN
  -- When utility bill is marked as paid
  IF NEW.payment_status = 'paid' AND (OLD IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- Update corresponding payment if it exists
    UPDATE payments
    SET 
      payment_status = 'paid',
      paid_date = NEW.paid_date,
      payment_method = 'manual',
      updated_at = NOW()
    WHERE 
      tenant_id = NEW.tenant_id
      AND property_id = NEW.property_id
      AND payment_type = 'utility'
      AND payment_status = 'pending'
      AND due_date = NEW.due_date
      AND ABS(amount - NEW.total_amount) < 1;
    
    RAISE NOTICE 'Synced payment from utility bill: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for reverse sync
DROP TRIGGER IF EXISTS trigger_sync_payment_from_utility_bill ON utility_bills;
CREATE TRIGGER trigger_sync_payment_from_utility_bill
  AFTER UPDATE ON utility_bills
  FOR EACH ROW
  EXECUTE FUNCTION sync_payment_from_utility_bill();

-- =====================================================
-- Manual sync for existing records
-- =====================================================

-- Sync existing paid payments to utility bills
UPDATE utility_bills ub
SET 
  payment_status = 'paid',
  paid_date = p.paid_date,
  payment_id = p.id,
  updated_at = NOW()
FROM payments p
WHERE 
  p.payment_type = 'utility'
  AND p.payment_status = 'paid'
  AND p.tenant_id = ub.tenant_id
  AND p.property_id = ub.property_id
  AND p.due_date = ub.due_date
  AND ABS(p.amount - ub.total_amount) < 1
  AND ub.payment_status = 'pending';

-- Log results
DO $$
DECLARE
  synced_count INTEGER;
BEGIN
  GET DIAGNOSTICS synced_count = ROW_COUNT;
  RAISE NOTICE 'Migration 020 completed!';
  RAISE NOTICE 'Synced % existing utility bill payments', synced_count;
  RAISE NOTICE 'Created bidirectional sync triggers';
  RAISE NOTICE 'Utility bills will now auto-update when payments are made';
END $$;

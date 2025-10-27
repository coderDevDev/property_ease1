-- ============================================
-- Auto-Sync Deposit Balances
-- Automatically create deposit_balances when security_deposit is paid
-- Date: October 26, 2025
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_create_deposit_balance ON payments;
DROP FUNCTION IF EXISTS create_deposit_balance_on_payment();

-- Create function to auto-create deposit_balances
CREATE OR REPLACE FUNCTION create_deposit_balance_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- When security_deposit payment is marked as paid
  IF NEW.payment_type = 'security_deposit' 
     AND NEW.payment_status = 'paid' 
     AND (OLD IS NULL OR OLD.payment_status != 'paid') THEN
    
    -- Create deposit_balances record if it doesn't exist
    INSERT INTO deposit_balances (
      tenant_id,
      property_id,
      deposit_amount,
      deductions,
      refundable_amount,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.tenant_id,
      NEW.property_id,
      NEW.amount,
      0,
      NEW.amount,
      'held',
      NOW(),
      NOW()
    )
    ON CONFLICT (tenant_id, property_id) 
    DO UPDATE SET
      deposit_amount = EXCLUDED.deposit_amount,
      refundable_amount = EXCLUDED.refundable_amount,
      updated_at = NOW();
    
    RAISE NOTICE 'Auto-created deposit_balances record for tenant % and property %', 
      NEW.tenant_id, NEW.property_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER auto_create_deposit_balance
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION create_deposit_balance_on_payment();

-- Add comment
COMMENT ON FUNCTION create_deposit_balance_on_payment() IS 
'Automatically creates or updates deposit_balances record when security_deposit payment is marked as paid. 
This ensures synchronization between payments table and deposit_balances table.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_deposit_balance_on_payment() TO authenticated;

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 017: Auto-sync deposit balances trigger created';
  RAISE NOTICE '  - Trigger: auto_create_deposit_balance';
  RAISE NOTICE '  - Function: create_deposit_balance_on_payment()';
  RAISE NOTICE '  - Action: Creates deposit_balances when security_deposit is paid';
END $$;

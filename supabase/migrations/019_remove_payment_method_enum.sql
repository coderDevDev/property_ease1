-- ============================================
-- Remove payment_method enum constraint
-- Change to TEXT for flexibility
-- Date: October 26, 2025
-- ============================================

-- Step 1: Change payment_method column from enum to TEXT
ALTER TABLE payments 
  ALTER COLUMN payment_method TYPE TEXT;

-- Step 2: Drop the enum type if it exists (optional, for cleanup)
-- Note: Only drop if no other tables are using it
DO $$ 
BEGIN
    -- Check if enum exists and drop it
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        DROP TYPE IF EXISTS payment_method CASCADE;
        RAISE NOTICE 'Dropped payment_method enum type';
    END IF;
END $$;

-- Step 3: Add a check constraint for valid values (optional, for data validation)
-- This is more flexible than enum but still provides validation
ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payment_method_check;

ALTER TABLE payments
  ADD CONSTRAINT payment_method_check 
  CHECK (
    payment_method IS NULL OR 
    payment_method IN (
      'cash',
      'gcash',
      'paymaya',
      'bank_transfer',
      'credit_card',
      'debit_card',
      'xendit',
      'GCASH',
      'PAYMAYA',
      'MANUAL_DEV',
      'manual-dev'
    )
  );

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 019: Removed payment_method enum constraint';
  RAISE NOTICE '  - Changed payment_method to TEXT type';
  RAISE NOTICE '  - Added flexible check constraint';
  RAISE NOTICE '  - Now accepts both uppercase and lowercase values';
END $$;

-- Add comment
COMMENT ON COLUMN payments.payment_method IS 
'Payment method used. Accepts various formats: gcash, GCASH, paymaya, bank_transfer, etc.';

-- ============================================
-- Add 'advance_rent' to payment_type enum
-- Date: October 26, 2025
-- ============================================

-- Add 'advance_rent' to the payment_type enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if the enum value already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'advance_rent' 
        AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'payment_type'
        )
    ) THEN
        -- Add the new enum value
        ALTER TYPE payment_type ADD VALUE 'advance_rent';
        RAISE NOTICE 'Added advance_rent to payment_type enum';
    ELSE
        RAISE NOTICE 'advance_rent already exists in payment_type enum';
    END IF;
END $$;

-- Verify the enum values
DO $$
DECLARE
    enum_values TEXT;
BEGIN
    SELECT string_agg(enumlabel, ', ' ORDER BY enumsortorder)
    INTO enum_values
    FROM pg_enum
    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_type');
    
    RAISE NOTICE 'Current payment_type enum values: %', enum_values;
END $$;

-- Log migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 018: Added advance_rent to payment_type enum';
  RAISE NOTICE '  - New payment type: advance_rent';
  RAISE NOTICE '  - Purpose: RA 9653 compliant advance rent (1 month)';
  RAISE NOTICE '  - Replaces: deposit (for clarity)';
END $$;

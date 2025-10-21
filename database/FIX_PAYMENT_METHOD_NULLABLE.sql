-- ============================================
-- Make payment_method Nullable
-- ============================================

-- Option 1: Make payment_method nullable (RECOMMENDED)
-- This allows NULL for unpaid payments

ALTER TABLE payments 
ALTER COLUMN payment_method DROP NOT NULL;

-- Now payment_method can be NULL for pending payments
-- Gets set to actual method ('xendit', 'cash', etc.) when paid

-- Verify the change
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'payments' 
  AND column_name = 'payment_method';

-- Expected result: is_nullable = 'YES'

-- ============================================
-- Check Required (NOT NULL) Fields in Tables
-- Run this to see what fields are required
-- ============================================

-- Check tenants table required fields
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'tenants'
  AND is_nullable = 'NO'
  AND column_default IS NULL
ORDER BY ordinal_position;

-- Check payments table required fields
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payments'
  AND is_nullable = 'NO'
  AND column_default IS NULL
ORDER BY ordinal_position;

-- This will show all fields that MUST have a value
-- Use this to ensure the function provides all required fields

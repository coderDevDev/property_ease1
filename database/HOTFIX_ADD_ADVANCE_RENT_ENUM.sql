-- ============================================
-- HOTFIX: Add 'advance_rent' to payment_type enum
-- Run this FIRST before running HOTFIX_APPROVE_FUNCTION.sql
-- ============================================

-- Add 'advance_rent' to the payment_type enum
ALTER TYPE payment_type ADD VALUE IF NOT EXISTS 'advance_rent';

-- Verify it was added
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payment_type')
ORDER BY enumsortorder;

-- You should see 'advance_rent' in the list

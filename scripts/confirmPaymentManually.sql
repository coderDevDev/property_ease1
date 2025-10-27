-- ============================================
-- Manual Payment Confirmation (Development)
-- Use this to manually mark payments as paid when webhooks don't work
-- ============================================

-- Step 1: Find pending payments
SELECT 
  id,
  payment_type,
  amount,
  due_date,
  payment_status,
  created_at,
  tenant_id
FROM payments
WHERE payment_status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- Step 2: Copy the payment ID from above, then run this:
-- Replace 'YOUR_PAYMENT_ID' with the actual payment ID

UPDATE payments
SET 
  payment_status = 'paid',
  paid_date = NOW(),
  payment_method = 'GCASH',
  reference_number = 'manual-dev-' || EXTRACT(EPOCH FROM NOW())::TEXT,
  notes = COALESCE(notes, '') || ' | Manually confirmed in development mode'
WHERE id = 'YOUR_PAYMENT_ID';

-- Step 3: Verify the update
SELECT 
  id,
  payment_type,
  amount,
  payment_status,
  paid_date,
  payment_method,
  reference_number
FROM payments
WHERE id = 'YOUR_PAYMENT_ID';

-- ============================================
-- EXAMPLE USAGE:
-- ============================================

-- 1. Find your payment:
-- SELECT id FROM payments WHERE payment_status = 'pending' LIMIT 1;
-- Result: abc-123-def-456

-- 2. Update it:
-- UPDATE payments SET payment_status = 'paid', paid_date = NOW(), payment_method = 'GCASH' WHERE id = 'abc-123-def-456';

-- 3. Verify:
-- SELECT payment_status, paid_date FROM payments WHERE id = 'abc-123-def-456';
-- Result: paid | 2025-10-26 07:35:00

-- ============================================
-- BULK CONFIRM (Use with caution!)
-- ============================================

-- Confirm ALL pending payments for a specific tenant
-- UPDATE payments
-- SET 
--   payment_status = 'paid',
--   paid_date = NOW(),
--   payment_method = 'MANUAL_DEV'
-- WHERE tenant_id = 'YOUR_TENANT_ID'
--   AND payment_status = 'pending';

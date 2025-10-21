-- ============================================
-- Generate Missing Payments for Your Lease
-- ============================================

-- STEP 1: Get your tenant_id and property_id
-- Run this first to get the IDs you need:

SELECT 
  id as tenant_id,
  user_id,
  property_id,
  monthly_rent,
  lease_start,
  lease_end,
  status
FROM tenants
WHERE user_id = '68ef2303-86b5-433a-993d-ee391d436461'
  AND status = 'active';

-- Copy the tenant_id and property_id from the results above
-- Then replace them in the INSERT below


-- STEP 2: Insert the 3 monthly payments
-- Replace YOUR_TENANT_ID and YOUR_PROPERTY_ID with actual values from Step 1

INSERT INTO payments (
  tenant_id,
  property_id,
  payment_type,
  amount,
  due_date,
  payment_status,
  created_by,
  notes
)
VALUES
  -- August 2025 Rent
  (
    'YOUR_TENANT_ID',  -- Replace this
    'YOUR_PROPERTY_ID', -- Replace this
    'rent',
    5000, -- Your monthly rent amount (adjust if needed)
    '2025-08-05',
    'pending',
    '68ef2303-86b5-433a-993d-ee391d436461', -- Your user_id
    'Auto-generated rent payment for August 2025'
  ),
  
  -- September 2025 Rent
  (
    'YOUR_TENANT_ID',  -- Replace this
    'YOUR_PROPERTY_ID', -- Replace this
    'rent',
    5000,
    '2025-09-05',
    'pending',
    '68ef2303-86b5-433a-993d-ee391d436461',
    'Auto-generated rent payment for September 2025'
  ),
  
  -- October 2025 Rent
  (
    'YOUR_TENANT_ID',  -- Replace this
    'YOUR_PROPERTY_ID', -- Replace this
    'rent',
    5000,
    '2025-10-05',
    'pending',
    '68ef2303-86b5-433a-993d-ee391d436461',
    'Auto-generated rent payment for October 2025'
  );


-- STEP 3: Verify payments were created
-- Run this to see your new payments:

SELECT 
  payment_type,
  amount,
  due_date,
  payment_status,
  notes
FROM payments
WHERE tenant_id = 'YOUR_TENANT_ID' -- Replace with your tenant_id
ORDER BY due_date;


-- You should see:
-- rent | 5000 | 2025-08-05 | pending | Auto-generated rent payment for August 2025
-- rent | 5000 | 2025-09-05 | pending | Auto-generated rent payment for September 2025
-- rent | 5000 | 2025-10-05 | pending | Auto-generated rent payment for October 2025

-- ✅ DONE! Now check your tenant dashboard at /tenant/dashboard/payments

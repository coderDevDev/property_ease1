-- ============================================
-- HOTFIX: Fix approve_rental_application Function
-- Run this in Supabase SQL Editor immediately
-- ============================================

-- Drop all existing versions
DROP FUNCTION IF EXISTS public.approve_rental_application(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.approve_rental_application(UUID);
DROP FUNCTION IF EXISTS public.approve_rental_application(UUID, INTEGER);

-- Create fixed version
CREATE OR REPLACE FUNCTION public.approve_rental_application(
  application_id UUID,
  lease_duration_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  tenant_id UUID
) AS $$
DECLARE
  v_application rental_applications%ROWTYPE;
  v_tenant_id UUID;
  v_lease_end DATE;
  v_property_monthly_rent NUMERIC;
  v_payment_date DATE;
  v_month_counter INTEGER;
BEGIN
  -- Get application details
  SELECT * INTO v_application
  FROM rental_applications
  WHERE id = application_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 'Application not found', NULL::UUID;
    RETURN;
  END IF;

  IF v_application.status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Application is not pending', NULL::UUID;
    RETURN;
  END IF;

  -- Get property monthly rent
  SELECT monthly_rent INTO v_property_monthly_rent
  FROM properties
  WHERE id = v_application.property_id;

  -- Calculate lease end date
  v_lease_end := v_application.move_in_date + (lease_duration_months || ' months')::INTERVAL;

  -- Create tenant record (RA 9653 Compliant)
  INSERT INTO tenants (
    user_id,
    property_id,
    unit_number,
    monthly_rent,
    deposit,
    security_deposit,
    lease_start,
    lease_end,
    status
  ) VALUES (
    v_application.user_id,
    v_application.property_id,
    v_application.unit_number,
    v_property_monthly_rent,
    v_property_monthly_rent,      -- 1 month advance
    v_property_monthly_rent * 2,  -- 2 months security
    v_application.move_in_date,
    v_lease_end,
    'active'
  )
  RETURNING id INTO v_tenant_id;

  -- Update application status
  UPDATE rental_applications
  SET status = 'approved', updated_at = NOW()
  WHERE id = application_id;

  -- Create upfront payment records (RA 9653 Compliant)
  -- 1. Advance Rent (1 month) - Due immediately upon approval
  INSERT INTO payments (
    tenant_id,
    property_id,
    payment_type,
    amount,
    due_date,
    payment_status,
    created_by,
    notes
  ) VALUES (
    v_tenant_id,
    v_application.property_id,
    'advance_rent',
    v_property_monthly_rent,
    v_application.move_in_date,
    'pending',
    v_application.user_id,
    'Advance rent (1 month) - RA 9653 compliant. Covers first month of tenancy.'
  );

  -- 2. Security Deposit (2 months) - Due immediately upon approval
  INSERT INTO payments (
    tenant_id,
    property_id,
    payment_type,
    amount,
    due_date,
    payment_status,
    created_by,
    notes
  ) VALUES (
    v_tenant_id,
    v_application.property_id,
    'security_deposit',
    v_property_monthly_rent * 2,
    v_application.move_in_date,
    'pending',
    v_application.user_id,
    'Security deposit (2 months) - RA 9653 compliant. Refundable at lease end.'
  );

  -- Generate monthly rent payment records (starting from 2nd month)
  -- First month is covered by advance rent payment above
  v_payment_date := DATE_TRUNC('month', v_application.move_in_date) + INTERVAL '1 month' + INTERVAL '4 days';
  
  -- Generate payments for months 2 through lease_duration_months
  FOR v_month_counter IN 1..(lease_duration_months - 1) LOOP
    INSERT INTO payments (
      tenant_id,
      property_id,
      payment_type,
      amount,
      due_date,
      payment_status,
      created_by,
      notes
    ) VALUES (
      v_tenant_id,
      v_application.property_id,
      'rent',
      v_property_monthly_rent,
      v_payment_date + ((v_month_counter - 1) || ' months')::INTERVAL,
      'pending',
      v_application.user_id,
      'Monthly rent payment - Month ' || (v_month_counter + 1) || ' of ' || lease_duration_months
    );
  END LOOP;

  -- Update property occupied units
  UPDATE properties
  SET occupied_units = occupied_units + 1
  WHERE id = v_application.property_id;

  RETURN QUERY SELECT TRUE, 'Success', v_tenant_id;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'Error: ' || SQLERRM, NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.approve_rental_application(UUID, INTEGER) TO authenticated;

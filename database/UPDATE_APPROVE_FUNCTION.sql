-- ============================================
-- Update approve_rental_application Function
-- Add lease_duration_months parameter
-- ============================================

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.approve_rental_application(UUID, VARCHAR);
DROP FUNCTION IF EXISTS public.approve_rental_application(UUID);

-- Create updated function with lease_duration_months parameter
CREATE OR REPLACE FUNCTION public.approve_rental_application(
  application_id UUID,
  lease_duration_months INTEGER DEFAULT 12  -- Default to 12 months if not provided
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

  -- Check if application is pending
  IF v_application.status != 'pending' THEN
    RETURN QUERY SELECT FALSE, 'Application is not pending', NULL::UUID;
    RETURN;
  END IF;

  -- Get property monthly rent
  SELECT monthly_rent INTO v_property_monthly_rent
  FROM properties
  WHERE id = v_application.property_id;

  -- Calculate lease end date based on duration
  v_lease_end := v_application.move_in_date + (lease_duration_months || ' months')::INTERVAL;

  -- Create tenant record
  -- Philippine Rent Control Act (RA 9653) Compliance:
  -- - Advance rent (deposit): Maximum 1 month
  -- - Security deposit: Maximum 2 months
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
    v_property_monthly_rent,      -- 1 month advance rent (RA 9653 compliant)
    v_property_monthly_rent * 2,  -- 2 months security deposit (RA 9653 compliant)
    v_application.move_in_date,
    v_lease_end,
    'active'
  )
  RETURNING id INTO v_tenant_id;

  -- Update application status
  UPDATE rental_applications
  SET 
    status = 'approved',
    updated_at = NOW()
  WHERE id = application_id;

  -- Auto-generate monthly payment records
  -- Start from the first payment date (5th of the month after move-in or on move-in month)
  v_payment_date := DATE_TRUNC('month', v_application.move_in_date) + INTERVAL '4 days'; -- 5th of move-in month
  
  -- If move-in date is after the 5th, start from next month
  IF EXTRACT(DAY FROM v_application.move_in_date) > 5 THEN
    v_payment_date := v_payment_date + INTERVAL '1 month';
  END IF;

  -- Generate payments for the lease duration
  FOR v_month_counter IN 0..(lease_duration_months - 1) LOOP
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
      v_payment_date + (v_month_counter || ' months')::INTERVAL,
      'pending',
      v_application.user_id,
      'Auto-generated rent payment for ' || 
      TO_CHAR(v_payment_date + (v_month_counter || ' months')::INTERVAL, 'Month YYYY')
    );
  END LOOP;

  -- Update property occupied units
  UPDATE properties
  SET occupied_units = occupied_units + 1
  WHERE id = v_application.property_id;

  -- Return success
  RETURN QUERY SELECT 
    TRUE, 
    'Application approved and ' || lease_duration_months || ' payments generated',
    v_tenant_id;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, 'Error: ' || SQLERRM, NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.approve_rental_application(UUID, INTEGER) TO authenticated;

-- Test the function (optional)
-- SELECT * FROM approve_rental_application('some-application-id', 12);

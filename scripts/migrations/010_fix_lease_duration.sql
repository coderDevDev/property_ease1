-- Fix lease duration to use owner-specified duration instead of hardcoded 12 months

-- Drop all versions of the old function with explicit signatures
-- This handles all possible existing versions
DO $$ 
BEGIN
    -- Drop function with just UUID parameter
    DROP FUNCTION IF EXISTS public.approve_rental_application(UUID);
    
    -- Drop function with UUID and TEXT parameters (old version)
    DROP FUNCTION IF EXISTS public.approve_rental_application(UUID, TEXT);
    
    -- Drop function with UUID and INTEGER parameters (if exists)
    DROP FUNCTION IF EXISTS public.approve_rental_application(UUID, INTEGER);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if functions don't exist
        NULL;
END $$;

-- Create updated function with lease_duration_months parameter
CREATE OR REPLACE FUNCTION public.approve_rental_application(
  application_id UUID,
  lease_duration_months INTEGER DEFAULT 12
)
RETURNS TABLE (
  success BOOLEAN,
  tenant_id UUID,
  message TEXT
) AS $$
DECLARE
  v_application RECORD;
  v_availability RECORD;
  v_tenant_id UUID;
  v_lease_end_date DATE;
BEGIN
  -- Get application details
  SELECT * INTO v_application
  FROM public.rental_applications
  WHERE id = application_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Application not found or already processed';
    RETURN;
  END IF;

  -- Check availability using the existing function
  SELECT * INTO v_availability 
  FROM public.get_unit_availability_status(
    v_application.property_id, 
    v_application.unit_number,
    application_id
  );

  IF NOT v_availability.is_available THEN
    RETURN QUERY SELECT false, NULL::UUID, (v_availability.details->>'message')::TEXT;
    RETURN;
  END IF;

  -- Calculate lease end date based on duration
  v_lease_end_date := (v_application.move_in_date::DATE + (lease_duration_months || ' months')::INTERVAL)::DATE;

  -- Begin transaction
  BEGIN
    -- Update application status and store lease duration
    UPDATE public.rental_applications
    SET 
      status = 'approved',
      updated_at = NOW()
    WHERE id = application_id;

    -- Create tenant record with correct lease duration
    INSERT INTO public.tenants (
      user_id,
      property_id,
      unit_number,
      lease_start,
      lease_end,
      monthly_rent,
      deposit,
      security_deposit,
      status,
      move_in_date,
      created_at,
      updated_at
    ) VALUES (
      v_application.user_id,
      v_application.property_id,
      v_application.unit_number,
      v_application.move_in_date::DATE,
      v_lease_end_date,
      v_application.monthly_rent,
      v_application.monthly_rent * 2, -- Two months deposit
      v_application.monthly_rent, -- One month security deposit
      'active',
      v_application.move_in_date::DATE,
      NOW(),
      NOW()
    ) RETURNING id INTO v_tenant_id;

    -- Increment occupied units
    PERFORM public.increment_occupied_units(v_application.property_id);

    -- Create audit log
    INSERT INTO public.audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      new_values
    ) VALUES (
      auth.uid(),
      'APPROVE_APPLICATION',
      'rental_applications',
      application_id::TEXT,
      jsonb_build_object(
        'tenant_id', v_tenant_id,
        'property_id', v_application.property_id,
        'unit_number', v_application.unit_number,
        'lease_duration_months', lease_duration_months,
        'lease_end_date', v_lease_end_date
      )
    );

    RETURN QUERY SELECT true, v_tenant_id, 'Application approved successfully';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error in approve_rental_application: %', SQLERRM;
      RETURN QUERY SELECT false, NULL::UUID, 'Failed to approve application: ' || SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.approve_rental_application(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.approve_rental_application IS 'Approves a rental application and creates tenant record with specified lease duration';

-- Function to check if a unit is available
CREATE OR REPLACE FUNCTION public.is_unit_available(
  p_property_id UUID,
  p_unit_number TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1
    FROM public.tenants
    WHERE property_id = p_property_id
      AND unit_number = p_unit_number
      AND status = 'active'
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.rental_applications
    WHERE property_id = p_property_id
      AND unit_number = p_unit_number
      AND status IN ('pending', 'approved')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a rental application
CREATE OR REPLACE FUNCTION public.approve_rental_application(
  application_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  tenant_id UUID,
  message TEXT
) AS $$
DECLARE
  v_application RECORD;
  v_tenant_id UUID;
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

  -- Check if unit is still available
  IF NOT public.is_unit_available(v_application.property_id, v_application.unit_number) THEN
    RETURN QUERY SELECT false, NULL::UUID, 'Unit is no longer available';
    RETURN;
  END IF;

  -- Begin transaction
  BEGIN
    -- Update application status
    UPDATE public.rental_applications
    SET 
      status = 'approved',
      updated_at = NOW()
    WHERE id = application_id;

    -- Create tenant record
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
      (v_application.move_in_date::DATE + INTERVAL '1 year')::DATE,
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
        'unit_number', v_application.unit_number
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

-- Function to reject a rental application
CREATE OR REPLACE FUNCTION public.reject_rental_application(
  application_id UUID,
  rejection_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_application RECORD;
BEGIN
  -- Get application details
  SELECT * INTO v_application
  FROM public.rental_applications
  WHERE id = application_id AND status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Application not found or already processed';
    RETURN;
  END IF;

  -- Begin transaction
  BEGIN
    -- Update application status
    UPDATE public.rental_applications
    SET 
      status = 'rejected',
      rejection_reason = COALESCE(reject_rental_application.rejection_reason, 'No reason provided'),
      updated_at = NOW()
    WHERE id = application_id;

    -- Create audit log
    INSERT INTO public.audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      new_values
    ) VALUES (
      auth.uid(),
      'REJECT_APPLICATION',
      'rental_applications',
      application_id::TEXT,
      jsonb_build_object(
        'rejection_reason', reject_rental_application.rejection_reason
      )
    );

    RETURN QUERY SELECT true, 'Application rejected successfully';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error in reject_rental_application: %', SQLERRM;
      RETURN QUERY SELECT false, 'Failed to reject application: ' || SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

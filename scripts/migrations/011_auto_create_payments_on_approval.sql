-- Automatically create security deposit and monthly rent payments when application is approved

-- Drop the existing function
DROP FUNCTION IF EXISTS public.approve_rental_application(UUID, INTEGER);

-- Create updated function that creates payment records
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
  v_security_deposit_amount NUMERIC;
  v_advance_deposit_amount NUMERIC;
  v_month_counter INTEGER;
  v_payment_due_date DATE;
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
  
  -- Calculate deposit amounts according to RA 9653
  v_security_deposit_amount := v_application.monthly_rent * 2; -- 2 months security deposit (max allowed by law)
  v_advance_deposit_amount := v_application.monthly_rent; -- 1 month advance rent (first month's payment)

  -- Begin transaction
  BEGIN
    -- Update application status
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
      v_advance_deposit_amount, -- 1 month advance rent (first month's payment)
      v_security_deposit_amount, -- 2 months security deposit (RA 9653 maximum)
      'active',
      v_application.move_in_date::DATE,
      NOW(),
      NOW()
    ) RETURNING id INTO v_tenant_id;

    -- Create Security Deposit Payment (Due immediately)
    INSERT INTO public.payments (
      tenant_id,
      property_id,
      payment_type,
      amount,
      due_date,
      payment_status,
      description,
      is_recurring,
      created_at,
      updated_at
    ) VALUES (
      v_tenant_id,
      v_application.property_id,
      'security_deposit',
      v_security_deposit_amount,
      v_application.move_in_date::DATE, -- Due on move-in date
      'pending',
      'Security Deposit - 2 months rent (refundable per RA 9653)',
      false,
      NOW(),
      NOW()
    );

    -- Create Advance Deposit Payment (Due immediately)
    INSERT INTO public.payments (
      tenant_id,
      property_id,
      payment_type,
      amount,
      due_date,
      payment_status,
      description,
      is_recurring,
      created_at,
      updated_at
    ) VALUES (
      v_tenant_id,
      v_application.property_id,
      'advance_deposit',
      v_advance_deposit_amount,
      v_application.move_in_date::DATE, -- Due on move-in date
      'pending',
      'Advance Rent - 1 month (first month''s payment)',
      false,
      NOW(),
      NOW()
    );

    -- Create Monthly Rent Payments for the lease duration
    FOR v_month_counter IN 1..lease_duration_months LOOP
      -- Calculate due date (5th of each month)
      v_payment_due_date := (v_application.move_in_date::DATE + ((v_month_counter - 1) || ' months')::INTERVAL)::DATE;
      v_payment_due_date := DATE_TRUNC('month', v_payment_due_date)::DATE + INTERVAL '4 days'; -- 5th of month
      
      INSERT INTO public.payments (
        tenant_id,
        property_id,
        payment_type,
        amount,
        due_date,
        payment_status,
        description,
        is_recurring,
        period_start,
        period_end,
        created_at,
        updated_at
      ) VALUES (
        v_tenant_id,
        v_application.property_id,
        'rent',
        v_application.monthly_rent,
        v_payment_due_date,
        'pending',
        'Monthly Rent - Month ' || v_month_counter || ' of ' || lease_duration_months,
        true,
        (v_application.move_in_date::DATE + ((v_month_counter - 1) || ' months')::INTERVAL)::DATE,
        (v_application.move_in_date::DATE + (v_month_counter || ' months')::INTERVAL)::DATE - INTERVAL '1 day',
        NOW(),
        NOW()
      );
    END LOOP;

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
        'lease_end_date', v_lease_end_date,
        'security_deposit', v_security_deposit_amount,
        'advance_deposit', v_advance_deposit_amount,
        'monthly_payments_created', lease_duration_months
      )
    );

    RETURN QUERY SELECT true, v_tenant_id, 'Application approved successfully. Created ' || (lease_duration_months + 2)::TEXT || ' payment records.';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE LOG 'Error in approve_rental_application: %', SQLERRM;
      RETURN QUERY SELECT false, NULL::UUID, 'Failed to approve application: ' || SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.approve_rental_application(UUID, INTEGER) TO authenticated;

COMMENT ON FUNCTION public.approve_rental_application IS 'Approves application, creates tenant record, and automatically generates security deposit, advance deposit, and monthly rent payment schedules';

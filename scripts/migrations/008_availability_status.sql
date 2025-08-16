-- Function to get detailed unit availability status
CREATE OR REPLACE FUNCTION public.get_unit_availability_status(
  p_property_id UUID,
  p_unit_number TEXT,
  p_application_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_available BOOLEAN,
  status TEXT,
  details JSONB
) AS $$
DECLARE
  v_property RECORD;
  v_tenant RECORD;
  v_application RECORD;
BEGIN
  -- Get property details
  SELECT p.* INTO v_property
  FROM public.properties p
  WHERE p.id = p_property_id;

  IF NOT FOUND THEN
    RETURN QUERY 
      SELECT 
        FALSE AS is_available,
        'property_not_found'::TEXT AS status,
        jsonb_build_object('message', 'Property not found') AS details;
    RETURN;
  END IF;

  -- Check if property is at capacity
  IF v_property.occupied_units >= v_property.total_units THEN
    RETURN QUERY 
      SELECT 
        FALSE AS is_available,
        'property_full'::TEXT AS status,
        jsonb_build_object(
          'occupied_units', v_property.occupied_units,
          'total_units', v_property.total_units,
          'message', 'Property is at full capacity'
        ) AS details;
    RETURN;
  END IF;

  -- Check if unit is occupied by an active tenant
  SELECT t.* INTO v_tenant
  FROM public.tenants t
  WHERE t.property_id = p_property_id
    AND t.unit_number = p_unit_number
    AND t.status = 'active';

  IF FOUND THEN
    RETURN QUERY 
      SELECT 
        FALSE AS is_available,
        'unit_occupied'::TEXT AS status,
        jsonb_build_object(
          'tenant_id', v_tenant.id,
          'lease_end', v_tenant.lease_end,
          'message', 'Unit is currently occupied'
        ) AS details;
    RETURN;
  END IF;

  -- Check for other pending/approved applications
  SELECT ra.* INTO v_application
  FROM public.rental_applications ra
  WHERE ra.property_id = p_property_id
    AND ra.unit_number = p_unit_number
    AND ra.status IN ('pending', 'approved')
    AND (p_application_id IS NULL OR ra.id != p_application_id)
  ORDER BY ra.submitted_at ASC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY 
      SELECT 
        FALSE AS is_available,
        'has_pending_application'::TEXT AS status,
        jsonb_build_object(
          'application_id', v_application.id,
          'application_status', v_application.status,
          'submitted_at', v_application.submitted_at,
          'message', 'Unit has another ' || v_application.status::TEXT || ' application'
        ) AS details;
    RETURN;
  END IF;

  -- Unit is available
  RETURN QUERY 
    SELECT 
      TRUE AS is_available,
      'available'::TEXT AS status,
      jsonb_build_object(
        'property_id', v_property.id,
        'unit_number', p_unit_number,
        'available_units', v_property.total_units - v_property.occupied_units,
        'message', 'Unit is available'
      ) AS details;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

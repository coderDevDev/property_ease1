-- Migration 008: Fix function overloading issues
-- This migration resolves the conflict between two is_unit_available functions

-- Drop the conflicting functions
DROP FUNCTION IF EXISTS public.is_unit_available(UUID, TEXT);
DROP FUNCTION IF EXISTS public.is_unit_available(UUID, TEXT, UUID);

-- Create a single, unified function with proper parameter handling
CREATE OR REPLACE FUNCTION public.is_unit_available(
    p_property_id UUID,
    p_unit_number TEXT,
    p_application_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if unit is occupied by an active tenant
    IF EXISTS (
        SELECT 1
        FROM public.tenants
        WHERE property_id = p_property_id
          AND unit_number = p_unit_number
          AND status = 'active'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check if unit has any other pending/approved applications (excluding current application)
    IF EXISTS (
        SELECT 1
        FROM public.rental_applications
        WHERE property_id = p_property_id
          AND unit_number = p_unit_number
          AND status IN ('pending', 'approved')
          AND (p_application_id IS NULL OR id != p_application_id)
    ) THEN
        RETURN FALSE;
    END IF;

    -- Unit is available
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_unit_available(UUID, TEXT, UUID) TO authenticated;

-- Create a simplified version for backward compatibility (2 parameters only)
CREATE OR REPLACE FUNCTION public.is_unit_available_simple(
    p_property_id UUID,
    p_unit_number TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if unit is occupied by an active tenant
    IF EXISTS (
        SELECT 1
        FROM public.tenants
        WHERE property_id = p_property_id
          AND unit_number = p_unit_number
          AND status = 'active'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check if unit has any pending/approved applications
    IF EXISTS (
        SELECT 1
        FROM public.rental_applications
        WHERE property_id = p_property_id
          AND unit_number = p_unit_number
          AND status IN ('pending', 'approved')
    ) THEN
        RETURN FALSE;
    END IF;

    -- Unit is available
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_unit_available_simple(UUID, TEXT) TO authenticated;

-- Also fix the get_available_unit_numbers function if it exists
DROP FUNCTION IF EXISTS public.get_available_unit_numbers(UUID);

CREATE OR REPLACE FUNCTION public.get_available_unit_numbers(
    p_property_id UUID
)
RETURNS TABLE(unit_number TEXT) AS $$
BEGIN
    RETURN QUERY
    WITH occupied_units AS (
        SELECT DISTINCT unit_number
        FROM public.tenants
        WHERE property_id = p_property_id
          AND status = 'active'
        UNION
        SELECT DISTINCT unit_number
        FROM public.rental_applications
        WHERE property_id = p_property_id
          AND status IN ('pending', 'approved')
    ),
    property_info AS (
        SELECT total_units
        FROM public.properties
        WHERE id = p_property_id
    )
    SELECT generate_series(1, pi.total_units)::TEXT as unit_number
    FROM property_info pi
    WHERE generate_series(1, pi.total_units)::TEXT NOT IN (
        SELECT unit_number FROM occupied_units
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_available_unit_numbers(UUID) TO authenticated;

-- Add comment explaining the functions
COMMENT ON FUNCTION public.is_unit_available(UUID, TEXT, UUID) IS 'Check if a unit is available for rent, excluding a specific application if provided';
COMMENT ON FUNCTION public.is_unit_available_simple(UUID, TEXT) IS 'Check if a unit is available for rent (simplified version without application exclusion)';
COMMENT ON FUNCTION public.get_available_unit_numbers(UUID) IS 'Get list of available unit numbers for a property';

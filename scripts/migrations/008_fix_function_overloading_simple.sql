-- Simple migration script to fix function overloading
-- Run this directly in your Supabase SQL Editor

-- Step 1: Drop the conflicting functions
DROP FUNCTION IF EXISTS public.is_unit_available(UUID, TEXT);
DROP FUNCTION IF EXISTS public.is_unit_available(UUID, TEXT, UUID);

-- Step 2: Create a single unified function
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

-- Step 3: Create a simplified version for backward compatibility
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

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION public.is_unit_available(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_unit_available_simple(UUID, TEXT) TO authenticated;

-- Step 5: Test the functions
-- You can test with these queries:
-- SELECT public.is_unit_available_simple('your-property-id', '1');
-- SELECT public.is_unit_available('your-property-id', '1', NULL);

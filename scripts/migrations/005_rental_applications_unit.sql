-- Add unit_number to rental_applications table
ALTER TABLE public.rental_applications
ADD COLUMN unit_number TEXT;

-- Create function to get available unit numbers
CREATE OR REPLACE FUNCTION public.get_available_unit_numbers(property_id UUID)
RETURNS TABLE (
    unit_number TEXT
) AS $$
BEGIN
    -- Get all unit numbers that are currently occupied
    RETURN QUERY
    WITH occupied_units AS (
        SELECT t.unit_number
        FROM public.tenants t
        WHERE t.property_id = get_available_unit_numbers.property_id
        AND t.status != 'terminated'
        UNION
        SELECT ra.unit_number
        FROM public.rental_applications ra
        WHERE ra.property_id = get_available_unit_numbers.property_id
        AND ra.status = 'pending'
        AND ra.unit_number IS NOT NULL
    ),
    -- Generate unit numbers based on total_units
    all_units AS (
        SELECT 'Unit ' || generate_series(1, p.total_units)::text as unit_number
        FROM public.properties p
        WHERE p.id = get_available_unit_numbers.property_id
    )
    SELECT a.unit_number
    FROM all_units a
    LEFT JOIN occupied_units o ON a.unit_number = o.unit_number
    WHERE o.unit_number IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


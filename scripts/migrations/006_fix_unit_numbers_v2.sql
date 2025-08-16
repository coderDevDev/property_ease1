-- Drop existing function
DROP FUNCTION IF EXISTS public.get_available_unit_numbers;

-- Create improved function to get available unit numbers
CREATE OR REPLACE FUNCTION public.get_available_unit_numbers(property_id UUID)
RETURNS TABLE (
    unit_number TEXT
) AS $$
DECLARE
    total_units INTEGER;
    property_type TEXT;
BEGIN
    -- Get total units and type for the property
    SELECT p.total_units, p.type INTO total_units, property_type
    FROM public.properties p
    WHERE p.id = property_id;

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
        AND ra.status IN ('pending', 'approved')
        AND ra.unit_number IS NOT NULL
    ),
    -- Generate sequential unit numbers
    all_units AS (
        SELECT 
            CASE 
                -- For residential/dormitory: Units per floor (e.g., 101, 102, 103, 201, 202, 203)
                WHEN property_type IN ('residential', 'dormitory') THEN
                    (FLOOR((generate_series - 1) / 5) + 1)::text || 
                    LPAD(((generate_series - 1) % 5 + 1)::text, 2, '0')
                -- For commercial: Unit A1, A2, B1, B2, etc.
                ELSE
                    CHR(65 + ((generate_series - 1) / 5)) || 
                    ((generate_series - 1) % 5 + 1)::text
            END as unit_number
        FROM generate_series(1, total_units) generate_series
    )
    SELECT DISTINCT a.unit_number
    FROM all_units a
    LEFT JOIN occupied_units o ON a.unit_number = o.unit_number
    WHERE o.unit_number IS NULL
    ORDER BY a.unit_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function
COMMENT ON FUNCTION public.get_available_unit_numbers IS 
'Generates available unit numbers based on property type:
- For residential/dormitory: Units are numbered by floor (101, 102, 103, 201, 202, 203)
- For commercial: Units use letter+number format (A1, A2, B1, B2)
Returns only unoccupied units (not assigned to tenants or pending applications)';

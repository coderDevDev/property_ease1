-- Drop existing function
DROP FUNCTION IF EXISTS public.get_available_unit_numbers;

-- Create improved function to get available unit numbers
CREATE OR REPLACE FUNCTION public.get_available_unit_numbers(property_id UUID)
RETURNS TABLE (
    unit_number TEXT
) AS $$
DECLARE
    total_units INTEGER;
BEGIN
    -- Get total units for the property
    SELECT p.total_units INTO total_units
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
        AND ra.status = 'pending'
        AND ra.unit_number IS NOT NULL
    ),
    -- Generate sequential unit numbers
    all_units AS (
        SELECT 
            CASE 
                -- For residential/dormitory: Unit 101, 102, etc. for first floor
                WHEN EXISTS (
                    SELECT 1 FROM public.properties 
                    WHERE id = property_id 
                    AND type IN ('residential', 'dormitory')
                ) THEN
                    CASE 
                        WHEN generate_series <= total_units / 4 THEN '1'
                        WHEN generate_series <= total_units / 2 THEN '2'
                        WHEN generate_series <= total_units * 3/4 THEN '3'
                        ELSE '4'
                    END || 
                    LPAD((generate_series % (total_units/4))::text, 2, '0')
                -- For commercial: Unit A1, A2, B1, B2, etc.
                ELSE
                    CHR(65 + ((generate_series-1) / 5)) || 
                    ((generate_series-1) % 5 + 1)::text
            END as unit_number
        FROM generate_series(1, total_units) generate_series
    )
    SELECT a.unit_number
    FROM all_units a
    LEFT JOIN occupied_units o ON a.unit_number = o.unit_number
    WHERE o.unit_number IS NULL
    ORDER BY a.unit_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unit_number to rental_applications table
ALTER TABLE public.rental_applications
ADD COLUMN IF NOT EXISTS unit_number TEXT;

-- Add unique constraint to prevent multiple pending/approved applications for the same unit
ALTER TABLE public.rental_applications
DROP CONSTRAINT IF EXISTS unique_pending_approved_unit;

CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_approved_unit
ON public.rental_applications (property_id, unit_number)
WHERE status IN ('pending', 'approved');

-- Update RLS policies to include unit_number
DROP POLICY IF EXISTS rental_applications_select ON public.rental_applications;
DROP POLICY IF EXISTS rental_applications_insert ON public.rental_applications;
DROP POLICY IF EXISTS rental_applications_update ON public.rental_applications;

CREATE POLICY rental_applications_select ON public.rental_applications
    FOR SELECT USING (
        user_id = auth.uid() OR
        property_id IN (
            SELECT id FROM public.properties WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY rental_applications_insert ON public.rental_applications
    FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY rental_applications_update ON public.rental_applications
    FOR UPDATE USING (
        user_id = auth.uid() OR
        property_id IN (
            SELECT id FROM public.properties WHERE owner_id = auth.uid()
        )
    );

-- Function to check if a unit is available
CREATE OR REPLACE FUNCTION public.is_unit_available(
    p_property_id UUID,
    p_unit_number TEXT
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if unit is occupied by a tenant
    IF EXISTS (
        SELECT 1 FROM public.tenants
        WHERE property_id = p_property_id
        AND unit_number = p_unit_number
        AND status != 'terminated'
    ) THEN
        RETURN FALSE;
    END IF;

    -- Check if unit has pending/approved application
    IF EXISTS (
        SELECT 1 FROM public.rental_applications
        WHERE property_id = p_property_id
        AND unit_number = p_unit_number
        AND status IN ('pending', 'approved')
    ) THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

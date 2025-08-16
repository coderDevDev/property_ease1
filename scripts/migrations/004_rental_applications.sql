-- Migration script for rental applications feature
-- Version: 004
-- Description: Adds rental applications and related tables

-- Create application status type
DO $$ BEGIN
    CREATE TYPE application_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create rental_applications table
CREATE TABLE IF NOT EXISTS public.rental_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    unit_type TEXT NOT NULL,
    monthly_rent DECIMAL(10,2) NOT NULL CHECK (monthly_rent >= 0),
    move_in_date DATE NOT NULL,
    status application_status DEFAULT 'pending',
    notes TEXT,
    rejection_reason TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create application_documents table
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES public.rental_applications(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rental_applications_user_id ON public.rental_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_property_id ON public.rental_applications(property_id);
CREATE INDEX IF NOT EXISTS idx_rental_applications_status ON public.rental_applications(status);
CREATE INDEX IF NOT EXISTS idx_application_documents_application_id ON public.application_documents(application_id);

-- Add updated_at trigger for rental_applications
CREATE TRIGGER update_rental_applications_updated_at
    BEFORE UPDATE ON public.rental_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for rental_applications
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own applications
CREATE POLICY "Tenants can view own applications" ON public.rental_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Tenants can create applications
CREATE POLICY "Tenants can create applications" ON public.rental_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Property owners can view applications for their properties
CREATE POLICY "Property owners can view applications for their properties" ON public.rental_applications
    FOR SELECT USING (
        property_id IN (
            SELECT id FROM public.properties WHERE owner_id = auth.uid()
        )
    );

-- Property owners can update applications for their properties
CREATE POLICY "Property owners can update applications for their properties" ON public.rental_applications
    FOR UPDATE USING (
        property_id IN (
            SELECT id FROM public.properties WHERE owner_id = auth.uid()
        )
    );

-- Create RLS policies for application_documents
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;

-- Tenants can view documents for their applications
CREATE POLICY "Tenants can view application documents" ON public.application_documents
    FOR SELECT USING (
        application_id IN (
            SELECT id FROM public.rental_applications WHERE user_id = auth.uid()
        )
    );

-- Tenants can upload documents to their applications
CREATE POLICY "Tenants can upload application documents" ON public.application_documents
    FOR INSERT WITH CHECK (
        application_id IN (
            SELECT id FROM public.rental_applications WHERE user_id = auth.uid()
        )
    );

-- Property owners can view documents for applications to their properties
CREATE POLICY "Property owners can view application documents" ON public.application_documents
    FOR SELECT USING (
        application_id IN (
            SELECT ra.id 
            FROM public.rental_applications ra
            JOIN public.properties p ON ra.property_id = p.id
            WHERE p.owner_id = auth.uid()
        )
    );

-- Create function to handle application approval
CREATE OR REPLACE FUNCTION public.approve_rental_application(
    application_id UUID,
    unit_number TEXT
)
RETURNS VOID AS $$
DECLARE
    app_record RECORD;
BEGIN
    -- Get application details
    SELECT * INTO app_record
    FROM public.rental_applications
    WHERE id = application_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or not in pending status';
    END IF;

    -- Start transaction
    BEGIN
        -- Update application status
        UPDATE public.rental_applications
        SET status = 'approved',
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
            move_in_date
        ) VALUES (
            app_record.user_id,
            app_record.property_id,
            unit_number,
            app_record.move_in_date,
            app_record.move_in_date + INTERVAL '1 year',
            app_record.monthly_rent,
            app_record.monthly_rent * 2, -- 2 months deposit
            app_record.monthly_rent, -- 1 month security deposit
            'pending',
            app_record.move_in_date
        );

        -- Increment occupied units
        PERFORM increment_occupied_units(app_record.property_id);

        -- Reject other pending applications from the same user for other properties
        UPDATE public.rental_applications
        SET status = 'rejected',
            rejection_reason = 'Another application was approved',
            updated_at = NOW()
        WHERE user_id = app_record.user_id
        AND id != application_id
        AND status = 'pending';

    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to approve application: %', SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle application rejection
CREATE OR REPLACE FUNCTION public.reject_rental_application(
    application_id UUID,
    reason TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.rental_applications
    SET status = 'rejected',
        rejection_reason = reason,
        updated_at = NOW()
    WHERE id = application_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found or not in pending status';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user has pending applications
CREATE OR REPLACE FUNCTION public.has_pending_applications(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.rental_applications
        WHERE user_id = has_pending_applications.user_id
        AND status = 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get application statistics for a property
CREATE OR REPLACE FUNCTION public.get_property_application_stats(
    property_id UUID,
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_applications INTEGER,
    pending_applications INTEGER,
    approved_applications INTEGER,
    rejected_applications INTEGER,
    average_processing_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_applications,
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_applications,
        COUNT(*) FILTER (WHERE status = 'approved')::INTEGER as approved_applications,
        COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER as rejected_applications,
        AVG(
            CASE 
                WHEN status != 'pending' THEN updated_at - submitted_at
                ELSE NULL 
            END
        )::INTERVAL as average_processing_time
    FROM public.rental_applications
    WHERE property_id = get_property_application_stats.property_id
    AND (start_date IS NULL OR submitted_at >= start_date)
    AND (end_date IS NULL OR submitted_at <= end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit trigger for rental_applications
CREATE TRIGGER audit_rental_applications
    AFTER INSERT OR UPDATE OR DELETE ON public.rental_applications
    FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

-- Create audit trigger for application_documents
CREATE TRIGGER audit_application_documents
    AFTER INSERT OR UPDATE OR DELETE ON public.application_documents
    FOR EACH ROW EXECUTE FUNCTION public.create_audit_log();

-- Insert default system settings for applications
INSERT INTO public.system_settings (
    setting_key,
    setting_value,
    category,
    description,
    updated_by
) VALUES (
    'application_settings',
    '{
        "max_pending_applications": 3,
        "min_documents_required": 1,
        "allowed_document_types": ["image/jpeg", "image/png", "application/pdf"],
        "max_document_size_mb": 10,
        "auto_reject_after_days": 30
    }'::jsonb,
    'system',
    'Rental application configuration settings',
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT (setting_key) DO NOTHING;

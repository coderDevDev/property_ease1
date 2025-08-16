-- Migration script for application documents storage
-- Version: 004
-- Description: Sets up storage bucket and policies for application documents

-- Note: This script needs to be run using the Supabase Dashboard SQL editor
-- or via the Supabase Management API, as storage.buckets is not directly accessible

-- Create storage bucket for application documents
INSERT INTO storage.buckets (id, name, public)
VALUES (
    'application-documents',
    'application-documents',
    FALSE
) ON CONFLICT DO NOTHING;

-- Create storage policy to allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload application documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'application-documents' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text 
        FROM rental_applications 
        WHERE user_id = auth.uid()
    )
);

-- Create storage policy to allow users to read their own documents
CREATE POLICY "Users can read their own application documents"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'application-documents' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text 
        FROM rental_applications 
        WHERE user_id = auth.uid()
    )
);

-- Create storage policy to allow property owners to read application documents
CREATE POLICY "Property owners can read application documents"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'application-documents' AND
    (storage.foldername(name))[1] IN (
        SELECT ra.id::text
        FROM rental_applications ra
        JOIN properties p ON ra.property_id = p.id
        WHERE p.owner_id = auth.uid()
    )
);

-- Create storage policy to allow users to delete their documents
CREATE POLICY "Users can delete their application documents"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'application-documents' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text 
        FROM rental_applications 
        WHERE user_id = auth.uid()
        AND status = 'pending'
    )
);

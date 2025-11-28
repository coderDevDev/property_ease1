-- Migration script to add feedback and personnel contact fields to maintenance_requests
-- This adds support for tenant feedback (rating and comment) and personnel contact information

-- Add personnel phone number field
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS assigned_personnel_phone TEXT;

-- Add feedback fields
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5);

ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS feedback_comment TEXT;

ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS feedback_submitted_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS feedback_required BOOLEAN DEFAULT FALSE;

-- Add comments to document the new fields
COMMENT ON COLUMN public.maintenance_requests.assigned_personnel_phone IS 'Contact phone number of the assigned maintenance personnel';
COMMENT ON COLUMN public.maintenance_requests.feedback_rating IS 'Tenant feedback rating (1-5, where 5 is highest)';
COMMENT ON COLUMN public.maintenance_requests.feedback_comment IS 'Tenant feedback comment';
COMMENT ON COLUMN public.maintenance_requests.feedback_submitted_at IS 'Timestamp when tenant submitted feedback';
COMMENT ON COLUMN public.maintenance_requests.feedback_required IS 'Whether feedback is required before owner can complete the request';

-- Create index on feedback_rating for analytics/queries
CREATE INDEX IF NOT EXISTS idx_maintenance_feedback_rating ON public.maintenance_requests(feedback_rating) WHERE feedback_rating IS NOT NULL;

-- Create index on feedback_required for filtering
CREATE INDEX IF NOT EXISTS idx_maintenance_feedback_required ON public.maintenance_requests(feedback_required) WHERE feedback_required = TRUE;


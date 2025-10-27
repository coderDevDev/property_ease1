-- Migration script to change assigned_to from UUID to TEXT
-- This allows storing personnel names as text instead of requiring UUID references

-- First, add a new column for the assigned personnel name
ALTER TABLE public.maintenance_requests 
ADD COLUMN assigned_personnel TEXT;

-- Copy any existing assigned_to data to the new column (if any)
-- Note: This will only work if there are existing user records
-- UPDATE public.maintenance_requests 
-- SET assigned_personnel = (
--   SELECT CONCAT(first_name, ' ', last_name) 
--   FROM public.users 
--   WHERE users.id = maintenance_requests.assigned_to
-- )
-- WHERE assigned_to IS NOT NULL;

-- Drop the foreign key constraint
ALTER TABLE public.maintenance_requests 
DROP CONSTRAINT IF EXISTS maintenance_requests_assigned_to_fkey;

-- Drop the old assigned_to column
ALTER TABLE public.maintenance_requests 
DROP COLUMN IF EXISTS assigned_to;

-- Rename the new column to assigned_to
ALTER TABLE public.maintenance_requests 
RENAME COLUMN assigned_personnel TO assigned_to;

-- Add a comment to document the change
COMMENT ON COLUMN public.maintenance_requests.assigned_to IS 'Name of the assigned maintenance personnel (stored as text)';

-- Update the RLS policies if needed (they should still work since we're just changing the data type)
-- The existing policies don't reference assigned_to specifically, so no changes needed

-- Create an index on the new assigned_to column for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_assigned_to ON public.maintenance_requests(assigned_to);

-- Update any existing views or functions that might reference the old UUID field
-- (Add any specific updates here if needed)

-- Example of how to query the new field:
-- SELECT id, title, assigned_to, status FROM maintenance_requests WHERE assigned_to IS NOT NULL;


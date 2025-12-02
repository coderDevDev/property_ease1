-- Enable Real-Time for Notifications Table
-- Run this in Supabase SQL Editor

-- Add notifications table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Verify it was added
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- You should see 'notifications' in the results

-- Also verify RLS policies allow SELECT
SELECT * FROM pg_policies 
WHERE tablename = 'notifications' 
AND cmd = 'SELECT';

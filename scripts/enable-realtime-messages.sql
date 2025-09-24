-- Enable real-time for messages table
-- This script enables real-time subscriptions for the messages table

-- Check if real-time is already enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';

-- Enable real-time for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Verify real-time is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';

-- Check publication status
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages';
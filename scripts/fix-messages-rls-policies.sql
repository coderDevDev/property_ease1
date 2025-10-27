-- Fix RLS policies for messages table to ensure real-time works for both owners and tenants
-- Run this in your Supabase SQL editor

-- First, check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'messages';

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

-- Create comprehensive RLS policies for messages
-- Policy 1: Users can view messages where they are sender or recipient
CREATE POLICY "Users can view own messages" ON public.messages
FOR SELECT USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

-- Policy 2: Users can insert messages (as sender)
CREATE POLICY "Users can insert messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_id = auth.uid()
);

-- Policy 3: Users can update their own messages (for read status, etc.)
CREATE POLICY "Users can update own messages" ON public.messages
FOR UPDATE USING (
  sender_id = auth.uid() OR recipient_id = auth.uid()
) WITH CHECK (
  sender_id = auth.uid() OR recipient_id = auth.uid()
);

-- Policy 4: Users can delete their own messages
CREATE POLICY "Users can delete own messages" ON public.messages
FOR DELETE USING (
  sender_id = auth.uid()
);

-- Ensure RLS is enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Check if real-time is enabled for messages table
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'messages';

-- If not enabled, enable it
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Also ensure conversations table has proper RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing conversation policies if they exist
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;

-- Create conversation policies
CREATE POLICY "Users can view own conversations" ON public.conversations
FOR SELECT USING (
  auth.uid() = ANY(participants)
);

CREATE POLICY "Users can insert conversations" ON public.conversations
FOR INSERT WITH CHECK (
  auth.uid() = ANY(participants)
);

CREATE POLICY "Users can update own conversations" ON public.conversations
FOR UPDATE USING (
  auth.uid() = ANY(participants)
) WITH CHECK (
  auth.uid() = ANY(participants)
);

-- Enable real-time for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Verify the setup
SELECT 
  'Messages RLS Status' as check_type,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as status
FROM pg_tables 
WHERE tablename = 'messages'

UNION ALL

SELECT 
  'Conversations RLS Status' as check_type,
  CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END as status
FROM pg_tables 
WHERE tablename = 'conversations'

UNION ALL

SELECT 
  'Messages Real-time Status' as check_type,
  CASE WHEN COUNT(*) > 0 THEN 'Enabled' ELSE 'Not Enabled' END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'messages'

UNION ALL

SELECT 
  'Conversations Real-time Status' as check_type,
  CASE WHEN COUNT(*) > 0 THEN 'Enabled' ELSE 'Not Enabled' END as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'conversations';

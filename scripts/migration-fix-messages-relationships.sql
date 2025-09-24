-- Migration to fix messages table relationships
-- This script adds explicit foreign key constraint names to resolve the embedding issue

-- Drop existing foreign key constraints if they exist
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_recipient_id_fkey;

-- Add explicit foreign key constraints with names
ALTER TABLE public.messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.messages 
ADD CONSTRAINT messages_recipient_id_fkey 
FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON public.messages(property_id);

-- Add RLS policies for messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages where they are sender or recipient
CREATE POLICY "Users can view their messages" ON public.messages
FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Policy: Users can insert messages where they are the sender
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (
  auth.uid() = sender_id
);

-- Policy: Users can update messages they sent (for read status, etc.)
CREATE POLICY "Users can update their sent messages" ON public.messages
FOR UPDATE USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id
);

-- Policy: Users can delete messages they sent
CREATE POLICY "Users can delete their sent messages" ON public.messages
FOR DELETE USING (
  auth.uid() = sender_id
);

-- Add RLS policies for conversations table
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view conversations they participate in
CREATE POLICY "Users can view their conversations" ON public.conversations
FOR SELECT USING (
  auth.uid() = ANY(participants)
);

-- Policy: Users can insert conversations where they are a participant
CREATE POLICY "Users can create conversations" ON public.conversations
FOR INSERT WITH CHECK (
  auth.uid() = ANY(participants)
);

-- Policy: Users can update conversations they participate in
CREATE POLICY "Users can update their conversations" ON public.conversations
FOR UPDATE USING (
  auth.uid() = ANY(participants)
);

-- Policy: Users can delete conversations they participate in
CREATE POLICY "Users can delete their conversations" ON public.conversations
FOR DELETE USING (
  auth.uid() = ANY(participants)
);


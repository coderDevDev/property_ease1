-- Complete Fix for Real-Time Notifications
-- Run ALL of these commands in Supabase SQL Editor

-- ============================================
-- STEP 1: Add notifications to real-time publication
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================
-- STEP 2: Verify it was added
-- ============================================
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
-- You should see 'notifications' in the results

-- ============================================
-- STEP 3: Check and fix RLS policies
-- ============================================

-- First, check existing policies
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';

-- Drop old policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable read access for own notifications" ON notifications;
DROP POLICY IF EXISTS "Enable realtime for own notifications" ON notifications;

-- Create proper RLS policy for SELECT (required for real-time)
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (user_id IN (
  SELECT id FROM users WHERE user_id = auth.uid()
));

-- Alternative if user_id directly references auth.users
-- Uncomment this if the above doesn't work:
/*
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);
*/

-- ============================================
-- STEP 4: Ensure RLS is enabled
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: Grant necessary permissions
-- ============================================
GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;

-- ============================================
-- STEP 6: Verify real-time is working
-- ============================================

-- Check if notifications table is in the publication
SELECT 
  schemaname,
  tablename,
  pubname
FROM pg_publication_tables
WHERE tablename = 'notifications';

-- Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'notifications';

-- ============================================
-- STEP 7: Test with a sample notification
-- ============================================

-- Insert a test notification for your user
-- Replace 'YOUR_USER_ID' with the actual user_id from the console
-- (the one that shows: ef9e7ff8-f88c-4a67-ba22-4414a9499e62)

/*
INSERT INTO notifications (
  user_id,
  title,
  message,
  type,
  priority,
  is_read
) VALUES (
  'ef9e7ff8-f88c-4a67-ba22-4414a9499e62', -- Replace with actual user_id
  '🧪 Test Notification',
  'If you see this in real-time, it works!',
  'system',
  'high',
  false
);
*/

-- ============================================
-- EXPECTED RESULTS
-- ============================================

-- After running these commands:
-- 1. Refresh the tenant's notifications page
-- 2. Console should show: "SUBSCRIBED" (no TIMED_OUT or CLOSED)
-- 3. Insert the test notification above
-- 4. It should appear immediately without refresh

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If still not working, check Supabase real-time logs:
-- Dashboard → Logs → Realtime Logs

-- Common issues:
-- 1. user_id column type mismatch (UUID vs TEXT)
-- 2. RLS policy references wrong auth column
-- 3. Multiple conflicting policies
-- 4. Supabase needs time to apply changes (wait 1-2 minutes)

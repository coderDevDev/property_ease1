-- Fix RLS Policies for Real-Time Notifications
-- The table is already in the publication, so we just need to fix policies

-- ============================================
-- STEP 1: Check current setup
-- ============================================

-- Check if notifications is in publication (should be YES)
SELECT tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications';
-- Expected: notifications

-- Check current RLS policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'notifications';
-- This shows what policies exist

-- ============================================
-- STEP 2: Check your user_id column structure
-- ============================================

-- Check what user_id references
SELECT
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'notifications'
AND tc.constraint_type = 'FOREIGN KEY'
AND kcu.column_name = 'user_id';
-- This tells us if user_id references 'users' table or 'auth.users'

-- ============================================
-- STEP 3: Drop ALL existing SELECT policies
-- ============================================

-- Drop any existing SELECT policies to avoid conflicts
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'notifications' 
        AND cmd = 'SELECT'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON notifications';
    END LOOP;
END $$;

-- ============================================
-- STEP 4: Create the correct RLS policy
-- ============================================

-- Try OPTION 1 first (if user_id references users table)
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM users WHERE user_id = auth.uid()
  )
);

-- If OPTION 1 fails, comment it out and try OPTION 2
-- (if user_id directly references auth.users)
/*
CREATE POLICY "Users can view their own notifications"
ON notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
*/

-- ============================================
-- STEP 5: Ensure RLS is enabled
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Grant permissions
-- ============================================

GRANT SELECT ON notifications TO authenticated;
GRANT SELECT ON notifications TO anon;

-- ============================================
-- STEP 7: Verify the fix
-- ============================================

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'notifications';
-- Expected: rowsecurity = true

-- Check new policy exists
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'notifications'
AND cmd = 'SELECT';
-- Expected: Should show "Users can view their own notifications"

-- Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'notifications'
AND privilege_type = 'SELECT';
-- Expected: Should show 'authenticated' and 'anon'

-- ============================================
-- STEP 8: Test with actual user
-- ============================================

-- Check if your user can see notifications
-- Replace with your actual user_id
SELECT COUNT(*) as notification_count
FROM notifications
WHERE user_id = 'ef9e7ff8-f88c-4a67-ba22-4414a9499e62';
-- This should return a count (not an error)

-- ============================================
-- AFTER RUNNING THIS:
-- ============================================
-- 1. Wait 30 seconds
-- 2. Refresh tenant notifications page
-- 3. Check console for "SUBSCRIBED" (no CLOSED)
-- 4. Test by completing a maintenance request

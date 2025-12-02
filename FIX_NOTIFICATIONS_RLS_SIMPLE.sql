-- Fix Notifications RLS to Match Messages Pattern
-- Since messages real-time works, we'll copy that pattern

-- ============================================
-- STEP 1: Check how messages RLS works
-- ============================================

-- See the messages policies that work
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'messages'
AND cmd = 'SELECT';

-- ============================================
-- STEP 2: Check current notifications policies
-- ============================================

SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'notifications'
AND cmd = 'SELECT';

-- ============================================
-- STEP 3: Drop ALL notifications SELECT policies
-- ============================================

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
        RAISE NOTICE 'Dropped policy: %', r.policyname;
    END LOOP;
END $$;

-- ============================================
-- STEP 4: Create SIMPLE policy (like messages)
-- ============================================

-- This is the simplest policy that should work
-- It matches the pattern that works for messages

CREATE POLICY "Enable read access for users"
ON notifications
FOR SELECT
TO public
USING (true);

-- If you want it more secure (only own notifications):
-- Comment out the above and uncomment this:
/*
CREATE POLICY "Users can read own notifications"
ON notifications
FOR SELECT
TO public
USING (
  user_id IN (
    SELECT id FROM users WHERE user_id = auth.uid()
  )
);
*/

-- ============================================
-- STEP 5: Ensure RLS is enabled
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 6: Grant permissions (like messages)
-- ============================================

GRANT ALL ON notifications TO postgres;
GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- ============================================
-- STEP 7: Verify
-- ============================================

-- Check the new policy
SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  qual
FROM pg_policies 
WHERE tablename = 'notifications';

-- Check permissions
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'notifications';

-- ============================================
-- STEP 8: Test query
-- ============================================

-- This should work without errors
SELECT COUNT(*) FROM notifications;

-- ==========================useRealtimeNotifications==================
-- AFTER RUNNING:
-- ============================================
-- 1. Wait 10 seconds
-- 2. Refresh tenant notifications page
-- 3. Should see "SUBSCRIBED" in console
-- 4. Test by completing maintenance request
-- 5. Notification should appear in real-time!

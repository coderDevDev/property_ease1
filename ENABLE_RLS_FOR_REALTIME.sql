-- Enable RLS for Real-Time Notifications
-- Real-time REQUIRES RLS to be enabled, but we'll make it permissive

-- ============================================
-- STEP 1: Enable RLS on notifications table
-- ============================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 2: Create a permissive policy (allow all reads)
-- ============================================

-- Drop any existing policies first
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
DROP POLICY IF EXISTS "Allow all to read notifications" ON notifications;
DROP POLICY IF EXISTS "Public read access" ON notifications;

-- Create a simple policy that allows everyone to read
-- (This is permissive like having RLS disabled, but RLS is technically enabled)
CREATE POLICY "Allow all to read notifications"
ON notifications
FOR SELECT
TO public
USING (true);

-- ============================================
-- STEP 3: Also allow INSERT/UPDATE/DELETE for authenticated users
-- ============================================

-- Allow authenticated users to insert
DROP POLICY IF EXISTS "Allow authenticated to insert" ON notifications;
CREATE POLICY "Allow authenticated to insert"
ON notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update
DROP POLICY IF EXISTS "Allow authenticated to update" ON notifications;
CREATE POLICY "Allow authenticated to update"
ON notifications
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete
DROP POLICY IF EXISTS "Allow authenticated to delete" ON notifications;
CREATE POLICY "Allow authenticated to delete"
ON notifications
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- STEP 4: Grant permissions
-- ============================================

GRANT ALL ON notifications TO anon;
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- ============================================
-- STEP 5: Verify RLS is enabled
-- ============================================

SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'notifications';
-- Should show: rls_enabled = true

-- ============================================
-- STEP 6: Check policies
-- ============================================

SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd;

-- ============================================
-- EXPECTED RESULT:
-- ============================================
-- RLS is enabled (required for real-time)
-- But policies allow everything (like RLS disabled)
-- Real-time will now work!

-- ============================================
-- AFTER RUNNING:
-- ============================================
-- 1. Wait 10 seconds
-- 2. Refresh tenant notifications page
-- 3. Console should show: "SUBSCRIBED" (no CLOSED)
-- 4. Test with maintenance completion
-- 5. Notification appears in real-time!

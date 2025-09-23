-- Check if real-time is enabled for messages and conversations tables
-- Run this in your Supabase SQL editor

-- Check which tables are enabled for real-time
SELECT 
    schemaname, 
    tablename,
    'Enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename IN ('messages', 'conversations')

UNION ALL

-- Check which tables are NOT enabled
SELECT 
    'public' as schemaname,
    tablename,
    'NOT Enabled' as status
FROM (
    SELECT 'messages' as tablename
    UNION SELECT 'conversations'
) t
WHERE tablename NOT IN (
    SELECT tablename 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime'
);

-- Check if the publication exists
SELECT 
    pubname,
    puballtables,
    pubinsert,
    pubupdate,
    pubdelete
FROM pg_publication 
WHERE pubname = 'supabase_realtime';

-- Check if real-time extension is installed
SELECT 
    extname,
    extversion,
    'Installed' as status
FROM pg_extension 
WHERE extname = 'supabase_realtime';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// Server-side Supabase client with service role key
// This should only be used in API routes or server-side code
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 Environment check:');
  console.log(
    '- NEXT_PUBLIC_SUPABASE_URL:',
    supabaseUrl ? '✅ Set' : '❌ Missing'
  );
  console.log(
    '- SUPABASE_SERVICE_ROLE_KEY:',
    supabaseServiceRoleKey ? '✅ Set' : '❌ Missing'
  );

  if (!supabaseUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL environment variable. Please check your .env.local file.'
    );
  }

  if (!supabaseServiceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please check your .env.local file.'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

// Export a pre-configured admin client for server-side use
export const supabaseAdmin = createServerSupabaseClient();

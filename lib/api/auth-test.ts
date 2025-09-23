// Test file to help diagnose registration issues
import { supabase } from '@/lib/supabase';

export const testAuthConnection = async () => {
  console.log('🔍 Testing authentication connection...');

  // Test 1: Basic connection
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('✅ Basic connection test:', { success: !error });
    if (error) console.error('Connection error:', error);
  } catch (error) {
    console.error('❌ Basic connection failed:', error);
  }

  // Test 2: Check environment variables
  console.log('🔍 Environment variables check:');
  console.log(
    'NEXT_PUBLIC_SUPABASE_URL:',
    !!process.env.NEXT_PUBLIC_SUPABASE_URL
  );
  console.log(
    'SUPABASE_SERVICE_ROLE_KEY:',
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Test 3: Try a simple database query
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);

    console.log('✅ Database query test:', { success: !error });
    if (error) console.error('Database error:', error);
  } catch (error) {
    console.error('❌ Database query failed:', error);
  }

  return true;
};

export const testRegistration = async (email: string = 'test@example.com') => {
  console.log('🧪 Testing registration process with email:', email);

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'TestPassword123!',
      options: {
        data: {
          first_name: 'Test',
          last_name: 'User',
          phone: '09123456789',
          role: 'tenant'
        }
      }
    });

    console.log('Registration test result:', {
      success: !error,
      userId: data.user?.id,
      emailSent: data.user?.email_confirmed_at === null,
      error: error?.message
    });

    // Clean up if successful
    if (data.user && !error) {
      console.log('🧹 Cleaning up test user...');
      // Note: In production, you'd need admin privileges to delete users
    }

    return { success: !error, data, error };
  } catch (error) {
    console.error('❌ Registration test failed:', error);
    return { success: false, error };
  }
};









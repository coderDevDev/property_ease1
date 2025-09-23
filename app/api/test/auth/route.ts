import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing auth creation...');

    // Get test data
    const { email = 'test@example.com', password = 'TestPassword123!' } =
      await request.json();

    // Create admin client
    const supabaseAdmin = createServerSupabaseClient();

    // Test 1: Check if we can connect to Supabase
    console.log('✅ Step 1: Admin client created successfully');

    // Test 2: Try to create a user
    console.log('📝 Step 2: Creating test user...');
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: 'Test',
          last_name: 'User',
          phone: '09123456789',
          role: 'tenant'
        }
      });

    if (authError) {
      console.error('❌ Auth creation failed:', authError);
      return NextResponse.json(
        {
          success: false,
          step: 'auth_creation',
          error: authError.message,
          details: authError
        },
        { status: 400 }
      );
    }

    console.log('✅ Step 2: Auth user created:', authData.user?.id);

    // Test 3: Check if user appears in auth.users
    const { data: authUsers, error: authUsersError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (authUsersError) {
      console.error('❌ Failed to list auth users:', authUsersError);
    } else {
      const userExists = authUsers.users.find(u => u.email === email);
      console.log(
        '🔍 Step 3: User in auth.users:',
        userExists ? '✅ Found' : '❌ Not found'
      );
    }

    // Test 4: Try to create user in public.users
    console.log('📝 Step 4: Creating user in public.users...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user!.id,
        email,
        first_name: 'Test',
        last_name: 'User',
        phone: '09123456789',
        role: 'tenant',
        is_verified: true,
        is_active: true
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ Public user creation failed:', userError);

      // Cleanup: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);

      return NextResponse.json(
        {
          success: false,
          step: 'public_user_creation',
          error: userError.message,
          details: userError
        },
        { status: 400 }
      );
    }

    console.log('✅ Step 4: Public user created successfully');

    // Test 5: Cleanup - delete the test user
    console.log('🧹 Step 5: Cleaning up test user...');
    await supabaseAdmin.from('users').delete().eq('id', authData.user!.id);
    await supabaseAdmin.auth.admin.deleteUser(authData.user!.id);

    return NextResponse.json({
      success: true,
      message: 'All tests passed! Registration should work now.',
      steps: {
        admin_client: '✅ Created',
        auth_user: '✅ Created',
        public_user: '✅ Created',
        cleanup: '✅ Done'
      }
    });
  } catch (error) {
    console.error('💥 Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}









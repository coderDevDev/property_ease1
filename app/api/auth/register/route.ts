import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-admin';
import type { RegisterData } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const data: RegisterData = await request.json();

    console.log(
      '🚀 Server-side registration for:',
      data.email,
      'Role:',
      data.role
    );

    // Create admin client (this will check environment variables)
    const supabaseAdmin = createServerSupabaseClient();

    // Step 1: Create user with Supabase Auth using admin client
    console.log('📝 Creating user in auth.users...');
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true, // Auto-confirm email for admin creation
        user_metadata: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          role: data.role,
          ...(data.role === 'owner' && {
            company_name: data.companyName,
            business_license: data.businessLicense
          }),
          ...(data.role === 'tenant' && {
            emergency_contact_name: data.emergencyContactName,
            emergency_contact_phone: data.emergencyContactPhone,
            emergency_contact_relationship: data.emergencyContactRelationship
          }),
          ...(data.role === 'admin' && {
            is_admin: true
          })
        }
      });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);

      // Provide more specific error messages
      let errorMessage = authError.message;
      if (
        authError.message.includes('already registered') ||
        authError.message.includes('already exists') ||
        authError.message.includes('duplicate')
      ) {
        errorMessage =
          'This email is already registered. Please use a different email or try signing in.';
      }

      return NextResponse.json(
        { success: false, message: errorMessage },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error('❌ No user data returned from auth creation');
      return NextResponse.json(
        { success: false, message: 'User creation failed' },
        { status: 400 }
      );
    }

    console.log('✅ User created in auth.users:', authData.user.id);

    // Step 2: Create user record in public.users table
    console.log('📝 Creating user record in public.users...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone,
        role: data.role,
        is_admin: data.role === 'admin',
        is_verified: false,
        is_active: true,
        company_name: data.role === 'owner' ? data.companyName : null,
        business_license: data.role === 'owner' ? data.businessLicense : null,
        emergency_contact_name:
          data.role === 'tenant' ? data.emergencyContactName : null,
        emergency_contact_phone:
          data.role === 'tenant' ? data.emergencyContactPhone : null,
        emergency_contact_relationship:
          data.role === 'tenant' ? data.emergencyContactRelationship : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (userError) {
      console.error('❌ User record creation failed:', userError);

      // Try to clean up the auth user if profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }

      // Provide more specific error messages
      let errorMessage = `Failed to create user profile: ${userError.message}`;
      if (
        userError.message.includes('duplicate') ||
        userError.message.includes('already exists') ||
        userError.message.includes('unique')
      ) {
        errorMessage =
          'This email is already registered. Please use a different email or try signing in.';
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage
        },
        { status: 400 }
      );
    }

    console.log('✅ User record created in public.users');

    console.log('🎉 Registration process completed successfully!');

    return NextResponse.json({
      success: true,
      message:
        'Registration successful! Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: data.role
      }
    });
  } catch (error) {
    console.error('💥 Registration API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      },
      { status: 500 }
    );
  }
}

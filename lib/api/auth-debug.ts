import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { RegisterData, LoginCredentials } from '@/types/auth';

// Debug version of AuthAPI to help troubleshoot registration issues

export class AuthDebugAPI {
  static async testConnection() {
    try {
      console.log('🔍 Testing Supabase connection...');
      console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log(
        'Has Service Role Key:',
        !!process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabase.auth.getSession();
      console.log('Session test result:', { data, error });

      return { success: true, data };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { success: false, error };
    }
  }

  static async register(data: RegisterData) {
    try {
      console.log(
        '🚀 Starting registration process for:',
        data.email,
        'Role:',
        data.role
      );

      // Step 1: Register with Supabase Auth
      console.log('📝 Step 1: Registering with Supabase Auth...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
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
        }
      });

      console.log('Auth registration result:', {
        success: !authError,
        userId: authData.user?.id,
        error: authError?.message
      });

      if (authError) {
        throw new Error(`Auth registration failed: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('No user data returned from auth registration');
      }

      console.log('✅ Step 1 completed: User registered in auth.users');

      // Step 2: Wait for trigger and check if user exists in public.users
      console.log('⏳ Step 2: Waiting for database trigger...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased wait time

      // Create admin client for checking
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      console.log('🔍 Step 3: Checking if user exists in public.users...');
      const { data: userData, error: userCheckError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      console.log('User check result:', {
        exists: !!userData,
        error: userCheckError?.message,
        userData: userData
          ? { id: userData.id, email: userData.email, role: userData.role }
          : null
      });

      if (userCheckError && userCheckError.code !== 'PGRST116') {
        console.error('❌ Error checking user existence:', userCheckError);
      }

      if (!userData) {
        console.log(
          '🔧 Step 4: Trigger failed, manually creating user record...'
        );
        const { data: insertedUser, error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role: data.role,
            is_verified: false,
            is_admin: data.role === 'admin',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Manual user creation failed:', insertError);
          throw new Error(
            `Failed to create user record: ${insertError.message}`
          );
        }

        console.log(
          '✅ Step 4 completed: User manually created in public.users'
        );
      } else {
        console.log(
          '✅ Step 3 completed: User already exists in public.users (trigger worked)'
        );
      }

      // Step 5: Update with role-specific data
      console.log('🔄 Step 5: Updating user with role-specific data...');
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          company_name: data.role === 'owner' ? data.companyName : null,
          business_license: data.role === 'owner' ? data.businessLicense : null,
          emergency_contact_name:
            data.role === 'tenant' ? data.emergencyContactName : null,
          emergency_contact_phone:
            data.role === 'tenant' ? data.emergencyContactPhone : null,
          emergency_contact_relationship:
            data.role === 'tenant' ? data.emergencyContactRelationship : null,
          is_admin: data.role === 'admin'
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('⚠️ Profile update failed (non-critical):', updateError);
      } else {
        console.log('✅ Step 5 completed: Role-specific data updated');
      }

      console.log('🎉 Registration process completed successfully!');

      return {
        success: true,
        message:
          'Registration successful! Please check your email to verify your account.',
        user: authData.user
      };
    } catch (error) {
      console.error('💥 Registration process failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }
}









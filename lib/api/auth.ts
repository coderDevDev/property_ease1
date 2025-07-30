import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import type { RegisterData, LoginCredentials } from '@/types/auth';

// Create a service client for admin operations that bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVsZWtxYnlkc3Nta2t2cWF5bm90Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzgzMzI0MSwiZXhwIjoyMDY5NDA5MjQxfQ.ltrPkJfcWdG_wAMMFSs7no7Fk3d8jSMlcwBiSDIXfsQ'
);

export class AuthAPI {
  static async register(data: RegisterData) {
    try {
      // Register user with Supabase Auth
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
            })
          }
        }
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Registration failed');
      }

      // Wait a moment for the trigger to execute
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if user record was created by the trigger using admin client
      const { data: userData, error: userCheckError } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();

      if (userCheckError || !userData) {
        // If trigger failed, manually create the user record using admin client
        console.log('Trigger failed, manually creating user record');
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: authData.user.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
            role: data.role,
            is_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('Manual user creation failed:', insertError);
          // Don't throw error here as the auth user was created successfully
        }
      }

      // Update the user record with additional data using admin client
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
            data.role === 'tenant' ? data.emergencyContactRelationship : null
        })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        // Don't throw error here as the user was created successfully
        // The additional data can be updated later
      }

      return {
        success: true,
        message:
          'Registration successful! Please check your email to verify your account.',
        user: authData.user
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  static async login(credentials: LoginCredentials) {
    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Login failed');
      }

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (userError) {
        console.error('User data fetch error:', userError);
        throw new Error('Failed to fetch user profile');
      }

      // Check if role matches
      if (userData && userData.role !== credentials.role) {
        await supabase.auth.signOut();
        throw new Error(`Invalid credentials for ${credentials.role} account`);
      }

      // Update last login
      if (userData) {
        await supabase
          .from('users')
          .update({
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', authData.user.id);
      }

      // Convert database user data to frontend format
      const user = userData
        ? {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            phone: userData.phone,
            role: userData.role,
            avatar: userData.avatar_url,
            isVerified: userData.is_verified,
            createdAt: userData.created_at,
            lastLogin: userData.last_login,
            companyName: userData.company_name,
            businessLicense: userData.business_license,
            emergencyContact: userData.emergency_contact_name
              ? {
                  name: userData.emergency_contact_name,
                  phone: userData.emergency_contact_phone || '',
                  relationship: userData.emergency_contact_relationship || ''
                }
              : undefined
          }
        : null;

      return {
        success: true,
        message: 'Login successful',
        user,
        session: authData.session
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  static async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      return { success: true, message: 'Logged out successfully' };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Logout failed'
      };
    }
  }

  static async getCurrentUser() {
    try {
      const {
        data: { user },
        error: authError
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return { user: null, session: null };
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('User data fetch error:', userError);
        return { user: null, session: null };
      }

      const {
        data: { session }
      } = await supabase.auth.getSession();

      // Convert database user data to frontend format
      const convertedUser = userData
        ? {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            phone: userData.phone,
            role: userData.role,
            avatar: userData.avatar_url,
            isVerified: userData.is_verified,
            createdAt: userData.created_at,
            lastLogin: userData.last_login,
            companyName: userData.company_name,
            businessLicense: userData.business_license,
            emergencyContact: userData.emergency_contact_name
              ? {
                  name: userData.emergency_contact_name,
                  phone: userData.emergency_contact_phone || '',
                  relationship: userData.emergency_contact_relationship || ''
                }
              : undefined
          }
        : null;

      return { user: convertedUser, session };
    } catch (error) {
      console.error('Get current user error:', error);
      return { user: null, session: null };
    }
  }

  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Password reset email sent successfully'
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Password reset failed'
      };
    }
  }
}

import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: 'owner' | 'tenant' | 'admin';
  avatar_url?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  // Owner specific fields
  company_name?: string;
  business_license?: string;
  // Tenant specific fields
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  // Admin specific fields
  permissions?: string[];
}

export interface ProfileFormData {
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url?: string;
  // Owner specific fields
  company_name?: string;
  business_license?: string;
  // Tenant specific fields
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export class ProfileAPI {
  // Get user profile
  static async getProfile(userId: string): Promise<{
    success: boolean;
    data?: UserProfile;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data as UserProfile
      };
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: 'Failed to get profile'
      };
    }
  }

  // Update user profile
  static async updateProfile(
    userId: string,
    profileData: ProfileFormData
  ): Promise<{
    success: boolean;
    data?: UserProfile;
    message?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        data: data as UserProfile
      };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: 'Failed to update profile'
      };
    }
  }

  // Change password
  static async changePassword(
    userId: string,
    passwordData: PasswordChangeData
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // First verify current password
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: '', // We'll need to get this from the user
          password: passwordData.current_password
        });

      if (authError) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Failed to change password'
      };
    }
  }

  // Upload avatar
  static async uploadAvatar(
    userId: string,
    file: File
  ): Promise<{
    success: boolean;
    data?: { url: string };
    message?: string;
  }> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      return {
        success: true,
        data: { url: publicUrl }
      };
    } catch (error) {
      console.error('Upload avatar error:', error);
      return {
        success: false,
        message: 'Failed to upload avatar'
      };
    }
  }

  // Delete avatar
  static async deleteAvatar(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Avatar deleted successfully'
      };
    } catch (error) {
      console.error('Delete avatar error:', error);
      return {
        success: false,
        message: 'Failed to delete avatar'
      };
    }
  }

  // Get profile statistics
  static async getProfileStats(
    userId: string,
    role: 'owner' | 'tenant'
  ): Promise<{
    success: boolean;
    data?: {
      accountAge: number;
      lastLogin: string;
      totalProperties?: number;
      totalTenants?: number;
      totalPayments?: number;
      totalMaintenance?: number;
      totalMessages?: number;
    };
    message?: string;
  }> {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('created_at, last_login')
        .eq('id', userId)
        .single();

      if (!userData) {
        throw new Error('User not found');
      }

      const accountAge = Math.floor(
        (new Date().getTime() - new Date(userData.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      const stats: any = {
        accountAge,
        lastLogin: userData.last_login || 'Never'
      };

      if (role === 'owner') {
        // Get owner-specific stats
        // Get property IDs first
        const { data: properties } = await supabase
          .from('properties')
          .select('id')
          .eq('owner_id', userId);

        const propertyIds = properties?.map(p => p.id) || [];

        const [
          propertiesResult,
          tenantsResult,
          paymentsResult,
          maintenanceResult,
          messagesResult
        ] = await Promise.all([
          supabase
            .from('properties')
            .select('id', { count: 'exact', head: true })
            .eq('owner_id', userId),
          supabase
            .from('tenants')
            .select('id', { count: 'exact', head: true })
            .in('property_id', propertyIds),
          supabase
            .from('payments')
            .select('id', { count: 'exact', head: true })
            .in('property_id', propertyIds),
          supabase
            .from('maintenance_requests')
            .select('id', { count: 'exact', head: true })
            .in('property_id', propertyIds),
          supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        ]);

        stats.totalProperties = propertiesResult.count || 0;
        stats.totalTenants = tenantsResult.count || 0;
        stats.totalPayments = paymentsResult.count || 0;
        stats.totalMaintenance = maintenanceResult.count || 0;
        stats.totalMessages = messagesResult.count || 0;
      } else {
        // Get tenant-specific stats
        // Get tenant ID first
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id')
          .eq('user_id', userId)
          .single();

        const tenantId = tenant?.id;

        const [paymentsResult, maintenanceResult, messagesResult] =
          await Promise.all([
            supabase
              .from('payments')
              .select('id', { count: 'exact', head: true })
              .eq('tenant_id', tenantId),
            supabase
              .from('maintenance_requests')
              .select('id', { count: 'exact', head: true })
              .eq('tenant_id', tenantId),
            supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          ]);

        stats.totalPayments = paymentsResult.count || 0;
        stats.totalMaintenance = maintenanceResult.count || 0;
        stats.totalMessages = messagesResult.count || 0;
      }

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Get profile stats error:', error);
      return {
        success: false,
        message: 'Failed to get profile statistics'
      };
    }
  }

  // Verify email
  static async verifyEmail(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: '' // We'll need to get this from the user
      });

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Verification email sent'
      };
    } catch (error) {
      console.error('Verify email error:', error);
      return {
        success: false,
        message: 'Failed to send verification email'
      };
    }
  }

  // Deactivate account
  static async deactivateAccount(userId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }

      return {
        success: true,
        message: 'Account deactivated successfully'
      };
    } catch (error) {
      console.error('Deactivate account error:', error);
      return {
        success: false,
        message: 'Failed to deactivate account'
      };
    }
  }
}

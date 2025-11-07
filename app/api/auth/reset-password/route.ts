import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-admin';


export const dynamic = 'force-static';
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: 'Password must be at least 8 characters long'
        },
        { status: 400 }
      );
    }

    // Check password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServerSupabaseClient();

    // Use Supabase's built-in password reset verification
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: 'recovery'
    });

    if (error) {
      console.error('Password reset verification error:', error);
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { success: false, message: 'Invalid reset token' },
        { status: 400 }
      );
    }

    // Update the user's password
    const { error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(data.user.id, {
        password: password
      });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update password' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password API error:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}

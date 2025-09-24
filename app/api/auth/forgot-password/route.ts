import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Create a client-side Supabase client for password reset
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Use Supabase's built-in password reset functionality
    // This will automatically send an email if the user exists
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password`
    });

    if (error) {
      console.error('Supabase password reset error:', error);
      
      // Handle specific error cases
      if (error.message.includes('User not found') || error.message.includes('Invalid email')) {
        // For security, don't reveal if email exists or not
        return NextResponse.json({
          success: true,
          message: 'If an account with that email exists, we have sent a password reset link.'
        });
      }
      
      return NextResponse.json(
        { success: false, message: 'Failed to process password reset request' },
        { status: 500 }
      );
    }

    // In development mode, log the reset link for testing
    if (process.env.NODE_ENV === 'development') {
      console.log('Password reset email sent to:', email);
      console.log('Check your Supabase Auth logs for the reset link');
    }

    return NextResponse.json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });
  } catch (error) {
    console.error('Forgot password API error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
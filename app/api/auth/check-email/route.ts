import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Create admin client
    const supabaseAdmin = createServerSupabaseClient();

    // Check if email exists in auth.users table
    const { data: authUsers, error: authError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000 // Adjust as needed
      });

    if (authError) {
      console.error('Error checking auth users:', authError);
      return NextResponse.json(
        { success: false, message: 'Failed to check email availability' },
        { status: 500 }
      );
    }

    // Check if email exists in any user
    const emailExists = authUsers.users.some(
      user => user.email?.toLowerCase() === email.toLowerCase()
    );

    // Also check in public.users table for additional verification
    const { data: publicUsers, error: publicError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .limit(1);

    if (publicError) {
      console.error('Error checking public users:', publicError);
      // Don't fail the request, just log the error
    }

    const existsInPublic = publicUsers && publicUsers.length > 0;

    return NextResponse.json({
      success: true,
      exists: emailExists || existsInPublic,
      message:
        emailExists || existsInPublic
          ? 'This email is already registered'
          : 'Email is available'
    });
  } catch (error) {
    console.error('Email check error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check email availability'
      },
      { status: 500 }
    );
  }
}

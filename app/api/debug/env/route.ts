import { NextResponse } from 'next/server';

export async function GET() {
  // This endpoint helps debug environment variable issues
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  };

  console.log('🔍 Environment Debug Check:', envCheck);

  return NextResponse.json({
    message: 'Environment variable check',
    variables: envCheck,
    help: {
      message: 'If any variables show false, check your .env.local file',
      location: 'The .env.local file should be in the client folder',
      required: [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY'
      ]
    }
  });
}

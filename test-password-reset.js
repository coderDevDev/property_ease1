// Test script for password reset functionality
// Run with: node test-password-reset.js

const BASE_URL = 'http://localhost:3000';

async function testForgotPassword() {
  console.log('🧪 Testing forgot password API...');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Forgot password API working');
      console.log('Response:', data.message);

      if (data.resetLink) {
        console.log('🔗 Reset link (development only):', data.resetLink);
      }
    } else {
      console.log('❌ Forgot password API failed');
      console.log('Error:', data.message);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

async function testResetPassword() {
  console.log('🧪 Testing reset password API...');

  try {
    const response = await fetch(`${BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: 'invalid-token',
        password: 'NewPassword123'
      })
    });

    const data = await response.json();

    if (!data.success) {
      console.log('✅ Reset password API correctly rejected invalid token');
      console.log('Response:', data.message);
    } else {
      console.log('❌ Reset password API should have rejected invalid token');
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting password reset API tests...\n');

  await testForgotPassword();
  console.log('');
  await testResetPassword();

  console.log('\n✨ Tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Start your development server: npm run dev');
  console.log('2. Visit http://localhost:3000/forgot-password');
  console.log('3. Test the forgot password flow');
  console.log('4. Check Supabase Auth logs for reset links');
}

runTests();

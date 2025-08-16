# Registration Troubleshooting Guide

## 🔍 Common Issues and Solutions

### Issue 1: "Registration not working" / No error but user not created

**Possible Causes:**

1. Missing environment variables
2. Database trigger not working
3. RLS policies blocking access
4. Network/connection issues

**Solutions:**

#### 1. Check Environment Variables

Ensure your `.env.local` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 2. Test Database Connection

Run this in your browser console:

```javascript
// Import the test function
import { testAuthConnection } from '@/lib/api/auth-test';
testAuthConnection();
```

#### 3. Update Database Trigger (Admin Role Support)

Make sure your database has the updated `handle_new_user()` function that supports admin roles. Run this SQL in your Supabase SQL Editor:

```sql
-- Update the trigger function to support admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
  phone_val TEXT;
  role_val TEXT;
  is_admin_val BOOLEAN;
BEGIN
  -- Safely extract values from metadata with defaults
  first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  phone_val := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  is_admin_val := COALESCE((NEW.raw_user_meta_data->>'is_admin')::BOOLEAN, FALSE);

  -- Ensure admin role consistency
  IF role_val = 'admin' THEN
    is_admin_val := TRUE;
  END IF;

  -- Insert user record with safe defaults
  INSERT INTO public.users (
    id,
    email,
    first_name,
    last_name,
    phone,
    role,
    is_admin,
    is_verified,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    first_name_val,
    last_name_val,
    phone_val,
    role_val::user_role,
    is_admin_val,
    FALSE,
    TRUE,
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the registration
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 4. Check RLS Policies

Ensure your `users` table has proper RLS policies. Run this SQL:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'users';

-- View existing policies
SELECT * FROM pg_policies WHERE tablename = 'users';
```

#### 5. Test Registration Process

Use the debug API to test:

```javascript
import { AuthDebugAPI } from '@/lib/api/auth-debug';

// Test the registration process with detailed logging
AuthDebugAPI.register({
  email: 'test@example.com',
  password: 'TestPassword123!',
  confirmPassword: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  phone: '09123456789',
  role: 'admin'
});
```

### Issue 2: "Missing SUPABASE_SERVICE_ROLE_KEY"

**Solution:**

1. Go to your Supabase dashboard
2. Navigate to Settings → API
3. Copy the "service_role" secret key
4. Add it to your `.env.local` file:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Issue 3: Database trigger not firing

**Symptoms:**

- User created in `auth.users` but not in `public.users`
- No error messages

**Solutions:**

1. Check if trigger exists:

```sql
SELECT * FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
```

2. Recreate the trigger:

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Issue 4: RLS blocking user creation

**Solution:**
Temporarily disable RLS to test:

```sql
-- Disable RLS for testing (ONLY for development)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test registration...

-- Re-enable RLS after testing
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

## 🔧 Quick Fix Commands

### Complete Database Reset (if needed)

```sql
-- Run the complete schema from create-tables-fixed.sql
-- This will recreate everything with admin support
```

### Test Registration from Console

```javascript
// Open browser console and test
const testData = {
  email: 'admin@test.com',
  password: 'AdminTest123!',
  confirmPassword: 'AdminTest123!',
  firstName: 'Admin',
  lastName: 'User',
  phone: '09123456789',
  role: 'admin'
};

// Test with detailed logging
fetch('/api/test-registration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testData)
});
```

## 📊 Monitoring Registration

Check the browser console for detailed logs:

- ✅ Green messages = Success
- ⚠️ Yellow messages = Warnings (non-critical)
- ❌ Red messages = Errors (need fixing)

The registration process should show:

1. 🚀 Starting registration
2. ✅ User registered in auth.users
3. ⏳ Waiting for database trigger
4. ✅ User created/found in public.users
5. ✅ Role-specific data updated
6. 🎉 Registration completed

If any step fails, the logs will help identify the issue.

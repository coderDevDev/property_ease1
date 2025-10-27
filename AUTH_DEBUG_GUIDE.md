# 🔍 Authentication Debug Guide

## Why Registration Might Not Insert Into Auth Table

### 🎯 **Quick Test**

First, test if your environment is set up correctly:

1. **Visit this URL in your browser:**

   ```
   http://localhost:3000/api/debug/env
   ```

   This will show you which environment variables are loaded.

2. **Test the auth system:**
   ```
   http://localhost:3000/api/test/auth
   ```
   POST an empty JSON `{}` to test user creation.

### 🔧 **Common Issues & Solutions**

#### 1. **Missing Environment Variables**

**Symptoms:**

- "Missing SUPABASE_SERVICE_ROLE_KEY" error
- Registration fails immediately

**Solution:**
Create `.env.local` file in `client` folder:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### 2. **Supabase Auth Settings**

**Problem:** Supabase might have email confirmation enabled

**Solution:**

1. Go to Supabase Dashboard → Authentication → Settings
2. **Disable "Enable email confirmations"** (for testing)
3. Or use our updated API that auto-confirms emails

#### 3. **Database Trigger Issues**

**Problem:** User created in `auth.users` but not in `public.users`

**Check:** Run this SQL in Supabase SQL Editor:

```sql
-- Check if trigger exists
SELECT * FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check recent auth users
SELECT id, email, created_at FROM auth.users
ORDER BY created_at DESC LIMIT 5;

-- Check recent public users
SELECT id, email, created_at FROM public.users
ORDER BY created_at DESC LIMIT 5;
```

**Fix:** Update the trigger function:

```sql
-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 4. **RLS (Row Level Security) Issues**

**Problem:** Permission denied errors

**Temporary Fix** (for testing only):

```sql
-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test registration...

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### 📊 **Step-by-Step Debugging**

#### Step 1: Check Environment

```bash
# Visit in browser
http://localhost:3000/api/debug/env
```

Should show:

- ✅ NEXT_PUBLIC_SUPABASE_URL: true
- ✅ SUPABASE_SERVICE_ROLE_KEY: true

#### Step 2: Test Auth Creation

```bash
# POST to this endpoint
http://localhost:3000/api/test/auth

# Body: {}
```

Should complete all 5 steps successfully.

#### Step 3: Check Supabase Logs

1. Go to Supabase Dashboard
2. Click "Logs" in sidebar
3. Look for any errors during registration

#### Step 4: Test Registration Flow

1. Try to register a new user
2. Check browser console for detailed logs
3. Look for these messages:
   - ✅ Registration completed via server API
   - ✅ User created in auth.users
   - ✅ User record created in public.users

### 🛠 **Manual Fixes**

#### Fix 1: Reset Database Trigger

```sql
-- Run in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name_val TEXT;
  last_name_val TEXT;
  phone_val TEXT;
  role_val TEXT;
  is_admin_val BOOLEAN;
BEGIN
  -- Extract values from metadata
  first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
  last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
  phone_val := COALESCE(NEW.raw_user_meta_data->>'phone', '');
  role_val := COALESCE(NEW.raw_user_meta_data->>'role', 'tenant');
  is_admin_val := COALESCE((NEW.raw_user_meta_data->>'is_admin')::BOOLEAN, FALSE);

  IF role_val = 'admin' THEN
    is_admin_val := TRUE;
  END IF;

  -- Insert user record
  INSERT INTO public.users (
    id, email, first_name, last_name, phone, role, is_admin,
    is_verified, is_active, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, first_name_val, last_name_val, phone_val,
    role_val::user_role, is_admin_val, NEW.email_confirmed_at IS NOT NULL,
    TRUE, NOW(), NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Fix 2: Test Manual User Creation

```sql
-- Test creating a user manually
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"first_name": "Test", "last_name": "User", "role": "tenant"}'::jsonb
);
```

### 🔄 **Fallback Registration**

Our updated code now has a fallback system:

1. **First try:** Server-side API (preferred)
2. **If that fails:** Client-side registration
3. **Database trigger:** Creates public.users record

This ensures registration works even if environment variables aren't set up perfectly.

### 📞 **Still Having Issues?**

1. **Check server logs** in your terminal where you run `npm run dev`
2. **Check Supabase logs** in the dashboard
3. **Run the test endpoint** to see which step fails
4. **Try the fallback registration** by temporarily removing `.env.local`

The registration should now work with both methods!

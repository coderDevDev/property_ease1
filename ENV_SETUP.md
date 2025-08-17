# Environment Setup Guide

## 🔐 Required Environment Variables

You need to create a `.env.local` file in your project root with the following variables:

### 1. Create `.env.local` file

Create a file named `.env.local` in the `client` folder with these contents:

```env
# Supabase Configuration
# Your Supabase project URL (found in Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase anon key (found in Project Settings > API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Your Supabase service role key (found in Project Settings > API)
# ⚠️ IMPORTANT: This is a secret key, keep it secure!
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 2. Find Your Supabase Keys

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Navigate to Settings → API**
4. **Copy the following values:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Example `.env.local` file

```env
# Example (replace with your actual values)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0Njg3ODIwMCwiZXhwIjoxOTYyNDU0MjAwfQ.example_key_here
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ2ODc4MjAwLCJleHAiOjE5NjI0NTQyMDB9.example_service_key_here
```

### 4. Security Notes

- ✅ **NEXT_PUBLIC_SUPABASE_URL** - Safe to expose in frontend
- ✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY** - Safe to expose in frontend
- ⚠️ **SUPABASE_SERVICE_ROLE_KEY** - Keep secret! Never expose in frontend code

### 5. Restart Development Server

After creating `.env.local`, restart your development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## 🧪 Test Your Setup

After setting up the environment variables, test the registration:

1. **Open your app** in the browser
2. **Try to register a new user**
3. **Check the browser console** for detailed logs
4. **Look for these success messages:**
   - ✅ Registration completed via API
   - ✅ User created in auth.users
   - ✅ User record created in public.users

## 🚨 Troubleshooting

### Error: "supabaseKey is required"

- **Cause**: Missing or incorrect environment variables
- **Solution**: Double-check your `.env.local` file and restart the dev server

### Error: "Missing SUPABASE_SERVICE_ROLE_KEY"

- **Cause**: Environment variable not loaded on server-side
- **Solution**: Ensure the variable name is exactly `SUPABASE_SERVICE_ROLE_KEY` (without `NEXT_PUBLIC_`)

### Error: "fetch failed" or network errors

- **Cause**: API route not working
- **Solution**: Check that the file `app/api/auth/register/route.ts` exists and restart the server

### Registration seems to work but user not found

- **Cause**: Database trigger issues or RLS policies
- **Solution**: Check the server-side logs and run the updated SQL schema








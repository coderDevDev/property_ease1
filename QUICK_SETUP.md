# 🚀 Quick Environment Setup

## Step 1: Create `.env.local` file

Create a new file called `.env.local` in your `client` folder and add these lines:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 2: Get Your Supabase Keys

1. **Go to your Supabase dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Click on Settings (gear icon) in the sidebar**
4. **Click on API**
5. **Copy these values:**

### Project URL

- Copy the **Project URL** → paste as `NEXT_PUBLIC_SUPABASE_URL`

### API Keys

- Copy the **anon public** key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copy the **service_role secret** key → paste as `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Example `.env.local`

Your final `.env.local` file should look like this (with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefg123456.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmcxMjM0NTYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0Njg3ODIwMCwiZXhwIjoxOTYyNDU0MjAwfQ.example_anon_key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmcxMjM0NTYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjQ2ODc4MjAwLCJleHAiOjE5NjI0NTQyMDB9.example_service_role_key
```

## Step 4: Restart Your Development Server

After creating the `.env.local` file:

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
# or
yarn dev
# or
pnpm dev
```

## 🔍 Where to Find Your Supabase Keys

### Visual Guide:

1. **Supabase Dashboard** → **Your Project** → **Settings** → **API**
2. Look for these sections:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **API Keys**:
     - `anon` `public` (this goes in `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
     - `service_role` `secret` (this goes in `SUPABASE_SERVICE_ROLE_KEY`)

## ⚠️ Important Notes

- ✅ The `.env.local` file should be in the `client` folder (same level as `package.json`)
- ✅ Make sure there are no spaces around the `=` sign
- ✅ Don't put quotes around the values
- ✅ The file should be named exactly `.env.local` (with the dot at the beginning)
- ⚠️ **NEVER** commit the `.env.local` file to git (it contains secrets!)

## 🧪 Test It

After setting up:

1. Restart your dev server
2. Try to register a new user
3. Check the browser console for success messages

If you still see the error, double-check:

- File name is exactly `.env.local`
- File is in the `client` folder
- All three environment variables are set
- Development server was restarted

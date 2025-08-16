# Database Setup Guide

This guide will help you set up the complete Supabase database for PropertyEase with all advanced features.

## 🎯 Complete Feature Set

This database setup now supports ALL features from the requirements including:

**Tenant Features:**

- User registration and authentication
- Property listings and search
- Online rent payments (GCash/Maya support)
- Maintenance request submission with image attachments
- In-app messaging system
- Document management and downloads
- Real-time notifications and alerts
- Lease agreement management

**Owner Features:**

- Property and tenant management
- Payment tracking and reporting
- Maintenance task assignment and tracking
- Messaging and announcements
- Document uploads and management
- Analytics and reporting
- Multi-property support

**Admin Features:**

- User account management and moderation
- System-wide property and payment oversight
- Content moderation capabilities
- System analytics and reporting
- Configuration management
- Audit logging and system health monitoring

## 📋 Prerequisites

1. **Supabase Account**: Make sure you have a Supabase account
2. **Project Created**: Ensure you have a Supabase project set up
3. **Environment Variables**: Your `.env.local` should have:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

## 🗄️ Database Setup Steps

### Step 1: Access Your Supabase Dashboard

1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project

### Step 2: Run the Fixed Database Scripts

1. **Navigate to SQL Editor**

   - In your Supabase dashboard, click on **SQL Editor** in the left sidebar

2. **Drop existing tables (if any)**

   - Click **New Query**
   - Run this to clean up any existing tables:

   ```sql
   -- Drop all tables and types for clean setup
   DROP TABLE IF EXISTS audit_logs CASCADE;
   DROP TABLE IF EXISTS system_settings CASCADE;
   DROP TABLE IF EXISTS announcements CASCADE;
   DROP TABLE IF EXISTS notifications CASCADE;
   DROP TABLE IF EXISTS documents CASCADE;
   DROP TABLE IF EXISTS messages CASCADE;
   DROP TABLE IF EXISTS conversations CASCADE;
   DROP TABLE IF EXISTS maintenance_requests CASCADE;
   DROP TABLE IF EXISTS payments CASCADE;
   DROP TABLE IF EXISTS tenants CASCADE;
   DROP TABLE IF EXISTS properties CASCADE;
   DROP TABLE IF EXISTS users CASCADE;

   -- Drop all custom types
   DROP TYPE IF EXISTS user_role CASCADE;
   DROP TYPE IF EXISTS property_type CASCADE;
   DROP TYPE IF EXISTS property_status CASCADE;
   DROP TYPE IF EXISTS tenant_status CASCADE;
   DROP TYPE IF EXISTS payment_type CASCADE;
   DROP TYPE IF EXISTS payment_method CASCADE;
   DROP TYPE IF EXISTS payment_status CASCADE;
   DROP TYPE IF EXISTS maintenance_category CASCADE;
   DROP TYPE IF EXISTS maintenance_priority CASCADE;
   DROP TYPE IF EXISTS maintenance_status CASCADE;
   DROP TYPE IF EXISTS message_type CASCADE;
   DROP TYPE IF EXISTS file_type CASCADE;
   DROP TYPE IF EXISTS document_category CASCADE;
   DROP TYPE IF EXISTS notification_type CASCADE;
   DROP TYPE IF EXISTS notification_priority CASCADE;
   DROP TYPE IF EXISTS announcement_type CASCADE;
   DROP TYPE IF EXISTS announcement_priority CASCADE;
   DROP TYPE IF EXISTS target_audience CASCADE;
   DROP TYPE IF EXISTS system_setting_category CASCADE;
   ```

3. **Create Complete Database Schema**

   - Click **New Query**
   - Copy the entire contents of `scripts/create-tables-fixed.sql`
   - Paste it into the SQL editor
   - Click **Run** to execute

4. **Verify Complete Schema Created**

   - Go to **Table Editor** in the left sidebar
   - You should see these tables:
     - `users` (with admin role support)
     - `properties` (enhanced with location data)
     - `tenants` (enhanced lease management)
     - `payments` (complete payment tracking)
     - `maintenance_requests` (with image support)
     - `messages` (messaging system)
     - `conversations` (chat conversations)
     - `documents` (file management)
     - `notifications` (real-time alerts)
     - `announcements` (owner-to-tenant communication)
     - `system_settings` (admin configuration)
     - `audit_logs` (system activity tracking)

5. **Set up Storage Buckets**
   - Go to **Storage** in the left sidebar
   - Create a new bucket called `documents`
   - Set the bucket to be publicly accessible for file downloads
   - Configure appropriate file upload policies

### Step 3: Configure Authentication

1. **Go to Authentication Settings**

   - In your Supabase dashboard, click **Authentication** → **Settings**

2. **Enable Email Confirmation**

   - Make sure **Enable email confirmations** is turned ON
   - This is required for the registration flow

3. **Configure Email Templates** (Optional)
   - Go to **Authentication** → **Email Templates**
   - Customize the confirmation email if needed

## 🔧 Verification Steps

### Check Database Tables

1. Go to **Table Editor** in Supabase dashboard
2. Verify these tables exist:
   - `users` (extends auth.users)
   - `properties`
   - `tenants`

### Check Functions and Triggers

1. Go to **Database** → **Functions** in Supabase dashboard
2. You should see:
   - `handle_new_user()` function (improved version)
   - `update_updated_at_column()` function

### Test Registration

1. Start your development server: `pnpm dev`
2. Try registering a new user
3. Check that no "Database error saving new user" errors occur

## 🚨 Troubleshooting

### Issue: "Database error saving new user"

**Solution**:

1. Use the fixed script `scripts/create-tables-fixed.sql`
2. The improved trigger function handles errors gracefully
3. The AuthAPI now has fallback mechanisms

### Issue: "Table 'users' does not exist"

**Solution**: Run the `create-tables-fixed.sql` script in SQL Editor

### Issue: "Function 'handle_new_user' does not exist"

**Solution**: The fixed script creates this function with better error handling. Make sure you ran the entire script.

### Issue: "Permission denied"

**Solution**:

1. Check your environment variables are correct
2. Ensure you're using the correct project
3. Verify your API keys have the right permissions

### Issue: "RLS policy error"

**Solution**: The fixed script creates RLS policies automatically. Make sure you ran the entire script.

## 🔄 What's New in the Complete Schema

### Enhanced Database Architecture

- **Complete Feature Coverage**: All functional requirements from T-01 to A-08 supported
- **Admin Role Support**: Full admin dashboard with user management and system oversight
- **Advanced Payment System**: GCash/Maya integration support with receipt management
- **Messaging System**: Real-time chat between tenants and owners
- **Document Management**: File uploads with categorization and access control
- **Maintenance Tracking**: Complete workflow from request to completion with image support
- **Notification System**: Real-time alerts for all user actions and reminders
- **Audit Logging**: Complete system activity tracking for compliance
- **Analytics Support**: Built-in views and functions for reporting and insights

### Improved Security & Performance

- **Comprehensive RLS Policies**: Row-level security for all tables with proper access control
- **Optimized Indexes**: Performance indexes on all commonly queried fields
- **Data Integrity**: Check constraints and foreign key relationships
- **Automated Triggers**: Auto-updating timestamps and conversation management
- **Storage Integration**: Seamless file upload and management with Supabase Storage

### Advanced Features

- **Multi-Property Support**: Owners can manage multiple properties
- **Geographic Data**: Property location coordinates for mapping
- **Flexible Payment Types**: Rent, deposits, utilities, penalties, and custom payments
- **Maintenance Categories**: Organized system for different types of maintenance
- **Announcement System**: Targeted communication to specific user groups
- **System Settings**: Configurable application settings through admin interface

## 📞 Getting Help

If you're still having issues:

1. **Check Supabase Logs**

   - Go to **Logs** in your Supabase dashboard
   - Look for any error messages

2. **Verify Environment Variables**

   - Double-check your `.env.local` file
   - Make sure the URLs and keys are correct

3. **Test Database Connection**
   - Try a simple query in SQL Editor: `SELECT * FROM users LIMIT 1;`
   - This will confirm the table exists

## 🔄 Reset Database (If Needed)

If you need to start fresh:

1. **Drop all tables** (in SQL Editor):

   ```sql
   DROP TABLE IF EXISTS tenants CASCADE;
   DROP TABLE IF EXISTS properties CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   DROP TYPE IF EXISTS user_role CASCADE;
   DROP TYPE IF EXISTS property_type CASCADE;
   DROP TYPE IF EXISTS property_status CASCADE;
   DROP TYPE IF EXISTS tenant_status CASCADE;
   ```

2. **Re-run the fixed setup script**:
   - Copy and paste `scripts/create-tables-fixed.sql`
   - Click **Run**

## ✅ Success Indicators

After following these steps, you should see:

- ✅ No "Database error saving new user" errors
- ✅ Registration form submits successfully
- ✅ Success message appears after registration
- ✅ Email verification email is sent
- ✅ User can log in after email verification

---

**Need more help?** Check the main README.md for additional troubleshooting steps.

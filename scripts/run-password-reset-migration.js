const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting password reset tokens migration...');

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      '..',
      'migrations',
      '009_create_password_reset_tokens.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing migration SQL...');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Password reset tokens migration completed successfully!');
    console.log('📋 Created:');
    console.log('   - password_reset_tokens table');
    console.log('   - Indexes for performance');
    console.log('   - RLS policies for security');
    console.log('   - Cleanup function for expired tokens');
    console.log('   - Updated_at trigger');
  } catch (error) {
    console.error('💥 Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();



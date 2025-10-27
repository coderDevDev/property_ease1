const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running migration 008: Fix function overloading...');

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      'migrations',
      '008_fix_function_overloading.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
    console.log('📋 Functions created:');
    console.log(
      '  - is_unit_available(UUID, TEXT, UUID) - Main function with application exclusion'
    );
    console.log(
      '  - is_unit_available_simple(UUID, TEXT) - Simplified function for basic checks'
    );
    console.log(
      '  - get_available_unit_numbers(UUID) - Get available unit numbers for a property'
    );
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Alternative method if exec_sql doesn't exist
async function runMigrationAlternative() {
  try {
    console.log(
      '🚀 Running migration 008: Fix function overloading (alternative method)...'
    );

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      'migrations',
      '008_fix_function_overloading.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec', { sql: statement });
        if (error) {
          console.error('❌ Statement failed:', error);
          console.error('Statement:', statement);
          process.exit(1);
        }
      }
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Try the main method first, fallback to alternative
runMigration().catch(() => {
  console.log('Trying alternative method...');
  runMigrationAlternative();
});

# Database Migrations

This directory contains SQL migration scripts for the PropertyEase database.

## Migration 008: Fix Function Overloading

### Problem

The database had two functions with the same name `is_unit_available` but different signatures:

- `is_unit_available(UUID, TEXT)` - 2 parameters
- `is_unit_available(UUID, TEXT, UUID)` - 3 parameters

PostgreSQL couldn't resolve which function to use when called with 2 parameters, causing the error:

```
Could not choose the best candidate function between:
public.is_unit_available(p_property_id => uuid, p_unit_number => text),
public.is_unit_available(p_property_id => uuid, p_unit_number => text, p_application_id => uuid)
```

### Solution

This migration:

1. **Drops** the conflicting functions
2. **Creates** a unified function with proper parameter handling
3. **Creates** a simplified function for backward compatibility
4. **Grants** proper permissions

### How to Run

#### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `008_fix_function_overloading_simple.sql`
4. Click **Run**

#### Option 2: Command Line

```bash
# Make sure you have the required environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the migration script
node scripts/run_migration.js
```

### Functions Created

#### `is_unit_available(UUID, TEXT, UUID)`

- **Purpose**: Check if a unit is available, excluding a specific application
- **Parameters**:
  - `p_property_id`: Property UUID
  - `p_unit_number`: Unit number as text
  - `p_application_id`: Application UUID to exclude (optional)
- **Returns**: Boolean (true if available)

#### `is_unit_available_simple(UUID, TEXT)`

- **Purpose**: Simple check if a unit is available
- **Parameters**:
  - `p_property_id`: Property UUID
  - `p_unit_number`: Unit number as text
- **Returns**: Boolean (true if available)

### Testing

After running the migration, you can test the functions:

```sql
-- Test simple function
SELECT public.is_unit_available_simple('your-property-id', '1');

-- Test full function
SELECT public.is_unit_available('your-property-id', '1', NULL);
```

### Code Changes

The application code has been updated to use `is_unit_available_simple` to avoid any future conflicts.

### Rollback

If you need to rollback this migration, you can run:

```sql
DROP FUNCTION IF EXISTS public.is_unit_available(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.is_unit_available_simple(UUID, TEXT);
```

Then restore the original functions from migrations 005 and 007.

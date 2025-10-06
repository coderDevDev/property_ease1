import { supabase } from './supabase';

/**
 * Utility function to handle PGRST116 error (multiple rows) when using .single()
 * @param query - The Supabase query builder
 * @param fallbackQuery - The fallback query to get multiple rows and take the first one
 * @returns Promise with data and error
 */
export async function handleSingleQuery<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  fallbackQuery: () => Promise<{ data: T[] | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await query();

    if (result.error && result.error.code === 'PGRST116') {
      // Multiple rows found, get the first one
      const fallbackResult = await fallbackQuery();
      if (fallbackResult.error) {
        return { data: null, error: fallbackResult.error };
      }
      if (!fallbackResult.data || fallbackResult.data.length === 0) {
        return { data: null, error: null };
      }
      return { data: fallbackResult.data[0], error: null };
    }

    return result;
  } catch (error) {
    // If it's a PGRST116 error, try the fallback
    if (error && (error as any).code === 'PGRST116') {
      const fallbackResult = await fallbackQuery();
      if (fallbackResult.error) {
        return { data: null, error: fallbackResult.error };
      }
      if (!fallbackResult.data || fallbackResult.data.length === 0) {
        return { data: null, error: null };
      }
      return { data: fallbackResult.data[0], error: null };
    }

    return { data: null, error };
  }
}

/**
 * Helper function to safely execute a single query with PGRST116 error handling
 * @param table - The table name
 * @param select - The select query
 * @param filters - The filter conditions
 * @returns Promise with data and error
 */
export async function safeSingleQuery<T>(
  table: string,
  select: string,
  filters: Record<string, any>
): Promise<{ data: T | null; error: any }> {
  return handleSingleQuery(
    () => supabase.from(table).select(select).match(filters).single(),
    () => supabase.from(table).select(select).match(filters).limit(1)
  );
}


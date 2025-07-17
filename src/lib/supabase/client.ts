import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Create a Supabase client for use in browser/client components
 * Uses the modern @supabase/ssr package with publishable key pattern
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
  )
}

/**
 * Singleton browser client instance
 * Use this for client-side operations
 */
export const supabase = createClient()

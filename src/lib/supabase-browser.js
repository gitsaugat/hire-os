import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client safe for use in browser/client components.
 * Uses @supabase/ssr which handles cookie-based session management automatically.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  )
}

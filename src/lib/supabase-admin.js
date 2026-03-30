import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin client using the service role key.
 * USE ONLY IN SERVER-SIDE CODE (Server Actions, Route Handlers).
 *
 * The service role key bypasses RLS — never expose it to the browser.
 * Set SUPABASE_SERVICE_ROLE_KEY in .env.local (no NEXT_PUBLIC_ prefix).
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = (supabaseUrl && serviceRoleKey) 
  ? createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null


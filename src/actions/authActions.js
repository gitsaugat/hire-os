'use server'

import { createSupabaseServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

/**
 * Signs the current user out and redirects to /login.
 */
export async function signOutAction() {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

import { supabase } from './supabase'

/**
 * Fetch all OPEN roles.
 * @returns {{ data: Role[] | null, error: Error | null }}
 */
export async function getRoles() {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('status', 'OPEN')
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Fetch a single role by ID.
 * @param {string} id
 * @returns {{ data: Role | null, error: Error | null }}
 */
export async function getRoleById(id) {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .single()

  return { data, error }
}

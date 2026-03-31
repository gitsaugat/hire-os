import { supabase } from './supabase'

/**
 * Fetch confirmed interview slots with candidate and role details.
 * 
 * @param {{ roleId?: string, date?: string }} filters
 * @returns {{ data: object[] | null, error: Error | null }}
 */
export async function getConfirmedInterviews(filters = {}) {
  let query = supabase
    .from('slots')
    .select(`
      *,
      candidate:candidates(
        id,
        name,
        email,
        role:roles(id, title, team)
      )
    `)
    .eq('status', 'CONFIRMED')
    .order('start_time', { ascending: true })

  // Filter by role (via nested candidate)
  if (filters.roleId) {
    query = query.filter('candidate.role_id', 'eq', filters.roleId)
  }

  // Filter by date (approximate for the full day)
  if (filters.date) {
    const startOfDay = `${filters.date}T00:00:00Z`
    const endOfDay = `${filters.date}T23:59:59Z`
    query = query.gte('start_time', startOfDay).lte('start_time', endOfDay)
  }

  const { data, error } = await query
  return { data, error }
}

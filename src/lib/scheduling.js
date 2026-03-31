import { supabase } from './supabase'

/**
 * Fetch confirmed interview slots with candidate and role details.
 * 
 * @param {{ roleId?: string, date?: string }} filters
 * @returns {{ data: object[] | null, error: Error | null }}
 */
export async function getConfirmedInterviews(filters = {}) {
  let query = supabase
    .from('interviews')
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

  // Filter by date (approximate for the full day)
  if (filters.date) {
    const startOfDay = `${filters.date}T00:00:00Z`
    const endOfDay = `${filters.date}T23:59:59Z`
    query = query.gte('start_time', startOfDay).lte('start_time', endOfDay)
  }

  const { data, error } = await query

  // Manual filter for roleId if needed (Supabase can't always filter by nested relation role_id easily depending on schema)
  let filteredData = data
  if (filters.roleId && data) {
    filteredData = data.filter(i => i.candidate?.role_id === filters.roleId || i.candidate?.role?.id === filters.roleId)
  }

  return { data: filteredData, error }
}

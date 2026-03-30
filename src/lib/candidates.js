import { supabase } from './supabase'

/**
 * Create a new candidate and log the initial APPLIED status in status_history.
 * Rejects duplicates (same email + role_id) at the DB level (unique constraint).
 *
 * @param {{
 *   name: string,
 *   email: string,
 *   linkedin_url?: string,
 *   github_url?: string,
 *   resume_url?: string,
 *   role_id: string,
 * }} candidateData
 * @returns {{ data: object | null, error: Error | null }}
 */
export async function createCandidate(candidateData) {
  // Insert the candidate record
  const { data: candidate, error: insertError } = await supabase
    .from('candidates')
    .insert({
      name: candidateData.name,
      email: candidateData.email,
      linkedin_url: candidateData.linkedin_url || null,
      github_url: candidateData.github_url || null,
      resume_url: candidateData.resume_url || null,
      role_id: candidateData.role_id,
      status: 'APPLIED',
    })
    .select()
    .single()

  if (insertError) {
    // Unique violation → duplicate application
    if (insertError.code === '23505') {
      return {
        data: null,
        error: new Error('You have already applied for this role with this email address.'),
      }
    }
    return { data: null, error: insertError }
  }

  // Log the initial status history entry
  const { error: historyError } = await supabase.from('status_history').insert({
    candidate_id: candidate.id,
    from_status: null,
    to_status: 'APPLIED',
    changed_by: 'HUMAN',
    reason: 'Application submitted',
  })

  if (historyError) {
    console.error('Failed to log status history for new candidate:', historyError)
    // Non-fatal — candidate was created; log the error but don't fail the request
  }

  return { data: candidate, error: null }
}

/**
 * Transition a candidate to a new status and log the change in status_history.
 *
 * @param {string} candidateId
 * @param {string} newStatus  - One of the CANDIDATE_STATUSES values
 * @param {string} [reason]   - Optional human-readable reason
 * @param {'AI'|'HUMAN'} [changedBy='HUMAN']
 * @returns {{ data: object | null, error: Error | null }}
 */
export async function updateCandidateStatus(
  candidateId,
  newStatus,
  reason = '',
  changedBy = 'HUMAN'
) {
  // Fetch current status first so we can record the transition
  const { data: current, error: fetchError } = await supabase
    .from('candidates')
    .select('status')
    .eq('id', candidateId)
    .single()

  if (fetchError) return { data: null, error: fetchError }

  const fromStatus = current.status

  // Update the candidate
  const { data: updated, error: updateError } = await supabase
    .from('candidates')
    .update({ status: newStatus })
    .eq('id', candidateId)
    .select()
    .single()

  if (updateError) return { data: null, error: updateError }

  // Insert status_history row
  const { error: historyError } = await supabase.from('status_history').insert({
    candidate_id: candidateId,
    from_status: fromStatus,
    to_status: newStatus,
    changed_by: changedBy,
    reason: reason || null,
  })

  if (historyError) {
    console.error('Failed to log status history:', historyError)
  }

  return { data: updated, error: null }
}

/**
 * Fetch a single candidate by ID, joined with role info and status history.
 *
 * @param {string} id
 */
export async function getCandidateById(id) {
  const { data: candidate, error } = await supabase
    .from('candidates')
    .select(`*, role:roles(*), status_history(*), ai_profile:candidate_ai_profiles(*)`)
    .eq('id', id)
    .single()


  if (error) return { data: null, error }

  // Sort status_history ascending by created_at
  if (candidate.status_history) {
    candidate.status_history.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    )
  }

  return { data: candidate, error: null }
}

/**
 * Fetch a paginated list of candidates with optional filters.
 *
 * @param {{ roleId?: string, status?: string }} [filters]
 * @returns {{ data: object[] | null, error: Error | null }}
 */
export async function getCandidates(filters = {}) {
  let query = supabase
    .from('candidates')
    .select(`*, role:roles(id, title, team)`)
    .order('created_at', { ascending: false })

  if (filters.roleId) {
    query = query.eq('role_id', filters.roleId)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query
  return { data, error }
}

/**
 * Delete a candidate by ID.
 * Used for rollback when resume upload fails after the record was created.
 *
 * @param {string} candidateId
 * @returns {{ error: Error | null }}
 */
export async function deleteCandidateById(candidateId) {
  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', candidateId)

  if (error) {
    console.error('[deleteCandidateById] Rollback failed:', error)
  }

  return { error }
}


import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'

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

  // --- Automated Cleanup Logic ---
  const isInterviewExit = fromStatus === 'INTERVIEW_SCHEDULED' && newStatus !== 'INTERVIEW_SCHEDULED'
  const isShortlistExit = (fromStatus === 'SHORTLISTED' || fromStatus === 'INTERVIEW_SCHEDULING') && 
                          (newStatus !== 'SHORTLISTED' && newStatus !== 'INTERVIEW_SCHEDULING' && newStatus !== 'INTERVIEW_SCHEDULED')

  if (isInterviewExit) {
    console.log(`[Cleanup] Candidate ${candidateId} leaving INTERVIEW_SCHEDULED. Deleting meetings.`)
    const { data: interview } = await supabaseAdmin.from('interviews').select('*').eq('candidate_id', candidateId).maybeSingle()
    if (interview) {
      await supabaseAdmin.from('interviews').delete().eq('id', interview.id)
      // Non-blocking calendar cancellation
      import('./google-calendar').then(gc => {
        gc.cancelCalendarEvent(interview.interviewer_email, interview.start_time, interview.end_time)
          .catch(err => console.error('[Cleanup] Calendar cancel failed:', err))
      })
    }
  }

  if (isInterviewExit || isShortlistExit) {
    console.log(`[Cleanup] Clearing temporary holds for candidate: ${candidateId}`)
    await supabaseAdmin.from('temporary_holds').delete().eq('candidate_id', candidateId)
  }

  return { data: updated, error: null }
}

/**
 * Fetch a single candidate by ID, joined with role info and status history.
 *
 * @param {string} id
 */
export async function getCandidateById(id, useAdmin = false) {
  const client = (useAdmin && supabaseAdmin) ? supabaseAdmin : supabase
  const { data: candidate, error } = await client
    .from('candidates')
    .select(`*, role:roles(*), status_history(*), ai_profile:candidate_ai_profiles(*), research_profile:candidate_research_profiles(*)`)
    .eq('id', id)
    .single()

  console.log(`[getCandidateById] Fetching ID: ${id}`)
  if (candidate) {
    console.log(`[getCandidateById] Raw ai_profile type: ${typeof candidate.ai_profile}, isArray: ${Array.isArray(candidate.ai_profile)}`)
    if (candidate.ai_profile) console.log(`[getCandidateById] ai_profile content:`, JSON.stringify(candidate.ai_profile).substring(0, 100))
  }

  if (error) return { data: null, error }

  // Supabase returns relations as arrays; normalize for the frontend
  if (candidate.ai_profile && Array.isArray(candidate.ai_profile)) {
    candidate.ai_profile = candidate.ai_profile[0] || null
  }
  if (candidate.research_profile && Array.isArray(candidate.research_profile)) {
    candidate.research_profile = candidate.research_profile[0] || null
  }

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
 * Fetch scheduling data associated with a specific candidate (Confirmed Interviews & Active Holds).
 *
 * @param {string} candidateId
 */
export async function getSchedulingDataByCandidateId(candidateId) {
  const [
    { data: interviews, error: interviewError },
    { data: holds, error: holdError }
  ] = await Promise.all([
    supabaseAdmin
      .from('interviews')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('start_time', { ascending: true }),
    supabaseAdmin
      .from('temporary_holds')
      .select('*')
      .eq('candidate_id', candidateId)
      .gt('expires_at', new Date().toISOString())
      .order('start_time', { ascending: true })
  ])

  if (interviewError || holdError) {
    return { error: interviewError || holdError }
  }

  return { 
    data: {
      interviews: interviews || [],
      holds: holds || []
    } 
  }
}

/**
 * Delete a candidate by ID.
 * Cascades or explicitly deletes related interviews, holds, and cancels calendar events.
 *
 * @param {string} candidateId
 * @returns {{ error: Error | null }}
 */
export async function deleteCandidateById(candidateId) {
  console.log(`[deleteCandidateById] Triggered for candidate: ${candidateId}`)
  
  // 1. Check for confirmed interviews to cancel calendar events
  const { data: interview } = await supabaseAdmin
    .from('interviews')
    .select('*')
    .eq('candidate_id', candidateId)
    .maybeSingle()
    
  if (interview) {
    console.log(`[deleteCandidateById] Canceling calendar event for interview...`)
    import('./google-calendar').then(gc => {
      gc.cancelCalendarEvent(interview.interviewer_email, interview.start_time, interview.end_time)
        .catch(err => console.error('[deleteCandidateById] Calendar cancel failed:', err))
    })
    await supabaseAdmin.from('interviews').delete().eq('id', interview.id)
  }

  // 2. Clear temporary holds
  await supabaseAdmin.from('temporary_holds').delete().eq('candidate_id', candidateId)

  // 3. Delete candidate record
  const { error } = await supabase
    .from('candidates')
    .delete()
    .eq('id', candidateId)

  if (error) {
    console.error('[deleteCandidateById] Deletion failed:', error)
  } else {
    console.log(`[deleteCandidateById] Successfully deleted candidate: ${candidateId}`)
  }

  return { error }
}


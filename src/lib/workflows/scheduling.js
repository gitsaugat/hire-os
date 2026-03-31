import { supabaseAdmin } from '../supabase-admin'
import { getBusyTimes } from '../google-calendar'
import { updateCandidateStatus } from '../candidates'
import { sendSchedulingEmail, sendConfirmationEmail } from '../email'

const SLOT_DURATION_MINS = 45
const WORKING_HOURS_START = 9
const WORKING_HOURS_END = 17 // 5 PM
const DEFAULT_INTERVIEWER = 'developer.saugatsiwakoti@gmail.com'

/**
 * Get cached busy times for an interviewer, refreshing if > 24h old.
 */
export async function getCachedBusyTimes(email, forceRefresh = false) {
  const { data: cache } = await supabaseAdmin
    .from('calendar_cache')
    .select('*')
    .eq('interviewer_email', email)
    .maybeSingle()

  const oneDayAgo = new Date()
  oneDayAgo.setHours(oneDayAgo.getHours() - 24)

  if (!forceRefresh && cache && new Date(cache.last_fetched_at) > oneDayAgo) {
    console.log(`[Scheduling] Using cached calendar for ${email}`)
    return cache.busy_blocks.map(b => ({ start: new Date(b.start), end: new Date(b.end) }))
  }

  console.log(`[Scheduling] Cache stales or forced. Fetching Google Calendar for ${email}`)
  const timeMin = new Date()
  timeMin.setHours(0, 0, 0, 0)
  const timeMax = new Date(timeMin)
  timeMax.setDate(timeMin.getDate() + 14) // Cache 2 weeks of availability

  const busyTimes = await getBusyTimes(email, timeMin, timeMax)
  
  await supabaseAdmin
    .from('calendar_cache')
    .upsert({
      interviewer_email: email,
      busy_blocks: busyTimes,
      last_fetched_at: new Date().toISOString()
    })

  return busyTimes
}

/**
 * Clean up expired temporary holds.
 */
async function cleanupHolds() {
  const { error } = await supabaseAdmin
    .from('temporary_holds')
    .delete()
    .lt('expires_at', new Date().toISOString())
  if (error) console.error('[Scheduling] Hold cleanup failed:', error.message)
}

/**
 * Fetch availability gaps for a candidate.
 */
export async function getAvailability(candidateId) {
  // 0. Check if already has confirmed interview
  const { data: existing } = await supabaseAdmin
    .from('interviews')
    .select('id')
    .eq('candidate_id', candidateId)
    .eq('status', 'CONFIRMED')
    .maybeSingle()
  
  if (existing) {
    console.log(`[Scheduling] Candidate ${candidateId} already has an interview. Returning no gaps.`)
    return []
  }

  await cleanupHolds()
  console.log(`[Scheduling] Computing gaps for candidate: ${candidateId}`)

  // 1. Fetch External Busy (Google Cache)
  const googleBusy = await getCachedBusyTimes(DEFAULT_INTERVIEWER)

  // 2. Fetch Internal Busy (Confirmed Interviews)
  const { data: interviews } = await supabaseAdmin
    .from('interviews')
    .select('start_time, end_time')
    .eq('interviewer_email', DEFAULT_INTERVIEWER)
    .gte('end_time', new Date().toISOString())

  // 3. Fetch Internal Busy (Other active holds)
  const { data: otherHolds } = await supabaseAdmin
    .from('temporary_holds')
    .select('start_time, end_time')
    .eq('interviewer_email', DEFAULT_INTERVIEWER)
    .neq('candidate_id', candidateId) // Ignore current candidate's holds

  // Combine all busy blocks
  const allBusy = [
    ...googleBusy,
    ...(interviews || []).map(i => ({ start: new Date(i.start_time), end: new Date(i.end_time) })),
    ...(otherHolds || []).map(h => ({ start: new Date(h.start_time), end: new Date(h.end_time) }))
  ]

  console.log(`[Scheduling] Total busy blocks found: ${allBusy.length} (Google: ${googleBusy.length}, Interviews: ${interviews?.length}, Holds: ${otherHolds?.length})`)

  // 4. Compute Gaps (Next 5 business days, 9-5)
  const options = []
  const timeMin = new Date()
  timeMin.setDate(timeMin.getDate() + 1)
  timeMin.setHours(0, 0, 0, 0)
  const timeMax = new Date(timeMin)
  timeMax.setDate(timeMin.getDate() + 5)

  const currentDay = new Date(timeMin)
  while (currentDay <= timeMax && options.length < 5) {
    if (currentDay.getDay() !== 0 && currentDay.getDay() !== 6) {
      let slotTime = new Date(currentDay)
      slotTime.setHours(WORKING_HOURS_START, 0, 0, 0)
      const dayEnd = new Date(currentDay)
      dayEnd.setHours(WORKING_HOURS_END, 0, 0, 0)

      while (slotTime < dayEnd && options.length < 5) {
        const start = new Date(slotTime)
        const end = new Date(start)
        end.setMinutes(start.getMinutes() + SLOT_DURATION_MINS)
        if (end > dayEnd) break
        
        const isBusy = allBusy.some(busy => (start < busy.end && end > busy.start))
        if (!isBusy) {
          options.push({ start: start.toISOString(), end: end.toISOString() })
        }
        slotTime.setMinutes(slotTime.getMinutes() + SLOT_DURATION_MINS)
      }
    }
    currentDay.setDate(currentDay.getDate() + 1)
  }

  // 5. Create holds for this candidate (expires in 48h)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)

  if (options.length > 0) {
    console.log(`[Scheduling] Inserting ${options.length} holds for ${candidateId}`)
    // Delete old holds for this candidate first
    await supabaseAdmin
      .from('temporary_holds')
      .delete()
      .eq('candidate_id', candidateId)

    const { error: insertError } = await supabaseAdmin
      .from('temporary_holds')
      .insert(options.map(opt => ({
        candidate_id: candidateId,
        interviewer_email: DEFAULT_INTERVIEWER,
        start_time: opt.start,
        end_time: opt.end,
        expires_at: expiresAt.toISOString()
      })))
    
    if (insertError) {
      console.error(`[Scheduling] FAILED to insert holds for ${candidateId}:`, insertError.message)
    } else {
      console.log(`[Scheduling] Successfully inserted holds for ${candidateId}`)
    }
  } else {
    console.warn(`[Scheduling] NO available options found for ${candidateId}`)
  }

  return options
}

/**
 * Handle initial scheduling for a shortlisted candidate.
 */
export async function initiateScheduling(candidateId) {
  console.log(`[Scheduling] Initiating flow for candidate: ${candidateId}`)
  
  // 1. Ensure token
  const { data: candidate } = await supabaseAdmin
    .from('candidates')
    .select('email, scheduling_token')
    .eq('id', candidateId)
    .single()

  let token = candidate?.scheduling_token
  if (!token) {
    token = crypto.randomUUID()
    await supabaseAdmin.from('candidates').update({ scheduling_token: token }).eq('id', candidateId)
  }

  // 2. Trigger invite email (availability computed on page load)
  await sendSchedulingEmail(candidate.email, token)
  return { success: true }
}

/**
 * Confirm booking (with Outcome A/B).
 */
export async function confirmBooking(candidateId, startTime, endTime) {
  console.log(`[Scheduling] Attempting booking for ${candidateId} at ${startTime}`)

  // 1. Check if hold still valid
  const { data: hold } = await supabaseAdmin
    .from('temporary_holds')
    .select('*')
    .eq('candidate_id', candidateId)
    .eq('start_time', startTime)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (!hold) {
    console.log('[Scheduling] No active hold found. Refreshing availability.')
    const newSlots = await getAvailability(candidateId)
    return { conflict: true, message: 'Your session expired. Please pick a new time.', new_slots: newSlots }
  }

  // 2. Prevent Duplicate Interview for same Candidate
  const { data: existingInterview, error: existingError } = await supabaseAdmin
    .from('interviews')
    .select('id, start_time')
    .eq('candidate_id', candidateId)
    .eq('status', 'CONFIRMED')
    .maybeSingle()

  if (existingInterview) {
    console.warn(`[Scheduling] Candidate ${candidateId} already has an interview scheduled for ${existingInterview.start_time}`)
    return { conflict: true, message: 'You already have an interview scheduled. Please contact support to reschedule.', confirmed: false }
  }

  // 3. Final Overlap Check (Interviews + Other Active Holds)
  // Standard overlap: (start_time < requested_end) AND (end_time > requested_start)
  const { data: overlaps, error: overlapError } = await supabaseAdmin
    .from('interviews')
    .select('id')
    .eq('interviewer_email', DEFAULT_INTERVIEWER)
    .lt('start_time', endTime)
    .gt('end_time', startTime)
    .maybeSingle()

  const { data: overlapHold, error: holdError } = await supabaseAdmin
    .from('temporary_holds')
    .select('id')
    .eq('interviewer_email', DEFAULT_INTERVIEWER)
    .neq('candidate_id', candidateId)
    .lt('start_time', endTime)
    .gt('end_time', startTime)
    .maybeSingle()

  if (overlaps || overlapHold) {
     console.warn('[Scheduling] CONFLICT DETECTED at confirmation. Slot already taken.')
     // Forced cache refresh on conflict to be safe
     await getCachedBusyTimes(DEFAULT_INTERVIEWER, true)
     const newSlots = await getAvailability(candidateId)
     return { conflict: true, message: 'That slot was just taken. Here are updated options:', new_slots: newSlots }
  }

  // ── Success (Booking) ──
  const { data: candidateInfo } = await supabaseAdmin.from('candidates').select('name, email').eq('id', candidateId).single()

  // 1. Insert Interview
  const { error: interviewError } = await supabaseAdmin
    .from('interviews')
    .insert({
      candidate_id: candidateId,
      interviewer_email: DEFAULT_INTERVIEWER,
      start_time: startTime,
      end_time: endTime,
      status: 'CONFIRMED'
    })

  if (interviewError) throw interviewError

  // 2. Cleanup all holds for this candidate
  await supabaseAdmin.from('temporary_holds').delete().eq('candidate_id', candidateId)

  // 3. Update candidate status
  await updateCandidateStatus(
    candidateId,
    'INTERVIEW_SCHEDULED',
    `Interview confirmed for ${new Date(startTime).toLocaleString()}`,
    'AI'
  )

  // 4. Synchronization (Google Calendar + Email) - Non-blocking
  import('../google-calendar').then(gc => {
    gc.createCalendarEvent(candidateInfo, { start_time: startTime, end_time: endTime, email: DEFAULT_INTERVIEWER })
      .catch(err => console.error('[Scheduling] Google Calendar sync failed:', err))
  })

  if (candidateInfo) {
    sendConfirmationEmail(candidateInfo.email, startTime)
      .catch(err => console.error('[Scheduling] Confirmation email failed:', err))
  }

  return { confirmed: true }
}

/**
 * Resolve candidate from token.
 */
export async function resolveCandidateByToken(token) {
  const { data, error } = await supabaseAdmin
    .from('candidates')
    .select('id, email, name')
    .eq('scheduling_token', token)
    .single()
  
  if (error || !data) return null
  return data
}

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
export async function getAvailability(candidateId, ignoreOverrides = false) {
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

  // 0.5 Check for HR Overrides first
  if (!ignoreOverrides) {
    const { data: request } = await supabaseAdmin
      .from('scheduling_requests')
      .select('offered_slots')
      .eq('candidate_id', candidateId)
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      
    if (request && request.offered_slots && request.offered_slots.length > 0) {
      console.log(`[Scheduling] HR Override found. Serving locked slots for ${candidateId}`)
      const options = request.offered_slots
      
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 48)
      
      await supabaseAdmin.from('temporary_holds').delete().eq('candidate_id', candidateId)
      
      await supabaseAdmin.from('temporary_holds').insert(options.map(opt => ({
        candidate_id: candidateId,
        interviewer_email: DEFAULT_INTERVIEWER,
        start_time: opt.start,
        end_time: opt.end,
        expires_at: expiresAt.toISOString()
      })))
      
      return options
    }
  }

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
  const allOptions = []
  const timeMin = new Date()
  timeMin.setDate(timeMin.getDate() + 1)
  timeMin.setHours(0, 0, 0, 0)
  const timeMax = new Date(timeMin)
  timeMax.setDate(timeMin.getDate() + 5)

  const currentDay = new Date(timeMin)
  while (currentDay <= timeMax) {
    if (currentDay.getDay() !== 0 && currentDay.getDay() !== 6) {
      let slotTime = new Date(currentDay)
      slotTime.setHours(WORKING_HOURS_START, 0, 0, 0)
      const dayEnd = new Date(currentDay)
      dayEnd.setHours(WORKING_HOURS_END, 0, 0, 0)

      while (slotTime < dayEnd) {
        const start = new Date(slotTime)
        const end = new Date(start)
        end.setMinutes(start.getMinutes() + SLOT_DURATION_MINS)
        if (end > dayEnd) break
        
        const isBusy = allBusy.some(busy => (start < busy.end && end > busy.start))
        if (!isBusy) {
          allOptions.push({ start: start.toISOString(), end: end.toISOString() })
        }
        slotTime.setMinutes(slotTime.getMinutes() + SLOT_DURATION_MINS)
      }
    }
    currentDay.setDate(currentDay.getDate() + 1)
  }

  // 4.5 Spread Slots Across Different Dates
  const options = []
  const slotsByDay = {}
  for (const opt of allOptions) {
    const dayKey = opt.start.split('T')[0]
    if (!slotsByDay[dayKey]) slotsByDay[dayKey] = []
    slotsByDay[dayKey].push(opt)
  }

  let added = true
  let index = 0
  // Pick progressively from each day (Round-Robin layout) to maximize variety
  while (options.length < 5 && added) {
    added = false
    for (const day of Object.keys(slotsByDay)) {
      if (options.length >= 5) break
      if (slotsByDay[day].length > index) {
        options.push(slotsByDay[day][index])
        added = true
      }
    }
    index++
  }

  // Sort them chronologically so they appear logical to the user
  options.sort((a, b) => new Date(a.start) - new Date(b.start))

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
    .select('*, role:roles(*)')
    .eq('id', candidateId)
    .single()

  let token = candidate?.scheduling_token
  if (!token) {
    token = crypto.randomUUID()
    await supabaseAdmin.from('candidates').update({ scheduling_token: token }).eq('id', candidateId)
  }

  // 2. Trigger invite email (availability computed on page load)
  await sendSchedulingEmail(candidate, token, candidate.role)
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
  const { data: candidateInfo } = await supabaseAdmin
    .from('candidates')
    .select('*, role:roles(*)')
    .eq('id', candidateId)
    .single()

  // 1. Insert Interview
  const { data: newInterview, error: interviewError } = await supabaseAdmin
    .from('interviews')
    .insert({
      candidate_id: candidateId,
      interviewer_email: DEFAULT_INTERVIEWER,
      start_time: startTime,
      end_time: endTime,
      status: 'CONFIRMED'
    })
    .select('id')
    .single()

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

  if (candidateInfo && newInterview) {
    sendConfirmationEmail(candidateInfo, startTime, candidateInfo.role, newInterview.id)
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
    .select('id, email, name, status')
    .eq('scheduling_token', token)
    .single()
  
  if (error || !data) return null
  return data
}

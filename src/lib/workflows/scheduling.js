import { supabaseAdmin } from '../supabase-admin'
import { getBusyTimes } from '../google-calendar'
import { updateCandidateStatus } from '../candidates'

const SLOT_DURATION_MINS = 45
const WORKING_HOURS_START = 9
const WORKING_HOURS_END = 17 // 5 PM
const DEFAULT_INTERVIEWER = 'developer.saugatsiwakoti@gmail.com'

/**
 * Generate interview slots for a shortlisted candidate.
 * 1. Fetch busy times from Google Calendar
 * 2. Compute available 45-min windows (9-5, weekdays)
 * 3. Save as AVAILABLE slots
 * 4. HOLD 5 slots for this candidate
 */
export async function generateSlots(candidateId) {
  await cleanupExpiredSlots()
  console.log(`[Scheduling] Generating slots for candidate: ${candidateId}`)

  // 1. Define window: Tomorrow to 5 days from now
  const now = new Date()
  const timeMin = new Date(now)
  timeMin.setDate(now.getDate() + 1)
  timeMin.setHours(0, 0, 0, 0)

  const timeMax = new Date(timeMin)
  timeMax.setDate(timeMin.getDate() + 5)
  timeMax.setHours(23, 59, 59, 999)

  // 2. Fetch busy times
  const busyTimes = await getBusyTimes(DEFAULT_INTERVIEWER, timeMin, timeMax)

  // 3. Generate candidate slots
  const potentialSlots = []
  const currentDay = new Date(timeMin)

  while (currentDay <= timeMax) {
    const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6

    if (!isWeekend) {
      // Start at 9 AM
      let slotTime = new Date(currentDay)
      slotTime.setHours(WORKING_HOURS_START, 0, 0, 0)

      // End at 5 PM
      const dayEnd = new Date(currentDay)
      dayEnd.setHours(WORKING_HOURS_END, 0, 0, 0)

      while (slotTime < dayEnd) {
        const start = new Date(slotTime)
        const end = new Date(start)
        end.setMinutes(start.getMinutes() + SLOT_DURATION_MINS)

        if (end > dayEnd) break

        // Check if this slot overlaps with any busy time from Google
        const isBusy = busyTimes.some(busy => {
          return (start < busy.end && end > busy.start)
        })

        if (!isBusy) {
          potentialSlots.push({
            interviewer_email: DEFAULT_INTERVIEWER,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            status: 'AVAILABLE'
          })
        }

        // Increment by slot duration (45 mins)
        slotTime.setMinutes(slotTime.getMinutes() + SLOT_DURATION_MINS)
        
        if (potentialSlots.length >= 20) break 
      }
    }
    currentDay.setDate(currentDay.getDate() + 1)
    if (potentialSlots.length >= 20) break
  }

  if (potentialSlots.length === 0) {
    console.warn('[Scheduling] No available slots found in the next 5 days.')
    return
  }

  // 4. Insert AVAILABLE slots 
  // We use a custom approach: try to insert each one, ignore if it already exists
  console.log(`[Scheduling] Attempting to ensure ${potentialSlots.length} available slots exist...`)
  
  const insertedSlots = []
  for (const slot of potentialSlots.slice(0, 15)) {
    const { data: existing } = await supabaseAdmin
      .from('slots')
      .select('id')
      .eq('interviewer_email', slot.interviewer_email)
      .eq('start_time', slot.start_time)
      .maybeSingle()

    if (existing) {
      insertedSlots.push(existing)
    } else {
      const { data: newlyInserted, error: insertError } = await supabaseAdmin
        .from('slots')
        .insert(slot)
        .select()
        .single()
      
      if (!insertError && newlyInserted) {
        insertedSlots.push(newlyInserted)
      } else if (insertError && insertError.code !== '23P01') {
        console.error('[Scheduling] Unexpected insert error:', insertError.code, insertError.message)
      }
    }
  }

  console.log(`[Scheduling] Confirmed/Created ${insertedSlots.length} total slots for pool.`)

  if (insertedSlots.length === 0) {
    console.error('[Scheduling] Could not acquire any slots for pool.')
    return
  }

  // 5. HOLD 5 slots for the candidate
  console.log(`[Scheduling] Holding 5 slots for candidate...`)
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)

  const slotsToHold = insertedSlots.slice(0, 5).map(s => s.id)

  const { error: holdError } = await supabaseAdmin
    .from('slots')
    .update({
      status: 'HELD',
      held_by_candidate_id: candidateId,
      expires_at: expiresAt.toISOString()
    })
    .in('id', slotsToHold)

  if (holdError) {
    console.error('[Scheduling] Failed to hold slots:', holdError.code, holdError.message)
  }

  console.log(`[Scheduling] Generated and held ${slotsToHold.length} slots for ${candidateId}.`)
}

/**
 * Confirm a selected slot for a candidate.
 */
export async function confirmSlot(candidateId, slotId) {
  console.log(`[Scheduling] Confirming slot ${slotId} for candidate ${candidateId}`)

  // 1. Fetch the slot and validate
  const { data: slot, error: fetchError } = await supabaseAdmin
    .from('slots')
    .select('*')
    .eq('id', slotId)
    .single()

  if (fetchError || !slot) throw new Error('Slot not found.')

  if (slot.status !== 'HELD' || slot.held_by_candidate_id !== candidateId) {
    throw new Error('Slot is no longer reserved for you.')
  }

  if (new Date(slot.expires_at) < new Date()) {
    throw new Error('Reservation has expired.')
  }

  // 2. Confirm the selected slot
  const { error: confirmError } = await supabaseAdmin
    .from('slots')
    .update({ status: 'CONFIRMED' })
    .eq('id', slotId)

  if (confirmError) throw confirmError

  // 3. Release other held slots for this candidate
  await supabaseAdmin
    .from('slots')
    .update({
      status: 'AVAILABLE',
      held_by_candidate_id: null,
      expires_at: null
    })
    .eq('held_by_candidate_id', candidateId)
    .eq('status', 'HELD')

  // 4. Update candidate status
  await updateCandidateStatus(
    candidateId,
    'INTERVIEW_SCHEDULED',
    `Interview confirmed for ${new Date(slot.start_time).toLocaleString()}`,
    'AI'
  )

  console.log(`[Scheduling] Confirmation complete for ${candidateId}.`)
  return { success: true, slot }
}

/**
 * Cleanup job: Find expired HELD slots and reset to AVAILABLE.
 */
export async function cleanupExpiredSlots() {
  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('slots')
    .update({
      status: 'AVAILABLE',
      held_by_candidate_id: null,
      expires_at: null
    })
    .eq('status', 'HELD')
    .lt('expires_at', now)

  if (error) console.error('[Scheduling] Cleanup failed:', error.message)
}

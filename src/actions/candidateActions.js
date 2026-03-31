'use server'

import { createCandidate, updateCandidateStatus, deleteCandidateById } from '@/lib/candidates'
import { validateResumeFile, uploadResume } from '@/lib/storage'
import { screenCandidate } from '@/lib/workflows/screenCandidate'
import { researchCandidate } from '@/lib/workflows/researchCandidate'
import { initiateScheduling } from '@/lib/workflows/scheduling'
import { revalidatePath } from 'next/cache'

/**
 * Server action — handles the /apply form submission.
 *
 * Flow:
 *   1. Validate inputs and file
 *   2. Create candidate record (status = APPLIED) → get candidate.id
 *   3. Upload resume to resumes/{candidate.id}/resume{ext}
 *   4. Update candidate.resume_url with the storage path
 *   5. On upload failure → delete the candidate record (rollback)
 *   6. Start AI screening in background (non-blocking)
 *
 * @param {FormData} formData
 * @returns {{ success: boolean, error?: string, candidateId?: string }}
 */
export async function applyAction(formData) {
  const name       = formData.get('name')?.trim()
  const email      = formData.get('email')?.trim()
  const linkedin   = formData.get('linkedin_url')?.trim() || null
  const github     = formData.get('github_url')?.trim() || null
  const roleId     = formData.get('role_id')
  const resumeFile = formData.get('resume')

  // ── 1. Input validation ────────────────────────────────────────
  if (!name || !email || !roleId) {
    return { success: false, error: 'Name, email, and role are required.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Invalid email address.' }
  }

  // Resume is required
  const fileError = validateResumeFile(resumeFile)
  if (fileError) {
    return { success: false, error: fileError }
  }

  // ── 2. Create candidate record (no resume_url yet) ─────────────
  const { data: candidate, error: createError } = await createCandidate({
    name,
    email,
    linkedin_url: linkedin,
    github_url: github,
    resume_url: null, // will be set after upload
    role_id: roleId,
  })

  if (createError) {
    return { success: false, error: createError.message }
  }

  // ── 3. Upload resume to resumes/{candidate.id}/resume{ext} ─────
  const { path: storagePath, error: uploadError } = await uploadResume(
    resumeFile,
    candidate.id
  )

  if (uploadError) {
    // Rollback: delete the candidate so the form can be retried cleanly
    await deleteCandidateById(candidate.id)
    return { success: false, error: uploadError }
  }

  // ── 4. Store the storage path (not a public URL) ───────────────
  const { error: updateError } = await updateCandidateResumeUrl(
    candidate.id,
    storagePath
  )

  if (updateError) {
    console.error('[applyAction] Failed to write resume_url to candidate:', updateError)
  }

  // ── 5. Trigger AI Screening (Asynchronous) ────────────────────
  // Update status to SCREENING first
  await updateCandidateStatus(candidate.id, 'SCREENING', 'AI screening started', 'AI')

  // Trigger evaluation in the background (no await)
  screenCandidate(candidate.id).catch(err => {
    console.error(`[applyAction] Async screening trigger failed for ${candidate.id}:`, err)
  })

  revalidatePath('/admin')
  return { success: true, candidateId: candidate.id }
}


/**
 * Server action — handles status update from admin candidate detail page.
 *
 * @param {FormData} formData
 * @returns {{ success: boolean, error?: string }}
 */
export async function updateStatusAction(formData) {
  const candidateId = formData.get('candidate_id')
  const newStatus   = formData.get('new_status')
  const reason      = formData.get('reason')?.trim() || ''

  if (!candidateId || !newStatus) {
    return { success: false, error: 'Missing candidate ID or status.' }
  }

  const { error } = await updateCandidateStatus(candidateId, newStatus, reason, 'HUMAN')

  if (error) {
    return { success: false, error: error.message }
  }

  // Re-screen when manually set back to SCREENING
  if (newStatus === 'SCREENING') {
    console.log(`[updateStatusAction] Manual re-screening triggered for: ${candidateId}`)
    // screenCandidate already runs researchCandidate as its final step
    screenCandidate(candidateId).catch(err =>
      console.error(`[updateStatusAction] Re-screening failed for ${candidateId}:`, err)
    )
  }

  // When a human manually shortlists (without re-screening), run research and scheduling
  if (newStatus === 'SHORTLISTED' || newStatus === 'INTERVIEW_SCHEDULING') {
    console.log(`[updateStatusAction] Manual status change to ${newStatus} — triggering research and scheduling for: ${candidateId}`)
    researchCandidate(candidateId).catch(err =>
      console.error(`[updateStatusAction] Research failed for ${candidateId}:`, err)
    )
    initiateScheduling(candidateId).catch(err =>
      console.error(`[updateStatusAction] Scheduling initiation failed for ${candidateId}:`, err)
    )
  }

  revalidatePath(`/admin/candidate/${candidateId}`)
  revalidatePath('/admin')
  return { success: true }
}

/**
 * Server action — manually regenerates interview slots for a candidate.
 *
 * @param {string} candidateId
 */
export async function regenerateSlotsAction(candidateId) {
  if (!candidateId) return { success: false, error: 'Missing candidate ID.' }

  console.log(`[regenerateSlotsAction] Manually triggering slot generation for: ${candidateId}`)
  try {
    await initiateScheduling(candidateId)
    revalidatePath(`/admin/candidate/${candidateId}`)
    return { success: true }
  } catch (err) {
    console.error(`[regenerateSlotsAction] Failed:`, err.message)
    return { success: false, error: err.message }
  }
}

/**
 * Server action — deletes a candidate and redirects to the candidates list.
 *
 * @param {string} candidateId
 */
export async function deleteCandidateAction(candidateId) {
  if (!candidateId) return { success: false, error: 'Missing candidate ID.' }

  console.log(`[deleteCandidateAction] Deleting candidate: ${candidateId}`)
  const { error } = await deleteCandidateById(candidateId)
  
  if (error) {
    return { success: false, error: error.message }
  }

  // Clear cache and redirect
  revalidatePath('/admin')
  return { success: true }
}

// ── Internal helpers ────────────────────────────────────────────────

import { supabase } from '@/lib/supabase'

async function updateCandidateResumeUrl(candidateId, resumeUrl) {
  const { error } = await supabase
    .from('candidates')
    .update({ resume_url: resumeUrl })
    .eq('id', candidateId)

  return { error }
}

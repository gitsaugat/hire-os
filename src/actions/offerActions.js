'use server'

import { createOffer, updateOfferStatus } from '@/lib/offers'
import { updateCandidateStatus } from '@/lib/candidates'
import { revalidatePath } from 'next/cache'

/**
 * Server action to create a new offer.
 */
export async function createOfferAction(formData) {
  const candidateId = formData.get('candidate_id')
  const salary = parseFloat(formData.get('salary'))
  const equity = formData.get('equity')
  const startDate = formData.get('start_date')
  const expirationDate = formData.get('expiration_date')
  const notes = formData.get('notes')

  if (!candidateId || isNaN(salary) || !startDate || !expirationDate) {
    return { success: false, error: 'Missing required offer fields.' }
  }

  const { data, error } = await createOffer({
    candidate_id: candidateId,
    salary,
    equity,
    start_date: startDate,
    expiration_date: expirationDate,
    status: 'PENDING_REVIEW',
    notes
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Update candidate status to OFFER_PENDING
  await updateCandidateStatus(candidateId, 'OFFER_PENDING', 'Offer generated and pending HR review', 'HUMAN')

  revalidatePath('/admin/offers')
  revalidatePath(`/admin/candidate/${candidateId}`)
  return { success: true, offerId: data.id }
}

/**
 * Server action to update offer status (e.g. Sent, Accepted, Declined).
 */
export async function updateOfferStatusAction(offerId, candidateId, newStatus) {
  const { error } = await updateOfferStatus(offerId, newStatus)
  
  if (error) {
    return { success: false, error: error.message }
  }

  // Map offer status to candidate status
  let candidateStatus = 'OFFER_PENDING'
  if (newStatus === 'SENT') candidateStatus = 'OFFER_SENT'
  if (newStatus === 'ACCEPTED') candidateStatus = 'OFFER_SIGNED'
  // If declined, we might keep as OFFER_SENT or move to REJECTED based on HR choice, 
  // but for now let's just keep it in sync.

  await updateCandidateStatus(candidateId, candidateStatus, `Offer marked as ${newStatus}`, 'HUMAN')

  revalidatePath('/admin/offers')
  revalidatePath(`/admin/candidate/${candidateId}`)
  return { success: true }
}

/**
 * Server action to send an onboarding email to an accepted candidate.
 */
export async function sendOnboardingEmailAction(candidateId) {
  const { supabaseAdmin } = await import('@/lib/supabase-admin')
  const { sendOnboardingEmail } = await import('@/lib/email')

  // Fetch candidate details with role and related offer status verification
  const { data: candidate, error } = await supabaseAdmin
    .from('candidates')
    .select('*, role:roles(title, team), offers!inner(status)')
    .eq('id', candidateId)
    .eq('offers.status', 'ACCEPTED')
    .single()

  if (error || !candidate) {
    return { success: false, error: 'Candidate not found or offer not accepted.' }
  }

  const { success, error: emailError } = await sendOnboardingEmail(candidate, candidate.role)
  
  if (!success) {
    return { success: false, error: emailError || 'Failed to send onboarding email.' }
  }

  await updateCandidateStatus(candidateId, 'ONBOARDING', 'Onboarding email sent manually by HR.', 'HUMAN')
  
  revalidatePath('/admin/offers')
  revalidatePath(`/admin/candidate/${candidateId}`)
  
  return { success: true }
}

/**
 * Server action to mark onboarding as completed.
 */
export async function markOnboardingDoneAction(candidateId) {
  const { supabaseAdmin } = await import('@/lib/supabase-admin')

  const { error } = await supabaseAdmin
    .from('candidates')
    .update({ status: 'ONBOARDING_DONE', updated_at: new Date().toISOString() })
    .eq('id', candidateId)

  if (error) {
    return { success: false, error: error.message }
  }

  await updateCandidateStatus(candidateId, 'ONBOARDING_DONE', 'Candidate onboarding has been officially marked as complete.', 'HUMAN')
  
  revalidatePath('/admin/offers')
  revalidatePath(`/admin/candidate/${candidateId}`)
  
  return { success: true }
}

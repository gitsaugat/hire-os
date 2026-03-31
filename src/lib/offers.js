import { supabaseAdmin } from './supabase-admin'
import { supabase } from './supabase'

/**
 * Create a new offer for a candidate.
 */
export async function createOffer(offerData) {
  const { data, error } = await supabaseAdmin
    .from('offers')
    .insert([{
      candidate_id: offerData.candidate_id,
      salary: offerData.salary,
      equity: offerData.equity,
      start_date: offerData.start_date,
      expiration_date: offerData.expiration_date,
      status: offerData.status || 'PENDING_REVIEW',
      notes: offerData.notes,
      ai_insights: offerData.ai_insights,
      signing_token: offerData.signing_token || crypto.randomUUID()
    }])
    .select()
    .single()

  return { data, error }
}

/**
 * Get all offers with candidate and role details.
 */
export async function getOffers() {
  const { data, error } = await supabaseAdmin
    .from('offers')
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        email,
        status,
        role:roles (
          title,
          team,
          location
        )
      )
    `)
    .order('created_at', { ascending: false })

  return { data, error }
}

/**
 * Get a specific offer by ID.
 */
export async function getOfferById(id) {
  const { data, error } = await supabaseAdmin
    .from('offers')
    .select(`
      *,
      candidate:candidates (
        id,
        name,
        email,
        status,
        role:roles (
          title,
          team,
          location
        )
      )
    `)
    .eq('id', id)
    .single()

  return { data, error }
}

/**
 * Update an offer's status.
 */
export async function updateOfferStatus(id, status) {
  const { data, error } = await supabaseAdmin
    .from('offers')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

/**
 * Get offer for a specific candidate.
 */
export async function getOfferByCandidateId(candidateId) {
  const { data, error } = await supabaseAdmin
    .from('offers')
    .select('*')
    .eq('candidate_id', candidateId)
    .maybeSingle()

  return { data, error }
}

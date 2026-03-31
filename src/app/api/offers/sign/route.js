import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateCandidateStatus } from '@/lib/candidates'

export async function POST(req) {
  try {
    const { signing_token, signature_data } = await req.json()

    if (!signing_token || !signature_data) {
      return NextResponse.json({ error: 'Missing signing data' }, { status: 400 })
    }

    // 1. Get Client IP (Best effort)
    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1'

    // 2. Fetch Offer
    const { data: offer, error: fetchError } = await supabaseAdmin
      .from('offers')
      .select('*')
      .eq('signing_token', signing_token)
      .single()

    if (fetchError || !offer) {
      throw new Error('Offer not found or invalid token')
    }

    if (offer.status === 'ACCEPTED') {
      return NextResponse.json({ success: true, alreadySigned: true })
    }

    // 3. Update Offer as Signed
    const { error: updateError } = await supabaseAdmin
      .from('offers')
      .update({
        status: 'ACCEPTED',
        signature_data: { signature_data }, // Store as JSON
        signed_at: new Date().toISOString(),
        ip_address: ip,
        updated_at: new Date().toISOString()
      })
      .eq('id', offer.id)

    if (updateError) throw updateError

    // 4. Update Candidate Status
    await updateCandidateStatus(offer.candidate_id, 'OFFER_SIGNED', 'Offer officially signed by candidate.', 'SYSTEM')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SignOfferAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

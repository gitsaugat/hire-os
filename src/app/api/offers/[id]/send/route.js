import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendOfferEmail } from '@/lib/email'
import { updateCandidateStatus } from '@/lib/candidates'

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params
    const { id } = resolvedParams

    // 1. Fetch Offer + Candidate
    const { data: offer, error: fetchError } = await supabaseAdmin
      .from('offers')
      .select('*, candidate:candidates(*, role:roles(*))')
      .eq('id', id)
      .single()

    if (fetchError || !offer) {
      throw new Error('Offer not found')
    }

    // 2. Ensure signing_token exists
    let signingToken = offer.signing_token
    if (!signingToken) {
      signingToken = crypto.randomUUID()
      await supabaseAdmin
        .from('offers')
        .update({ signing_token: signingToken })
        .eq('id', id)
    }

    console.log(`[SendOfferAPI] Attempting to send email to ${offer.candidate.email} for offer ${id}`)

    // 3. Send Email
    const emailRes = await sendOfferEmail(
      offer.candidate,
      offer.candidate.role.title,
      signingToken
    )

    if (!emailRes.success) {
      console.error(`[SendOfferAPI] Email failed: ${emailRes.error}`)
      throw new Error(emailRes.error || 'Failed to send email')
    }

    console.log(`[SendOfferAPI] Email sent successfully. Updating statuses...`)

    // 4. Update status and sent_at
    const { error: updateError } = await supabaseAdmin
      .from('offers')
      .update({ 
        status: 'SENT', 
        sent_at: new Date().toISOString() 
      })
      .eq('id', id)

    if (updateError) {
      console.error(`[SendOfferAPI] DB Update Error (Offer): ${updateError.message}`)
      throw updateError
    }

    // 5. Update Candidate Status using canonical helper to ensure history log insertion
    const { error: candError } = await updateCandidateStatus(
      offer.candidate_id, 
      'OFFER_SENT', 
      'Official offer letter generated and sent to candidate.',
      'HUMAN'
    )

    if (candError) {
      console.error(`[SendOfferAPI] Candidate Status Update Error: ${candError.message}`)
      // Don't throw here, as offer was already sent
    }

    return NextResponse.json({ success: true, resend: !!offer.sent_at })
  } catch (error) {
    console.error('[SendOfferAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

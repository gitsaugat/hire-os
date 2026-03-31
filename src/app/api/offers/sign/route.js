import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { updateCandidateStatus } from '@/lib/candidates'
import { notifyHRAboutAcceptance, attemptWorkspaceInvite } from '@/lib/slack'

export async function POST(req) {
  try {
    const { signing_token, signature_data } = await req.json()

    if (!signing_token || !signature_data) {
      return NextResponse.json({ error: 'Missing signing data' }, { status: 400 })
    }

    // 1. Get Client IP (Best effort)
    const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1'

    // 2. Fetch Offer with candidate and role
    const { data: offer, error: fetchError } = await supabaseAdmin
      .from('offers')
      .select(`
        *,
        candidate:candidates (
          id,
          name,
          email,
          role:roles (
            title,
            team
          )
        )
      `)
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

    // 4. Trigger Official Onboarding & Slack Integrations asynchronously
    const { sendOnboardingEmail } = await import('@/lib/email')
    Promise.all([
      sendOnboardingEmail(offer.candidate, offer.candidate.role),
      notifyHRAboutAcceptance(offer.candidate, offer.candidate.role),
      attemptWorkspaceInvite(offer.candidate.email)
    ]).catch(err => console.error('[IntegrationError]', err))

    // 5. Update Candidate Status directly to HIRED
    await updateCandidateStatus(offer.candidate_id, 'HIRED', 'Offer signed and onboarding automatically initiated.', 'SYSTEM')

    // Revalidate admin paths so HR sees the updated status immediately
    revalidatePath('/admin/offers')
    revalidatePath('/admin/interviews')
    revalidatePath(`/admin/candidate/${offer.candidate_id}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SignOfferAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

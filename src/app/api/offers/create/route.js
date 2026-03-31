import { NextResponse } from 'next/server'
import { createOffer } from '@/lib/offers'
import { updateCandidateStatus } from '@/lib/candidates'

export async function POST(req) {
  try {
    const body = await req.json()
    const { candidate_id, salary, equity, start_date, expiration_date, notes, status, ai_insights } = body

    if (!candidate_id || !salary || !start_date || !expiration_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await createOffer({
      candidate_id,
      salary: parseFloat(salary),
      equity,
      start_date,
      expiration_date,
      status: status || 'PENDING_REVIEW',
      notes,
      ai_insights
    })

    if (error) throw error

    // Ensure candidate status is updated (secondary safety check)
    await updateCandidateStatus(candidate_id, 'OFFER_PENDING', 'Offer finalized by HR.', 'HUMAN')

    return NextResponse.json({ success: true, offer: data })
  } catch (error) {
    console.error('[CreateOfferAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

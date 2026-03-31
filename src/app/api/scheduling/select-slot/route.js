import { NextResponse } from 'next/server'
import { resolveCandidateByToken, confirmSlot } from '@/lib/workflows/scheduling'

/**
 * Handle candidate slot selection.
 * POST /api/scheduling/select-slot
 * Body: { token, slotId }
 */
export async function POST(req) {
  try {
    const { token, slotId, candidateId } = await req.json()

    if (!slotId || (!token && !candidateId)) {
      return NextResponse.json({ error: 'Slot ID and either Token or Candidate ID are required.' }, { status: 400 })
    }

    // 1. Resolve candidate
    let candidate = null
    if (token) {
      candidate = await resolveCandidateByToken(token)
    } else if (candidateId) {
      // In a real app, check admin session here
      candidate = { id: candidateId }
    }

    if (!candidate) {
      return NextResponse.json({ error: 'Invalid or expired scheduling link.' }, { status: 403 })
    }

    // 2. Attempt confirmation (handles conflict logic internally)
    const result = await confirmSlot(candidate.id, slotId)

    if (result.conflict) {
      return NextResponse.json({
        conflict: true,
        message: result.message || 'That slot was just taken. Here are updated available times:',
        new_slots: result.new_slots
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Interview confirmed!',
      slot: result.slot
    })

  } catch (err) {
    console.error('[API select-slot] Error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

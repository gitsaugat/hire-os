import { NextResponse } from 'next/server'
import { confirmSlot } from '@/lib/workflows/scheduling'

/**
 * POST /api/scheduling/select-slot
 * Confirms an interview slot for a candidate.
 */
export async function POST(request) {
  try {
    const { candidateId, slotId } = await request.json()

    if (!candidateId || !slotId) {
      return NextResponse.json(
        { error: 'Missing candidateId or slotId' },
        { status: 400 }
      )
    }

    const result = await confirmSlot(candidateId, slotId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API SelectSlot] Error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

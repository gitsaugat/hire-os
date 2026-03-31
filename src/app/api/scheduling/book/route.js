import { NextResponse } from 'next/server'
import { resolveCandidateByToken, confirmBooking } from '@/lib/workflows/scheduling'

/**
 * POST /api/scheduling/book
 * Finalizes an interview booking using the candidate token.
 */
export async function POST(req) {
  try {
    const { token, start_time, end_time } = await req.json()

    if (!token || !start_time || !end_time) {
      return NextResponse.json({ error: 'Token, start_time, and end_time are required.' }, { status: 400 })
    }

    // 1. Resolve candidate
    const candidate = await resolveCandidateByToken(token)
    if (!candidate) {
      return NextResponse.json({ error: 'Invalid or expired scheduling link.' }, { status: 403 })
    }

    // 2. Process Booking (Outcome A or B)
    const result = await confirmBooking(candidate.id, start_time, end_time)

    // Result will contain { confirmed: true } or { conflict: true, new_slots: [...] }
    return NextResponse.json(result)
  } catch (error) {
    console.error('[BookAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { resolveCandidateByToken, getAvailability } from '@/lib/workflows/scheduling'

/**
 * GET /api/scheduling/availability?token=...
 * Returns 3-5 available slots and creates temporary holds.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 })
    }

    // 1. Resolve candidate
    const candidate = await resolveCandidateByToken(token)
    if (!candidate) {
      return NextResponse.json({ error: 'Invalid or expired scheduling link.' }, { status: 403 })
    }

    // 2. Fetch/Compute Availability (Creates HOLDS)
    const slots = await getAvailability(candidate.id)

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('[AvailabilityAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

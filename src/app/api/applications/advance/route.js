import { NextResponse } from 'next/server'
import { updateCandidateStatus } from '@/lib/candidates'

export async function POST(req) {
  try {
    const { candidate_id, status } = await req.json()

    if (!candidate_id || !status) {
      return NextResponse.json({ error: 'Missing candidate ID or status' }, { status: 400 })
    }

    // Map the status payload to our uppercase DB enum/constants
    let dbStatus = 'REJECTED'
    if (status === 'offer') dbStatus = 'OFFER'
    if (status === 'hold') dbStatus = 'HOLD'

    const reasonMap = {
      'OFFER': 'Advanced to offer stage post-interview.',
      'HOLD': 'Placed on hold post-interview.',
      'REJECTED': 'Rejected post-interview.'
    }

    const { error } = await updateCandidateStatus(
      candidate_id, 
      dbStatus, 
      reasonMap[dbStatus], 
      'HUMAN'
    )

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[AdvanceApplicationAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

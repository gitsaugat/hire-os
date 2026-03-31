import { NextResponse } from 'next/server'
import { updateCandidateStatus } from '@/lib/candidates'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateCompletion } from '@/lib/ai/index'
import { createOffer } from '@/lib/offers'

export async function POST(req) {
  try {
    const { candidate_id, status } = await req.json()

    if (!candidate_id || !status) {
      return NextResponse.json({ error: 'Missing candidate ID or status' }, { status: 400 })
    }

    // Map the status payload to our uppercase DB enum/constants
    let dbStatus = 'REJECTED'
    if (status === 'offer') dbStatus = 'OFFER_PENDING'
    if (status === 'hold') dbStatus = 'INTERVIEW_COMPLETED' // Keep in current state but updated reason

    const reasonMap = {
      'OFFER_PENDING': 'Advanced to offer stage post-interview.',
      'INTERVIEW_COMPLETED': 'Placed on hold post-interview.',
      'REJECTED': 'Rejected post-interview.'
    }

    // Capture the result of status update
    const { error: statusError } = await updateCandidateStatus(
      candidate_id, 
      dbStatus, 
      reasonMap[dbStatus], 
      'HUMAN'
    )

    if (statusError) throw statusError

    return NextResponse.json({ success: true, dbStatus })
  } catch (error) {
    console.error('[AdvanceApplicationAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

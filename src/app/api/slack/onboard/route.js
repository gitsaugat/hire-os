import { NextResponse } from 'next/server'
import { sendOnboardingSlackWorkflow } from '@/lib/slack'

/**
 * POST /api/slack/onboard
 * Body: { candidate_id }
 * 
 * Manually trigger the Slack onboarding workflow for a candidate.
 */
export async function POST(req) {
  try {
    const { candidate_id } = await req.json()

    if (!candidate_id) {
      return NextResponse.json({ error: 'Missing candidate_id' }, { status: 400 })
    }

    const result = await sendOnboardingSlackWorkflow(candidate_id)

    if (!result.success) {
      return NextResponse.json({ 
        message: 'Slack onboarding completed with warnings', 
        details: result.error 
      }, { status: 200 })
    }

    return NextResponse.json({ success: true, message: 'Slack onboarding triggered successfully' })
  } catch (error) {
    console.error('[SlackAPI] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateCompletion } from '@/lib/ai/index'
import { updateCandidateStatus } from '@/lib/candidates'

export async function POST(req) {
  try {
    const { interview_id, candidate, notes } = await req.json()

    if (!interview_id || !notes || !Array.isArray(notes)) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
    }

    // 1. Initial record update (save notes immediately and set status)
    await supabaseAdmin
      .from('interviews')
      .update({ notes, status: 'completed' })
      .eq('id', interview_id)

    // 2. Generate Transcript & Summary with fallback
    let transcript = `Raw Notes Transcription:\n${notes.join('\n')}`
    let summary = {
      overall_assessment: "Technical interview concluded. Detailed AI assessment unavailable.",
      strengths: ["Participated in interview"],
      concerns: ["Detailed assessment failed"],
      recommendation: "hold",
      recommendation_reason: "Manual review required due to processing error.",
      confidence: 0
    }
    let bias = { flags: [], clean: true, summary: "Bias detection failed to run." }

    try {
      // Step A: Generate Transcript
      const transcriptPrompt = `Convert these real-time interview notes into a structured transcript for a ${candidate?.role || 'Job'} interview with ${candidate?.name || 'the candidate'}.
Notes captured:
${notes.join('\n')}
Format as raw dialogue. Do NOT include markdown blocks.`

      const rawTranscript = await generateCompletion(transcriptPrompt)
      if (rawTranscript) {
        transcript = rawTranscript.replace(/```\w*/g, '').replace(/```/g, '').trim()
      }

      // Step B: Generate Summary
      const summaryPrompt = `Review this transcript and return ONLY a JSON object:
Candidate: ${candidate?.name || 'Candidate'}
Transcript: ${transcript}
Structure: { "overall_assessment": "...", "strengths": [...], "concerns": [...], "recommendation": "advance"|"reject"|"hold", "recommendation_reason": "...", "confidence": 85 }`

      const rawSummary = await generateCompletion(summaryPrompt)
      if (rawSummary) {
        const summaryClean = rawSummary.replace(/```json/g, '').replace(/```\w*/g, '').replace(/```/g, '').trim()
        summary = JSON.parse(summaryClean)
      }

      // Step C: Bias Detection
      const biasPrompt = `Review for bias indicators: ${transcript}
Return JSON { "flags": [], "clean": true, "summary": "..." }`

      const rawBias = await generateCompletion(biasPrompt)
      if (rawBias) {
        const biasClean = rawBias.replace(/```json/g, '').replace(/```\w*/g, '').replace(/```/g, '').trim()
        bias = JSON.parse(biasClean)
      }
    } catch (aiError) {
      console.error('[CompleteInterviewAPI] AI Error (using fallbacks):', aiError)
    }

    // 3. Save Final Results
    const { error: dbError } = await supabaseAdmin
      .from('interviews')
      .update({
        transcript,
        summary,
        recommendation: summary.recommendation,
        bias_flags: bias
      })
      .eq('id', interview_id)

    if (dbError) throw dbError

    // 4. Update Candidate status to INTERVIEW_COMPLETED
    await updateCandidateStatus(
      candidate?.id, 
      'INTERVIEW_COMPLETED', 
      'Interview completion processed (with AI resilience).', 
      'AI'
    )

    return NextResponse.json({ success: true, redirect: `/admin/interviews` })
  } catch (error) {
    console.error('[CompleteInterviewAPI] Fatal Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

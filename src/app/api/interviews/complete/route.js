// Force HMR recompile
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateCompletion } from '@/lib/ai/index'

export async function POST(req) {
  try {
    const { interview_id, candidate, notes } = await req.json()

    if (!interview_id || !notes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Generate Transcript
    const transcriptPrompt = `Convert these real-time interview notes into a structured transcript for a ${candidate?.role || 'Job'} interview with ${candidate?.name || 'the candidate'}.
  
Notes captured:
${notes.join('\n')}

Format as a realistic back-and-forth interview transcript.
Label speakers as "Interviewer:" and "Candidate:".
Expand each note into 2-3 lines of natural dialogue.
Keep total length to 400-600 words. Do NOT include markdown blocks or introductory text, just the raw dialogue.`

    const rawTranscript = await generateCompletion(transcriptPrompt)
    const transcript = rawTranscript.replace(/```\w*/g, '').replace(/```/g, '').trim()

    // 2. Generate Summary
    const summaryPrompt = `You are a senior hiring manager reviewing an interview transcript.

Candidate: ${candidate?.name || 'Candidate'}, applying for ${candidate?.role || 'Role'}
Transcript:
${transcript}

Return ONLY a JSON object with this exact structure:
{
  "overall_assessment": "2-3 sentence summary",
  "strengths": ["...", "...", "..."],
  "concerns": ["...", "..."],
  "recommendation": "advance"|"reject"|"hold",
  "recommendation_reason": "1 sentence",
  "confidence": 85
}`

    const rawSummary = await generateCompletion(summaryPrompt)
    const summaryClean = rawSummary.replace(/```json/g, '').replace(/```\w*/g, '').replace(/```/g, '').trim()
    const summary = JSON.parse(summaryClean)

    // 3. Bias Detection
    const biasPrompt = `Review this interview transcript for potential bias indicators.
Look for: comments about personality unrelated to job requirements, references to age, background, communication style as negatives, culture fit language used subjectively, double standards.

Transcript: 
${transcript}

Return ONLY a JSON object with this structure:
{
  "flags": [
    { "quote": "...", "concern": "...", "severity": "low"|"medium"|"high" }
  ],
  "clean": true|false,
  "summary": "one sentence overall"
}

If no issues found return: { "flags": [], "clean": true, "summary": "No bias indicators detected" }`

    const rawBias = await generateCompletion(biasPrompt)
    const biasClean = rawBias.replace(/```json/g, '').replace(/```\w*/g, '').replace(/```/g, '').trim()
    const bias = JSON.parse(biasClean)

    // 4. Save to DB
    const { error: dbError } = await supabaseAdmin
      .from('interviews')
      .update({
        transcript: transcript,
        summary: summary,
        notes: notes,
        recommendation: summary.recommendation,
        bias_flags: bias,
        status: 'completed'
      })
      .eq('id', interview_id)

    if (dbError) throw dbError

    // 5. Update Candidate status to processing/completed interview visually
    await supabaseAdmin
      .from('candidates')
      .update({ status: 'EVALUATING' }) // Or keep as is, but good for UI
      .eq('id', candidate?.id)

    // Log the status transition if needed (skipped for brevity)

    return NextResponse.json({ success: true, redirect: `/interview/${interview_id}/summary` })
  } catch (error) {
    console.error('[CompleteInterviewAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

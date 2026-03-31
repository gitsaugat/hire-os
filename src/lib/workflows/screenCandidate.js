import { supabaseAdmin } from '../supabase-admin'
import { updateCandidateStatus } from '../candidates'
import { evaluateCandidate } from '../ai'
import { extractTextFromPdf } from '../pdf'
import { researchCandidate } from './researchCandidate'
import { initiateScheduling } from './scheduling'

/**
 * Background AI screening + research workflow.
 * Steps:
 *   1. Download + extract resume text
 *   2. AI Evaluation (score, skills, strengths, risks)
 *   3. Store evaluation results
 *   4. Determine final status
 *   5. AI Research (brief, signals, projects) — always runs
 *   6. Automated Scheduling (if shortlisted)
 *
 * @param {string} candidateId
 */
export async function screenCandidate(candidateId) {
  console.log(`[screenCandidate] Starting AI screening for candidate: ${candidateId}`)

  try {
    // ── Step 1: Fetch candidate + role ─────────────────────────────
    const { data: candidate, error: fetchError } = await supabaseAdmin
      .from('candidates')
      .select('*, role:roles(*)')
      .eq('id', candidateId)
      .single()

    if (fetchError || !candidate) {
      throw new Error(`Candidate not found: ${fetchError?.message}`)
    }

    if (!candidate.resume_url) {
      throw new Error('Resume URL is missing for this candidate.')
    }

    // ── Step 2: Download + extract resume text ─────────────────────
    console.log(`[screenCandidate] Downloading resume: ${candidate.resume_url}`)
    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
      .from('resumes')
      .download(candidate.resume_url.replace('resumes/', ''))

    if (downloadError) throw downloadError

    const arrayBuffer = await fileBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    console.log(`[screenCandidate] PDF buffer: ${buffer.length} bytes`)

    let resumeText = ''
    try {
      resumeText = await extractTextFromPdf(buffer)
      console.log(`[screenCandidate] Extracted ${resumeText.length} characters from PDF.`)
      if (!resumeText || resumeText.trim().length < 50) {
        console.warn('[screenCandidate] Short text — possible scanned PDF.')
        resumeText += `\n\nNOTE: Resume text is very short. Candidate: ${candidate.name} <${candidate.email}>`
      }
    } catch (err) {
      console.warn('[screenCandidate] PDF extraction failed:', err.message)
      resumeText = `CANDIDATE: ${candidate.name} | EMAIL: ${candidate.email} | NOTE: PDF extraction failed.`
    }

    const jdText = candidate.role?.jd_text || 'No job description provided.'

    // ── Step 3: AI Evaluation ──────────────────────────────────────
    console.log(`[screenCandidate] Running AI evaluation...`)
    let aiResult
    try {
      aiResult = await evaluateCandidate(jdText, resumeText)
    } catch (err) {
      console.error(`[screenCandidate] AI evaluation failed:`, err.message)
      throw err
    }

    // ── Step 4: Store evaluation results ──────────────────────────
    const { error: profileError } = await supabaseAdmin
      .from('candidate_ai_profiles')
      .upsert({
        candidate_id: candidateId,
        summary: aiResult.summary,
        skills_found: aiResult.skills || [],
        gaps_found: aiResult.gaps ? [aiResult.gaps] : [],
        recommendation: aiResult.recommendation,
        experience_years: aiResult.experience_years,
        strengths: aiResult.strengths,
        risks: aiResult.risks,
        raw_analysis: aiResult,
      }, { onConflict: 'candidate_id' })

    if (profileError) throw profileError

    const { error: updateError } = await supabaseAdmin
      .from('candidates')
      .update({
        ai_score: (aiResult.score || 0) / 100,
        ai_confidence: aiResult.confidence || 0,
      })
      .eq('id', candidateId)

    if (updateError) throw updateError

    // ── Step 6: Determine + save final status ──────────────────────
    const score = aiResult.score || 0
    let finalStatus = 'SCREENED'
    let statusReason = 'AI screening completed'

    if (score < 50) {
      finalStatus = 'REJECTED'
      statusReason = 'Low AI evaluation score'
    } else if (score >= 50) {
      finalStatus = 'INTERVIEW_SCHEDULING'
      statusReason = 'AI score meets recruitment threshold. Initiating scheduling.'
    }

    await updateCandidateStatus(candidateId, finalStatus, statusReason, 'AI')

    console.log(`[screenCandidate] Evaluation complete. Status: ${finalStatus}`)

    // ── Step 5: AI Research & Step 7: Scheduling (Parallel/Background) ──
    const researchTask = researchCandidate(candidateId, resumeText).catch(err =>
      console.error(`[screenCandidate] Research failed for ${candidateId}:`, err)
    )

    if (finalStatus === 'INTERVIEW_SCHEDULING') {
      console.log(`[screenCandidate] Initiating scheduling flow for ${candidateId}`)
      initiateScheduling(candidateId).catch(err =>
        console.error(`[screenCandidate] Scheduling initiation failed for ${candidateId}:`, err)
      )
    }

    // We don't necessarily need to await research for the screening flow to be 'complete'
    // but we can if we want to ensure logs are in order.
    // For "immediate" scheduling, we didn't await scheduling above.
    
    console.log(`[screenCandidate] Pipeline complete for ${candidateId}.`)

  } catch (err) {
    console.error(`[screenCandidate] Workflow failed for ${candidateId}:`, err)
    await updateCandidateStatus(
      candidateId,
      'SCREENING_FAILED',
      `AI Screening failed: ${err.message}`,
      'AI'
    )
  }
}


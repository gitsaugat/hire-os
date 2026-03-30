import { supabaseAdmin } from '../supabase-admin'
import { updateCandidateStatus } from '../candidates'
import { evaluateCandidate } from '../ai'

/**
 * Background AI screening workflow.
 * This is non-blocking and updates the database upon completion.
 *
 * @param {string} candidateId
 */
export async function screenCandidate(candidateId) {
  console.log(`[screenCandidate] Starting AI screening for candidate: ${candidateId}`)

  try {
    // 1. Fetch candidate + role data
    const { data: candidate, error: fetchError } = await supabaseAdmin
      .from('candidates')
      .select('*, role:roles(*)')
      .eq('id', candidateId)
      .single()

    if (fetchError || !candidate) {
      throw new Error(`Candidate not found: ${fetchError?.message}`)
    }

    // 2. Extract resume text
    // NOTE: In a real app, you would download the file from Storage
    // and use a PDF parsing library (like pdf-parse) here.
    // For this implementation, we'll simulate the extraction.
    const resumeText = `Name: ${candidate.name}\nEmail: ${candidate.email}\nExperience: 5 years in full-stack development. Proficient in React, Node.js, and SQL.`
    const jdText = candidate.role?.jd_text || 'No job description provided.'

    // 3. AI Evaluation (with retry logic)
    let aiResult
    let attempts = 0
    while (attempts < 2) {
      try {
        aiResult = await evaluateCandidate(resumeText, jdText)
        break
      } catch (err) {
        attempts++
        if (attempts === 2) throw err
        console.warn(`[screenCandidate] AI attempt ${attempts} failed, retrying...`)
      }
    }

    // 4. Store the AI profile results
    const { error: profileError } = await supabaseAdmin
      .from('candidate_ai_profiles')
      .upsert({
        candidate_id: candidateId,
        summary: aiResult.summary,
        skills_found: aiResult.skills_found,
        gaps_found: aiResult.gaps_found,
        recommendation: aiResult.recommendation,
        raw_analysis: aiResult.raw_analysis
      }, { onConflict: 'candidate_id' })

    if (profileError) throw profileError

    // 5. Update candidate with scores
    const { error: updateError } = await supabaseAdmin
      .from('candidates')
      .update({
        ai_score: aiResult.score / 100, // Normalize to 0-1
        ai_confidence: aiResult.confidence
      })
      .eq('id', candidateId)

    if (updateError) throw updateError

    // 6. Determine final status
    const isStrong = aiResult.score >= 75 && aiResult.confidence >= 0.6
    const finalStatus = isStrong ? 'SHORTLISTED' : 'SCREENED'
    const statusReason = isStrong ? 'AI recommended for shortlist' : 'AI screening completed'

    await updateCandidateStatus(candidateId, finalStatus, statusReason, 'AI')

    console.log(`[screenCandidate] Successfully completed for ${candidateId}. Result: ${finalStatus}`)

  } catch (err) {
    console.error(`[screenCandidate] Workflow failed for ${candidateId}:`, err)

    // Mark as failed in the DB
    await updateCandidateStatus(
      candidateId, 
      'SCREENING_FAILED', 
      `AI Screening failed: ${err.message}`, 
      'AI'
    )
  }
}

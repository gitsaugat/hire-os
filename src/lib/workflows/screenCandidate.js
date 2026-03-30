import { supabaseAdmin } from '../supabase-admin'
import { updateCandidateStatus } from '../candidates'
import { evaluateCandidate } from '../ai'
import { PDFParse } from 'pdf-parse'

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

    if (!candidate.resume_url) {
      throw new Error('Resume URL is missing for this candidate.')
    }

    // 2. Download and Extract resume text
    console.log(`[screenCandidate] Downloading resume from storage: ${candidate.resume_url}`)
    const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
      .from('resumes')
      .download(candidate.resume_url.replace('resumes/', ''))

    if (downloadError) throw downloadError

    // Convert Blob to Buffer for PDFParse
    const arrayBuffer = await fileBlob.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    let resumeText = ''
    try {
      // Use the PDFParse class (version 2.4.5 API)
      const parser = new PDFParse({ data: buffer })
      const pdfData = await parser.getText()
      resumeText = pdfData.text
      console.log(`[screenCandidate] Successfully extracted ${resumeText.length} characters from PDF.`)
      
      // Clean up parser
      await parser.destroy()
    } catch (err) {
      console.warn('[screenCandidate] PDF parsing failed, falling back to metadata:', err.message)
      resumeText = `Candidate Name: ${candidate.name}\nEmail: ${candidate.email}\nNote: Resume text extraction failed.`
    }


    const jdText = candidate.role?.jd_text || 'No job description provided.'

    // 3. AI Evaluation (Router handles which provider to use and fallback)
    let aiResult
    try {
      aiResult = await evaluateCandidate(jdText, resumeText)
    } catch (err) {

      console.error(`[screenCandidate] AI Router failed for ${candidateId}:`, err.message)
      throw err // caught by the outer try-catch
    }

    // 4. Store the AI profile results
    const { error: profileError } = await supabaseAdmin
      .from('candidate_ai_profiles')
      .upsert({
        candidate_id: candidateId,
        summary: aiResult.summary,
        skills_found: aiResult.skills || [],
        gaps_found: aiResult.gaps ? [aiResult.gaps] : [], // user's gaps field
        recommendation: aiResult.recommendation,
        experience_years: aiResult.experience_years,
        strengths: aiResult.strengths,
        risks: aiResult.risks,
        raw_analysis: aiResult
      }, { onConflict: 'candidate_id' })

    if (profileError) throw profileError

    // 5. Update candidate with scores
    const { error: updateError } = await supabaseAdmin
      .from('candidates')
      .update({
        ai_score: (aiResult.score || 0) / 100, // Normalize to 0-1
        ai_confidence: aiResult.confidence || 0
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

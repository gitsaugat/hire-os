import { supabaseAdmin } from '../supabase-admin'
import { extractTextFromPdf } from '../pdf'

const RESEARCH_PROMPT = (resumeText, linkedinUrl, githubUrl) => `
You are a senior hiring research analyst at a top-tier recruiting firm.

Your task: analyze the candidate data below and return a concise intelligence profile 
that will be used by the hiring manager before an interview.

---

RESUME TEXT:
${resumeText || 'Not provided.'}

LINKEDIN PROFILE URL:
${linkedinUrl || 'Not provided.'}

GITHUB PROFILE URL:
${githubUrl || 'Not provided.'}

---

INSTRUCTIONS:

1. Summarize the candidate's professional background using LinkedIn-style language (infer from resume if URL only)
2. Summarize their GitHub/technical contributions (infer from resume skills if only a URL)
3. List 2–5 notable projects or contributions
4. List 3–6 strong hiring signals (e.g., "Led team of 8 engineers", "Built product from 0 to 10k users")
5. List any inconsistencies between the resume and expected norms (e.g., gap years, title inflation)
6. Write a 3–5 sentence candidate brief for a hiring manager

CRITICAL RULES:
- Do NOT hallucinate specific facts (e.g., company names, exact dates) not explicitly in resume
- If only a URL is provided without scraped content, clearly state assumptions
- If a section has no data, return null for that field or an empty array
- Return ONLY valid JSON, no markdown, no commentary

REQUIRED JSON STRUCTURE:
{
  "linkedin_summary": "string or null",
  "github_summary": "string or null",
  "notable_projects": ["string", "string"],
  "signals": ["string", "string"],
  "inconsistencies": ["string"],
  "candidate_brief": "string"
}
`

/**
 * AI Research workflow — triggered as the final step of every screening.
 * Analyzes resume + LinkedIn/GitHub URLs to generate an enriched intelligence profile.
 * Stores results in candidate_research_profiles.
 *
 * @param {string} candidateId
 * @param {string} [preExtractedResumeText] - Already-extracted text from screenCandidate (avoids double download)
 */
export async function researchCandidate(candidateId, preExtractedResumeText = null) {
  console.log(`[researchCandidate] Starting research for candidate: ${candidateId}`)

  let attemptCount = 0

  async function run() {
    attemptCount++

    // 1. Fetch candidate
    const { data: candidate, error: fetchError } = await supabaseAdmin
      .from('candidates')
      .select('*, role:roles(*)')
      .eq('id', candidateId)
      .single()

    if (fetchError || !candidate) {
      throw new Error(`Candidate not found: ${fetchError?.message}`)
    }

    // 2. Use pre-extracted text or download + extract fresh
    let resumeText = preExtractedResumeText || ''
    if (!resumeText && candidate.resume_url) {
      try {
        const { data: fileBlob, error: downloadError } = await supabaseAdmin.storage
          .from('resumes')
          .download(candidate.resume_url.replace('resumes/', ''))

        if (!downloadError && fileBlob) {
          const arrayBuffer = await fileBlob.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          resumeText = await extractTextFromPdf(buffer)
          console.log(`[researchCandidate] Extracted ${resumeText.length} chars from PDF.`)
        }
      } catch (err) {
        console.warn(`[researchCandidate] PDF extraction failed:`, err.message)
        resumeText = `Candidate Name: ${candidate.name}, Email: ${candidate.email}`
      }
    } else if (resumeText) {
      console.log(`[researchCandidate] Using pre-extracted resume text (${resumeText.length} chars).`)
    }

    // 3. Get active AI provider
    const { data: settings } = await supabaseAdmin
      .from('ai_settings')
      .select('provider, model_name, api_key')
      .eq('is_active', true)
      .single()

    const provider = settings?.provider || 'openai'
    const model = settings?.model_name
    const apiKey = settings?.api_key

    console.log(`[researchCandidate] Using provider: ${provider} - ${model || 'default'}`)

    // 4. Call AI
    const prompt = RESEARCH_PROMPT(resumeText, candidate.linkedin_url, candidate.github_url)
    let researchResult

    switch (provider) {
      case 'gemini':
        researchResult = await callGemini(prompt, model, apiKey)
        break
      case 'claude':
        researchResult = await callClaude(prompt, model, apiKey)
        break
      case 'openai':
      default:
        researchResult = await callOpenAI(prompt, model, apiKey)
    }

    // 5. Store result
    const { error: upsertError } = await supabaseAdmin
      .from('candidate_research_profiles')
      .upsert({
        candidate_id: candidateId,
        linkedin_summary: researchResult.linkedin_summary || null,
        github_summary: researchResult.github_summary || null,
        notable_projects: researchResult.notable_projects || [],
        signals: researchResult.signals || [],
        inconsistencies: researchResult.inconsistencies || [],
        candidate_brief: researchResult.candidate_brief || null,
      }, { onConflict: 'candidate_id' })

    if (upsertError) throw upsertError

    console.log(`[researchCandidate] Research complete for ${candidateId}.`)
  }

  try {
    await run()
  } catch (err) {
    console.error(`[researchCandidate] Attempt ${attemptCount} failed:`, err.message)
    if (attemptCount < 2) {
      console.log(`[researchCandidate] Retrying once...`)
      try {
        await run()
      } catch (retryErr) {
        console.error(`[researchCandidate] Retry failed; saving minimal record:`, retryErr.message)
        // Save a minimal fallback record so the UI knows research was attempted
        await supabaseAdmin.from('candidate_research_profiles').upsert({
          candidate_id: candidateId,
          candidate_brief: `AI research could not be completed. Error: ${retryErr.message}`,
          signals: [],
          inconsistencies: [],
          notable_projects: [],
        }, { onConflict: 'candidate_id' }).catch(() => {})
      }
    }
  }
}

// ─── Provider Helpers ─────────────────────────────────────────────────────────

async function callGemini(prompt, model = 'gemini-1.5-flash', apiKey) {
  const key = apiKey || process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY missing')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { response_mime_type: 'application/json' },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Gemini error: ${err.error?.message || res.statusText}`)
  }
  const data = await res.json()
  const content = data.candidates[0].content.parts[0].text
  return JSON.parse(content)
}

async function callClaude(prompt, model = 'claude-3-5-haiku-20241022', apiKey) {
  const key = apiKey || process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY missing')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Claude error: ${err.error?.message || res.statusText}`)
  }
  const data = await res.json()
  return JSON.parse(data.content[0].text)
}

async function callOpenAI(prompt, model = 'gpt-4o-mini', apiKey) {
  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY missing')

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`OpenAI error: ${err.error?.message || res.statusText}`)
  }
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

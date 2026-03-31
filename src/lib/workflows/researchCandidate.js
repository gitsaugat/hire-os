import { supabaseAdmin } from '../supabase-admin'
import { extractTextFromPdf } from '../pdf'
import { scrapeUrl } from '../firecrawl'
import { getGitHubData } from '../github'

const RESEARCH_PROMPT = (resumeText, linkedinUrl, githubUrl, linkedinContent, githubData) => `
You are a senior hiring research analyst at a top-tier recruiting firm.

Your task: generate a high-signal candidate intelligence profile that helps a hiring manager quickly understand the candidate’s strengths, risks, and overall quality.

Use the provided LinkedIn content and GitHub repository data for analysis. Do not rely solely on inference if real data is available.

---

## INPUT

RESUME:
${resumeText || 'Not provided.'}

LINKEDIN URL:
${linkedinUrl || 'Not provided.'}

REAL LINKEDIN CONTENT:
${linkedinContent ? (linkedinContent.content || linkedinContent) : 'Not available (rely on resume/inference).'}

GITHUB URL:
${githubUrl || 'Not provided.'}

REAL GITHUB DATA:
${githubData ? JSON.stringify(githubData, null, 2) : 'Not available (rely on resume/inference).'}

---

## INSTRUCTIONS

### 1. Professional Background (LinkedIn-style)
- Summarize career trajectory
- Highlight seniority progression
- Mention notable companies (if present)
- If LinkedIn content is available, use it as primary source. Otherwise, infer from resume.

---

### 2. Company & Pedigree Analysis
- Identify top-tier or recognizable companies (FAANG, startups, etc.)
- Evaluate quality of experience (scale, impact, reputation)
- If unclear, state assumption

---

### 3. Thought Leadership & Signals (LinkedIn Posts)
- Infer whether candidate likely produces:
  - technical content
  - blogs
  - open-source contributions
- Use real LinkedIn content if available to find evidence.
- If no data, explicitly say: "No evidence of public thought leadership"

---

### 4. GitHub Evaluation
- Assess engineering depth based on:
  - types of projects (frontend apps, systems, tooling, etc.)
  - complexity (basic CRUD vs systems thinking)
  - consistency of contributions
- Map real GitHub data (repositories, descriptions, stars) to resume claims.
- Identify:
  - strongest repos from data
  - technologies used
- If GitHub data is not available, infer from resume skills.

---

### 5. Notable Projects
List 2–5:
- projects that demonstrate skill, ownership, or impact
- verify against real GitHub data if provided

---

### 6. Strong Hiring Signals
List 3–6:
Examples:
- “Built production-grade applications”
- “Demonstrates ownership of end-to-end systems”
- “Experience at high-scale company”

---

### 7. Risks / Inconsistencies
Examples:
- skill mismatch vs role
- unclear progression
- short tenures
- inconsistencies between resume claims and real GitHub/LinkedIn data

---

### 8. Candidate Brief (MOST IMPORTANT)
Write a 3–5 sentence summary:

- who they are
- what they’re strong at
- key gaps
- hiring recommendation tone

Make this extremely concise and recruiter-ready.

---

## CRITICAL RULES

- Do NOT hallucinate specific facts (company names, repos, posts) not in resume or external data
- If only URLs are provided without fetched data:
  → clearly state assumptions
- Prefer real data over inference
- Be concise and high-signal (no fluff)

---

## OUTPUT (JSON ONLY)

{
  "linkedin_summary": "string or null",
  "company_analysis": "string or null",
  "thought_leadership": "string or null",
  "github_summary": "string or null",
  "notable_projects": ["string"],
  "signals": ["string"],
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

    // ── Step 3: Fetch External Data ───────────────────────────────
    let linkedinContent = null
    let githubData = null

    if (candidate.linkedin_url) {
      console.log(`[researchCandidate] Scraping LinkedIn: ${candidate.linkedin_url}`)
      linkedinContent = await scrapeUrl(candidate.linkedin_url)
    }

    if (candidate.github_url) {
      console.log(`[researchCandidate] Fetching GitHub data: ${candidate.github_url}`)
      githubData = await getGitHubData(candidate.github_url)
    }

    // ── Step 4: Get active AI provider ───────────────────────────
    const { data: settings } = await supabaseAdmin
      .from('ai_settings')
      .select('provider, model_name, api_key')
      .eq('is_active', true)
      .single()

    const provider = settings?.provider || 'openai'
    const model = settings?.model_name
    const apiKey = settings?.api_key

    console.log(`[researchCandidate] Using provider: ${provider} - ${model || 'default'}`)

    // ── Step 5: Call AI ─────────────────────────────────────────
    const prompt = RESEARCH_PROMPT(
      resumeText,
      candidate.linkedin_url,
      candidate.github_url,
      linkedinContent,
      githubData
    )
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
        company_analysis: researchResult.company_analysis || null,
        thought_leadership: researchResult.thought_leadership || null,
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
        }, { onConflict: 'candidate_id' }).catch(() => { })
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

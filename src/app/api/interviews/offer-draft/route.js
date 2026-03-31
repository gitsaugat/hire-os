import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateCompletion } from '@/lib/ai/index'

export async function POST(req) {
  try {
    const { interview_id } = await req.json()

    if (!interview_id) {
      return NextResponse.json({ error: 'Missing interview ID' }, { status: 400 })
    }

    // 1. Fetch Interview + Candidate + Role
    const { data: interview, error: intError } = await supabaseAdmin
      .from('interviews')
      .select('*, candidate:candidates(*, role:roles(*))')
      .eq('id', interview_id)
      .single()

    if (intError || !interview) {
      throw new Error('Interview not found')
    }

    const { candidate } = interview
    const role = candidate.role

    // 2. Prompt LLM for Competitive Insights
    const prompt = `You are an expert HR Compensation Analyst and Technical Recruiter.
Analyze the following interview assessment and job description to provide competitive offer insights for a high-growth tech company.

Candidate: ${candidate.name}
Role Title: ${role.title}
Job Description: ${role.jd_text}
Interview Summary: ${JSON.stringify(interview.summary)}

Based on the candidate's performance and market standards, return a JSON object with:
1. "market_min": Lowest competitive base salary for this level/role (integer).
2. "market_max": Highest competitive base salary for this level/role (integer).
3. "candidate_value_score": A score from 1.0 to 10.0 reflecting their performance vs requirements (float).
4. "value_justification": 1-2 sentences explaining the score.
5. "suggested_salary": A specific recommended base salary within the range (integer).
6. "suggested_equity": A specific recommended equity/options grant (string).
7. "benefits": Array of 3-4 suggested perks (e.g. "Sign-on bonus", "Learning budget").

Return ONLY valid JSON:
{
  "market_min": 130000,
  "market_max": 165000,
  "candidate_value_score": 9.4,
  "value_justification": "...",
  "suggested_salary": 155000,
  "suggested_equity": "...",
  "benefits": ["...", "..."]
}`

    const rawDraft = await generateCompletion(prompt)
    const draftClean = rawDraft.replace(/```json/g, '').replace(/```\w*/g, '').replace(/```/g, '').trim()
    const insights = JSON.parse(draftClean)

    return NextResponse.json({ 
      success: true, 
      insights,
      candidate: {
        id: candidate.id,
        name: candidate.name,
        role_title: role.title
      }
    })

  } catch (error) {
    console.error('[OfferDraftAPI] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

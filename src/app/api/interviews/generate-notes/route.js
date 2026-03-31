// Force HMR recompile
import { NextResponse } from 'next/server'
import { generateCompletion } from '@/lib/ai/index'

export async function POST(req) {
  try {
    const { candidate } = await req.json()

    if (!candidate) {
      return NextResponse.json({ error: 'Missing candidate data' }, { status: 400 })
    }

    const prompt = `You are an AI notetaker for a job interview.
Candidate: ${candidate.name}
Role: ${candidate.role}
Skills on resume: ${candidate.skills?.join(', ') || 'Not specified'}
Screening summary: ${candidate.screening_summary || 'No summary provided'}

Generate 20 realistic interview observation notes that would be captured during a 30-minute technical interview for this specific role.
Each note should feel like it was written in real time.

Return ONLY a JSON array with this exact structure, no markdown formatting or extra text:
[
  { 
    "text": "observation text here", 
    "type": "observation"|"highlight"|"flag",
    "delay": seconds_from_start (spread between 30 and 1700)
  }
]

Rules:
- Notes must reference the candidate's actual skills and role
- highlights = strong positive signals (2-4 of them)
- flags = things worth discussing or clarifying (1-2 of them)  
- observations = neutral real-time captures
- Vary length: some short (8 words), some detailed (25 words)
- Do NOT make them all positive — realistic interviews have mixed signals`

    const responseText = await generateCompletion(prompt)
    
    // Parse the JSON array. Might need to sanitize if Claude adds markdown.
    const cleanText = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    const notes = JSON.parse(cleanText)

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('[GenerateNotesAPI] Error:', error)
    
    // Fallback notes on error as specified in requirements
    const fallbackNotes = Array.from({ length: 15 }).map((_, i) => ({
      text: `Candidate discussed background and experience relevant to the role. ${i + 1}`,
      type: i % 5 === 0 ? 'highlight' : i === 7 ? 'flag' : 'observation',
      delay: (i + 1) * 60 // every 1 minute
    }))
    
    return NextResponse.json({ notes: fallbackNotes })
  }
}

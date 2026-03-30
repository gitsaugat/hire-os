const PROMPT_TEMPLATE = (jdText, resumeText) => `
Evaluate the following candidate's resume against the provided job description.
Return a valid JSON object with EXACTLY this structure:
{
  "score": 85,
  "confidence": 0.8,
  "recommendation": "Interview immediately",
  "skills": ["React", "Node.js"],
  "experience_years": 5,
  "strengths": "Strong backend experience",
  "gaps": "Lacks cloud devops experience",
  "risks": "None noted",
  "summary": "Excellent fit for the role"
}

Ensure the output is ONLY the JSON object, nothing else.

Job Description:
${jdText}

Resume Text:
${resumeText}
`;

/**
 * Gemini (Google) Provider
 */
export async function evaluateWithGemini(jdText, resumeText, model = 'gemini-1.5-pro', apiKey = null) {
  const finalKey = apiKey || process.env.GEMINI_API_KEY;
  if (!finalKey) throw new Error('GEMINI_API_KEY is missing');

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${finalKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: PROMPT_TEMPLATE(jdText, resumeText) }]
      }],
      generationConfig: {
        response_mime_type: 'application/json'
      }
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gemini API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  return JSON.parse(content);
}

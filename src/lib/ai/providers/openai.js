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
 * OpenAI Provider
 */
export async function evaluateWithOpenAI(jdText, resumeText, model = 'gpt-4o', apiKey = null) {
  const finalKey = apiKey || process.env.OPENAI_API_KEY;
  if (!finalKey) throw new Error('OPENAI_API_KEY is missing');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${finalKey}`,
    },

    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a professional recruitment AI advisor.' },
        { role: 'user', content: PROMPT_TEMPLATE(jdText, resumeText) },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`OpenAI API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

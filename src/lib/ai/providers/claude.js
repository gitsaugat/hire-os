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
 * Claude (Anthropic) Provider
 */
export async function evaluateWithClaude(jdText, resumeText, model = 'claude-3-5-sonnet-20240620', apiKey = null) {
  const finalKey = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!finalKey) throw new Error('ANTHROPIC_API_KEY is missing');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': finalKey,
      'anthropic-version': '2023-06-01',
    },

    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [
        { role: 'user', content: PROMPT_TEMPLATE(jdText, resumeText) },
      ],
      system: 'You are a professional recruitment AI advisor. Always respond with valid JSON.',
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Claude API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Extract JSON if model wraps in markdown
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : content);
}

/**
 * Generic text generation with Claude
 */
export async function generateWithClaude(prompt, model = 'claude-3-5-sonnet-20240620', apiKey = null) {
  const finalKey = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!finalKey) throw new Error('ANTHROPIC_API_KEY is missing');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': finalKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Claude API error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

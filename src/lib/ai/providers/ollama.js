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
 * Ollama (Local LLM) Provider
 */
export async function evaluateWithOllama(jdText, resumeText, model = 'llama3', baseUrl = 'http://localhost:11434') {
  console.log(`[Ollama] Calling local model: ${model} at ${baseUrl}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: PROMPT_TEMPLATE(jdText, resumeText)
          }
        ],
        stream: false,
        format: 'json'
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.message?.content;
    
    if (!content) {
      throw new Error('Ollama returned empty response content.');
    }

    // Attempt to parse JSON
    try {
      return JSON.parse(content);
    } catch (parseErr) {
      console.error('[Ollama] JSON Parse Error. Raw content:', content);
      // Fallback: try to extract JSON from markdown if present
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw parseErr;
    }
  } catch (err) {
    console.error(`[Ollama] Request failed:`, err.message);
    throw err;
  }
}

/**
 * Generic text generation with Ollama
 */
export async function generateWithOllama(prompt, model = 'llama3', baseUrl = 'http://localhost:11434') {
  console.log(`[Ollama] Generating completion with model: ${model} at ${baseUrl}`);
  
  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        stream: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.message?.content || '';
  } catch (err) {
    console.error(`[Ollama] Generation failed:`, err.message);
    throw err;
  }
}

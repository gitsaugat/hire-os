/**
 * Mock AI Evaluation Service
 * In a real app, this would call OpenAI, Anthropic, or a custom ML model.
 *
 * @param {string} resumeText
 * @param {string} jdText
 * @returns {Promise<{
 *   score: number,
 *   confidence: number,
 *   summary: string,
 *   skills_found: string[],
 *   gaps_found: string[],
 *   recommendation: string,
 *   raw_analysis: object
 * }>}
 */
export async function evaluateCandidate(resumeText, jdText) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Logic: Highly scientific random assessment for now
  const score = Math.floor(Math.random() * 60) + 40 // 40-100
  const confidence = Number((Math.random() * 0.4 + 0.5).toFixed(2)) // 0.5-0.9

  const isStrong = score >= 75 && confidence >= 0.6

  return {
    score,
    confidence,
    summary: `Candidate shows ${isStrong ? 'strong' : 'moderate'} alignment with the role requirements based on the provided resume.`,
    skills_found: ['React', 'Node.js', 'Tailwind CSS', 'PostgreSQL'],
    gaps_found: isStrong ? [] : ['Cloud Infrastructure (AWS/GCP)', 'System Design'],
    recommendation: isStrong ? 'High priority for interview' : 'Standard screening recommended',
    raw_analysis: {
      match_details: {
        frontend: 0.9,
        backend: 0.7,
        devops: 0.4
      },
      evaluation_timestamp: new Date().toISOString()
    }
  }
}

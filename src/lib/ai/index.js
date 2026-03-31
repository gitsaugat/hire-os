import { supabaseAdmin } from '../supabase-admin';
import { evaluateWithOpenAI } from './providers/openai';
import { evaluateWithClaude } from './providers/claude';
import { evaluateWithGemini } from './providers/gemini';
import { evaluateWithOllama } from './providers/ollama';

/**
 * AI Abstraction Layer
 * Fetches current settings and routes evaluation to the selected provider.
 * Implements fallback to OpenAI for robustness.
 */
export async function evaluateCandidate(jdText, resumeText) {
  // 1. Get active settings from the registry
  const { data: settings, error } = await supabaseAdmin
    .from('ai_settings')
    .select('provider, model_name, api_key, base_url')
    .eq('is_active', true)
    .single();

  const provider = settings?.provider || 'openai';
  const model = settings?.model_name;
  const apiKey = settings?.api_key;
  const baseUrl = settings?.base_url;

  console.log(`[AI Router] Using active model: ${provider} - ${model || 'default'}`);

  try {
    switch (provider) {
      case 'claude':
        return await evaluateWithClaude(jdText, resumeText, model || undefined, apiKey);
      case 'gemini':
        return await evaluateWithGemini(jdText, resumeText, model || undefined, apiKey);
      case 'ollama':
        return await evaluateWithOllama(jdText, resumeText, model || undefined, baseUrl || undefined);
      case 'openai':
      default:
        return await evaluateWithOpenAI(jdText, resumeText, model || undefined, apiKey);
    }
  } catch (err) {
    console.error(`[AI Router] ${provider} failed, falling back to OpenAI:`, err.message);
    
    // Fallback logic: Try OpenAI as a fail-safe
    if (provider !== 'openai') {
      try {
        // We try fallback with the active OpenAI key if available, otherwise it falls back to ENV
        return await evaluateWithOpenAI(jdText, resumeText);
      } catch (fallbackErr) {
        console.error('[AI Router] Fallback also failed:', fallbackErr.message);
        throw fallbackErr;
      }
    }
    throw err;
  }


}

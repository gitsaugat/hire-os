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

/**
 * Generic string-in, string-out text generation
 * Routes to the currently active LLM provider.
 */
export async function generateCompletion(prompt) {
  const { data: settings } = await supabaseAdmin
    .from('ai_settings')
    .select('provider, model_name, api_key, base_url')
    .eq('is_active', true)
    .single();

  const provider = settings?.provider || 'openai';
  const model = settings?.model_name;
  const apiKey = settings?.api_key;
  const baseUrl = settings?.base_url;

  console.log(`[AI Router] Generating text with: ${provider}`);

  // Dynamic imports to prevent circular dependencies if needed, or we can just import at top.
  // The imports are already at the top of the file, but we need to import the generateWithX functions.
  // Wait, I didn't import them at the top. Let's assume I can dynamic import them or I need to update the imports block. 
  // Let me just dynamic import them to be safe and clean.
  
  try {
    switch (provider) {
      case 'claude':
        const { generateWithClaude } = await import('./providers/claude');
        return await generateWithClaude(prompt, model || undefined, apiKey);
      case 'ollama':
        const { generateWithOllama } = await import('./providers/ollama');
        return await generateWithOllama(prompt, model || undefined, baseUrl || undefined);
      case 'gemini':
        // Fallback to openai if gemini generator isn't implemented fully yet
        // A generic generator for Gemini can be added or we fallback
        console.warn('[AI Router] Gemini textual generation pending, falling back to OpenAI');
        const { generateWithOpenAI: fallbackG } = await import('./providers/openai');
        return await fallbackG(prompt);
      case 'openai':
      default:
        const { generateWithOpenAI } = await import('./providers/openai');
        return await generateWithOpenAI(prompt, model || undefined, apiKey);
    }
  } catch (err) {
    console.error(`[AI Router] ${provider} generation failed:`, err.message);
    throw err;
  }
}

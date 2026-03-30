import { supabaseAdmin } from './supabase-admin';

/**
 * Fetch the active AI provider settings.
 */
/**
 * Fetch the currently active AI model setting.
 */
export async function getAISettings() {
  const { data, error } = await supabaseAdmin
    .from('ai_settings')
    .select('*')
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[getAISettings] Error:', error.message);
  }

  return { data, error };
}

/**
 * List all configured AI models in the registry.
 */
export async function listAISettings() {
  const { data, error } = await supabaseAdmin
    .from('ai_settings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[listAISettings] Error:', error.message);
  }

  return { data, error };
}

/**
 * Add a new model configuration to the registry.
 */
export async function addAISetting(provider, model_name, api_key = null) {
  const { data, error } = await supabaseAdmin
    .from('ai_settings')
    .insert({
      provider,
      model_name,
      api_key,
      is_active: false // New models are inactive by default
    })
    .select()
    .single();

  if (error) {
    console.error('[addAISetting] Error:', error.message);
  }

  return { data, error };
}

/**
 * Set a specific model as the active one.
 * This will deactivate all other models.
 */
export async function setActiveAISetting(id) {
  // 1. Deactivate all
  await supabaseAdmin
    .from('ai_settings')
    .update({ is_active: false })
    .neq('id', id);

  // 2. Activate the target
  const { data, error } = await supabaseAdmin
    .from('ai_settings')
    .update({ is_active: true })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('[setActiveAISetting] Error:', error.message);
  }

  return { data, error };
}

/**
 * Delete a model configuration from the registry.
 */
export async function deleteAISetting(id) {
  const { error } = await supabaseAdmin
    .from('ai_settings')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[deleteAISetting] Error:', error.message);
  }

  return { error };
}



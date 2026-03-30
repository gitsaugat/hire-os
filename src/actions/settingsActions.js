'use server'

import { updateAISettings } from '@/lib/settings'
import { revalidatePath } from 'next/cache'

/**
 * Server action to update AI provider and model settings.
 */
import { addAISetting, setActiveAISetting, deleteAISetting } from '@/lib/settings'

/**
 * Action to add a new model to the registry.
 */
export async function addModelAction(formData) {
  const provider   = formData.get('provider')
  const modelName  = formData.get('model_name')?.trim()
  const apiKey     = formData.get('api_key')?.trim() || null

  if (!provider || !modelName) {
    return { success: false, error: 'Provider and Model Name are required.' }
  }

  const { error } = await addAISetting(provider, modelName, apiKey)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

/**
 * Action to set a model as active.
 */
export async function activateModelAction(id) {
  const { error } = await setActiveAISetting(id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}

/**
 * Action to delete a model.
 */
export async function deleteModelAction(id) {
  const { error } = await deleteAISetting(id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}


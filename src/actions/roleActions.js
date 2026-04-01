'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

/**
 * Create a new role.
 */
export async function createRoleAction(formData) {
  const title = formData.get('title')
  const team = formData.get('team')
  const location = formData.get('location')
  const level = formData.get('level')
  const description = formData.get('description')
  const requirements = formData.get('requirements')

  if (!title || !team || !level) {
    return { error: 'Title, Team, and Level are required.' }
  }

  // Combine description and requirements into jd_text
  const jd_text = `${description}\n\nRequirements:\n${requirements}`

  const { data, error } = await supabaseAdmin
    .from('roles')
    .insert({
      title,
      team,
      location,
      level,
      jd_text,
      status: 'OPEN'
    })
    .select()
    .single()

  if (error) {
    console.error('[CreateRole] Error:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/roles')
  revalidatePath('/careers')
  return { success: true, role: data }
}

/**
 * Update an existing role.
 */
export async function updateRoleAction(id, formData) {
  const title = formData.get('title')
  const team = formData.get('team')
  const location = formData.get('location')
  const level = formData.get('level')
  const description = formData.get('description')
  const requirements = formData.get('requirements')
  const status = formData.get('status') || 'OPEN'

  if (!id) return { error: 'Role ID is required.' }

  const jd_text = `${description}\n\nRequirements:\n${requirements}`

  const { data, error } = await supabaseAdmin
    .from('roles')
    .update({
      title,
      team,
      location,
      level,
      jd_text,
      status
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('[UpdateRole] Error:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/roles')
  revalidatePath('/careers')
  return { success: true, role: data }
}

/**
 * Delete a role.
 */
export async function deleteRoleAction(id) {
  if (!id) return { error: 'Role ID is required.' }

  // Check if role has applicants first (prevent orphans)
  const { count, error: countErr } = await supabaseAdmin
    .from('candidates')
    .select('*', { count: 'exact', head: true })
    .eq('role_id', id)

  if (countErr) return { error: countErr.message }
  if (count > 0) {
    return { error: `Cannot delete role with ${count} active applicants. Consider closing the role instead.` }
  }

  const { error } = await supabaseAdmin
    .from('roles')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[DeleteRole] Error:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/roles')
  revalidatePath('/careers')
  return { success: true }
}

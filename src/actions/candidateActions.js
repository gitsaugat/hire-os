'use server'

import { supabase } from '@/lib/supabase'
import { createCandidate, updateCandidateStatus } from '@/lib/candidates'
import { revalidatePath } from 'next/cache'

const ALLOWED_MIME_TYPES = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx']
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB

/**
 * Server action — handles the /apply form submission.
 * Uploads resume to Supabase Storage then creates the candidate.
 *
 * @param {FormData} formData
 * @returns {{ success: boolean, error?: string, candidateId?: string }}
 */
export async function applyAction(formData) {
  const name        = formData.get('name')?.trim()
  const email       = formData.get('email')?.trim()
  const linkedin    = formData.get('linkedin_url')?.trim() || null
  const github      = formData.get('github_url')?.trim() || null
  const roleId      = formData.get('role_id')
  const resumeFile  = formData.get('resume')

  // Basic validation
  if (!name || !email || !roleId) {
    return { success: false, error: 'Name, email, and role are required.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Invalid email address.' }
  }

  let resumeUrl = null

  // Handle resume upload
  if (resumeFile && resumeFile.size > 0) {
    if (resumeFile.size > MAX_FILE_BYTES) {
      return { success: false, error: 'Resume must be under 5 MB.' }
    }

    const fileExt = resumeFile.name.slice(resumeFile.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(fileExt)) {
      return { success: false, error: 'Resume must be a PDF or Word document.' }
    }

    if (!ALLOWED_MIME_TYPES.includes(resumeFile.type) && resumeFile.type !== '') {
      return { success: false, error: 'Invalid file type. Upload PDF or DOCX.' }
    }

    const fileName = `${Date.now()}-${email.replace(/[^a-z0-9]/gi, '_')}${fileExt}`

    const arrayBuffer = await resumeFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(fileName, buffer, {
        contentType: resumeFile.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Resume upload error:', uploadError)
      return { success: false, error: 'Failed to upload resume. Please try again.' }
    }

    const { data: urlData } = supabase.storage.from('resumes').getPublicUrl(uploadData.path)
    resumeUrl = urlData.publicUrl
  }

  const { data, error } = await createCandidate({
    name,
    email,
    linkedin_url: linkedin,
    github_url: github,
    resume_url: resumeUrl,
    role_id: roleId,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin')
  return { success: true, candidateId: data.id }
}

/**
 * Server action — handles status update from admin candidate detail page.
 *
 * @param {FormData} formData
 * @returns {{ success: boolean, error?: string }}
 */
export async function updateStatusAction(formData) {
  const candidateId = formData.get('candidate_id')
  const newStatus   = formData.get('new_status')
  const reason      = formData.get('reason')?.trim() || ''

  if (!candidateId || !newStatus) {
    return { success: false, error: 'Missing candidate ID or status.' }
  }

  const { error } = await updateCandidateStatus(candidateId, newStatus, reason, 'HUMAN')

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/candidate/${candidateId}`)
  revalidatePath('/admin')
  return { success: true }
}

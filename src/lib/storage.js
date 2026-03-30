import { supabase } from './supabase'
import { supabaseAdmin } from './supabase-admin'

const BUCKET = 'resumes'
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx'])
const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5 MB
const SIGNED_URL_TTL_SECONDS = 60 * 60 // 1 hour

/**
 * Validate a resume file before upload.
 * Returns null if valid, or an error string if not.
 *
 * @param {File} file
 * @returns {string | null}
 */
export function validateResumeFile(file) {
  if (!file || file.size === 0) {
    return 'Resume is required.'
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'Resume must be under 5 MB.'
  }
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return 'Resume must be a PDF or Word document (.pdf, .doc, .docx).'
  }
  // Only reject on MIME mismatch if the browser actually provided one
  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return 'Invalid file type. Upload PDF or DOCX only.'
  }
  return null
}

/**
 * Determine the normalised content-type for storage.
 * Falls back to 'application/pdf' for .pdf when browser omits MIME.
 *
 * @param {File} file
 * @returns {string}
 */
function resolveContentType(file) {
  if (file.type && ALLOWED_MIME_TYPES.has(file.type)) return file.type
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  const fallback = {
    '.pdf':  'application/pdf',
    '.doc':  'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  }
  return fallback[ext] ?? 'application/octet-stream'
}

/**
 * Upload a resume file to Supabase Storage under:
 *   resumes/{candidateId}/resume{ext}
 *
 * The original filename is discarded. Only the extension is preserved
 * so the admin can still download a .pdf vs .docx.
 *
 * @param {File} file
 * @param {string} candidateId  UUID of the candidate record
 * @returns {{ path: string | null, error: string | null }}
 */
export async function uploadResume(file, candidateId) {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  const storagePath = `${candidateId}/resume${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Use admin client (service role key) to bypass storage RLS.
  // This is safe because uploadResume is only called from server actions.
  if (!supabaseAdmin) {
    console.error('[uploadResume] SUPABASE_SERVICE_ROLE_KEY is missing from .env.local')
    return { path: null, error: 'Storage configuration error (missing admin key).' }
  }

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: resolveContentType(file),
      upsert: true, // overwrite if re-applying (edge case)
    })

  if (error) {
    console.error('[uploadResume] Storage error:', error)
    return { path: null, error: 'Failed to upload resume. Please try again.' }
  }

  return { path: data.path, error: null }
}

/**
 * Generate a short-lived signed URL for a stored resume.
 * Retries once on failure.
 *
 * @param {string} storagePath  e.g. "abc-uuid/resume.pdf"
 * @param {number} [ttl]        seconds the URL is valid (default 1 hour)
 * @returns {{ url: string | null, error: string | null }}
 */
export async function getSignedResumeUrl(storagePath, ttl = SIGNED_URL_TTL_SECONDS) {
  // Use admin client for signing to ensure the admin dashboard
  // can always generate links from the private bucket.
  if (!supabaseAdmin) {
    console.error('[getSignedResumeUrl] SUPABASE_SERVICE_ROLE_KEY is missing')
    return { url: null, error: 'Storage configuration error.' }
  }

  async function attempt() {
    return supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, ttl)
  }

  let { data, error } = await attempt()

  // Retry once on transient failure
  if (error) {
    console.warn('[getSignedResumeUrl] First attempt failed, retrying…', error)
    ;({ data, error } = await attempt())
  }

  if (error) {
    console.error('[getSignedResumeUrl] Signed URL generation failed:', error)
    return { url: null, error: 'Could not generate resume access link.' }
  }

  return { url: data.signedUrl, error: null }
}


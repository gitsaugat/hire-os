import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCandidateById } from '@/lib/candidates'
import { getSignedResumeUrl } from '@/lib/storage'
import StatusBadge from '@/components/StatusBadge'
import StatusTimeline from '@/components/StatusTimeline'
import StatusUpdateForm from './StatusUpdateForm'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const { data } = await getCandidateById(id)
  return { title: data ? `${data.name} – HireOS Admin` : 'Candidate – HireOS Admin' }
}

export default async function CandidateDetailPage({ params }) {
  const { id } = await params
  const { data: candidate, error } = await getCandidateById(id)

  if (error || !candidate) notFound()

  // Generate a 1-hour signed URL for the resume (private bucket)
  let resumeSignedUrl = null
  let resumeSignError = null
  if (candidate.resume_url) {
    const { url, error: signErr } = await getSignedResumeUrl(candidate.resume_url)
    resumeSignedUrl = url
    resumeSignError = signErr
  }


  return (
    <div className="px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-400">
        <Link href="/admin" className="hover:text-gray-700 transition-colors">Candidates</Link>
        <span>›</span>
        <span className="text-gray-700 font-medium">{candidate.name}</span>
      </nav>

      {/* Gradient header card */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold text-white backdrop-blur-sm">
              {candidate.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{candidate.name}</h1>
              <p className="mt-0.5 text-sm text-white/70">{candidate.email}</p>
            </div>
          </div>
          <StatusBadge status={candidate.status} variant="light" />
        </div>

        <div className="mt-5 flex flex-wrap gap-6 text-sm text-white/70">
          <div><span className="text-white/50">Role</span><p className="font-medium text-white">{candidate.role?.title ?? '—'}</p></div>
          <div><span className="text-white/50">Team</span><p className="font-medium text-white">{candidate.role?.team ?? '—'}</p></div>
          <div><span className="text-white/50">Location</span><p className="font-medium text-white">{candidate.role?.location ?? '—'}</p></div>
          <div><span className="text-white/50">Applied</span><p className="font-medium text-white">{formatDate(candidate.created_at)}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-1">
          {/* Links */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wider">Links</h2>
            <div className="flex flex-wrap gap-2">
              {candidate.linkedin_url && (
                <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                  LinkedIn ↗
                </a>
              )}
              {candidate.github_url && (
                <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
                  GitHub ↗
                </a>
              )}
              {resumeSignedUrl && (
                <a href={resumeSignedUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-indigo-600 hover:to-purple-700 transition-all">
                  Resume ↗
                </a>
              )}
              {candidate.resume_url && !resumeSignedUrl && resumeSignError && (
                <span className="text-xs text-red-400">Resume link unavailable</span>
              )}
              {!candidate.linkedin_url && !candidate.github_url && !candidate.resume_url && (
                <p className="text-sm text-gray-400">No links provided</p>
              )}
            </div>
          </div>

          {/* AI Score & Insights */}
          {(candidate.ai_score != null || candidate.status === 'SCREENING') && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">AI Evaluation</h2>
              
              {candidate.status === 'SCREENING' ? (
                <div className="flex flex-col gap-3 animate-pulse">
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-amber-500 italic">Processing...</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100" />
                  <p className="text-xs text-gray-400">AI is currently analyzing the resume against the job description.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {Math.round(candidate.ai_score * 100)}
                    </span>
                    <span className="mb-1 text-sm text-gray-400">/ 100</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${Math.round(candidate.ai_score * 100)}%` }}
                    />
                  </div>
                  {candidate.ai_confidence != null && (
                    <p className="mt-2 text-xs text-gray-400">
                      Confidence: {Math.round(candidate.ai_confidence * 100)}%
                    </p>
                  )}

                  {/* Detailed AI Insights */}
                  {candidate.ai_profile && (
                    <div className="mt-6 space-y-4 border-t border-gray-50 pt-4">
                      <div>
                        <h3 className="text-xs font-bold text-gray-900 uppercase">Recommendation</h3>
                        <p className="mt-1 text-sm text-indigo-600 font-semibold">{candidate.ai_profile.recommendation}</p>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-gray-400 uppercase">Analysis Summary</h3>
                        <p className="mt-1 text-sm text-gray-600 leading-relaxed">{candidate.ai_profile.summary}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-xs font-bold text-teal-600 uppercase">Key Skills</h3>
                          <ul className="mt-1 space-y-1">
                            {candidate.ai_profile.skills_found?.map(s => (
                              <li key={s} className="text-xs text-gray-600 flex items-center gap-1">
                                <span className="text-teal-500">✓</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-amber-600 uppercase">Missing/Gaps</h3>
                          <ul className="mt-1 space-y-1">
                            {candidate.ai_profile.gaps_found?.length > 0 ? (
                              candidate.ai_profile.gaps_found.map(g => (
                                <li key={g} className="text-xs text-gray-600 flex items-center gap-1">
                                  <span className="text-amber-500">⚠</span> {g}
                                </li>
                              ))
                            ) : (
                              <li className="text-xs text-gray-400">None identified</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}


          {/* Status update form */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Update Status</h2>
            <StatusUpdateForm candidateId={candidate.id} currentStatus={candidate.status} />
          </div>
        </div>

        {/* Right column — timeline */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-base font-semibold text-gray-900">Status History</h2>
            <StatusTimeline history={candidate.status_history} />
          </div>
        </div>
      </div>
    </div>
  )
}

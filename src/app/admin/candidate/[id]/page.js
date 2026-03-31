import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCandidateById, getSchedulingDataByCandidateId } from '@/lib/candidates'
import { getSignedResumeUrl } from '@/lib/storage'
import StatusBadge from '@/components/StatusBadge'
import StatusTimeline from '@/components/StatusTimeline'
import StatusUpdateForm from './StatusUpdateForm'
import InterviewScheduler from '@/components/admin/InterviewScheduler'
import DeleteCandidateButton from '@/components/admin/DeleteCandidateButton'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  })
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const { data } = await getCandidateById(id, true)
  return { title: data ? `${data.name} – HireOS Admin` : 'Candidate – HireOS Admin' }
}

export default async function CandidateDetailPage({ params }) {
  const { id } = await params
  const [
    { data: candidate, error },
    { data: schedulingData }
  ] = await Promise.all([
    getCandidateById(id, true),
    getSchedulingDataByCandidateId(id)
  ])

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

          {/* Interview Scheduling */}
          <InterviewScheduler 
            candidate={candidate} 
            interviews={schedulingData?.interviews || []} 
            holds={schedulingData?.holds || []} 
          />

          {/* AI Score & Insights */}
          {(candidate.ai_profile != null || candidate.ai_score != null || candidate.status === 'SCREENING' || candidate.status === 'SCREENING_FAILED') && (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
              <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-lg">✨</span> AI Evaluation
                </h2>
                {candidate.ai_confidence != null && (
                  <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                    {Math.round(candidate.ai_confidence * 100)}% Confidence
                  </span>
                )}
              </div>

              {candidate.status === 'SCREENING' ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative h-16 w-16">
                    <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Analyzing Candidate...</p>
                    <p className="text-xs text-gray-400 mt-1">Cross-referencing resume with job requirements.</p>
                  </div>
                </div>
              ) : (candidate.ai_profile && Object.keys(candidate.ai_profile).length > 0) ? (
                <div className="p-5 space-y-6">
                  {/* Score & Recommendation Banner */}
                  <div className="flex flex-col gap-4">

                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-gray-900 leading-none">
                          {Math.round((candidate.ai_score || 0) * 100)}
                        </span>
                        <span className="text-sm font-bold text-gray-300">/100</span>
                      </div>
                      <div className={`px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight shadow-sm ${candidate.ai_profile?.recommendation?.toLowerCase().includes('shortlist') || candidate.ai_score > 0.8
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : candidate.ai_profile?.recommendation?.toLowerCase().includes('interview') || candidate.ai_score > 0.6
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                        }`}>
                        {candidate.ai_profile?.recommendation || 'Evaluated'}
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000"
                        style={{ width: `${Math.round((candidate.ai_score || 0) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Analysis Summary */}
                  {candidate.ai_profile?.summary && (

                    < div className="relative rounded-xl bg-gray-50 p-4 border border-gray-100">

                      <span className="absolute -top-2 -left-1 text-2xl text-gray-200 font-serif">“</span>
                      <p className="text-[13px] text-gray-600 leading-relaxed italic">
                        {candidate.ai_profile.summary}
                      </p>
                    </div>
                  )}

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/50 border border-indigo-50">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-lg">📅</div>
                        <div>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Experience</p>
                          <p className="text-sm font-bold text-indigo-900">{candidate.ai_profile.experience_years ?? '—'} Relevant Years</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-green-400"></span>
                          Core Strengths
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed bg-green-50/30 p-3 rounded-xl border border-green-50/50">
                          {candidate.ai_profile.strengths || 'Strong general background.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-red-400"></span>
                          Potential Risks
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed bg-red-50/30 p-3 rounded-xl border border-red-50/50 italic">
                          {candidate.ai_profile.risks || 'No immediate concerns found.'}
                        </p>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    <div className="space-y-4 pt-2">
                      <div>
                        <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2 px-1">Found Skills</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.ai_profile?.skills_found && candidate.ai_profile.skills_found.length > 0 ? (
                            candidate.ai_profile.skills_found.map((s, idx) => (
                              <span key={idx} className="px-2 py-1 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-md border border-teal-100">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic px-1">Not explicitly listed</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 px-1">Knowledge Gaps</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.ai_profile?.gaps_found && candidate.ai_profile.gaps_found.length > 0 ? (
                            candidate.ai_profile.gaps_found.map((g, idx) => (
                              <span key={idx} className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-md border border-amber-100">
                                {g}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-gray-400 italic px-1">No major gaps identified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-10 text-center">
                  <span className="text-4xl mb-4 block">🤖</span>
                  <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">Evaluation Unavailable</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
                    The AI analysis is currently unavailable or the screening process has not yet completed.
                    {candidate.status === 'SCREENING_FAILED' && (
                      <span className="block mt-2 text-red-500 font-bold uppercase tracking-tighter">Screening Failed</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Status update form */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wider">Update Status</h2>
            <StatusUpdateForm candidateId={candidate.id} currentStatus={candidate.status} />
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-red-100 bg-red-50/10 p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-red-500 uppercase tracking-wider">Danger Zone</h2>
            <DeleteCandidateButton candidateId={candidate.id} />
          </div>
        </div>

        {/* Right column — research profile + timeline */}
        <div className="lg:col-span-2 space-y-6">

          {/* AI Research Profile */}
          {(candidate.status === 'SHORTLISTED' || candidate.research_profile) && (
            <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="text-lg">🔍</span> AI Research Profile
                </h2>
                {candidate.research_profile && (
                  <span className="text-[10px] font-bold text-indigo-500 bg-white px-2 py-1 rounded-md border border-indigo-100">
                    Intelligence Brief
                  </span>
                )}
              </div>

              {!candidate.research_profile ? (
                <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Researching Candidate...</p>
                    <p className="text-xs text-gray-400 mt-1">Generating intelligence profile from resume and social links.</p>
                  </div>
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  {/* Candidate Brief — Top Highlight */}
                  {candidate.research_profile.candidate_brief && (
                    <div className="rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 p-5 border border-indigo-100">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Candidate Brief</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{candidate.research_profile.candidate_brief}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* LinkedIn Summary */}
                    {candidate.research_profile.linkedin_summary && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                          <span>💼</span> LinkedIn Summary
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed bg-blue-50/40 p-3 rounded-xl border border-blue-50">
                          {candidate.research_profile.linkedin_summary}
                        </p>
                      </div>
                    )}

                    {/* GitHub Summary */}
                    {candidate.research_profile.github_summary && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
                          <span>💻</span> GitHub / Technical
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/60 p-3 rounded-xl border border-gray-100">
                          {candidate.research_profile.github_summary}
                        </p>
                      </div>
                    )}

                    {/* Company Analysis */}
                    {candidate.research_profile.company_analysis && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                          <span>🏢</span> Company & Pedigree
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed bg-indigo-50/40 p-3 rounded-xl border border-indigo-50">
                          {candidate.research_profile.company_analysis}
                        </p>
                      </div>
                    )}

                    {/* Thought Leadership */}
                    {candidate.research_profile.thought_leadership && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
                          <span>✍️</span> Thought Leadership
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed bg-orange-50/40 p-3 rounded-xl border border-orange-50">
                          {candidate.research_profile.thought_leadership}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Notable Projects */}
                  {candidate.research_profile.notable_projects?.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-1.5">
                        <span>🚀</span> Notable Projects
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {candidate.research_profile.notable_projects.map((project, idx) => (
                          <span key={idx} className="text-[11px] text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-lg font-medium">
                            {project}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Signals */}
                  {candidate.research_profile.signals?.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                        <span>⚡</span> Hiring Signals
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        {candidate.research_profile.signals.map((signal, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-emerald-50/60 border border-emerald-50">
                            <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                            <span className="text-[11px] text-emerald-800 font-medium">{signal}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inconsistencies */}
                  {candidate.research_profile.inconsistencies?.length > 0 && candidate.research_profile.inconsistencies.some(Boolean) && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
                        <span>⚠️</span> Flags & Inconsistencies
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        {candidate.research_profile.inconsistencies.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                            <span className="text-amber-500 mt-0.5 flex-shrink-0">!</span>
                            <span className="text-[11px] text-amber-800 font-medium">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status Timeline */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-6 text-base font-semibold text-gray-900">Status History</h2>
            <StatusTimeline history={candidate.status_history} />
          </div>
        </div>
      </div>
    </div>
  )
}

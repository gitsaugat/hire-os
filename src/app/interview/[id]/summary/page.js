import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase-admin'
import SummaryActions from './SummaryActions'

export const dynamic = 'force-dynamic'

export default async function InterviewSummaryPage({ params }) {
  const { id } = await params

  const { data: interview, error: interviewError } = await supabaseAdmin
    .from('interviews')
    .select('*, candidate:candidates!inner(*)')
    .eq('id', id)
    .single()

  if (interviewError || !interview) {
    notFound()
  }

  const { candidate, summary, bias_flags, transcript } = interview

  const recColor = summary?.recommendation === 'advance' 
    ? 'bg-green-100 text-green-700 border-green-200'
    : summary?.recommendation === 'reject'
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-amber-100 text-amber-700 border-amber-200'

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-200 pb-32">
      {/* 1. HEADER */}
      <header className="border-b border-[#2a2a35] bg-[#12121a] px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-white">{candidate.name}</h1>
              <span className="text-sm px-2 py-0.5 rounded-full bg-[#1e1e2d] text-gray-400 border border-[#2a2a35]">
                {candidate.role?.title || 'Candidate'}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Interviewed on {new Date(interview.created_at).toLocaleDateString()} 
              {' • '}
              Evaluated by Read.ai Bot
            </p>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">AI Recommendation</span>
            <div className={`px-4 py-1.5 rounded-lg border text-sm font-bold uppercase tracking-wider ${recColor}`}>
              {summary?.recommendation || 'Pending'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-8 space-y-8">
        
        {/* 2. AI ASSESSMENT CARD */}
        <section className="bg-[#12121a] border border-[#2a2a35] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="text-[#7c6ef0]">✨</span> AI Assessment
            </h2>
            <span className="text-sm font-bold px-3 py-1 bg-[#1e1e2d] border border-[#2a2a35] rounded-lg">
              {summary?.confidence || 0}% Confidence
            </span>
          </div>
          
          <p className="text-gray-300 leading-relaxed mb-6 font-medium">
            {summary?.overall_assessment}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Strengths
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary?.strengths?.map((s, i) => (
                  <span key={i} className="text-xs bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-1 rounded-md">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Concerns
              </h3>
              <div className="flex flex-wrap gap-2">
                {summary?.concerns?.map((c, i) => (
                  <span key={i} className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 rounded-md">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#2a2a35]">
            <span className="text-xs text-gray-500 font-bold uppercase tracking-wider mr-2">Reason:</span>
            <span className="text-sm text-gray-300 italic">{summary?.recommendation_reason}</span>
          </div>
        </section>

        {/* 3. BIAS REPORT CARD */}
        <section className={`border rounded-2xl p-6 ${bias_flags?.clean ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/30'}`}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className={bias_flags?.clean ? 'text-emerald-500' : 'text-amber-500'}>
                {bias_flags?.clean ? '✓' : '⚠️'}
              </span> 
              Bias Detection Report
            </h2>
          </div>
          
          <p className={`text-sm mb-4 ${bias_flags?.clean ? 'text-emerald-400' : 'text-amber-400 font-medium'}`}>
            {bias_flags?.summary}
          </p>

          {!bias_flags?.clean && bias_flags?.flags?.length > 0 && (
            <div className="space-y-4 mt-6">
              {bias_flags.flags.map((flag, i) => (
                <div key={i} className="bg-[#12121a] border border-amber-500/30 p-4 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#7c6ef0]">Transcript Quote</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded">
                      {flag.severity} RISK
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 font-mono bg-[#0a0a0f] p-3 rounded-lg border border-[#2a2a35] mb-3">
                    "{flag.quote}"
                  </p>
                  <p className="text-sm text-amber-200">
                    <span className="font-bold flex-shrink-0 mr-2">Concern:</span>
                    {flag.concern}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 4. FULL TRANSCRIPT */}
        <details className="group bg-[#12121a] border border-[#2a2a35] rounded-2xl overflow-hidden">
          <summary className="p-6 cursor-pointer text-lg font-bold text-white flex items-center justify-between list-none">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">📄</span> Raw Transcript
            </div>
            <span className="text-gray-500 text-sm group-open:hidden">Show</span>
            <span className="text-gray-500 text-sm hidden group-open:block">Hide</span>
          </summary>
          <div className="p-6 border-t border-[#2a2a35] bg-[#0a0a0f] font-mono text-sm leading-relaxed max-h-[500px] overflow-y-auto whitespace-pre-wrap text-gray-400">
            {transcript?.split('\n').map((line, idx) => {
              if (line.startsWith('Interviewer:')) return <div key={idx} className="text-[#7c6ef0] mb-2">{line}</div>
              if (line.startsWith('Candidate:')) return <div key={idx} className="text-gray-200 mb-2">{line}</div>
              return <div key={idx} className="mb-2">{line}</div>
            })}
          </div>
        </details>
      </main>

      {/* 5. ACTION BAR (Sticky) */}
      <SummaryActions candidateId={candidate.id} />
    </div>
  )
}

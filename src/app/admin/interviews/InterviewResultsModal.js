'use client'

import { useState } from 'react'

export default function InterviewResultsModal({ interview, onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [view, setView] = useState('results') // 'results' | 'offer'
  const [offerInsights, setOfferInsights] = useState(null)
  
  // Form State for Offer
  const [offerForm, setOfferForm] = useState({
    salary: '',
    equity: '',
    start_date: '',
    expiration_date: '',
    notes: ''
  })

  if (!interview) return null

  const { candidate, summary, bias_flags, transcript, start_time } = interview

  const formattedDate = new Date(start_time).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const recColor = summary?.recommendation === 'advance' 
    ? 'bg-green-100 text-green-700 border-green-200'
    : summary?.recommendation === 'reject'
    ? 'bg-red-100 text-red-700 border-red-200'
    : 'bg-amber-100 text-amber-700 border-amber-200'

  const handleAction = async (status) => {
    if (status === 'offer') {
      await prepareOfferDraft()
      return
    }

    const actionName = status === 'hold' ? 'Place on Hold' : 'Reject Candidate'
    if (!window.confirm(`Are you sure you want to ${actionName}?`)) return
    
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/applications/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidate.id, status })
      })
      const data = await res.json()
      if (data.success) {
        onClose()
        window.location.reload()
      } else {
        alert('Action failed: ' + data.error)
      }
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const prepareOfferDraft = async () => {
    setIsSubmitting(true)
    try {
      // 1. Get AI Insights
      const draftRes = await fetch('/api/interviews/offer-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id: interview.id })
      })
      const draftData = await draftRes.json()
      if (!draftData.success) throw new Error(draftData.error)

      // 2. Create the Offer automatically
      const createRes = await fetch('/api/offers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: candidate.id,
          salary: draftData.insights.suggested_salary,
          equity: draftData.insights.suggested_equity,
          start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: draftData.insights.benefits.join(', '),
          ai_insights: draftData.insights // This needs the DB column
        })
      })
      
      const createData = await createRes.json()
      if (createData.success) {
        // Redirect to centralized offer page
        window.location.href = `/admin/offers/${createData.offer.id}`
      } else {
        alert('Failed to create draft offer: ' + createData.error)
      }
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="h-full w-full max-w-2xl bg-[#0a0a0f] shadow-2xl border-l border-[#2a2a35] flex flex-col animate-in slide-in-from-right duration-300"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2a2a35] bg-[#12121a] px-6 py-4">
          <div className="flex items-center gap-3">
            {view === 'offer' && (
              <button 
                onClick={() => setView('results')}
                className="p-1.5 hover:bg-[#1e1e2d] rounded-lg text-gray-400 transition-colors"
              >
                ←
              </button>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">
                {view === 'offer' ? 'Draft Offer' : candidate?.name}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {candidate?.role?.title} {view === 'results' && `• ${formattedDate}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-[#1e1e2d] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          
          {view === 'results' ? (
            <>
              {/* AI Recommendation */}
              <div className="flex items-center justify-between bg-[#12121a] border border-[#2a2a35] rounded-xl p-4 shadow-inner">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">AI Recommendation</span>
                  <div className={`inline-block px-3 py-1 rounded-md border text-xs font-bold uppercase tracking-wider ${recColor}`}>
                    {summary?.recommendation || 'Pending'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black block mb-1">Confidence Score</span>
                  <span className="text-sm font-bold text-white bg-[#1e1e2d] border border-[#2a2a35] px-2 py-1 rounded shadow-sm">
                    {summary?.confidence || 0}%
                  </span>
                </div>
              </div>

              {/* Assessment */}
              <section>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-[#7c6ef0]">✨</span> Overall Assessment
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed bg-[#12121a] p-4 rounded-xl border border-[#2a2a35]">
                  {summary?.overall_assessment}
                </p>
              </section>

              {/* Strengths & Concerns */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#12121a] border border-[#2a2a35] p-4 rounded-xl">
                  <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {summary?.strengths?.map((s, i) => (
                      <li key={i} className="text-xs text-gray-300">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-[#12121a] border border-[#2a2a35] p-4 rounded-xl">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Concerns
                  </h4>
                  <ul className="space-y-2">
                    {summary?.concerns?.map((c, i) => (
                      <li key={i} className="text-xs text-gray-300">• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Bias Report */}
              <section className={`border rounded-xl p-4 ${bias_flags?.clean ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className={bias_flags?.clean ? 'text-emerald-500' : 'text-amber-500'}>
                    {bias_flags?.clean ? '✓' : '⚠️'}
                  </span> 
                  Bias Report: <span className="text-xs font-normal text-gray-400">{bias_flags?.summary}</span>
                </h3>
              </section>

              {/* Transcript */}
              <section>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <span className="text-gray-500">📄</span> Interview Transcript
                </h3>
                <div className="bg-[#12121a] border border-[#2a2a35] rounded-xl p-4 h-[300px] overflow-y-auto custom-scrollbar font-mono text-xs leading-relaxed text-gray-400 shadow-inner">
                  {transcript?.split('\n').map((line, idx) => {
                    if (line.startsWith('Interviewer:')) return <div key={idx} className="text-[#7c6ef0] font-bold mb-2">{line}</div>
                    if (line.startsWith('Candidate:')) return <div key={idx} className="text-gray-200 font-bold mb-2">{line}</div>
                    return <div key={idx} className="mb-2">{line}</div>
                  })}
                </div>
              </section>
            </>
          ) : (
            /* Offer Configuration View */
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* AI Offer Insights Card */}
              <div className="bg-gradient-to-br from-[#1a1a2e] to-[#12121a] border border-[#3e3e4a] rounded-[2rem] p-6 mb-8 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <span className="text-6xl text-[#7c6ef0]">✨</span>
                </div>
                
                <header className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[10px] text-[#7c6ef0] uppercase tracking-[0.2em] font-black block mb-1">AI Market Analysis</span>
                    <h3 className="text-xl font-bold text-white tracking-tight">Competitive Intelligence</h3>
                  </div>
                  <div className="text-center bg-[#7c6ef0]/10 border border-[#7c6ef0]/20 rounded-2xl px-4 py-2">
                    <span className="text-[10px] text-gray-500 uppercase font-black block mb-0.5">Value Score</span>
                    <span className="text-lg font-black text-[#7c6ef0]">{offerInsights?.candidate_value_score}/10</span>
                  </div>
                </header>

                <div className="grid grid-cols-2 gap-6 mb-6">
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Avg. Market Rate</span>
                      <div className="text-lg font-bold text-white">
                        ${(offerInsights?.market_min/1000).toFixed(0)}k - ${(offerInsights?.market_max/1000).toFixed(0)}k
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 italic">Based on role and seniority</p>
                   </div>
                   <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">AI Recommendation</span>
                      <div className="text-lg font-bold text-[#7c6ef0]">
                        ${(offerInsights?.suggested_salary/1000).toFixed(0)}k
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{offerInsights?.suggested_equity}</p>
                   </div>
                </div>

                <div className="bg-[#7c6ef0]/5 border border-[#7c6ef0]/10 rounded-2xl p-4">
                  <h4 className="text-[10px] font-black text-[#7c6ef0] uppercase tracking-widest mb-1 flex items-center gap-2">
                    Why this score?
                  </h4>
                  <p className="text-xs text-gray-300 leading-relaxed italic">
                    "{offerInsights?.value_justification}"
                  </p>
                </div>
              </div>

              {/* Offer Form */}
              <form onSubmit={handleCreateOffer} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Annual Salary (USD)</label>
                    <input 
                      type="number"
                      value={offerForm.salary}
                      onChange={(e) => setOfferForm({...offerForm, salary: e.target.value})}
                      required
                      className="w-full bg-[#12121a] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] focus:ring-1 focus:ring-[#7c6ef0] outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Equity Stake</label>
                    <input 
                      type="text"
                      value={offerForm.equity}
                      onChange={(e) => setOfferForm({...offerForm, equity: e.target.value})}
                      placeholder="e.g. 0.05% Options"
                      className="w-full bg-[#12121a] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] focus:ring-1 focus:ring-[#7c6ef0] outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Start Date</label>
                    <input 
                      type="date"
                      value={offerForm.start_date}
                      onChange={(e) => setOfferForm({...offerForm, start_date: e.target.value})}
                      required
                      className="w-full bg-[#12121a] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] focus:ring-1 focus:ring-[#7c6ef0] outline-none transition-all shadow-inner [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Offer Expiration</label>
                    <input 
                      type="date"
                      value={offerForm.expiration_date}
                      onChange={(e) => setOfferForm({...offerForm, expiration_date: e.target.value})}
                      required
                      className="w-full bg-[#12121a] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] focus:ring-1 focus:ring-[#7c6ef0] outline-none transition-all shadow-inner [color-scheme:dark]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Benefits & Sign-on Bonus</label>
                  <textarea 
                    rows={3}
                    value={offerForm.notes}
                    onChange={(e) => setOfferForm({...offerForm, notes: e.target.value})}
                    placeholder="Sign-on bonus, Relocation, Learning budget..."
                    className="w-full bg-[#12121a] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] focus:ring-1 focus:ring-[#7c6ef0] outline-none transition-all shadow-inner resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#7c6ef0] to-[#6b5ded] text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-[#7c6ef0]/20 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Finalizing Offer...' : 'Confirm & Create Draft'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Actions (Results View Only) */}
        {view === 'results' && (
          <div className="border-t border-[#2a2a35] bg-[#12121a] px-6 py-4 flex items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
            <div className="flex gap-2">
              <button 
                onClick={() => handleAction('rejected')}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-all disabled:opacity-50"
              >
                Reject
              </button>
              <button 
                onClick={() => handleAction('hold')}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold text-amber-500 hover:bg-amber-500/10 rounded-lg border border-amber-500/20 transition-all disabled:opacity-50"
              >
                Hold
              </button>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleAction('offer')}
                disabled={isSubmitting}
                className="bg-white text-black hover:bg-gray-100 px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    Analysing Market...
                  </>
                ) : (
                  <>
                    <span>Draft Offer</span>
                    <span className="text-xs opacity-50">✨</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

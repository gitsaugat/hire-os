'use client'

// FORCE RE-COMPILE: v2

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function OfferReviewClient({ offer }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    salary: offer.salary,
    equity: offer.equity,
    start_date: offer.start_date,
    expiration_date: offer.expiration_date,
    notes: offer.notes
  })

  const [showCertificate, setShowCertificate] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Auto-open certificate if requested via query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('certificate') === 'true') {
      setShowCertificate(true)
    }
  }, [])

  if (!offer) return <div className="text-white p-10">Offer not found</div>

  const { candidate, ai_insights } = offer
  const role = candidate?.role

  const handleUpdate = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/offers/${offer.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.success) {
        alert('Offer updated successfully')
      } else {
        alert('Update failed: ' + data.error)
      }
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSend = async () => {
    if (!window.confirm('Are you sure you want to send this offer to the candidate?')) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/offers/${offer.id}/send`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        alert('Offer sent to candidate!')
        window.location.reload()
      } else {
        alert('Failed to send: ' + data.error)
      }
    } catch (e) {
      alert('Error: ' + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Review Offer</h1>
          <p className="text-gray-500 mt-1 font-medium">
            <span className="text-gray-900">{candidate?.name}</span> • <span className="text-[#7c6ef0]">{role?.title}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-black text-[#7c6ef0] hover:text-[#5a4ecc] transition-colors uppercase tracking-widest"
          >
            ← Back
          </button>
          
          {offer.status === 'ACCEPTED' && (
            <button 
              onClick={() => setShowCertificate(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-green-500/20"
            >
              <span className="text-lg">📜</span> View Signed Certificate
            </button>
          )}

          <button 
            onClick={() => setShowPreview(true)}
            className="bg-white border border-gray-200 hover:border-[#7c6ef0] hover:text-[#7c6ef0] text-gray-600 px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm"
          >
            <span className="text-lg">👁️</span> Preview Letter
          </button>

          <button 
            onClick={handleSend}
            disabled={isSubmitting || (offer.status !== 'PENDING_REVIEW' && offer.status !== 'SENT')}
            className="bg-[#7c6ef0] hover:bg-[#6b5ded] text-white px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-[#7c6ef0]/20 transition-all disabled:opacity-50"
          >
            {offer.status === 'SENT' ? 'Resend Offer Letter' : offer.status === 'ACCEPTED' ? 'Offer Signed' : 'Send for Signature'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
             <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
               <span className="text-[#7c6ef0]">📄</span> Compensation Details
             </h2>
             
             <form onSubmit={handleUpdate} className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base Salary (USD)</label>
                   <input 
                     type="number"
                     value={form.salary}
                     onChange={(e) => setForm({...form, salary: e.target.value})}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:border-[#7c6ef0] focus:bg-white outline-none transition-all"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Equity/Options</label>
                   <input 
                     type="text"
                     value={form.equity}
                     onChange={(e) => setForm({...form, equity: e.target.value})}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:border-[#7c6ef0] focus:bg-white outline-none transition-all"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Start Date</label>
                   <input 
                     type="date"
                     value={form.start_date}
                     onChange={(e) => setForm({...form, start_date: e.target.value})}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:border-[#7c6ef0] focus:bg-white outline-none transition-all"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiration Date</label>
                   <input 
                     type="date"
                     value={form.expiration_date}
                     onChange={(e) => setForm({...form, expiration_date: e.target.value})}
                     className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:border-[#7c6ef0] focus:bg-white outline-none transition-all"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Benefits & Perks</label>
                 <textarea 
                   rows={4}
                   value={form.notes}
                   onChange={(e) => setForm({...form, notes: e.target.value})}
                   className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm focus:border-[#7c6ef0] focus:bg-white outline-none transition-all resize-none"
                 />
               </div>

               <button 
                 type="submit"
                 disabled={isSubmitting || offer.status === 'ACCEPTED'}
                 className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-2.5 rounded-xl text-xs font-bold transition-all disabled:opacity-30 border border-gray-200"
               >
                 {isSubmitting ? 'Updating...' : 'Save Changes'}
               </button>
             </form>
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
               <span className="text-8xl text-indigo-400">✨</span>
             </div>

             <header className="mb-8">
               <span className="text-[10px] text-indigo-600 uppercase tracking-[0.2em] font-black block mb-1">AI Market Intel</span>
               <h3 className="text-xl font-bold text-gray-900">Competitive View</h3>
             </header>

             <div className="space-y-6 mb-8">
               <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100 shadow-sm">
                 <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Market Salary Range</span>
                 <div className="text-lg font-bold text-gray-900">
                    ${(ai_insights?.market_min/1000).toFixed(0)}k - ${(ai_insights?.market_max/1000).toFixed(0)}k
                 </div>
               </div>

               <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100 shadow-sm flex items-center justify-between">
                 <div>
                   <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Value Score</span>
                   <div className="text-lg font-bold text-[#7c6ef0]">{ai_insights?.candidate_value_score}/10</div>
                 </div>
                 <div className="w-12 h-12 rounded-full border-4 border-indigo-100 flex items-center justify-center text-[10px] font-black text-[#7c6ef0] bg-indigo-50">
                   TOP {((10 - ai_insights?.candidate_value_score) * 10).toFixed(0)}%
                 </div>
               </div>
             </div>

             <div className="bg-white rounded-2xl p-5 border border-indigo-50 shadow-sm">
               <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 font-sans">Market Analysis</h4>
               <p className="text-sm text-gray-600 leading-relaxed italic">
                 "{ai_insights?.value_justification}"
               </p>
             </div>
           </div>

           <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
             <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 font-sans">Offer Progress</h3>
             <div className="space-y-4">
               {[
                 { label: 'Drafted', date: offer.created_at, done: true },
                 { label: 'Sent to Candidate', date: offer.sent_at, done: offer.status === 'SENT' || !!offer.sent_at || offer.status === 'ACCEPTED' },
                 { label: 'Signed', date: offer.signed_at, done: offer.status === 'ACCEPTED' },
               ].map((step, i) => (
                 <div key={i} className="flex items-start gap-3">
                   <div className={`mt-1.5 w-2 h-2 rounded-full ${step.done ? 'bg-green-500' : 'bg-gray-200'}`} />
                   <div>
                     <p className={`text-xs font-bold ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                     {step.date && <p className="text-[10px] text-gray-400">{new Date(step.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>}
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>

      {/* Digital Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl relative border border-gray-100">
            <button 
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all z-10"
            >
              ×
            </button>
            
            <div className="p-12 space-y-8 font-serif text-gray-900 overflow-y-auto max-h-[85vh]">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-[#7c6ef0] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#7c6ef0]/20">
                  <span className="text-white text-xl">✓</span>
                </div>
                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-[#7c6ef0] font-sans">Digital Completion Certificate</h2>
                <p className="text-xs text-gray-400 font-sans">Issued by HireOS Secure Terminal</p>
              </div>

              <div className="py-8 border-y border-gray-100 grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-400 uppercase font-sans font-bold">Candidate</p>
                  <p className="text-sm font-bold font-sans">{candidate?.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-400 uppercase font-sans font-bold">Role</p>
                  <p className="text-sm font-bold font-sans">{role?.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-400 uppercase font-sans font-bold">Completion Date</p>
                  <p className="text-sm font-bold font-sans">{new Date(offer.signed_at).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-400 uppercase font-sans font-bold">Audit Reference</p>
                  <p className="text-[10px] font-mono bg-gray-50 py-0.5 px-2 rounded w-fit border border-gray-100">{offer.id.toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-6">
                 <div>
                   <p className="text-[9px] text-gray-400 uppercase font-sans font-bold mb-4">Visual Signature</p>
                   <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex items-center justify-center">
                     {offer.signature_data?.signature_data ? (
                       <img 
                         src={offer.signature_data.signature_data} 
                         alt="Digital Signature" 
                         className="max-h-32 object-contain grayscale"
                       />
                     ) : (
                       <p className="text-xs text-gray-400 italic">Signature image not available</p>
                     )}
                   </div>
                 </div>

                 <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-indigo-600 uppercase font-black font-sans">Blockchain Verify</span>
                      <span className="text-[9px] text-green-600 font-bold font-sans flex items-center gap-1">
                        <span className="w-1 h-1 bg-green-500 rounded-full animate-pulse" /> VERIFIED
                      </span>
                    </div>
                    <div className="text-[10px] text-indigo-900/70 space-y-1 font-sans">
                      <p>• IP Address recorded: <span className="font-bold">{offer.ip_address}</span></p>
                      <p>• Signature Hash: <span className="font-mono text-[8px]">SH256_{offer.signing_token?.slice(0,16)}...</span></p>
                    </div>
                 </div>
              </div>
              
              <div className="text-center pt-4">
                <p className="text-[9px] text-gray-400 italic font-sans">
                  This document serves as an official record of offer acceptance. 
                  Digital signatures captured through HireOS are legally binding 
                  under the Electronic Signatures in Global and National Commerce Act.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate View Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl relative border border-gray-100">
            <button 
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all z-10"
            >
              ×
            </button>
            
            <div className="p-16 space-y-10 font-serif text-gray-900 overflow-y-auto max-h-[85vh]">
              {/* Letterhead */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-8">
                 <div className="space-y-1">
                   <div className="text-2xl font-black tracking-tighter text-[#7c6ef0] flex items-center gap-2 mb-2 font-sans">
                     <div className="w-6 h-6 bg-[#7c6ef0] rounded-lg" /> HIREOS
                   </div>
                   <p className="text-[10px] text-gray-400 uppercase tracking-widest font-sans font-black">Official Offer of Employment</p>
                 </div>
                 <div className="text-right text-[10px] text-gray-400 font-sans space-y-0.5 uppercase tracking-tighter">
                   <p>Reference: OFF-{offer.id.slice(0,8).toUpperCase()}</p>
                   <p>Status: DRAFT PREVIEW</p>
                 </div>
              </div>

              {/* Content */}
              <div className="space-y-8">
                <section className="space-y-4">
                  <h2 className="text-xl font-bold">Dear {candidate?.name},</h2>
                  <p className="leading-relaxed text-gray-700">
                    On behalf of HireOS, I am delighted to officially offer you the position of <strong>{role?.title}</strong>. 
                    We were extremely impressed by your skills and experience throughout the interview process, and we are confident 
                    that your contributions will be invaluable to our continued success.
                  </p>
                </section>

                <section className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#7c6ef0] font-sans">Terms of Employment</h3>
                  <div className="grid grid-cols-2 gap-8 py-6 border-y border-gray-100">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-sans font-bold">Base Salary</p>
                      <p className="text-lg font-bold">${Number(form.salary).toLocaleString('en-US')} USD / Year</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-sans font-bold">Equity/Options</p>
                      <p className="text-lg font-bold">{form.equity || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-sans font-bold">Target Start Date</p>
                      <p className="text-sm font-bold font-sans">{new Date(form.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 uppercase font-sans font-bold">Benefits & Perks</p>
                      <p className="text-xs font-sans leading-relaxed text-gray-600">{form.notes || 'Standard benefits package included'}</p>
                    </div>
                  </div>
                </section>

                <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 text-center font-sans space-y-4">
                   <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto" />
                   <p className="text-xs text-gray-400 italic">Candidate will sign in this area using the secure signing terminal.</p>
                </div>
              </div>

              <div className="text-center pt-8 border-t border-gray-50">
                 <p className="text-[10px] text-gray-400 font-sans uppercase tracking-[0.2em] font-black italic opacity-50">HireOS Confidential Preview</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

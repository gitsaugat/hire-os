'use client'

// FORCE RE-COMPILE: v2

import { useState } from 'react'

export default function OfferReviewClient({ offer }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    salary: offer.salary,
    equity: offer.equity,
    start_date: offer.start_date,
    expiration_date: offer.expiration_date,
    notes: offer.notes
  })

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
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a35] pb-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Review Offer</h1>
          <p className="text-gray-500 mt-1">
            {candidate?.name} • {role?.title}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend}
            disabled={isSubmitting || (offer.status !== 'PENDING_REVIEW' && offer.status !== 'SENT')}
            className="bg-[#7c6ef0] hover:bg-[#6b5ded] text-white px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-[#7c6ef0]/20 transition-all disabled:opacity-50"
          >
            {offer.status === 'SENT' ? 'Resend Offer Letter' : 'Send for Signature'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#12121a] border border-[#2a2a35] rounded-2xl p-8 shadow-xl">
             <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
               <span className="text-[#7c6ef0]">📄</span> Compensation Details
             </h2>
             
             <form onSubmit={handleUpdate} className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Base Salary (USD)</label>
                   <input 
                     type="number"
                     value={form.salary}
                     onChange={(e) => setForm({...form, salary: e.target.value})}
                     className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] outline-none transition-all"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Equity/Options</label>
                   <input 
                     type="text"
                     value={form.equity}
                     onChange={(e) => setForm({...form, equity: e.target.value})}
                     className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] outline-none transition-all"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Start Date</label>
                   <input 
                     type="date"
                     value={form.start_date}
                     onChange={(e) => setForm({...form, start_date: e.target.value})}
                     className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] outline-none transition-all [color-scheme:dark]"
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Expiration Date</label>
                   <input 
                     type="date"
                     value={form.expiration_date}
                     onChange={(e) => setForm({...form, expiration_date: e.target.value})}
                     className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] outline-none transition-all [color-scheme:dark]"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Benefits & Perks</label>
                 <textarea 
                   rows={4}
                   value={form.notes}
                   onChange={(e) => setForm({...form, notes: e.target.value})}
                   className="w-full bg-[#0a0a0f] border border-[#2a2a35] rounded-xl px-4 py-3 text-white text-sm focus:border-[#7c6ef0] outline-none transition-all resize-none"
                 />
               </div>

               <button 
                 type="submit"
                 disabled={isSubmitting}
                 className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
               >
                 {isSubmitting ? 'Updating...' : 'Save Changes'}
               </button>
             </form>
          </div>
        </div>

        {/* Right Column: AI Insights */}
        <div className="space-y-6">
           <div className="bg-gradient-to-br from-[#1a1a2e] to-[#12121a] border border-[#3e3e4a] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5">
               <span className="text-8xl text-[#7c6ef0]">✨</span>
             </div>

             <header className="mb-8">
               <span className="text-[10px] text-[#7c6ef0] uppercase tracking-[0.2em] font-black block mb-1">AI Market Intel</span>
               <h3 className="text-xl font-bold text-white">Competitive View</h3>
             </header>

             <div className="space-y-6 mb-8">
               <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                 <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Market Salary Range</span>
                 <div className="text-lg font-bold text-white">
                    ${(ai_insights?.market_min/1000).toFixed(0)}k - ${(ai_insights?.market_max/1000).toFixed(0)}k
                 </div>
               </div>

               <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                 <div>
                   <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Value Score</span>
                   <div className="text-lg font-bold text-[#7c6ef0]">{ai_insights?.candidate_value_score}/10</div>
                 </div>
                 <div className="w-12 h-12 rounded-full border-4 border-[#7c6ef0]/20 flex items-center justify-center text-[10px] font-black text-[#7c6ef0] bg-[#7c6ef0]/5">
                   TOP {((10 - ai_insights?.candidate_value_score) * 10).toFixed(0)}%
                 </div>
               </div>
             </div>

             <div className="bg-[#7c6ef0]/5 border border-[#7c6ef0]/10 rounded-2xl p-5">
               <h4 className="text-[10px] font-black text-[#7c6ef0] uppercase tracking-widest mb-2">Market Analysis</h4>
               <p className="text-sm text-gray-300 leading-relaxed italic">
                 "{ai_insights?.value_justification}"
               </p>
             </div>
           </div>

           <div className="bg-[#12121a] border border-[#2a2a35] rounded-2xl p-6">
             <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4">Offer Progress</h3>
             <div className="space-y-4">
               {[
                 { label: 'Drafted', date: offer.created_at, done: true },
                 { label: 'Sent to Candidate', date: offer.sent_at, done: offer.status === 'SENT' || !!offer.sent_at },
                 { label: 'Signed', date: offer.signed_at, done: offer.status === 'ACCEPTED' },
               ].map((step, i) => (
                 <div key={i} className="flex items-start gap-3">
                   <div className={`mt-1.5 w-2 h-2 rounded-full ${step.done ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-[#2a2a35]'}`} />
                   <div>
                     <p className={`text-xs font-bold ${step.done ? 'text-white' : 'text-gray-500'}`}>{step.label}</p>
                     {step.date && <p className="text-[10px] text-gray-500">{new Date(step.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>}
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}

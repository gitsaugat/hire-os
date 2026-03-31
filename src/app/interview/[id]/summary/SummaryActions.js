'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SummaryActions({ candidateId }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAction = async (status) => {
    const actionName = status === 'offer' ? 'Advance to Offer' 
      : status === 'hold' ? 'Place on Hold' 
      : 'Reject Candidate'

    if (!window.confirm(`Are you sure you want to ${actionName}?`)) {
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/applications/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, status })
      })
      
      const data = await res.json()
      
      if (data.success) {
        router.push('/admin')
        router.refresh()
      } else {
        alert('Failed to update candidate status: ' + data.error)
        setIsSubmitting(false)
      }
    } catch (e) {
      alert('Error updating status: ' + e.message)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#12121a]/95 backdrop-blur-sm border-t border-[#2a2a35] z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Final Decision</span>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleAction('rejected')}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-bold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors disabled:opacity-50"
          >
            Reject
          </button>

          <button 
            onClick={() => handleAction('hold')}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-bold text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors disabled:opacity-50"
          >
            Hold
          </button>

          <button 
            onClick={() => handleAction('offer')}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#7c6ef0] hover:bg-[#6b5ded] shadow-[0_0_20px_rgba(124,110,240,0.3)] transition-all disabled:opacity-50"
          >
            Advance to Offer
          </button>
        </div>
      </div>
    </div>
  )
}

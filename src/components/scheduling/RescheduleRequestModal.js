'use client'

import { useState } from 'react'
import { submitSchedulingRequestAction } from '@/actions/schedulingActions'
import { useRouter } from 'next/navigation'

export default function RescheduleRequestModal({ candidateId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [requestedTime, setRequestedTime] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reason) return alert('Please provide a reason.')
    
    setIsSubmitting(true)
    const result = await submitSchedulingRequestAction(candidateId, requestedTime, reason)
    
    if (result.success) {
       alert('Your request has been submitted to HR. We will notify you when new times are available.')
       setIsOpen(false)
       router.refresh()
    } else {
       alert('Failed to submit request: ' + result.error)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="mt-8 text-center pt-6 border-t border-gray-100 font-sans">
      <p className="text-sm text-gray-500 mb-3">None of these times work for you?</p>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline decoration-indigo-200 underline-offset-4"
      >
        Request a different time
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden scale-in-95 duration-200">
            <header className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center text-left">
              <h3 className="font-black text-gray-900 tracking-tight">Request Reschedule</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-light focus:outline-none">&times;</button>
            </header>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left bg-white">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Preferred Time (Optional)</label>
                <input 
                  type="text" 
                  value={requestedTime}
                  onChange={e => setRequestedTime(e.target.value)}
                  placeholder="e.g. Next Tuesday morning"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-gray-900 transition-all placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Reason</label>
                <textarea 
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="e.g. I am currently traveling and won't be available until..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-gray-900 resize-none transition-all placeholder:text-gray-300"
                />
              </div>
              <footer className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition-colors focus:outline-none"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !reason}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:shadow-none focus:outline-none"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

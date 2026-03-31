'use client'

import { useState, useEffect } from 'react'

export default function SlotPicker({ token }) {
  const [slots, setSlots] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState({ type: null, message: '' })

  useEffect(() => {
    fetchSlots()
  }, [])

  const fetchSlots = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/scheduling/availability?token=${token}`)
      const data = await res.json()
      if (data.slots) {
        setSlots(data.slots)
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to load slots.' })
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Could not load slots.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = async (slot) => {
    setSelectedSlot(slot)
    setIsSubmitting(true)
    setStatus({ type: null, message: '' })

    try {
      const res = await fetch('/api/scheduling/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          start_time: slot.start, 
          end_time: slot.end 
        })
      })

      const data = await res.json()

      if (data.confirmed) {
        setStatus({ type: 'success', message: 'Interview Confirmed! Check your email for details.' })
        setSlots([])
      } else if (data.conflict) {
        setStatus({ type: 'conflict', message: data.message })
        setSlots(data.new_slots || [])
        setSelectedSlot(null)
        
        // Auto-dismiss conflict banner after 5.5s (slight delay for UX)
        setTimeout(() => setStatus(prev => prev.type === 'conflict' ? { type: null, message: '' } : prev), 5500)
      } else {
        setStatus({ type: 'error', message: data.error || 'Something went wrong.' })
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <div className="h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-400 font-medium animate-pulse">Finding your slots...</p>
      </div>
    )
  }

  if (status.type === 'success') {
    return (
      <div className="text-center py-12 px-6 bg-green-50 rounded-[2.5rem] border border-green-100 animate-in zoom-in duration-500">
        <div className="text-6xl mb-6">🗓️</div>
        <h2 className="text-2xl font-bold text-green-900 mb-3">Interview Scheduled!</h2>
        <p className="text-green-700 leading-relaxed max-w-sm mx-auto">
          Your interview is confirmed. Check your email for the calendar invite and meeting details.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {status.message && (
        <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-all ${
          status.type === 'conflict' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
          'bg-red-50 border-red-200 text-red-800'
        } animate-in slide-in-from-top-4 duration-500`}>
          <span className="text-2xl">{status.type === 'conflict' ? '⚡' : '⚠️'}</span>
          <div>
            <p className="font-bold text-sm">Conflict Detected</p>
            <p className="text-xs opacity-90">{status.message}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {slots.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-400 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-lg font-medium">No slots available right now.</p>
            <p className="text-sm">Please refresh or contact your recruiter.</p>
            <button onClick={fetchSlots} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full text-sm font-bold">
              Try Again
            </button>
          </div>
        ) : (
          slots.map((slot, index) => {
            const start = new Date(slot.start)
            const isSelected = selectedSlot?.start === slot.start
            
            return (
              <button
                key={index}
                onClick={() => !isSubmitting && handleSelect(slot)}
                disabled={isSubmitting}
                className={`group relative flex flex-col p-6 rounded-3xl border transition-all duration-300 text-left ${
                  isSelected 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-[1.02]' 
                    : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:translate-y-[-2px]'
                } ${isSubmitting && !isSelected ? 'opacity-40 grayscale pointer-events-none' : ''}`}
              >
                <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isSelected ? 'text-indigo-200' : 'text-indigo-600/50'}`}>
                  {start.toLocaleDateString(undefined, { weekday: 'long' })}
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <div>
                    <div className="text-lg font-bold tracking-tight">
                      {start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className={`text-xl font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                      {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-white text-indigo-600' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {isSubmitting && isSelected ? (
                      <span className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                    ) : (
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="pt-8 border-t border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase font-bold tracking-widest text-gray-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          Live Availability Active
        </div>
        <div>Holds valid for 48 hours</div>
      </div>
    </div>
  )
}

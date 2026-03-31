'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import { regenerateSlotsAction } from '@/actions/candidateActions'

/**
 * Admin component to manage interview slots for a specific candidate.
 */
export default function InterviewScheduler({ candidate, initialSlots = [] }) {
  const [slots, setSlots] = useState(initialSlots)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const confirmedSlot = slots.find(s => s.status === 'CONFIRMED')
  const heldSlots = slots.filter(s => s.status === 'HELD')

  const handleGenerateSlots = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await regenerateSlotsAction(candidate.id)
      if (!result.success) throw new Error(result.error || 'Failed to generate slots')
      router.refresh()
      window.location.reload()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSelectSlot = async (slotId) => {
    if (!confirm('Confirm this interview slot? All other held slots will be released.')) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/scheduling/select-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidate.id, slotId }),
      })

      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Failed to select slot')

      // Refresh data
      router.refresh()
      window.location.reload() // Force reload to show status change
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (candidate.status === 'REJECTED') return null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Interview Scheduling</h2>
        {confirmedSlot && <StatusBadge status="INTERVIEW_SCHEDULED" />}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {confirmedSlot ? (
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-xs font-medium text-green-600 uppercase tracking-tight">Confirmed Interview</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg shadow-sm">🗓️</div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {new Date(confirmedSlot.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(confirmedSlot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – 
                {new Date(confirmedSlot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      ) : heldSlots.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-400">Please select an available slot to confirm the interview.</p>
          <div className="grid grid-cols-1 gap-2">
            {heldSlots.map((slot) => (
              <button
                key={slot.id}
                disabled={loading}
                onClick={() => handleSelectSlot(slot.id)}
                className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-left hover:border-indigo-200 hover:bg-indigo-50/50 transition-all disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                    {new Date(slot.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-100 text-xs shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">
                  →
                </div>
              </button>
            ))}
          </div>
          {loading && <p className="text-center text-xs text-indigo-500 animate-pulse font-medium">Confirming...</p>}
        </div>
      ) : candidate.status === 'SHORTLISTED' ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-2 text-2xl">⏳</div>
          <p className="text-sm font-medium text-gray-600">Generating slots...</p>
          <p className="text-xs text-gray-400 mb-4 px-4">We are fetching interviewer availability from Google Calendar.</p>
          
          <button
            onClick={handleGenerateSlots}
            disabled={loading}
            className="rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {loading ? 'Fetching...' : 'Generate New Slots'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">Interview slots will be generated once candidate is shortlisted.</p>
      )}
    </div>
  )
}

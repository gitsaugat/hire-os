'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import { regenerateSlotsAction } from '@/actions/candidateActions'

/**
 * Admin component to manage interview slots for a specific candidate.
 */
export default function InterviewScheduler({ candidate, interviews = [], holds = [] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  const confirmedInterview = interviews[0] // Only support one for now

  const handleInitiateScheduling = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await regenerateSlotsAction(candidate.id)
      if (!result.success) throw new Error(result.error || 'Failed to initiate scheduling')
      router.refresh()
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (candidate.status === 'REJECTED') return null

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Interview Status</h2>
        {confirmedInterview && <StatusBadge status="INTERVIEW_SCHEDULED" />}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {confirmedInterview ? (
        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
          <p className="text-xs font-medium text-green-600 uppercase tracking-tight">Confirmed Interview</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg shadow-sm">🗓️</div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {new Date(confirmedInterview.start_time).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(confirmedInterview.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – 
                {new Date(confirmedInterview.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>
      ) : holds.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-tight flex items-center gap-1">
              <span className="animate-pulse h-1.5 w-1.5 bg-amber-500 rounded-full" />
              Active Holds ({holds.length})
            </p>
            <span className="text-[10px] text-gray-400">Wait for candidate</span>
          </div>
          
          <div className="grid grid-cols-1 gap-2 opacity-80 pointer-events-none">
            {holds.map((hold) => (
              <div
                key={hold.id}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-left"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(hold.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(hold.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-gray-300 uppercase leading-none">Held</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                const link = `${window.location.origin}/schedule/${candidate.scheduling_token}`;
                navigator.clipboard.writeText(link);
                alert('Copied to clipboard!');
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-all active:scale-[0.98]"
            >
              <span>🔗</span> Copy Selection Link
            </button>
            
            <button
              onClick={handleInitiateScheduling}
              disabled={loading}
              className="w-full text-center text-[10px] font-bold text-gray-400 hover:text-indigo-600 transition-colors py-2 uppercase tracking-widest"
            >
              {loading ? 'Refreshing...' : 'Re-send Email Invite'}
            </button>
          </div>
        </div>
      ) : candidate.status === 'SHORTLISTED' || candidate.status === 'INTERVIEW_SCHEDULING' ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="mb-2 text-2xl">⏳</div>
          <p className="text-sm font-medium text-gray-600">Awaiting Selection</p>
          <p className="text-xs text-gray-400 mb-4 px-4">Candidate has been invited to pick a slot.</p>
          
          <div className="flex flex-col w-full gap-2 px-2">
            {candidate.scheduling_token && (
              <button
                onClick={() => {
                  const link = `${window.location.origin}/schedule/${candidate.scheduling_token}`;
                  navigator.clipboard.writeText(link);
                  alert('Copied to clipboard!');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/30 px-4 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all active:scale-[0.98]"
              >
                <span>🔗</span> Copy Selection Link
              </button>
            )}
            
            <button
              onClick={handleInitiateScheduling}
              disabled={loading}
              className="rounded-xl bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Re-send Email Invite'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">Interview scheduling will initiate once shortlisted.</p>
      )}
    </div>
  )
}

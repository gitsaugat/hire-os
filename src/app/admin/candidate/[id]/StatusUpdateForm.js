'use client'

import { useState, useTransition } from 'react'
import { updateStatusAction } from '@/actions/candidateActions'
import { CANDIDATE_STATUSES } from '@/lib/constants'

export default function StatusUpdateForm({ candidateId, currentStatus }) {
  const [newStatus, setNewStatus] = useState(currentStatus)
  const [reason, setReason] = useState('')
  const [result, setResult] = useState(null)
  const [isPending, startTransition] = useTransition()

  const isDirty = newStatus !== currentStatus

  function handleSubmit(e) {
    e.preventDefault()
    if (!isDirty) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set('candidate_id', candidateId)
      formData.set('new_status', newStatus)
      formData.set('reason', reason)

      const res = await updateStatusAction(formData)
      setResult(res)
      if (res.success) setReason('')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="new_status" className="block text-xs font-medium text-gray-500 mb-1.5">
          New Status
        </label>
        <select
          id="new_status"
          value={newStatus}
          onChange={(e) => { setNewStatus(e.target.value); setResult(null) }}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
        >
          {CANDIDATE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="reason" className="block text-xs font-medium text-gray-500 mb-1.5">
          Note <span className="text-gray-300">(optional)</span>
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="e.g. Strong technical background…"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none transition-all"
        />
      </div>

      {result?.success && (
        <p className="text-sm font-medium text-green-600">✓ Status updated successfully.</p>
      )}
      {result?.error && (
        <p className="text-sm text-red-500">{result.error}</p>
      )}

      <button
        type="submit"
        disabled={!isDirty || isPending}
        className="w-full rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 transition-all"
      >
        {isPending ? 'Saving…' : 'Save Status'}
      </button>
    </form>
  )
}

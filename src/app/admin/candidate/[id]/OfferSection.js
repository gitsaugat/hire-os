'use client'

import { useState } from 'react'
import { createOfferAction } from '@/actions/offerActions'

export default function OfferSection({ candidate, existingOffer }) {
  const [isExpanding, setIsExpanding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (existingOffer) {
    return (
      <div className="rounded-2xl border border-orange-100 bg-orange-50/30 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-orange-800 uppercase tracking-wider">Active Offer</h2>
          <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md uppercase tracking-widest border border-orange-200">
            {existingOffer.status.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-xs text-orange-600/80 mb-4">
          An offer of <strong>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(existingOffer.salary)}</strong> has been initiated.
        </p>
        <a 
          href="/admin/offers" 
          className="text-xs font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1 transition-colors"
        >
          View in Offer Management ↗
        </a>
      </div>
    )
  }

  const canCreateOffer = ['INTERVIEW_COMPLETED', 'OFFER_PENDING', 'SHORTLISTED'].includes(candidate.status)

  if (!canCreateOffer) return null

  return (
    <div className={`rounded-2xl border transition-all duration-300 ${isExpanding ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-100 bg-white'} p-5 shadow-sm`}>
      {!isExpanding ? (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Initiate Offer</h2>
            <p className="text-xs text-gray-400 mt-0.5">Move this candidate to the final stage.</p>
          </div>
          <button 
            onClick={() => setIsExpanding(true)}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-all active:scale-95"
          >
            Create Offer Draft
          </button>
        </div>
      ) : (
        <form action={async (formData) => {
          setIsSubmitting(true)
          const res = await createOfferAction(formData)
          if (res.success) {
            setIsExpanding(false)
          } else {
            alert(res.error)
          }
          setIsSubmitting(false)
        }} className="space-y-4">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">New Offer Details</h2>
            <button 
              type="button"
              onClick={() => setIsExpanding(false)}
              className="text-xs text-indigo-400 hover:text-indigo-600 font-bold"
            >
              Cancel
            </button>
          </div>

          <input type="hidden" name="candidate_id" value={candidate.id} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Annual Salary (USD)</label>
              <input 
                name="salary"
                type="number" 
                required 
                placeholder="120000"
                className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Equity / Options</label>
              <input 
                name="equity"
                type="text" 
                placeholder="0.05% Options"
                className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Start Date</label>
              <input 
                name="start_date"
                type="date" 
                required 
                className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Offer Expiration</label>
              <input 
                name="expiration_date"
                type="date" 
                required 
                className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Additional Notes</label>
            <textarea 
              name="notes"
              rows={2}
              placeholder="Sign-on bonus details, relocation, etc."
              className="rounded-xl border border-indigo-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-bold text-white shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? 'Generating...' : 'Submit for Review'}
          </button>
        </form>
      )}
    </div>
  )
}

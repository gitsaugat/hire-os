'use client'

import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { updateOfferStatusAction } from '@/actions/offerActions'

export default function OffersTable({ initialOffers }) {
  const [offers, setOffers] = useState(initialOffers)
  const [isUpdating, setIsUpdating] = useState(null)

  const handleStatusUpdate = async (offerId, candidateId, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this offer as ${newStatus}?`)) return

    setIsUpdating(offerId)
    const result = await updateOfferStatusAction(offerId, candidateId, newStatus)
    
    if (result.success) {
      setOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: newStatus } : o))
    } else {
      alert('Failed to update: ' + result.error)
    }
    setIsUpdating(null)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-gray-50/50 border-b border-gray-100">
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role & Team</th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Salary</th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {offers.length === 0 ? (
            <tr>
              <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic font-medium">
                No offers found in this phase.
              </td>
            </tr>
          ) : (
            offers.map((offer) => (
              <tr key={offer.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 font-bold text-xs">
                      {offer.candidate?.name?.[0]}
                    </div>
                    <Link href={`/admin/candidate/${offer.candidate?.id}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                      {offer.candidate?.name}
                    </Link>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-700 font-medium">{offer.candidate?.role?.title}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{offer.candidate?.role?.team}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(offer.salary)}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{offer.equity || 'No equity'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={offer.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest">
                    {offer.status === 'PENDING_REVIEW' && (
                      <Link
                        href={`/admin/offers/${offer.id}`}
                        className="rounded-lg bg-[#7c6ef0]/10 px-3 py-1.5 text-[#7c6ef0] hover:bg-[#7c6ef0]/20 transition-colors"
                      >
                        Review & Send
                      </Link>
                    )}
                    {offer.status === 'SENT' && (
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/offers/${offer.id}`}
                          className="rounded-lg border border-gray-100 px-3 py-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleStatusUpdate(offer.id, offer.candidate.id, 'ACCEPTED')}
                          disabled={isUpdating === offer.id}
                          className="rounded-lg bg-green-50 px-3 py-1.5 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50"
                        >
                          Mark Accepted
                        </button>
                      </div>
                    )}
                    {offer.status === 'ACCEPTED' && (
                       <span className="text-green-600 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                         ✓ Signed
                       </span>
                    )}
                    <Link
                      href={`/admin/candidate/${offer.candidate?.id}`}
                      className="rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-gray-400 hover:border-gray-200 hover:text-gray-600 transition-all font-sans"
                    >
                      Profile
                    </Link>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

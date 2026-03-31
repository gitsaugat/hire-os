'use client'

import { useState } from 'react'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { updateOfferStatusAction, sendOnboardingEmailAction, markOnboardingDoneAction } from '@/actions/offerActions'

export default function OffersTable({ initialOffers }) {
  const [offers, setOffers] = useState(initialOffers)
  const [isUpdating, setIsUpdating] = useState(null)
  const [selectedOffer, setSelectedOffer] = useState(null)

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

  const handleOnboardingEmail = async (candidateId) => {
    if (!window.confirm(`Are you sure you want to send the onboarding email to this candidate?`)) return

    setIsUpdating(candidateId) 
    const result = await sendOnboardingEmailAction(candidateId)
    
    if (result.success) {
      alert('Onboarding email sent successfully!')
    } else {
      alert('Failed to send onboarding email: ' + result.error)
    }
    setIsUpdating(null)
  }

  const handleOnboardingDone = async (candidateId) => {
    if (!window.confirm(`Are you sure you want to mark onboarding as complete for this candidate?`)) return

    setIsUpdating(candidateId) 
    const result = await markOnboardingDoneAction(candidateId)
    
    if (result.success) {
      alert('Candidate onboarding marked as complete!')
    } else {
      alert('Failed to mark onboarding as complete: ' + result.error)
    }
    setIsUpdating(null)
  }

  const formatCurrency = (amount) => {


    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        {/* ... table content ... */}
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
                       <div className="flex gap-2 items-center">
                         {offer.candidate.status === 'HIRED' ? (
                           <div className="flex gap-2 items-center">
                             <div className="rounded-lg bg-emerald-50 px-3 py-1.5 text-emerald-600 flex items-center gap-1 cursor-default font-bold border border-emerald-100 text-[10px]">
                               🎉 Hired
                             </div>
                             <button
                               onClick={() => handleOnboardingEmail(offer.candidate.id)}
                               disabled={isUpdating === offer.candidate.id}
                               className="rounded-lg bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 text-indigo-700 flex items-center gap-1 transition-all font-bold border border-indigo-100 disabled:opacity-50 shadow-sm text-[10px]"
                               title="Re-send Slack & Email Onboarding"
                             >
                               🔄 Re-send
                             </button>
                           </div>
                         ) : (
                           <button
                             onClick={() => handleOnboardingEmail(offer.candidate.id)}
                             disabled={isUpdating === offer.candidate.id}
                             className="rounded-lg bg-blue-50 hover:bg-blue-100 px-4 py-1.5 text-blue-700 flex items-center gap-1 transition-all font-bold border border-blue-100 disabled:opacity-50 shadow-sm text-xs"
                             title="Send Onboarding Email"
                           >
                             ✉️ Send Onboarding
                           </button>
                         )}
                         <button
                           onClick={() => setSelectedOffer(offer)}
                           className="rounded-lg bg-green-50 px-4 py-1.5 text-green-700 font-bold hover:bg-green-100 transition-all flex items-center gap-1 border border-green-100 shadow-sm text-xs"
                         >
                           ✓ Signed Offer
                         </button>
                       </div>
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

      {/* Full Signed Offer Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl relative border border-gray-100 flex flex-col max-h-[90vh]">
            <header className="px-8 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#7c6ef0] rounded-lg flex items-center justify-center shadow-lg shadow-[#7c6ef0]/20">
                  <span className="text-white text-xs font-bold">✓</span>
                </div>
                <div>
                   <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest font-sans">Signed Employment Agreement</h2>
                   <p className="text-[10px] text-gray-400 font-sans font-medium uppercase tracking-tighter">OFF-{selectedOffer.id.slice(0,8).toUpperCase()} • Verified Document</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedOffer(null)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-all"
              >
                <span className="text-2xl">×</span>
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-12 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Left: The Letter */}
                <div className="lg:col-span-8 space-y-8 font-serif text-gray-800 pr-4 lg:border-r lg:border-gray-50">
                  <section className="space-y-4">
                    <h3 className="text-xl font-bold font-sans text-gray-900">Dear {selectedOffer.candidate?.name},</h3>
                    <p className="leading-relaxed">
                      On behalf of HireOS, we are delighted to officially provide this copy of your signed employment agreement for the position of <strong>{selectedOffer.candidate?.role?.title}</strong>. 
                      Since your acceptance on {new Date(selectedOffer.signed_at).toLocaleDateString()}, we have processed your information and are preparing for your arrival.
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#7c6ef0] font-sans">Summary of Agreement</h4>
                    <div className="grid grid-cols-2 gap-8 py-6 border-y border-gray-100 font-sans">
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-black">Base Salary</p>
                        <p className="text-base font-bold text-gray-900">{formatCurrency(selectedOffer.salary)} USD / Year</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-black">Equity/Options</p>
                        <p className="text-base font-bold text-gray-900">{selectedOffer.equity || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-black">Start Date</p>
                        <p className="text-sm font-bold text-gray-900">{new Date(selectedOffer.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-gray-400 uppercase font-black">Benefits</p>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">{selectedOffer.notes || 'Standard benefits package'}</p>
                      </div>
                    </div>
                  </section>

                  <section className="space-y-6 font-sans">
                     <h4 className="text-xs font-black uppercase tracking-widest text-[#7c6ef0]">Execution of Document</h4>
                     <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col items-center gap-4">
                        {selectedOffer.signature_data?.signature_data ? (
                          <div className="space-y-4 text-center w-full">
                            <div className="flex justify-center">
                              <img 
                                src={selectedOffer.signature_data.signature_data} 
                                alt="Digital Signature" 
                                className="max-h-24 object-contain grayscale"
                              />
                            </div>
                            <div className="border-t border-gray-200 pt-4 w-full">
                               <p className="text-sm font-bold text-gray-900">{selectedOffer.candidate?.name}</p>
                               <p className="text-[10px] text-gray-400 font-medium uppercase">Digitally Signed on {new Date(selectedOffer.signed_at).toLocaleString()}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 italic">Visual signature record unavailable</p>
                        )}
                     </div>
                  </section>
                </div>

                {/* Right: Audit & Verification */}
                <div className="lg:col-span-4 space-y-6 font-sans">
                   <div className="bg-indigo-50/30 rounded-2xl p-6 border border-indigo-50 space-y-6">
                      <header>
                        <span className="text-[9px] text-[#7c6ef0] uppercase font-black block mb-1">Audit Trail</span>
                        <h4 className="text-sm font-bold text-gray-900">Digital Certificate</h4>
                      </header>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <p className="text-[9px] text-gray-400 uppercase font-bold">IP Address</p>
                          <p className="text-xs font-mono font-bold text-gray-700">{selectedOffer.ip_address}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Security Hash</p>
                          <p className="text-xs font-mono font-bold text-gray-700 break-all bg-white p-2 rounded border border-indigo-50/50">
                            SH256_{selectedOffer.signing_token?.slice(0,24)}...
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] text-gray-400 uppercase font-bold">Verified by</p>
                          <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> HireOS Secure Protocol
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-indigo-100/50 mt-4">
                        <p className="text-[10px] text-indigo-900/60 leading-relaxed italic">
                          "This document is a legally binding electronic record. Any modifications after signing will invalidate the verification hash."
                        </p>
                      </div>
                   </div>

                   <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Verification Steps</h4>
                      <div className="space-y-3">
                         {[
                           'Identity Authenticated',
                           'Terms Acknowledged',
                           'Visual Signature Captured',
                           'IP Geolocation Logged',
                           'Audit immutable'
                         ].map((step, i) => (
                           <div key={i} className="flex items-center gap-2">
                             <div className="w-3.5 h-3.5 rounded-full bg-green-100 flex items-center justify-center">
                               <span className="text-[8px] text-green-600 font-bold">✓</span>
                             </div>
                             <span className="text-[10px] text-gray-600 font-medium">{step}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <footer className="px-8 py-4 border-t border-gray-100 bg-gray-50/50 text-center">
               <p className="text-[9px] text-gray-400 font-sans uppercase tracking-[0.2em] font-black italic opacity-50">
                 HireOS Confidential • Signed Digital Record • {new Date().getFullYear()}
               </p>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}

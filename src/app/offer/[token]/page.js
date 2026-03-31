import { supabaseAdmin } from '@/lib/supabase-admin'
import OfferSigningClient from './OfferSigningClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OfferSigningPage({ params }) {
  // UNWRAP PARAMS AS PER NEXT.JS 15+ REQUIREMENTS
  const resolvedParams = await params
  const { token } = resolvedParams

  // Fetch Offer by signing_token
  const { data: offer, error } = await supabaseAdmin
    .from('offers')
    .select('*, candidate:candidates(*, role:roles(*))')
    .eq('signing_token', token)
    .single()

  if (error || !offer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-10 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <span className="text-2xl text-red-500">?</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Offer Link Invalid</h2>
        <p className="text-gray-500 max-w-sm mb-8">This offer link is invalid, expired, or has already been processed. Please contact your recruiting manager for assistance.</p>
        <Link 
          href="/"
          className="text-[#7c6ef0] font-bold text-sm uppercase tracking-widest"
        >
          Return Home
        </Link>
      </div>
    )
  }

  // Check if already signed
  if (offer.status === 'ACCEPTED' || offer.signed_at) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-md w-full rounded-3xl shadow-2xl p-10 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Offer Already Signed</h2>
          <p className="text-gray-500 mb-4 tracking-tight">
            This offer was successfully signed on {new Date(offer.signed_at).toLocaleDateString()}.
          </p>
          <div className="py-3 px-6 bg-green-50 rounded-xl text-green-700 text-sm font-bold">
            Onboarding in progress
          </div>
        </div>
      </div>
    )
  }

  return <OfferSigningClient offer={offer} />
}

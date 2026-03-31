import { getOfferById } from '@/lib/offers'
import OfferReviewClient from './OfferReviewClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function OfferEditorPage({ params }) {
  // UNWRAP PARAMS AS PER NEXT.JS 15+ REQUIREMENTS
  const resolvedParams = await params
  const { id } = resolvedParams

  const { data: offer, error } = await getOfferById(id)

  if (error || !offer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
        <h2 className="text-2xl font-bold text-white mb-4">Offer Not Found</h2>
        <p className="text-gray-500 mb-8">We couldn't find the offer you're looking for or it may have been deleted.</p>
        <Link 
          href="/admin/offers"
          className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl transition-all"
        >
          Back to Offers
        </Link>
      </div>
    )
  }

  return <OfferReviewClient offer={offer} />
}

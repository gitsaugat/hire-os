import { getOffers } from '@/lib/offers'
import OffersTable from './OffersTable'

export const metadata = { title: 'Offers – HireOS Admin' }

export default async function OffersPage() {
  const { data: offers, error } = await getOffers()

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offer Management</h1>
          <p className="mt-1 text-sm text-gray-400">Track and manage candidate offers from generation to signing.</p>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Statistics</span>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">{offers?.length || 0}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Total Offers</span>
            </div>
            <div className="h-8 w-px bg-gray-100" />
            <div className="flex flex-col">
              <span className="text-lg font-bold text-amber-600">{offers?.filter(o => o.status === 'PENDING_REVIEW').length || 0}</span>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">On Hold</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          Failed to load offers: {error.message}
        </div>
      )}

      {/* Offers Table */}
      <OffersTable initialOffers={offers || []} />
      
      {/* Footer / Legend */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Pending HR Review</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Sent to Candidate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Accepted / Signed</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-300 font-medium italic italic">
          Offers are automatically associated with the respective candidate profile.
        </p>
      </div>
    </div>
  )
}

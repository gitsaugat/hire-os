import { getConfirmedInterviews } from '@/lib/scheduling'
import { getRoles } from '@/lib/roles'
import Link from 'next/link'
import InterviewsClient from './InterviewsClient'

export const metadata = { title: 'Interviews – HireOS Admin' }

export default async function InterviewsPage({ searchParams }) {
  const params = await searchParams
  const roleFilter = params?.role || ''
  const dateFilter = params?.date || ''

  const [{ data: interviews, error }, { data: roles }] = await Promise.all([
    getConfirmedInterviews({ roleId: roleFilter || undefined, date: dateFilter || undefined }),
    getRoles(),
  ])

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Interview Schedule</h1>
        <p className="mt-1 text-sm text-gray-400">Manage and track all confirmed and completed interviews.</p>
      </div>

      {/* Filters */}
      <form method="GET" className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Filter by Role</label>
          <select
            name="role"
            defaultValue={roleFilter}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">All Roles</option>
            {roles?.map((r) => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Filter by Date</label>
          <input
            type="date"
            name="date"
            defaultValue={dateFilter}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="flex items-end self-end mb-0.5 mt-auto">
          <button
            type="submit"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            Apply Filters
          </button>
        </div>

        {(roleFilter || dateFilter) && (
          <div className="flex items-end self-end mb-0.5 mt-auto ml-1">
            <Link href="/admin/interviews" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              Clear
            </Link>
          </div>
        )}

        <span className="ml-auto text-xs text-gray-400 font-medium">
          {interviews?.length || 0} session{(interviews?.length !== 1) ? 's' : ''} listed
        </span>
      </form>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          Failed to load interviews: {error.message}
        </div>
      )}

      {/* Main Interviews List (Client Component) */}
      <InterviewsClient interviews={interviews} />
    </div>
  )
}

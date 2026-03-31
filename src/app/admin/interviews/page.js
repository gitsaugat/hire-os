import Link from 'next/link'
import { getConfirmedInterviews } from '@/lib/scheduling'
import { getRoles } from '@/lib/roles'
import StatusBadge from '@/components/StatusBadge'

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
        <p className="mt-1 text-sm text-gray-400">Manage and track all confirmed candidate interviews.</p>
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
          {interviews?.length || 0} interview{(interviews?.length !== 1) ? 's' : ''} confirmed
        </span>
      </form>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          Failed to load interviews: {error.message}
        </div>
      )}

      {/* Interview Table */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Candidate</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Role & Team</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Schedule</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Interviewer</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!interviews || interviews.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400 italic">
                  No confirmed interviews found.
                </td>
              </tr>
            ) : (
              interviews.map((interview) => (
                <tr key={interview.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 font-bold text-xs">
                        {interview.candidate?.name?.[0]}
                      </div>
                      <Link href={`/admin/candidate/${interview.candidate?.id}`} className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                        {interview.candidate?.name || 'Unknown Candidate'}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700 font-medium">{interview.candidate?.role?.title || '—'}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{interview.candidate?.role?.team || 'General'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-indigo-600">{formatDateTime(interview.start_time)}</span>
                      <span className="text-[10px] text-gray-400 font-medium italic">45-minute window</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      <span className="text-xs font-semibold text-gray-600">{interview.interviewer_email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <a 
                      href={`mailto:${interview.candidate?.email}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-100 bg-white px-3 py-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95"
                    >
                      Email ↗
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

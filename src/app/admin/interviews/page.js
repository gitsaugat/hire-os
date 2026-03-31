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

      {/* Interview List */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {!interviews || interviews.length === 0 ? (
          <div className="lg:col-span-2 rounded-2xl border border-dashed border-gray-200 p-12 text-center text-gray-400 bg-white/50">
            No confirmed interviews found for the selected criteria.
          </div>
        ) : (
          interviews.map((interview) => (
            <div key={interview.id} className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:border-indigo-100 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 text-xl shadow-sm group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:text-white transition-all transform group-hover:scale-105 duration-300">
                    🗓️
                  </div>
                  <div>
                    <Link href={`/admin/candidate/${interview.candidate?.id}`} className="text-base font-bold text-gray-900 hover:text-indigo-600 transition-colors">
                      {interview.candidate?.name}
                    </Link>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">
                      {interview.candidate?.role?.title || 'Unknown Role'} • {interview.candidate?.role?.team || 'General'}
                    </p>
                  </div>
                </div>
                <StatusBadge status="INTERVIEW_SCHEDULED" />
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-2 text-indigo-600">
                  <span className="text-xs font-black uppercase tracking-widest">Starts</span>
                  <span className="text-sm font-bold">{formatDateTime(interview.start_time)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <span className="text-xs font-bold uppercase tracking-widest">Duration</span>
                  <span className="text-sm font-medium">45 min</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50/50 p-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Interviewer</span>
                  <span className="text-xs font-semibold text-gray-700">{interview.interviewer_email}</span>
                </div>
                <a 
                  href={`mailto:${interview.candidate?.email}`}
                  className="text-[10px] font-black text-indigo-500 hover:underline tracking-widest uppercase"
                >
                  Email Candidate
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

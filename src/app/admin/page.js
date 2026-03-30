import Link from 'next/link'
import { getCandidates } from '@/lib/candidates'
import { getRoles } from '@/lib/roles'
import StatusBadge from '@/components/StatusBadge'
import { CANDIDATE_STATUSES } from '@/lib/constants'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export const metadata = { title: 'Candidates – HireOS Admin' }

export default async function AdminDashboard({ searchParams }) {
  const params = await searchParams
  const roleFilter   = params?.role   || ''
  const statusFilter = params?.status || ''

  const [{ data: candidates, error: candError }, { data: roles }] = await Promise.all([
    getCandidates({ roleId: roleFilter || undefined, status: statusFilter || undefined }),
    getRoles(),
  ])

  // Stat calculations
  const total      = candidates?.length ?? 0
  const today      = candidates?.filter(c => new Date(c.created_at).toDateString() === new Date().toDateString()).length ?? 0
  const shortlisted = candidates?.filter(c => c.status === 'SHORTLISTED').length ?? 0

  return (
    <div className="px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Candidate Pipeline</h1>
        <p className="mt-1 text-sm text-gray-400">Track and manage all applicants across every stage.</p>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Candidates', value: total, icon: '👥', color: 'from-indigo-500 to-purple-600' },
          { label: 'Applied Today', value: today, icon: '✨', color: 'from-teal-500 to-cyan-500' },
          { label: 'Shortlisted', value: shortlisted, icon: '⭐', color: 'from-amber-400 to-orange-500' },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-xl shadow-sm`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form method="GET" className="mb-5 flex flex-wrap items-center gap-3">
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

        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          <option value="">All Statuses</option>
          {CANDIDATE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 transition-all"
        >
          Filter
        </button>

        {(roleFilter || statusFilter) && (
          <Link href="/admin" className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Clear
          </Link>
        )}

        <span className="ml-auto text-xs text-gray-400 font-medium">
          {total} result{total !== 1 ? 's' : ''}
        </span>
      </form>

      {candError && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          Failed to load candidates: {candError.message}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-50 text-sm">
          <thead>
            <tr className="bg-gray-50/80">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Candidate</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Role</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Status</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">AI Score</th>
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Applied</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {!candidates || candidates.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                  No candidates found.
                </td>
              </tr>
            ) : (
              candidates.map((c) => (
                <tr key={c.id} className="group hover:bg-indigo-50/30 transition-colors">
                  <td className="px-5 py-4">
                    <Link href={`/admin/candidate/${c.id}`} className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-sm font-bold text-indigo-600">
                        {c.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-800 font-medium">{c.role?.title ?? '—'}</p>
                    <p className="text-xs text-gray-400">{c.role?.team}</p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-5 py-4">
                    {c.ai_score != null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${Math.round(c.ai_score * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600">
                          {Math.round(c.ai_score * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{formatDate(c.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

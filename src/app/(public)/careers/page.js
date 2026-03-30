import Link from 'next/link'
import { getRoles } from '@/lib/roles'

export const metadata = {
  title: 'Open Roles – HireOS',
  description: 'Browse our open positions and apply today.',
}

const levelColors = {
  Senior: 'bg-purple-50 text-purple-700',
  Mid:    'bg-blue-50 text-blue-700',
  Junior: 'bg-green-50 text-green-700',
}

export default async function CareersPage() {
  const { data: roles, error } = await getRoles()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-semibold text-indigo-700 tracking-wide">We&apos;re Hiring</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 lg:text-5xl">
            Open Positions
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Join our team and help build the future of intelligent hiring.
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            Failed to load roles. Please check your Supabase configuration.
          </div>
        )}

        {!error && (!roles || roles.length === 0) && (
          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <p className="text-gray-400">No open positions right now. Check back soon!</p>
          </div>
        )}

        {/* Role grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {roles?.map((role) => (
            <div
              key={role.id}
              className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Level badge */}
              <span
                className={`mb-4 inline-block self-start rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  levelColors[role.level] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {role.level}
              </span>

              <h2 className="text-lg font-bold text-gray-900 leading-snug">{role.title}</h2>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-gray-400">
                <span>{role.team}</span>
                <span>·</span>
                <span>{role.location}</span>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-500 line-clamp-3 flex-1">
                {role.jd_text}
              </p>

              <div className="mt-6">
                <Link
                  href={`/apply?role=${role.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 transition-all"
                >
                  Apply Now →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

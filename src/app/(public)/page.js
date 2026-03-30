import Link from 'next/link'

const floatingTags = [
  { label: 'AI Screening', color: 'from-indigo-500 to-purple-500', top: '10%', right: '5%' },
  { label: 'Auto Scheduling', color: 'from-purple-500 to-pink-500', top: '40%', right: '-4%' },
  { label: 'Offer Generation', color: 'from-teal-500 to-cyan-500', bottom: '20%', right: '8%' },
]

const mockCandidates = [
  { name: 'Sarah Chen', role: 'Senior Frontend Eng.', status: 'Shortlisted', score: 94 },
  { name: 'Marcus Williams', role: 'Backend Engineer', status: 'Interview Scheduled', score: 88 },
  { name: 'Priya Patel', role: 'Product Manager', status: 'Screened', score: 91 },
]

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-6 py-20 lg:py-28">
        {/* Background gradients */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 right-0 h-[500px] w-[500px] rounded-full bg-indigo-50 opacity-70 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-purple-50 opacity-70 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left column */}
          <div className="flex flex-col items-start">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-semibold text-indigo-700 tracking-wide">
                Future of Intelligent Hiring
              </span>
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900 lg:text-6xl">
              One Platform.{' '}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                From Candidate
              </span>{' '}
              to Employee.
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-relaxed text-gray-500">
              HireOS automates screening, scheduling, and onboarding with AI — so your team spends time on people, not paperwork.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/careers"
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:from-indigo-600 hover:to-purple-700 transition-all"
              >
                Book a Demo
              </Link>
              <Link
                href="/careers"
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
              >
                View Careers
                <span className="text-gray-400">→</span>
              </Link>
            </div>

            {/* Social proof */}
            <div className="mt-12 flex items-center gap-4 text-sm text-gray-400">
              <div className="flex -space-x-2">
                {['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd'].map((color, i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-white"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <span>
                Trusted by <strong className="text-gray-700">500+</strong> hiring teams
              </span>
            </div>
          </div>

          {/* Right column — Mock dashboard card */}
          <div className="relative">
            {/* Floating feature tags */}
            <div className="absolute -top-4 -left-6 z-10 rounded-xl border border-indigo-100 bg-white px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white text-xs">✦</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">AI Screening</span>
              </div>
            </div>

            <div className="absolute -bottom-4 -left-4 z-10 rounded-xl border border-teal-100 bg-white px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-white text-xs">⚡</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">Auto Scheduling</span>
              </div>
            </div>

            <div className="absolute top-1/2 -right-4 z-10 -translate-y-1/2 rounded-xl border border-purple-100 bg-white px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-white text-xs">📄</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">Offer Generation</span>
              </div>
            </div>

            {/* Mock dashboard card */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
              {/* Card header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Candidate Pipeline</p>
                  <p className="text-xs text-gray-400">March 2026</p>
                </div>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                  3 active
                </span>
              </div>

              {/* Candidate rows */}
              <div className="divide-y divide-gray-50">
                {mockCandidates.map((c) => (
                  <div key={c.name} className="flex items-center gap-4 px-5 py-3.5">
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-sm font-bold text-indigo-600">
                      {c.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400 truncate">{c.role}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {c.status}
                      </span>
                      <span className="text-xs font-semibold text-gray-400">
                        AI {c.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-50 bg-gray-50/50 px-5 py-3">
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>Updated just now</span>
                  <span className="text-indigo-500 font-medium cursor-pointer">View all →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-8">
            Everything your hiring team needs
          </p>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { icon: '🤖', title: 'AI Resume Screening', desc: 'Score and rank applicants automatically' },
              { icon: '📅', title: 'Smart Scheduling', desc: 'Zero-friction interview booking' },
              { icon: '📊', title: 'Pipeline Visibility', desc: 'Real-time status across all stages' },
              { icon: '✍️', title: 'Offer Management', desc: 'Generate and track offers in one place' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-white border border-gray-100 p-5 shadow-sm">
                <div className="mb-3 text-2xl">{f.icon}</div>
                <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                <p className="mt-1 text-xs text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

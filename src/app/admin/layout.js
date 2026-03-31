import Link from 'next/link'
import { signOutAction } from '@/actions/authActions'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const sidebarLinks = [
  { label: 'Dashboard', href: '/admin', icon: '⊞' },
  { label: 'Candidates', href: '/admin', icon: '👥' },
  { label: 'Interviews', href: '/admin/interviews', icon: '📅' },
  { label: 'Offers', href: '/admin/offers', icon: '📄' },
  { label: 'Emails', href: '/admin/emails', icon: '📬' },
  { label: 'Settings', href: '/admin/settings', icon: '⚙️' },
]


export const metadata = {
  title: 'Admin – HireOS',
}

export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-gray-900 md:flex">
        {/* Logo area */}
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
            <span className="text-xs font-bold text-white">H</span>
          </div>
          <span className="text-base font-bold text-white">HireOS</span>
          <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
            Admin
          </span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-white/30">
            Overview
          </p>
          {sidebarLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <span className="text-base">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* User info + sign out */}
        <div className="border-t border-white/10 p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3 px-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs font-bold text-white shrink-0">
                {user.email?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-white/80">{user.email}</p>
                <p className="text-xs text-white/40">Admin</p>
              </div>
            </div>
          )}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
            >
              <span>↩</span> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0 overflow-auto">{children}</div>
    </div>
  )
}

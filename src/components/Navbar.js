import Link from 'next/link'

const navLinks = [
  { label: 'Products', href: '#' },
  { label: 'Solutions', href: '#' },
  { label: 'Resources', href: '#' },
  { label: 'Company', href: '#' },
  { label: 'Pricing', href: '#' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-sm">
            <span className="text-xs font-bold text-white">H</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">HireOS</span>
        </Link>

        {/* Center nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side CTAs */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/careers"
            className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 transition-all"
          >
            Book a Demo
          </Link>
        </div>
      </nav>
    </header>
  )
}

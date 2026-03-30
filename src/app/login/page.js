import { Suspense } from 'react'
import LoginForm from './LoginForm'

export const metadata = {
  title: 'Sign In – HireOS',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-indigo-100 opacity-60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-purple-100 opacity-60 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur-sm shadow-xl px-8 py-10">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg mb-4">
              <span className="text-white font-bold text-xl">H</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">HireOS Admin</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to access the dashboard</p>
          </div>

          <Suspense fallback={<div className="h-48" />}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

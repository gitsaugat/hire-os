import { resolveCandidateByToken } from '@/lib/workflows/scheduling'
import { supabaseAdmin } from '@/lib/supabase-admin'
import SlotPicker from '@/components/SlotPicker'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Schedule your Interview | HireOS',
  description: 'Pick a time that works best for your interview.'
}

export default async function SchedulePage({ params }) {
  const { token } = await params

  // 1. Resolve candidate
  const candidate = await resolveCandidateByToken(token)
  if (!candidate) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4 sm:p-8 font-sans">
      <div className="w-full max-w-xl">
        {/* Branding */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg ring-4 ring-indigo-50">
            H
          </div>
          <span className="text-xl font-black text-gray-900 tracking-tight">HireOS</span>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 sm:p-12">
          <header className="mb-10">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
              Book your interview, {candidate.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 leading-relaxed">
              We're excited to learn more about you. Please select a 45-minute window that fits your schedule.
            </p>
          </header>

          <SlotPicker token={token} />

          <footer className="mt-12 pt-8 border-t border-gray-50 text-center">
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest px-4 py-2 bg-gray-50 rounded-full inline-block">
              Secured by HireOS Intelligence
            </p>
          </footer>
        </div>
      </div>
    </div>
  )
}

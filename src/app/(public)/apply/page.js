import { Suspense } from 'react'
import { getRoles } from '@/lib/roles'
import ApplyForm from './ApplyForm'

export const metadata = {
  title: 'Apply – HireOS',
  description: 'Submit your job application.',
}

export default async function ApplyPage() {
  const { data: roles, error } = await getRoles()

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-6 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load roles. Please check your Supabase configuration.
        </div>
      </div>
    )
  }

  return (
    <Suspense fallback={<div className="p-12 text-center text-zinc-400">Loading…</div>}>
      <ApplyForm roles={roles ?? []} />
    </Suspense>
  )
}

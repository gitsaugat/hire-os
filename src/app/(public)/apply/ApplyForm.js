'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { applyAction } from '@/actions/candidateActions'

export default function ApplyForm({ roles }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const formRef = useRef(null)

  const defaultRole = searchParams.get('role') || ''
  const [selectedRole, setSelectedRole] = useState(defaultRole)
  const [isPending, setIsPending] = useState(false)
  const [result, setResult] = useState(null) // { success, error, candidateId }
  const [fileName, setFileName] = useState('')

  useEffect(() => {
    setSelectedRole(searchParams.get('role') || '')
  }, [searchParams])

  async function handleSubmit(e) {
    e.preventDefault()
    setIsPending(true)
    setResult(null)

    const formData = new FormData(formRef.current)
    const res = await applyAction(formData)
    setResult(res)
    setIsPending(false)

    if (res.success) {
      formRef.current?.reset()
      setFileName('')
    }
  }

  if (result?.success) {
    return (
      <div className="mx-auto max-w-xl px-6 py-12">
        <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-xl font-semibold text-green-800">Application Submitted!</h2>
          <p className="mt-2 text-sm text-green-700">
            We&apos;ve received your application and will be in touch soon.
          </p>
          <button
            onClick={() => { setResult(null) }}
            className="mt-6 text-sm font-medium text-green-700 underline"
          >
            Submit another application
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Apply</h1>
        <p className="mt-2 text-zinc-500">Fill in your details and attach your resume.</p>
      </div>

      {result?.error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {result.error}
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {/* Role */}
        <div>
          <label htmlFor="role_id" className="block text-sm font-medium text-zinc-700 mb-1">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role_id"
            name="role_id"
            required
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="">Select a role…</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.title} — {role.team} · {role.location}
              </option>
            ))}
          </select>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Jane Smith"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="jane@example.com"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {/* LinkedIn */}
        <div>
          <label htmlFor="linkedin_url" className="block text-sm font-medium text-zinc-700 mb-1">
            LinkedIn URL
          </label>
          <input
            id="linkedin_url"
            name="linkedin_url"
            type="url"
            placeholder="https://linkedin.com/in/janesmith"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {/* GitHub / Portfolio */}
        <div>
          <label htmlFor="github_url" className="block text-sm font-medium text-zinc-700 mb-1">
            GitHub / Portfolio URL <span className="text-zinc-400">(optional)</span>
          </label>
          <input
            id="github_url"
            name="github_url"
            type="url"
            placeholder="https://github.com/janesmith"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>

        {/* Resume Upload */}
        <div>
          <label htmlFor="resume" className="block text-sm font-medium text-zinc-700 mb-1">
            Resume <span className="text-zinc-400">(PDF or DOCX, max 5 MB)</span>
          </label>
          <label
            htmlFor="resume"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-zinc-300 px-4 py-4 text-sm hover:border-zinc-500 transition-colors"
          >
            <span className="text-zinc-400 text-xl">📎</span>
            <span className="text-zinc-500">
              {fileName || 'Click to upload your resume'}
            </span>
          </label>
          <input
            id="resume"
            name="resume"
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-60 transition-colors"
        >
          {isPending ? 'Submitting…' : 'Submit Application'}
        </button>
      </form>
    </div>
  )
}

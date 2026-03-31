'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCandidateAction } from '@/actions/candidateActions'

export default function DeleteCandidateButton({ candidateId }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this candidate? This will also remove any scheduled interviews, active slot holds, and cancel Google Calendar events. This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    const { success, error } = await deleteCandidateAction(candidateId)
    
    if (success) {
      router.push('/admin')
      router.refresh()
    } else {
      alert(`Failed to delete candidate: ${error}`)
      setIsDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 px-4 py-2 text-sm font-semibold hover:bg-red-100 transition-colors ${
        isDeleting ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {isDeleting ? 'Deleting...' : 'Delete Candidate'}
    </button>
  )
}

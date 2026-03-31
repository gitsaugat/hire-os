import { notFound, redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-admin'
import InterviewRoom from './InterviewRoom'

export const dynamic = 'force-dynamic'

export default async function InterviewPage({ params }) {
  const { id } = await params

  // 1. Fetch Interview Record
  const { data: interview, error: interviewError } = await supabaseAdmin
    .from('interviews')
    .select('*')
    .eq('id', id)
    .single()

  if (interviewError || !interview) {
    console.error('[InterviewPage] Interview not found:', interviewError)
    notFound()
  }

  // 2. Access Control / Status Check
  if (interview.status === 'completed') {
    redirect(`/interview/${id}/summary`)
  }

  // 3. Fetch Candidate Data
  const { data: candidate, error: candidateError } = await supabaseAdmin
    .from('candidates')
    .select(`*, role:roles(title)`)
    .eq('id', interview.candidate_id)
    .single()

  if (candidateError || !candidate) {
    console.error('[InterviewPage] Candidate not found:', candidateError)
    notFound()
  }

  // Generate interviewer name from email temporarily since we don't have a users table
  const interviewerName = interview.interviewer_email.split('@')[0].replace(/\./g, ' ')

  return (
    <InterviewRoom 
      interview={interview} 
      candidate={candidate} 
      interviewerName={interviewerName}
    />
  )
}

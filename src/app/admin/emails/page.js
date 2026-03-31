import { supabaseAdmin } from '@/lib/supabase-admin'
import EmailsClient from './EmailsClient'

export const metadata = {
  title: 'Email Logs – HireOS Admin'
}

export const revalidate = 0 // always fetch fresh on page load since log is active

export default async function EmailsPage() {
  const { data: logs, error } = await supabaseAdmin
    .from('email_logs')
    .select(`
      *,
      candidate:candidates(name, role:roles(title))
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Failed to fetch email logs:', error)
  }

  return <EmailsClient initialLogs={logs || []} />
}

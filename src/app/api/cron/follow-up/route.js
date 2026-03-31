import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendEmail } from '@/lib/email'

// Secure the cron endpoint (Vercel standard)
const CRON_SECRET = process.env.CRON_SECRET || 'development-cron-secret'

export async function GET(req) {
  // 1. Verify Authorization
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 2. Calculate the 48-hour threshold
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

    // 3. Find inactive candidates stuck in scheduling
    // They must be 'INTERVIEW_SCHEDULING' AND 
    // Their last_contacted_at must be older than 48 hours, OR null if they've never been followed up with 
    // but their updated_at is older than 48 hours indicating system latency
    const { data: candidates, error } = await supabaseAdmin
      .from('candidates')
      .select('*, role:roles(title)')
      .eq('status', 'INTERVIEW_SCHEDULING')
      .or(`last_contacted_at.lt.${fortyEightHoursAgo},and(last_contacted_at.is.null,updated_at.lt.${fortyEightHoursAgo})`)

    if (error) throw error

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ success: true, message: 'No inactive candidates found.' })
    }

    const results = []

    // 4. Send follow-up emails
    for (const candidate of candidates) {
      const scheduleUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/schedule/${candidate.scheduling_token}`
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Still Interested, ${candidate.name}?</h2>
          <p>We noticed you haven't yet selected an interview time for the <strong>${candidate.role?.title}</strong> role.</p>
          <p>Our team is still excited to speak with you! Please use the link below to select a time that works for your schedule within the next 48 hours.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${scheduleUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Schedule Interview</a>
          </div>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 14px; color: #4b5563;">If none of these times work, you can now <strong>Request a Different Time</strong> directly on the scheduling page!</p>
          </div>
          <p style="font-size: 13px; color: #6b7280;">If you are no longer interested, please simply reply to this email to let us know.</p>
        </div>
      `

      const { success } = await sendEmail({
        to: candidate.email,
        subject: `Follow-up: Interview scheduling for ${candidate.role?.title}`,
        html: emailHtml,
        candidateId: candidate.id
      })

      if (success) {
        // Update last_contacted_at to prevent spam loop
        await supabaseAdmin
          .from('candidates')
          .update({ last_contacted_at: new Date().toISOString() })
          .eq('id', candidate.id)
          
        results.push({ email: candidate.email, status: 'followed_up' })
      } else {
        results.push({ email: candidate.email, status: 'failed' })
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results })
  } catch (error) {
    console.error('[CRON Follow-Up Error]:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

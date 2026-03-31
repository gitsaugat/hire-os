'use server'

import { supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function submitSchedulingRequestAction(candidateId, requestedTime, reason) {
  if (!candidateId || !reason) {
    return { success: false, error: 'Candidate ID and reason are required.' }
  }

  try {
    const { error } = await supabaseAdmin
      .from('scheduling_requests')
      .insert({
        candidate_id: candidateId,
        requested_time: requestedTime || null,
        reason: reason,
        status: 'PENDING'
      })

    if (error) throw error

    // Note: To avoid Supabase ENUM conflicts on candidate.status,
    // we keep candidate.status as 'INTERVIEW_SCHEDULING' and rely on the
    // scheduling_requests table to track this auxiliary state.

    revalidatePath(`/admin/interviews`)
    return { success: true }
  } catch (error) {
    console.error('Submit Scheduling Request Error:', error)
    return { success: false, error: error.message }
  }
}

export async function fetchRawSlotsAction(candidateId) {
  const { getAvailability } = await import('@/lib/workflows/scheduling')
  return await getAvailability(candidateId, true) // ignore overrides
}

export async function reviewSchedulingRequestAction(requestId, candidateId, decision, adminNotes = '', offeredSlots = []) {
  // decision: 'APPROVED' or 'REJECTED'
  try {
    const { error } = await supabaseAdmin
      .from('scheduling_requests')
      .update({
        status: decision,
        admin_notes: adminNotes,
        offered_slots: offeredSlots.length > 0 ? offeredSlots : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)

    if (error) throw error

    const { sendEmail } = await import('@/lib/email')
    const { data: candidate } = await supabaseAdmin.from('candidates').select('name, email, scheduling_token, role:roles(title)').eq('id', candidateId).single()
    
    const scheduleUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/schedule/${candidate.scheduling_token}`
    
    const emailSubject = decision === 'APPROVED' 
      ? `Interview Update for ${candidate.role?.title} - New Times Available` 
      : `Interview Update for ${candidate.role?.title}`
      
    // Aesthetic HTML email templates
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 10px;">
        <h2 style="color: ${decision === 'APPROVED' ? '#10b981' : '#4f46e5'};">Scheduling Request Update</h2>
        <p>Hi ${candidate.name},</p>
        <p>Our team has reviewed your request regarding interview availability.</p>
        
        <div style="background-color: ${decision === 'APPROVED' ? '#f0fdf4' : '#f9fafb'}; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid ${decision === 'APPROVED' ? '#d1fae5' : '#f3f4f6'};">
          <p style="margin: 0; font-size: 14px; color: #374151;">
            ${decision === 'APPROVED' 
              ? '<strong>Good news!</strong> We have opened up new availability specifically for you. Please use your secure link below to select a time that works.'
              : 'Our interviewers are unfortunately not available outside the standard provided blocks at this time. Please select whatever time from the original options fits you best.'}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${scheduleUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">View Available Times</a>
        </div>
        
        <p style="font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          Best regards,<br>
          <strong>The HireOS Talent Team</strong>
        </p>
      </div>
    `
      
    await sendEmail({
      to: candidate.email,
      subject: emailSubject,
      html: emailHtml,
      candidateId: candidateId
    })

    revalidatePath('/admin/interviews')
    
    return { success: true }
  } catch (error) {
    console.error('Review Scheduling Request Error:', error)
    return { success: false, error: error.message }
  }
}

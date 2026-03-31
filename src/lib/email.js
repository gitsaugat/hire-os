import sgMail from '@sendgrid/mail'

// Initialize SendGrid with API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'hire@yourdomain.com'

/**
 * Generic email sender using SendGrid.
 */
export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[EMAIL MOCK] To:', to, 'Subject:', subject)
    return { success: true, mock: true }
  }

  console.log(`[EMAIL] Attempting to send to: ${to} | Subject: ${subject}`)

  const msg = {
    to,
    from: FROM_EMAIL,
    subject,
    text: text || subject,
    html,
  }

  try {
    const response = await sgMail.send(msg)
    console.log(`[EMAIL] SendGrid success for: ${to} | Status: ${response[0].statusCode}`)
    return { success: true }
  } catch (error) {
    console.error('[SendGrid Error]:', error.response?.body || error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Template for Interview Invitation (Scheduling).
 */
export function getInvitationTemplate(candidateName, roleTitle, teamName, roleDescription, schedulingUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 10px;">
      <h2 style="color: #4f46e5;">Congratulations, ${candidateName}!</h2>
      <p>You've been shortlisted for the <strong>${roleTitle}</strong> position within the <strong>${teamName}</strong> team.</p>
      
      <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6;">
        <h4 style="margin-top: 0; color: #374151;">Role Insight:</h4>
        <p style="font-size: 14px; color: #4b5563; line-height: 1.5;">${roleDescription || 'Join us and make an impact in your next role.'}</p>
      </div>

      <p>Our team was impressed by your profile and we'd love to learn more about you. Please select a time for your interview using the link below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${schedulingUrl}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Schedule Your Interview</a>
      </div>

      <p style="font-size: 14px; color: #6b7280;">If the button above doesn't work, copy and paste this URL into your browser: <br> ${schedulingUrl}</p>
      
      <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #f3f4f6; pt-20px;">
        Best regards,<br>
        <strong>The HireOS Talent Team</strong>
      </p>
    </div>
  `
}

/**
 * Template for Interview Confirmation (Calendar Event).
 */
export function getConfirmationTemplate(candidateName, roleTitle, startTime, interviewId) {
  const date = new Date(startTime).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  const meetingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview/${interviewId}`

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 10px;">
      <h2 style="color: #10b981;">Interview Confirmed!</h2>
      <p>Hi ${candidateName}, your interview for the <strong>${roleTitle}</strong> position has been successfully scheduled.</p>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; margin: 20px 0;">
        <p style="margin: 5px 0; font-size: 16px;"><strong>📅 When:</strong> ${date}</p>
        <p style="margin: 5px 0; font-size: 16px;"><strong>🏢 Where:</strong> Online Meeting Room</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${meetingUrl}" style="display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Join Interview Room</a>
      </div>

      <p>A calendar invitation has been sent to your email. Please make sure to add it to your calendar and join using the button above at the scheduled time.</p>
      
      <p>We look forward to meeting you! If you have any questions or need to reschedule, please reply to this email.</p>
      
      <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #f3f4f6; pt-20px;">
        Best regards,<br>
        <strong>The HireOS Talent Team</strong>
      </p>
    </div>
  `
}

/**
 * Compatibility function for invitation emails.
 */
export async function sendSchedulingEmail(candidate, token, role) {
  const schedulingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/schedule/${token}`
  
  const html = getInvitationTemplate(
    candidate.name,
    role.title,
    role.team || 'Engineering',
    role.description,
    schedulingUrl
  )

  return await sendEmail({
    to: candidate.email,
    subject: `Interview Invitation: ${role.title} at HireOS`,
    html
  })
}

/**
 * Template for Offer Letter Delivery.
 */
export function getOfferTemplate(candidateName, roleTitle, signingUrl) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 10px;">
      <h2 style="color: #7c6ef0;">Your Offer from HireOS!</h2>
      <p>Hi ${candidateName},</p>
      <p>We are absolutely thrilled to officially offer you the position of <strong>${roleTitle}</strong> at HireOS!</p>
      
      <p>Our team was incredibly impressed with your performance during the interview process, and we believe you'll be a fantastic addition to our mission.</p>
      
      <div style="background-color: #f5f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #7c6ef0; margin: 25px 0;">
        <p style="margin: 0; font-size: 15px; color: #4c1d95; line-height: 1.6;">
          Please review the details of your offer and sign the letter using our secure portal below. This offer is valid for 7 days.
        </p>
      </div>

      <div style="text-align: center; margin: 35px 0;">
        <a href="${signingUrl}" style="display: inline-block; background: #7c6ef0; color: white; padding: 14px 40px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(124, 110, 240, 0.3);">View & Sign Offer Letter</a>
      </div>

      <p>We're looking forward to having you on board! If you have any questions before signing, please don't hesitate to reach out.</p>
      
      <p style="font-size: 12px; color: #9ca3af; margin-top: 40px; border-top: 1px solid #f3f4f6; padding-top: 20px;">
        Best regards,<br>
        <strong>The HireOS Talent Team</strong>
      </p>
    </div>
  `
}

/**
 * Compatibility function for confirmation emails.
 */
export async function sendConfirmationEmail(candidate, startTime, role, interviewId) {
  const html = getConfirmationTemplate(
    candidate.name,
    role.title,
    startTime,
    interviewId
  )

  return await sendEmail({
    to: candidate.email,
    subject: `Confirmed: ${role.title} Interview`,
    html
  })
}

/**
 * Sends the official offer letter email.
 */
export async function sendOfferEmail(candidate, roleTitle, signingToken) {
  const signingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/offer/${signingToken}`
  
  const html = getOfferTemplate(
    candidate.name,
    roleTitle,
    signingUrl
  )

  return await sendEmail({
    to: candidate.email,
    subject: `Offer Letter: ${roleTitle} at HireOS`,
    html
  })
}

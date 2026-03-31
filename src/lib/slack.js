import { WebClient } from '@slack/web-api'
import { supabaseAdmin } from './supabase-admin'
import { generateCompletion } from './ai'

const slackToken = process.env.SLACK_BOT_TOKEN
const defaultChannel = process.env.SLACK_DEFAULT_CHANNEL || '#general'
const hrChannel = process.env.SLACK_HR_CHANNEL || '#hr-notifications'

const slack = slackToken ? new WebClient(slackToken) : null

/**
 * Log aSlack action for observability.
 */
async function logSlackAction({ candidate_id, channel, message_preview, status, error_message }) {
  try {
    await supabaseAdmin.from('slack_logs').insert({
      candidate_id,
      channel,
      message_preview: message_preview?.substring(0, 200),
      status,
      error_message
    })
  } catch (err) {
    console.error('[SlackLog] Failed to log Slack action:', err)
  }
}

/**
 * AI-generated personalized welcome message.
 */
async function generateSlackWelcomeMessage(candidate, role, offer) {
  const startDate = new Date(offer.start_date).toLocaleDateString('en-US', { 
    month: 'long', day: 'numeric', year: 'numeric' 
  })
  
  const prompt = `
    You are the HireOS Onboarding Assistant. 
    Generate a friendly, professional, and concise Slack welcome message for a new hire.
    
    Candidate Name: ${candidate.name}
    Role: ${role.title}
    Team: ${role.team || 'Engineering'}
    Start Date: ${startDate}
    Manager: ${offer.manager_name || 'their hiring manager'}
    
    The message should:
    - Welcome them to the team.
    - Confirm their role and start date.
    - Mention that onboarding resources will follow.
    - Use a warm tone with 1-2 appropriate emojis.
    - Use Slack markdown (*bold*).
    - Be under 150 words.
    
    Output ONLY the final Slack message content.
  `

  try {
    const aiResponse = await generateCompletion(prompt)
    return aiResponse.trim()
  } catch (err) {
    console.error('[SlackAI] Failed to generate welcome message:', err)
    return `Welcome to the team, *${candidate.name}*! We are thrilled to have you join as our new *${role.title}* starting ${startDate}. Your manager will reach out soon with onboarding resources!`
  }
}

/**
 * Higher-level workflow to onboard a candidate via Slack.
 * Triggered when offer is signed.
 */
export async function sendOnboardingSlackWorkflow(candidateId) {
  if (!slack) {
    console.warn('[Slack] Integration not configured (missing token). skipping.')
    return { success: false, error: 'Slack not configured' }
  }

  try {
    // 1. Fetch Candidate + Offer Data
    const { data: candidate, error: fetchErr } = await supabaseAdmin
      .from('candidates')
      .select('*, role:roles(*), offers(*)')
      .eq('id', candidateId)
      .single()

    if (fetchErr || !candidate) throw new Error('Candidate or offer data not found')
    
    const signedOffer = candidate.offers?.find(o => o.status === 'ACCEPTED')
    if (!signedOffer) throw new Error('No signed offer found for this candidate')

    // 2. Generate AI Message
    const welcomeText = await generateSlackWelcomeMessage(candidate, candidate.role, signedOffer)

    // 3. Send Welcome Message to Default Channel
    let welcomeStatus = 'SENT'
    let welcomeErr = null
    try {
      await slack.chat.postMessage({
        channel: defaultChannel,
        text: welcomeText,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: welcomeText }
          }
        ]
      })
    } catch (err) {
      welcomeStatus = 'FAILED'
      welcomeErr = err.message
      console.error('[SlackWelcome] Failed:', err)
    }

    // 4. Send HR Notification
    let hrStatus = 'SENT'
    let hrErr = null
    try {
      const hrText = `🚀 *New hire onboarded:* ${candidate.name} – ${candidate.role.title}`
      await slack.chat.postMessage({
        channel: hrChannel,
        text: hrText
      })
    } catch (err) {
      hrStatus = 'FAILED'
      hrErr = err.message
      console.error('[SlackHR] Failed:', err)
    }

    // 5. Log actions
    await Promise.all([
      logSlackAction({
        candidate_id: candidateId,
        channel: defaultChannel,
        message_preview: welcomeText,
        status: welcomeStatus,
        error_message: welcomeErr
      }),
      logSlackAction({
        candidate_id: candidateId,
        channel: hrChannel,
        message_preview: `New hire onboarded: ${candidate.name}`,
        status: hrStatus,
        error_message: hrErr
      })
    ])

    return { 
      success: true, 
      welcome: welcomeStatus === 'SENT',
      hr: hrStatus === 'SENT'
    }
  } catch (error) {
    console.error('[SlackWorkflow] Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Legacy compatibility: Notify HR about offer acceptance.
 * This is now largely superseded by the workflow but kept for direct calls.
 */
export async function notifyHRAboutAcceptance(candidate, role) {
  if (!slack || !hrChannel) return { success: false }
  try {
    const result = await slack.chat.postMessage({
      channel: hrChannel,
      text: `🎉 *Offer Signed:* ${candidate.name} has accepted the role of ${role?.title}.`
    })
    return { success: true, result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

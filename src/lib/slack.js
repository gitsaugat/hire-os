import { WebClient } from '@slack/web-api'

const slackToken = process.env.SLACK_BOT_TOKEN
const hrChannelId = process.env.SLACK_HR_CHANNEL_ID

const slack = slackToken ? new WebClient(slackToken) : null

/**
 * Notify the HR channel that an offer has been accepted.
 */
export async function notifyHRAboutAcceptance(candidate, role) {
  if (!slack || !hrChannelId) {
    console.warn('Slack integration not configured. Skipping HR notification.')
    return { success: false, error: 'Slack not configured' }
  }

  try {
    const result = await slack.chat.postMessage({
      channel: hrChannelId,
      text: `🎉 *Offer Accepted!* 🎉\n*${candidate.name}* has just signed the offer for the *${role?.title}* position.`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎉 *Offer Accepted!* 🎉\n*${candidate.name}* has just signed the digital proposal for the *${role?.title}* position on the *${role?.team}* team.`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Please initiate the standard onboarding protocol. A Slack workspace invitation has been triggered.`
            }
          ]
        }
      ]
    })
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send Slack HR notification:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send a welcome onboarding DM to a new user.
 */
export async function sendWelcomeMessage(slackUserId, messageMarkdown) {
  if (!slack) {
    console.warn('Slack integration not configured. Skipping welcome message.')
    return { success: false, error: 'Slack not configured' }
  }

  try {
    const result = await slack.chat.postMessage({
      channel: slackUserId, // Sending directly to the user ID acts as a DM in Slack
      text: "Welcome to the team! We're excited to have you.", // Fallback text
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: messageMarkdown
          }
        }
      ]
    })
    return { success: true, result }
  } catch (error) {
    console.error('Failed to send Slack personalized welcome message:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Optionally try to invite the user via API (Requires Enterprise Grid / specific scopes).
 * Most standard integrations will rely on emails sending join links instead.
 */
export async function attemptWorkspaceInvite(email) {
  const sendEmailFallback = async () => {
    try {
      const { sendSlackInviteEmail } = await import('./email')
      await sendSlackInviteEmail(email)
      console.log(`[SLACK] Sent email invite fallback to ${email}`)
      return { success: true, fallback: 'email_sent' }
    } catch (emailErr) {
      console.error('Failed to send fallback Slack email invite:', emailErr)
      return { success: false, error: emailErr.message }
    }
  }

  if (!slack) {
    console.log('Slack not configured. Skipping API invite and going straight to email fallback.')
    return await sendEmailFallback()
  }
  
  try {
    // Note: admin.users.invite requires Enterprise Grid.
    const result = await slack.admin.users.invite({
      team_id: process.env.SLACK_TEAM_ID,
      email: email,
      channel_ids: hrChannelId
    })
    return { success: true, result }
  } catch (error) {
    console.log('Slack admin invite API failed or unauthorized. Falling back to email.', error.message)
    return await sendEmailFallback()
  }
}


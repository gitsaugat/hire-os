import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { generateCompletion } from '@/lib/ai'
import { sendWelcomeMessage } from '@/lib/slack'

export async function POST(request) {
  try {
    const body = await request.json()

    // 1. Handle Slack URL Verification Challenge
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }

    // 2. Handle team_join events
    if (body.event && body.event.type === 'team_join') {
      // It's best practice to acknowledge receipt immediately to prevent Slack retries,
      // but in Next.js Serverless we must await the work or use waitUntil. 
      // For this implementation, we'll await the straightforward process.
      await handleTeamJoin(body.event)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling Slack event:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

async function handleTeamJoin(event) {
  const user = event.user
  const email = user?.profile?.email

  if (!email) {
    console.log('No email found in team_join event profile. Skipping.')
    return
  }

  // Look up candidate in our system by email
  const { data: candidates, error } = await supabaseAdmin
    .from('candidates')
    .select(`
      id, 
      name, 
      status,
      role:roles (
        title,
        team
      ),
      offers (
        start_date,
        status
      )
    `)
    .eq('email', email)
  
  if (error || !candidates || candidates.length === 0) {
    console.log(`No candidate found matching email: ${email}`)
    return
  }

  const candidate = candidates[0]
  
  // They must have an accepted offer to get the welcome journey
  const acceptedOffer = candidate.offers?.find(o => o.status === 'ACCEPTED')
  if (!acceptedOffer) {
    console.log(`Candidate ${candidate.name} has no accepted offer. Skipping welcome message.`)
    return
  }

  const { role } = candidate
  const startDate = new Date(acceptedOffer.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  // Construct prompt for AI personalized message
  const prompt = `
You are the official HireOS Slack Onboarding Assistant.
A new candidate has just joined the company Slack workspace.

Candidate Name: ${candidate.name}
Role: ${role?.title}
Team: ${role?.team}
Start Date: ${startDate}

Please write a short, warm, and highly personalized Slack welcome message. 
- Include their name, role, and team.
- Mention their start date.
- Say that their manager will reach out to them shortly.
- Provide a couple of helpful links for onboarding (make them up, e.g., an IT Welcome Guide or Employee Handbook).
- Use a friendly, professional tone with appropriate emojis.
- Do not output any thinking process or generic greetings, JUST the final Slack message formatted with Slack markdown (use * for bold).
`

  console.log(`[Slack] Generating personalized welcome message for ${candidate.name}...`)
  
  try {
    const aiMessage = await generateCompletion(prompt)
    
    // Send the DM
    await sendWelcomeMessage(user.id, aiMessage)
    console.log(`[Slack] Successfully sent welcome DM to ${candidate.name} (${user.id})`)
  } catch (err) {
    console.error(`[Slack] Failed to generate/send welcome message:`, err.message)
    // Fallback if AI fails
    await sendWelcomeMessage(user.id, `Welcome to the team, ${candidate.name}! We are thrilled to have you join as our new ${role?.title}. Your manager will reach out shortly!`)
  }
}

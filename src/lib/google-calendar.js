/**
 * Google Calendar Utility — Fetches busy times via FreeBusy API.
 */
export async function getBusyTimes(email, timeMin, timeMax) {
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY

  if (!apiKey) {
    console.warn('[GoogleCalendar] GOOGLE_CALENDAR_API_KEY missing. Falling back to mock data.')
    return getMockBusyTimes(timeMin, timeMax)
  }

  try {
    console.log(`[GoogleCalendar] Fetching FreeBusy for: ${email}`)
    console.log(`[GoogleCalendar] Request Body:`, JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: email }]
    }))

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: email }]
      })
    })
    
    clearTimeout(timeoutId)

    console.log(`[GoogleCalendar] Response Status: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      throw new Error(`Google Calendar API failed: ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[GoogleCalendar] Raw Response Data:`, JSON.stringify(data))
    const busy = data.calendars?.[email]?.busy || []

    return busy.map(b => ({
      start: new Date(b.start),
      end: new Date(b.end)
    }))
  } catch (error) {
    console.error(`[GoogleCalendar] FreeBusy fetch failed:`, error.message)
    return getMockBusyTimes(timeMin, timeMax)
  }
}

/**
 * Mock busy times for testing/demo.
 * Generates random 1-hour blocks.
 */
function getMockBusyTimes(timeMin, timeMax) {
  console.log('[GoogleCalendar] Generating mock busy times...')
  const busy = []
  const current = new Date(timeMin)

  // Randomly add 2-3 busy blocks per day
  while (current < timeMax) {
    if (current.getDay() !== 0 && current.getDay() !== 6) { // Weekdays only
      // Mock meeting 1: 10:00 - 11:30
      const b1Start = new Date(current)
      b1Start.setHours(10, 0, 0, 0)
      const b1End = new Date(current)
      b1End.setHours(11, 30, 0, 0)
      busy.push({ start: b1Start, end: b1End })

      // Mock meeting 2: 14:00 - 15:00
      const b2Start = new Date(current)
      b2Start.setHours(14, 0, 0, 0)
      const b2End = new Date(current)
      b2End.setHours(15, 0, 0, 0)
      busy.push({ start: b2Start, end: b2End })
    }
    current.setDate(current.getDate() + 1)
  }
  return busy
}

/**
 * Create a calendar event for a confirmed interview.
 * REQUIRES: Google Service Account or OAuth2 token in .env.local
 */
export async function createCalendarEvent(candidate, slot) {
  const accessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN
  const calendarId = slot.email || 'primary'

  if (!accessToken) {
    console.warn('[GoogleCalendar] No access token found. Skipping live event creation.')
    console.log('[GoogleCalendar] Mocking event creation for:', candidate?.name, 'at:', slot.start_time)
    return { success: true, mock: true }
  }

  try {
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        summary: `Interview: ${candidate.name} x HireOS`,
        description: `Ref: ${candidate.email}\nJoined via HireOS Automated Scheduler.`,
        start: { dateTime: slot.start_time },
        end: { dateTime: slot.end_time },
        attendees: [
          { email: candidate.email },
          { email: slot.email }
        ],
        reminders: {
          useDefault: true
        }
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message || 'Google API Error')
    }

    console.log(`[GoogleCalendar] Event created successfully for ${candidate.name}`)
    return { success: true }
  } catch (error) {
    console.error('[GoogleCalendar] Failed to create event:', error.message)
    return { success: false, error: error.message }
  }
}

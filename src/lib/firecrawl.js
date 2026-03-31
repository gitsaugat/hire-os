/**
 * Firecrawl Utility — Scrapes URLs and returns markdown/text.
 * used for LinkedIn profiles and personal websites.
 */
export async function scrapeUrl(url) {
  const apiKey = process.env.FIRECRAWL_API_KEY

  if (!apiKey) {
    console.warn('[Firecrawl] FIRECRAWL_API_KEY missing. Skipping scrape.')
    return null
  }

  try {
    console.log(`[Firecrawl] Scraping URL: ${url}`)
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: url,
        pageOptions: {
          onlyMainContent: true
        }
      })
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || response.statusText)
    }

    const data = await response.json()

    if (data.success && data.data) {
      return {
        content: data.data.markdown || data.data.content || '',
        metadata: data.data.metadata || {}
      }
    }

    return null
  } catch (error) {
    console.error(`[Firecrawl] Search failed for ${url}:`, error.message)
    return null
  }
}

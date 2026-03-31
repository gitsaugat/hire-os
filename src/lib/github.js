/**
 * GitHub Utility — Fetches repository data via GitHub API.
 * used to evaluate engineering depth.
 */
export async function getGitHubData(githubUrl) {
  if (!githubUrl) return null

  try {
    // 1. Extract username from GitHub URL
    // Examples: https://github.com/username, https://github.com/username/, github.com/username
    const cleanedUrl = githubUrl.replace(/\/$/, '') // remove trailing slash
    const parts = cleanedUrl.split('/')
    const username = parts[parts.length - 1]

    if (!username) return null

    console.log(`[GitHub] Fetching repositories for user: ${username}`)

    // 2. Fetch repos (top 30 by default)
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${process.env.GITHUB_API_KEY}` // Optional: if we have a token
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API failed: ${response.statusText}`)
    }

    const repos = await response.json()

    if (!Array.isArray(repos)) return null

    // 3. Process top 5 repos by stars or recent activity
    const processedRepos = repos
      .sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0))
      .slice(0, 5)
      .map(repo => ({
        name: repo.name,
        description: repo.description || 'No description provided',
        language: repo.language || 'Multiple',
        stars: repo.stargazers_count || 0,
        url: repo.html_url
      }))

    return {
      username: username,
      repositories: processedRepos,
      total_repos: repos.length
    }
  } catch (error) {
    console.error(`[GitHub] Fetch failed for ${githubUrl}:`, error.message)
    return null
  }
}

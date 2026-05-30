/**
 * GitHub Search API — repos comparáveis por stack (Fase 2)
 * Auth: GitHub App ou GITHUB_TOKEN
 */
import { getGithubAuthToken, githubHeaders } from './github-auth.mjs'

const QUERY_MAP = {
  vite: 'vite topic:vite stars:>100',
  react: 'react topic:react stars:>500',
  next: 'nextjs topic:nextjs stars:>200',
  streamlit: 'streamlit topic:streamlit stars:>50',
  'node-monorepo': 'monorepo topic:nodejs stars:>100',
}

export function buildSearchQuery(profile) {
  const fw = profile.summary?.frameworks || []
  for (const key of ['vite', 'next', 'streamlit', 'react', 'node-monorepo']) {
    if (fw.includes(key) && QUERY_MAP[key]) return QUERY_MAP[key]
  }
  const langs = (profile.signals || []).find((s) => s.id === 'languages')?.evidence
  if (Array.isArray(langs) && langs.includes('python')) return 'python topic:python stars:>500'
  return 'topic:nodejs stars:>1000'
}

export async function searchComparableRepos(profile) {
  const query = buildSearchQuery(profile)
  const auth = await getGithubAuthToken().catch(() => ({ token: process.env.GITHUB_TOKEN, type: 'pat' }))
  const headers = githubHeaders(auth.token)

  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=5`
    const res = await fetch(url, { headers })
    if (!res.ok) {
      return {
        query,
        items: [],
        note: auth.token ? `GitHub API ${res.status}` : 'Sem auth — configure GITHUB_TOKEN ou GitHub App',
        rateLimited: res.status === 403,
      }
    }
    const data = await res.json()
    const items = (data.items || []).map((r) => ({
      fullName: r.full_name,
      url: r.html_url,
      stars: r.stargazers_count,
      description: r.description || '',
      topics: (r.topics || []).slice(0, 5),
    }))
    return { query, items, totalCount: data.total_count || items.length }
  } catch (err) {
    return { query, items: [], error: err.message }
  }
}

export function mergeGithubSearchIntoPatterns(externalPatterns, search) {
  const fromSearch = (search.items || []).map((r) => ({
    catalogId: 'github-search',
    sourceRepo: r.fullName,
    url: r.url,
    patterns: r.topics,
    stars: r.stars,
    fromApi: true,
  }))
  return [...externalPatterns, ...fromSearch]
}

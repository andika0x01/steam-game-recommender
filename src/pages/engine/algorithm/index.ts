import { GenreWeight } from './types'
import { calculateBayesianScore } from './bayesian'
import { runSimulatedAnnealing, CandidateGame } from './sa'

export * from './types'
export * from './fuzzyLogic'
export * from './bayesian'
export * from './sa'
export type { CandidateGame }

export async function generateDeepPersonalizedRecommendations(
  userLibrary: any[],
  candidates: any[],
  kv: any,
  count: number = 12
): Promise<CandidateGame[]> {
  // 1. Scoring Phase: Calculate Bayesian Probability for ALL candidates
  // We process in batches to handle KV enrichment
  const scoredCandidates: CandidateGame[] = await Promise.all(
    candidates.map(async (game) => {
      // Ensure we have genre data (Enrichment from KV)
      let genres = game.genres || []
      if (genres.length === 0) {
        const details = await fetchAppDetailsWithCache(kv, game.appid)
        genres = details?.genres?.map((g: any) => g.description) || ['Indie']
      }

      const score = calculateBayesianScore(genres, userLibrary)
      return {
        appid: game.appid,
        name: game.name,
        genres,
        score
      }
    })
  )

  // 2. Optimization Phase: Simulated Annealing
  // SA will select the best 'count' games, maximizing score while ensuring diversity
  return runSimulatedAnnealing(scoredCandidates, count)
}

// Helper internal to avoid circular deps or redundant code
async function fetchAppDetailsWithCache(kv: any, appId: number) {
  const cacheKey = `app_details:${appId}`
  const cached = await kv.get(cacheKey, 'json')
  if (cached) return cached

  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`
  try {
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data[appId]?.success) {
        const appData = data[appId].data
        await kv.put(cacheKey, JSON.stringify(appData))
        return appData
      }
    }
  } catch (e) {}
  return null
}

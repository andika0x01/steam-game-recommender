/**
 * Core Mathematical & Algorithmic Functions
 */

// 1. Fuzzy Logic Primitives
export function trapezoid(x: number, a: number, b: number, c: number, d: number): number {
  if (x <= a || x >= d) return 0
  if (x >= b && x <= c) return 1
  if (x > a && x < b) return (x - a) / (b - a)
  if (x > c && x < d) return (d - x) / (d - c)
  return 0
}

// 2. Bayesian & Profiling Primitives
export interface GenreProfile {
  genre: string
  score: number
}

export function calculateNormalizedProfile(items: any[], getWeight: (item: any) => number): GenreProfile[] {
  const genreTotalWeights: Record<string, number> = {}
  
  items.forEach(item => {
    const weight = getWeight(item)
    const genres = item.genres || []
    genres.forEach((genreObj: any) => {
      const genreName = typeof genreObj === 'string' ? genreObj : (genreObj.description || genreObj.name)
      if (genreName) {
        genreTotalWeights[genreName] = (genreTotalWeights[genreName] || 0) + weight
      }
    })
  })

  const totalWeightSum = Object.values(genreTotalWeights).reduce((a, b) => a + b, 0) || 1
  
  return Object.entries(genreTotalWeights)
    .map(([genre, weight]) => ({
      genre,
      score: weight / totalWeightSum
    }))
    .sort((a, b) => b.score - a.score)
}

export function calculateAffinityScore(itemGenres: string[], profile: GenreProfile[]): number {
  if (itemGenres.length === 0) return 0.1

  let aggregateScore = 0
  itemGenres.forEach(genre => {
    const profileEntry = profile.find(p => p.genre === genre)
    aggregateScore += profileEntry ? profileEntry.score : (1 / (profile.length + 10))
  })

  return Math.min(1.0, aggregateScore / itemGenres.length)
}

// 3. Optimization Primitives (Simulated Annealing)
export interface ScoredCandidate {
  appid: number
  genres: string[]
  score: number
  [key: string]: any
}

export function runSAOptimization(
  candidates: ScoredCandidate[],
  count: number,
  calculateEnergy: (solution: ScoredCandidate[]) => number
): ScoredCandidate[] {
  if (candidates.length === 0) return []

  // Ensure uniqueness
  const uniqueMap = new Map<number, ScoredCandidate>()
  candidates.forEach(c => {
    if (!uniqueMap.has(c.appid) || c.score > uniqueMap.get(c.appid)!.score) {
      uniqueMap.set(c.appid, c)
    }
  })
  const pool = Array.from(uniqueMap.values())
  
  let currentSolution = [...pool]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(count, pool.length))
  
  let currentEnergy = calculateEnergy(currentSolution)
  let temp = 100
  const coolingRate = 0.96

  while (temp > 1) {
    let nextSolution = [...currentSolution]
    const idxToRemove = Math.floor(Math.random() * currentSolution.length)
    const idxToAdd = Math.floor(Math.random() * pool.length)
    const candidateToAdd = pool[idxToAdd]

    if (!nextSolution.some(g => g.appid === candidateToAdd.appid)) {
      nextSolution[idxToRemove] = candidateToAdd
      const nextEnergy = calculateEnergy(nextSolution)
      if (nextEnergy > currentEnergy || Math.random() < Math.exp((nextEnergy - currentEnergy) / temp)) {
        currentSolution = nextSolution
        currentEnergy = nextEnergy
      }
    }
    temp *= coolingRate
  }

  return currentSolution.sort((a, b) => b.score - a.score)
}

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

// 2. Naive Bayes Classifier
export interface NaiveBayesModel {
  priorLiked: number
  priorDisliked: number
  tagLikelihoodsLiked: Record<string, number>
  tagLikelihoodsDisliked: Record<string, number>
  defaultLikelihoodLiked: number
  defaultLikelihoodDisliked: number
}

export function trainNaiveBayes(library: any[]): NaiveBayesModel {
  let totalLikedWeight = 0
  let totalDislikedWeight = 0
  
  const tagCountsLiked: Record<string, number> = {}
  const tagCountsDisliked: Record<string, number> = {}

  // Calculate dynamic threshold: 15% of average playtime in library
  const avgPlaytime = library.reduce((sum, g) => sum + (g.playtime_forever || 0), 0) / (library.length || 1)
  const dynamicThreshold = Math.max(1, (avgPlaytime / 60) * 0.15) // Min 1 hour

  library.forEach(game => {
    const hours = (game.playtime_forever || 0) / 60
    // Fuzzified playtime score (0.0 to 1.0) using dynamic threshold
    const fuzzyScore = trapezoid(hours, 0, dynamicThreshold, 1000, 1000)
    
    const likedWeight = fuzzyScore
    const dislikedWeight = 1 - fuzzyScore

    totalLikedWeight += likedWeight
    totalDislikedWeight += dislikedWeight

    // Use top 5 tags only
    const tags = game.tags || {}
    const topTags = Object.entries(tags)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([tag]) => tag)
    
    topTags.forEach(tag => {
      tagCountsLiked[tag] = (tagCountsLiked[tag] || 0) + likedWeight
      tagCountsDisliked[tag] = (tagCountsDisliked[tag] || 0) + dislikedWeight
    })
  })

  // Laplace Smoothing
  const alpha = 1
  const allTags = new Set([...Object.keys(tagCountsLiked), ...Object.keys(tagCountsDisliked)])
  const V = allTags.size || 1

  const tagLikelihoodsLiked: Record<string, number> = {}
  const tagLikelihoodsDisliked: Record<string, number> = {}

  allTags.forEach(tag => {
    tagLikelihoodsLiked[tag] = ((tagCountsLiked[tag] || 0) + alpha) / (totalLikedWeight + alpha * V)
    tagLikelihoodsDisliked[tag] = ((tagCountsDisliked[tag] || 0) + alpha) / (totalDislikedWeight + alpha * V)
  })

  const totalWeight = totalLikedWeight + totalDislikedWeight || 1

  return {
    priorLiked: (totalLikedWeight + alpha) / (totalWeight + 2 * alpha),
    priorDisliked: (totalDislikedWeight + alpha) / (totalWeight + 2 * alpha),
    tagLikelihoodsLiked,
    tagLikelihoodsDisliked,
    defaultLikelihoodLiked: alpha / (totalLikedWeight + alpha * V),
    defaultLikelihoodDisliked: alpha / (totalDislikedWeight + alpha * V)
  }
}

export function calculateNaiveBayesPosterior(game: any, model: NaiveBayesModel): number {
  const tags = game.tags || {}
  // Use top 5 tags only
  const topTags = Object.entries(tags)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([tag]) => tag)

  // Prior probabilities in log space
  let logProbLiked = Math.log(model.priorLiked)
  let logProbDisliked = Math.log(model.priorDisliked)

  topTags.forEach(tag => {
    logProbLiked += Math.log(model.tagLikelihoodsLiked[tag] || model.defaultLikelihoodLiked)
    logProbDisliked += Math.log(model.tagLikelihoodsDisliked[tag] || model.defaultLikelihoodDisliked)
  })

  // Convert back from log space using normalization trick to avoid underflow
  const maxLog = Math.max(logProbLiked, logProbDisliked)
  const probLiked = Math.exp(logProbLiked - maxLog)
  const probDisliked = Math.exp(logProbDisliked - maxLog)

  return probLiked / (probLiked + probDisliked)
}

// 3. Review Score & Time Decay
export function getReviewScore(game: any): number {
  // CheapShark: steamRatingPercent
  if (game.steamRatingPercent) return parseFloat(game.steamRatingPercent)
  
  // SteamSpy: positive / (positive + negative) * 100
  if (typeof game.positive === 'number' && typeof game.negative === 'number') {
    const total = game.positive + game.negative
    if (total === 0) return 50
    return (game.positive / total) * 100
  }
  
  return 50
}

export function calculateTimeDecay(game: any, reviewScore: number): number {
  let ageInYears = 0
  
  // CheapShark: releaseDate (UNIX timestamp)
  if (game.releaseDate) {
    ageInYears = (Date.now() / 1000 - game.releaseDate) / (365 * 24 * 3600)
  } 
  // Steam: release_date (string)
  else if (game.release_date) {
    // Steam API can return "Aug 21, 2012" or { date: "..." }
    const dateStr = typeof game.release_date === 'string' ? game.release_date : game.release_date.date
    if (dateStr) {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        ageInYears = (Date.now() - date.getTime()) / (365 * 24 * 3600 * 1000)
      }
    }
  }

  // Smooth Exponential Decay: ~5% reduction per year
  const lambda = 0.05
  return Math.exp(-lambda * ageInYears)
}

export function calculateFinalScore(game: any, model: NaiveBayesModel): number {
  const posterior = calculateNaiveBayesPosterior(game, model)
  const reviewScore = getReviewScore(game)
  const timeDecay = calculateTimeDecay(game, reviewScore)
  
  const normalizedReview = reviewScore / 100
  // Combined score: Weighted average of posterior and review score, adjusted by time decay
  return (posterior * 0.7 + normalizedReview * 0.3) * timeDecay
}

// 4. Maximal Marginal Relevance (MMR) for Diversity
export interface ScoredCandidate {
  appid: number
  score: number
  tags?: Record<string, number>
  [key: string]: any
}

function calculateCosineSimilarity(tagsA: Record<string, number>, tagsB: Record<string, number>): number {
  const allTags = new Set([...Object.keys(tagsA), ...Object.keys(tagsB)])
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const tag of allTags) {
    const valA = tagsA[tag] || 0
    const valB = tagsB[tag] || 0
    dotProduct += valA * valB
    normA += valA * valA
    normB += valB * valB
  }

  if (normA === 0 || normB === 0) return 0
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function runMMROptimization(
  candidates: ScoredCandidate[],
  count: number,
  lambda: number = 0.7
): ScoredCandidate[] {
  if (candidates.length === 0) return []

  // Unique appids only, keep best score
  const uniqueMap = new Map<number, ScoredCandidate>()
  candidates.forEach(c => {
    if (!uniqueMap.has(c.appid) || c.score > uniqueMap.get(c.appid)!.score) {
      uniqueMap.set(c.appid, c)
    }
  })
  
  const pool = Array.from(uniqueMap.values())
  const selected: ScoredCandidate[] = []
  const remaining = [...pool]

  while (selected.length < count && remaining.length > 0) {
    let bestIndex = -1
    let maxMMR = -Infinity

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i]
      let maxSim = 0

      if (selected.length > 0) {
        const candidateTags = candidate.tags || {}
        for (const s of selected) {
          const sTags = s.tags || {}
          const sim = calculateCosineSimilarity(candidateTags, sTags)
          if (sim > maxSim) maxSim = sim
        }
      }

      const mmrScore = (lambda * candidate.score) - ((1 - lambda) * maxSim)

      if (mmrScore > maxMMR) {
        maxMMR = mmrScore
        bestIndex = i
      }
    }

    selected.push(remaining[bestIndex])
    remaining.splice(bestIndex, 1)
  }

  return selected
}

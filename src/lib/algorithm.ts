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

export function trainNaiveBayes(library: any[]): NaiveBayesModel & { tagIdf: Record<string, number> } {
  let totalLikedWeight = 0
  let totalDislikedWeight = 0
  
  const tagCountsLiked: Record<string, number> = {}
  const tagCountsDisliked: Record<string, number> = {}
  const tagDocCounts: Record<string, number> = {}

  // Filter out unrated games (0-30 mins)
  const ratedLibrary = library.filter(g => (g.playtime_forever || 0) > 30)
  const totalDocs = ratedLibrary.length || 1

  // Calculate average playtime per primary genre
  const genrePlaytimes: Record<string, { total: number, count: number }> = {}
  ratedLibrary.forEach(g => {
    // Assume first tag is primary genre or use a heuristic
    const primaryGenre = Object.keys(g.tags || {})[0] || 'Unknown'
    if (!genrePlaytimes[primaryGenre]) genrePlaytimes[primaryGenre] = { total: 0, count: 0 }
    genrePlaytimes[primaryGenre].total += g.playtime_forever || 0
    genrePlaytimes[primaryGenre].count++
  })

  const genreThresholds: Record<string, number> = {}
  Object.keys(genrePlaytimes).forEach(genre => {
    const avg = genrePlaytimes[genre].total / genrePlaytimes[genre].count
    genreThresholds[genre] = Math.max(1, (avg / 60) * 0.15)
  })

  ratedLibrary.forEach(game => {
    const hours = (game.playtime_forever || 0) / 60
    const primaryGenre = Object.keys(game.tags || {})[0] || 'Unknown'
    const dynamicThreshold = genreThresholds[primaryGenre] || 2
    
    // Fuzzified playtime score (0.0 to 1.0) using genre-specific dynamic threshold
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
      tagDocCounts[tag] = (tagDocCounts[tag] || 0) + 1
    })
  })

  // Calculate IDF
  const tagIdf: Record<string, number> = {}
  Object.keys(tagDocCounts).forEach(tag => {
    tagIdf[tag] = Math.log(totalDocs / (1 + tagDocCounts[tag]))
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
    defaultLikelihoodDisliked: alpha / (totalDislikedWeight + alpha * V),
    tagIdf
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

function calculateCosineSimilarity(
  tagsA: Record<string, number>, 
  tagsB: Record<string, number>,
  tagIdf: Record<string, number> = {}
): number {
  const allTags = new Set([...Object.keys(tagsA), ...Object.keys(tagsB)])
  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (const tag of allTags) {
    const idf = tagIdf[tag] || 1
    const valA = (tagsA[tag] || 0) * idf
    const valB = (tagsB[tag] || 0) * idf
    
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
  lambda: number = 0.7,
  tagIdf: Record<string, number> = {}
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
          const sim = calculateCosineSimilarity(candidateTags, sTags, tagIdf)
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

// 5. Simulated Annealing for Budget Optimization (Knapsack)
export function runSimulatedAnnealing(
  candidates: ScoredCandidate[],
  budget: number,
  iterations: number = 10000,
  initialTemp: number = 100,
  coolingRate: number = 0.99
): ScoredCandidate[] {
  if (candidates.length === 0 || budget <= 0) return []

  // Ensure unique appids and filter out items more expensive than budget
  const uniquePool = Array.from(
    candidates.reduce((map, item) => {
      const price = parseFloat(item.salePrice || "0")
      if (price <= budget && (!map.has(item.appid) || item.score > map.get(item.appid)!.score)) {
        map.set(item.appid, item)
      }
      return map
    }, new Map<number, ScoredCandidate>()).values()
  )

  if (uniquePool.length === 0) return []

  let currentSelection: ScoredCandidate[] = []
  let currentCost = 0
  let currentScore = 0

  // Initial greedy state: fill with highest score per price (efficiency)
  const sorted = [...uniquePool].sort((a, b) => {
    const effA = a.score / (parseFloat(a.salePrice) || 0.01)
    const effB = b.score / (parseFloat(b.salePrice) || 0.01)
    return effB - effA
  })

  for (const item of sorted) {
    const cost = parseFloat(item.salePrice || "0")
    if (currentCost + cost <= budget) {
      currentSelection.push(item)
      currentCost += cost
      currentScore += item.score
    }
  }

  let bestSelection = [...currentSelection]
  let bestScore = currentScore
  let temp = initialTemp

  for (let i = 0; i < iterations; i++) {
    const action = Math.random() // 0-1
    let nextSelection = [...currentSelection]
    let nextCost = currentCost
    let nextScore = currentScore

    if (action < 0.3 && nextSelection.length > 0) {
      // 1. Remove Operation
      const idx = Math.floor(Math.random() * nextSelection.length)
      const removed = nextSelection.splice(idx, 1)[0]
      nextCost -= parseFloat(removed.salePrice || "0")
      nextScore -= removed.score
    } 
    else if (action < 0.6) {
      // 2. Add Operation
      const currentIds = new Set(nextSelection.map(s => s.appid))
      const unselected = uniquePool.filter(c => !currentIds.has(c.appid))
      if (unselected.length > 0) {
        const added = unselected[Math.floor(Math.random() * unselected.length)]
        const cost = parseFloat(added.salePrice || "0")
        
        nextSelection.push(added)
        nextCost += cost
        nextScore += added.score

        // Enforce budget constraint by removing random items if over budget
        while (nextCost > budget && nextSelection.length > 0) {
          const removeIdx = Math.floor(Math.random() * nextSelection.length)
          const removedItem = nextSelection.splice(removeIdx, 1)[0]
          nextCost -= parseFloat(removedItem.salePrice || "0")
          nextScore -= removedItem.score
        }
      }
    } 
    else if (nextSelection.length > 0) {
      // 3. Swap Operation
      const idx = Math.floor(Math.random() * nextSelection.length)
      const removed = nextSelection.splice(idx, 1)[0]
      nextCost -= parseFloat(removed.salePrice || "0")
      nextScore -= removed.score

      const currentIds = new Set(nextSelection.map(s => s.appid))
      const unselected = uniquePool.filter(c => !currentIds.has(c.appid))
      
      if (unselected.length > 0) {
        const added = unselected[Math.floor(Math.random() * unselected.length)]
        const cost = parseFloat(added.salePrice || "0")
        
        nextSelection.push(added)
        nextCost += cost
        nextScore += added.score

        // Enforce budget constraint by removing random items if over budget
        while (nextCost > budget && nextSelection.length > 0) {
          const removeIdx = Math.floor(Math.random() * nextSelection.length)
          const removedItem = nextSelection.splice(removeIdx, 1)[0]
          nextCost -= parseFloat(removedItem.salePrice || "0")
          nextScore -= removedItem.score
        }
      } else {
        // Revert if no unselected items
        nextSelection.push(removed)
        nextCost += parseFloat(removed.salePrice || "0")
        nextScore += removed.score
      }
    }

    // Acceptance Probability (Metropolis Criterion)
    const delta = nextScore - currentScore
    if (delta > 0 || Math.random() < Math.exp(delta / temp)) {
      currentSelection = nextSelection
      currentCost = nextCost
      currentScore = nextScore

      if (currentScore > bestScore) {
        bestScore = currentScore
        bestSelection = [...currentSelection]
      }
    }

    // Cooling
    temp *= coolingRate
  }

  return bestSelection
}

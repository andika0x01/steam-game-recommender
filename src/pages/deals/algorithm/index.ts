import { calculateUserGenreProfile, calculateBayesianPreferenceScore } from '../../engine/algorithm/bayesian'
import { runSimulatedAnnealing } from '../../engine/algorithm/sa'

export * from '../../engine/algorithm/bayesian'
export * from '../../engine/algorithm/sa'

export async function getDealRecommendations(
  userLibrary: any[],
  candidateDeals: any[],
  count: number = 24
) {
  const userProfile = calculateUserGenreProfile(userLibrary)

  const scoredDeals = candidateDeals.map(deal => {
    const genres = deal.genres || ['Indie']
    
    const bScore = calculateBayesianPreferenceScore(genres, userProfile)
    const savings = (parseFloat(deal.savings) || 0) / 100
    const salePrice = parseFloat(deal.salePrice) || 0
    const priceScore = salePrice > 0 ? Math.min(1, 20 / salePrice) : 1
    
    // Multi-Objective Score: Personal Match (60%) + Savings (30%) + Low Price (10%)
    const finalScore = (bScore * 0.6) + (savings * 0.3) + (priceScore * 0.1)
    
    return {
      ...deal,
      genres,
      score: finalScore
    }
  })

  return runSimulatedAnnealing(scoredDeals, count)
}

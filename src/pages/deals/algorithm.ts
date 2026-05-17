import { 
  trainNaiveBayes,
  calculateFinalScore,
  runMMROptimization
} from '../../lib/algorithm'

export async function getDealRecommendations(
  userLibrary: any[],
  candidateDeals: any[],
  count: number = 24
) {
  const model = trainNaiveBayes(userLibrary)

  const scoredDeals = candidateDeals.map(deal => {
    // Base recommendation score (NB + Review + Time Decay)
    const baseScore = calculateFinalScore(deal, model)
    
    // Custom Deal Factors: Multiplicative Boost
    // Discount percentage (savings) boosts the base score
    const savings = (parseFloat(deal.savings) || 0) / 100
    
    // Multiplicative scoring: Discount only boosts games you actually might like
    const finalScore = baseScore * (1 + savings)
    
    return {
      ...deal,
      score: finalScore
    }
  })

  // Pass tagIdf to MMR for weighted diversity calculation
  return runMMROptimization(scoredDeals, count, 0.7, model.tagIdf)
}

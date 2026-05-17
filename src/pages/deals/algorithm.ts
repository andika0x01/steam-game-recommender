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
    
    // Custom Deal Factors: Savings (30%) + Low Price (10%)
    const savings = (parseFloat(deal.savings) || 0) / 100
    const salePrice = parseFloat(deal.salePrice) || 0
    const priceScore = salePrice > 0 ? Math.min(1, 20 / salePrice) : 1
    
    // Final Weighted Score for Deals
    const finalScore = (baseScore * 0.6) + (savings * 0.3) + (priceScore * 0.1)
    
    return {
      ...deal,
      score: finalScore
    }
  })

  return runMMROptimization(scoredDeals, count)
}

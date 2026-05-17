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
    
    // Custom Deal Factors: Focus on Savings (Discount %)
    const savings = (parseFloat(deal.savings) || 0) / 100
    
    // Final Weighted Score for Deals: 50% Match, 50% Savings
    // Removed absolute price limit to prioritize relative value (discount %)
    const finalScore = (baseScore * 0.5) + (savings * 0.5)
    
    return {
      ...deal,
      score: finalScore
    }
  })

  return runMMROptimization(scoredDeals, count)
}

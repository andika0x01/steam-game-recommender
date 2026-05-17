import { 
  trainNaiveBayes,
  calculateFinalScore,
  runMMROptimization,
  runSimulatedAnnealing
} from '../../lib/algorithm'

export async function getDealRecommendations(
  userLibrary: any[],
  candidateDeals: any[],
  count: number = 24,
  budgetUSD?: number
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

  // If budget is provided, use Simulated Annealing (Knapsack)
  if (budgetUSD && budgetUSD > 0) {
    return runSimulatedAnnealing(scoredDeals, budgetUSD)
  }

  // Pass tagIdf to MMR for weighted diversity calculation (Default behavior)
  return runMMROptimization(scoredDeals, count, 0.7, model.tagIdf)
}

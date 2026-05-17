import { 
  calculateFinalScore, 
  runMMROptimization,
  trainNaiveBayes
} from '../../lib/algorithm'

export { trainNaiveBayes }

export async function getCoopConvergence(
  groupProfiles: any[],
  sharedGamesPool: any[],
  count: number = 12
) {
  const scoredSharedGames = sharedGamesPool.map(g => {
    let totalConvergenceScore = 0
    
    // Convergence: Average the Final Score across all participants' models
    groupProfiles.forEach(p => {
      totalConvergenceScore += calculateFinalScore(g, p.profileData)
    })
    
    return {
      ...g,
      score: totalConvergenceScore / groupProfiles.length
    }
  })

  return runMMROptimization(scoredSharedGames, count)
}

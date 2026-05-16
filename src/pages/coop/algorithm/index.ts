import { calculateBayesianScore } from './bayesian'
import { runSimulatedAnnealing, CandidateGame } from './sa'

export * from './fuzzyLogic'
export * from './bayesian'
export * from './sa'

export function findSharedGroupRecommendations(
  sharedGames: any[],
  allUserLibraries: any[][],
  count: number = 12
): CandidateGame[] {
  // 1. Scoring: Calculate average Bayesian score across all users in the nexus
  const candidates: CandidateGame[] = sharedGames.map(game => {
    const genres = game.genres || []
    
    let totalScore = 0
    allUserLibraries.forEach(library => {
      totalScore += calculateBayesianScore(genres, library)
    })
    
    const averageScore = totalScore / (allUserLibraries.length || 1)
    
    return {
      appid: game.appid,
      name: game.name,
      genres,
      score: averageScore
    }
  })

  // 2. Optimization: SA for selection and diversity
  return runSimulatedAnnealing(candidates, count)
}
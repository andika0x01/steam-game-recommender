import { calculateUserGenreProfile, calculateBayesianPreferenceScore } from './bayesian'
import { runSimulatedAnnealing } from './sa'

export * from './bayesian'
export * from './sa'
export * from './fuzzyLogic'

export async function getCoopConvergence(
  groupProfiles: any[],
  sharedGamesPool: any[],
  count: number = 12
) {
  const scoredSharedGames = sharedGamesPool.map(g => {
    const genres = g.genres || ['Multiplayer']
    
    let totalConvergenceScore = 0
    groupProfiles.forEach(p => {
      totalConvergenceScore += calculateBayesianPreferenceScore(genres, p.profileData)
    })
    
    return {
      ...g,
      genres,
      score: totalConvergenceScore / groupProfiles.length
    }
  })

  return runSimulatedAnnealing(scoredSharedGames, count)
}

import { 
  calculateBayesianPreferenceScore, 
  runSimulatedAnnealing,
  calculateUserGenreProfile
} from '../../lib/algorithm'

export { calculateUserGenreProfile }

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

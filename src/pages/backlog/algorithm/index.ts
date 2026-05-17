import { calculateUserGenreProfile, calculateBayesianPreferenceScore, UserGenreProfile } from '../../engine/algorithm/bayesian'

export * from '../../engine/algorithm/bayesian'

export async function getBacklogRecommendations(
  userLibrary: any[],
  backlogGames: any[],
  count: number = 50
) {
  const userProfile = calculateUserGenreProfile(userLibrary)

  return backlogGames.map(game => {
    const genres = game.genres || ['Indie']
    const score = calculateBayesianPreferenceScore(genres, userProfile)
    return { ...game, genres, personalMatch: score }
  })
}

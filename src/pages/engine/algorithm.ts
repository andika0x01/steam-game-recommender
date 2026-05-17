import { 
  calculateUserGenreProfile, 
  calculateBayesianPreferenceScore, 
  runSimulatedAnnealing,
  CandidateGame
} from '../../lib/algorithm'

export { calculateUserGenreProfile }

export async function getSmartRecommendations(
  userLibrary: any[],
  candidates: any[],
  count: number = 12
): Promise<CandidateGame[]> {
  // 1. Profiling Phase: Identify user's "Genre Fingerprint"
  const userProfile = calculateUserGenreProfile(userLibrary)

  // 2. Scoring Phase: Process candidates using the profile
  const scoredCandidates: CandidateGame[] = candidates.map(game => {
    const score = calculateBayesianPreferenceScore(game.genres || [], userProfile)
    return {
      appid: game.appid,
      name: game.name,
      genres: game.genres || [],
      score
    }
  })

  // 3. Optimization Phase: Simulated Annealing (Diversity & Balance)
  return runSimulatedAnnealing(scoredCandidates, count)
}

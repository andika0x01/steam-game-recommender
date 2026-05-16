import { calculateBayesianScore } from './bayesian'
import { runSimulatedAnnealing, CandidateGame } from './sa'

export * from './fuzzyLogic'
export * from './bayesian'
export * from './sa'

export function optimizeBacklogSequence(
  backlogGames: any[],
  userLibrary: any[],
  count: number = 10
): CandidateGame[] {
  // Score each game in the backlog based on user library preferences
  const candidates: CandidateGame[] = backlogGames.map(game => {
    const score = calculateBayesianScore(game.genres || [], userLibrary)
    return {
      appid: game.appid,
      name: game.name,
      genres: game.genres || [],
      score
    }
  })

  // Use SA to find the best sequence (maximizing match and diversity)
  return runSimulatedAnnealing(candidates, count)
}

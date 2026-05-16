import { calculateBayesianScore } from './bayesian'
import { runSimulatedAnnealing, CandidateGame } from './sa'

export * from './fuzzyLogic'
export * from './bayesian'
export * from './sa'

export function optimizeDealsSelection(
  deals: any[],
  userLibrary: any[],
  count: number = 15
): CandidateGame[] {
  // Deals are already scored in the component logic using Bayesian
  // This function can be used to further refine or diversify using SA
  const candidates: CandidateGame[] = deals.map(d => ({
    appid: d.appid,
    name: d.name,
    genres: d.genres || [],
    score: d.match // use the pre-calculated match score
  }))

  return runSimulatedAnnealing(candidates, count)
}

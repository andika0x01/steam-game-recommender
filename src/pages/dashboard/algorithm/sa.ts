import { runSAOptimization, ScoredCandidate } from '../../../lib/algorithm/core'

export type CandidateGame = ScoredCandidate

export function runSimulatedAnnealing(candidates: CandidateGame[], count: number = 12): CandidateGame[] {
  return runSAOptimization(candidates, count, (solution) => {
    const totalAffinity = solution.reduce((sum, g) => sum + g.score, 0)
    const genreCounts: Record<string, number> = {}
    solution.flatMap(g => g.genres).forEach(genre => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })

    const uniqueGenreCount = Object.keys(genreCounts).length
    return totalAffinity + (uniqueGenreCount / 10)
  })
}

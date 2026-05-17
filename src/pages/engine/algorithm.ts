import { 
  trainNaiveBayes,
  calculateFinalScore,
  runMMROptimization,
  ScoredCandidate
} from '../../lib/algorithm'

export { trainNaiveBayes }

export async function getSmartRecommendations(
  userLibrary: any[],
  candidates: any[],
  count: number = 12
): Promise<ScoredCandidate[]> {
  // 1. Profiling Phase: Train Naive Bayes Model
  const model = trainNaiveBayes(userLibrary)

  // 2. Scoring Phase: Calculate posterior probability + reviews + time decay
  const scoredCandidates: ScoredCandidate[] = candidates.map(game => {
    const score = calculateFinalScore(game, model)
    return {
      ...game,
      score
    }
  })

  // 3. Optimization Phase: MMR for Diversity
  return runMMROptimization(scoredCandidates, count)
}

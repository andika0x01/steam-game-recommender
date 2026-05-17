import { 
  trainNaiveBayes, 
  calculateFinalScore 
} from '../../lib/algorithm'

export async function getBacklogRecommendations(
  userLibrary: any[],
  backlogGames: any[],
  count: number = 50
) {
  const model = trainNaiveBayes(userLibrary)

  return backlogGames.map(game => {
    const score = calculateFinalScore(game, model)
    return { ...game, personalMatch: score }
  })
}

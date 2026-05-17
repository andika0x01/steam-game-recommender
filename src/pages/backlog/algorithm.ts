import { 
  trainNaiveBayes, 
  calculateFinalScore,
  trapezoid 
} from '../../lib/algorithm'

export async function getBacklogRecommendations(
  userLibrary: any[],
  backlogGames: any[],
  count: number = 50
) {
  const model = trainNaiveBayes(userLibrary)

  return backlogGames.map(game => {
    // 1. Base Score (Naive Bayes + Review + Time Decay)
    const baseScore = calculateFinalScore(game, model)
    
    // 2. Hidden Gems Multiplier (Low Playtime + High Quality)
    // Gunakan fungsi trapezoid terbalik untuk mem-boost game dengan jam main rendah
    const hours = (game.playtime_forever || 0) / 60
    
    // Boost maksimal (1.2x) jika jam main sangat rendah (< 1 jam), 
    // luruh ke 1.0x jika jam main > 10 jam.
    const playtimePenalty = 1 - trapezoid(hours, 0, 1, 10, 20)
    const hiddenGemMultiplier = 1.0 + (playtimePenalty * 0.2)
    
    return { 
      ...game, 
      personalMatch: baseScore * hiddenGemMultiplier 
    }
  })
}

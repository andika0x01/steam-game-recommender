import { trapezoid } from './fuzzyLogic'

export interface UserGenreProfile {
  genre: string
  prob: number
}

export function calculateUserGenreProfile(library: any[]): UserGenreProfile[] {
  const genreTotalWeights: Record<string, number> = {}
  
  // 1. Calculate Fuzzy Engagement for each game
  const gamesWithFuzzyWeight = library.map(g => {
    const hours = (g.playtime_forever || 0) / 60
    // Dynamic weight: Game with > 2 hours is considered "significant"
    const weight = trapezoid(hours, 0, 2, 1000, 1000)
    return { ...g, weight }
  })

  const totalPossibleWeight = gamesWithFuzzyWeight.reduce((sum, g) => sum + g.weight, 0) || 1

  // 2. Accumulate weights per genre
  gamesWithFuzzyWeight.forEach(game => {
    const genres = game.genres || []
    genres.forEach((genreObj: any) => {
      const genreName = typeof genreObj === 'string' ? genreObj : (genreObj.description || genreObj.name)
      if (genreName) {
        genreTotalWeights[genreName] = (genreTotalWeights[genreName] || 0) + game.weight
      }
    })
  })

  // 3. Convert to probabilities (normalized weights)
  const totalGenreWeightSum = Object.values(genreTotalWeights).reduce((a, b) => a + b, 0) || 1
  
  return Object.entries(genreTotalWeights)
    .map(([genre, weight]) => ({
      genre,
      prob: weight / totalGenreWeightSum
    }))
    .sort((a, b) => b.prob - a.prob)
}

export function calculateBayesianPreferenceScore(
  gameGenres: string[],
  userProfile: UserGenreProfile[]
): number {
  // P(Interest | Genres) ∝ P(Genres | Interest) * P(Interest)
  // Since we want to rank, we use a scoring function derived from the profile probs
  
  if (gameGenres.length === 0) return 0.1

  let aggregateScore = 0
  gameGenres.forEach(genre => {
    const profileEntry = userProfile.find(p => p.genre === genre)
    // Add smoothing for genres not in profile
    aggregateScore += profileEntry ? profileEntry.prob : (1 / (userProfile.length + 10))
  })

  // Average genre affinity
  return Math.min(1.0, aggregateScore / gameGenres.length)
}

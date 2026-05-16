import { GenreWeight } from './types'
import { trapezoid } from './fuzzyLogic'

export * from './types'

export function calculateGenrePreferences(games: any[]): GenreWeight[] {
  const genreScores: Record<string, number> = {}

  games.forEach((game) => {
    const hours = game.playtime_forever / 60
    
    // Fuzzy membership values
    const low = trapezoid(hours, 0, 0, 1, 5)
    const medium = trapezoid(hours, 2, 5, 15, 25)
    const high = trapezoid(hours, 20, 30, 1000, 1000)

    // Calculate engagement score (0 to 1)
    const engagement = (low * 0.2) + (medium * 0.6) + (high * 1.0)

    if (game.genres) {
      game.genres.forEach((genre: any) => {
        genreScores[genre.description] = (genreScores[genre.description] || 0) + engagement
      })
    }
  })

  // Normalize scores
  const total = Object.values(genreScores).reduce((a, b) => a + b, 0)
  return Object.entries(genreScores).map(([genre, score]) => ({
    genre,
    weight: total > 0 ? score / total : 0
  })).sort((a, b) => b.weight - a.weight)
}

export function scoreGameRecommendation(gameGenres: string[], userPreferences: GenreWeight[]): number {
  let score = 0
  gameGenres.forEach((genre) => {
    const pref = userPreferences.find((p) => p.genre === genre)
    if (pref) {
      score += pref.weight
    }
  })
  // Simple probabilistic score (Bayesian-like)
  return score / (gameGenres.length || 1)
}

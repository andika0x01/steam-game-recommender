import { GenreWeight } from './types'
import { trapezoid } from './fuzzyLogic'

export * from './types'
export * from './fuzzyLogic'
export * from './ga'

export function calculateGenrePreferences(games: any[], customParams?: number[]): GenreWeight[] {
  const genreScores: Record<string, number> = {}
  const p = customParams || [1, 5, 2, 5, 15, 25, 20, 30, 0.2, 0.6, 1.0]

  games.forEach((game) => {
    const hours = game.playtime_forever / 60
    const low = trapezoid(hours, 0, 0, p[0], p[1])
    const medium = trapezoid(hours, p[2], p[3], p[4], p[5])
    const high = trapezoid(hours, p[6], p[7], 1000, 1000)
    const engagement = (low * p[8]) + (medium * p[9]) + (high * p[10])

    if (game.genres && Array.isArray(game.genres)) {
      game.genres.forEach((genre: any) => {
        const name = typeof genre === 'string' ? genre : (genre.description || genre.name)
        if (name) {
          genreScores[name] = (genreScores[name] || 0) + engagement
        }
      })
    } else {
      genreScores['Indie'] = (genreScores['Indie'] || 0) + engagement
    }
  })

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
    if (pref) score += pref.weight
  })
  return score / (gameGenres.length || 1)
}

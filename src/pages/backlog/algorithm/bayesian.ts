import { GenreWeight } from './types'
import { trapezoid } from './fuzzyLogic'

export function calculateBayesianScore(
  gameGenres: string[],
  userLibrary: any[]
): number {
  // P(Like | Genre) = (P(Genre | Like) * P(Like)) / P(Genre)
  
  // Fuzzy Engagement Calculation:
  // We use a trapezoidal function to define "Like" as a continuous value [0, 1]
  // Parameters: [low_a, low_b, med_c, med_d] -> [0, 2, 50, 1000] hours
  const libraryWithWeights = userLibrary.map(g => {
    const hours = (g.playtime_forever || 0) / 60
    // Weight increases from 0 to 2 hours, stays 1 up to 1000 hours
    const weight = trapezoid(hours, 0, 2, 1000, 1000)
    return { ...g, fuzzyWeight: weight }
  })

  const totalFuzzyLikes = libraryWithWeights.reduce((sum, g) => sum + g.fuzzyWeight, 0) || 1
  const totalGames = userLibrary.length || 1
  const pLike = totalFuzzyLikes / totalGames

  let totalProbability = pLike

  gameGenres.forEach(genre => {
    // P(Genre | Like) using Fuzzy Weights
    const sumFuzzyWeightWithGenre = libraryWithWeights
      .filter(g => g.genres?.some((genreObj: any) => (genreObj.description || genreObj) === genre))
      .reduce((sum, g) => sum + g.fuzzyWeight, 0)
    
    // Laplace smoothing with fuzzy weights
    const pGenreGivenLike = (sumFuzzyWeightWithGenre + 0.1) / (totalFuzzyLikes + 0.2)

    // P(Genre) - Simple frequentist approach
    const gamesWithGenre = userLibrary.filter(g => 
      g.genres?.some((genreObj: any) => (genreObj.description || genreObj) === genre)
    ).length
    const pGenre = (gamesWithGenre + 1) / (totalGames + 2)

    // Bayesian update
    totalProbability *= (pGenreGivenLike / pGenre)
  })

  // Normalize and cap
  return Math.min(totalProbability, 1.0)
}

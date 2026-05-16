import { GenreWeight } from './types'

export function calculateBayesianScore(
  gameGenres: string[],
  userLibrary: any[]
): number {
  // P(Like | Genre) = (P(Genre | Like) * P(Like)) / P(Genre)
  
  // For simplicity, we define "Like" as playtime > 2 hours
  const likedGames = userLibrary.filter(g => g.playtime_forever > 120)
  const totalGames = userLibrary.length || 1
  const pLike = likedGames.length / totalGames

  let totalProbability = pLike

  gameGenres.forEach(genre => {
    // P(Genre | Like)
    const gamesWithGenreAndLiked = likedGames.filter(g => 
      g.genres?.some((genreObj: any) => (genreObj.description || genreObj) === genre)
    ).length
    const pGenreGivenLike = (gamesWithGenreAndLiked + 1) / (likedGames.length + 2) // Laplace smoothing

    // P(Genre)
    const gamesWithGenre = userLibrary.filter(g => 
      g.genres?.some((genreObj: any) => (genreObj.description || genreObj) === genre)
    ).length
    const pGenre = (gamesWithGenre + 1) / (totalGames + 2)

    // Bayesian update (naive assumption: independent genres)
    totalProbability *= (pGenreGivenLike / pGenre)
  })

  return Math.min(totalProbability, 1.0)
}

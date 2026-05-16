import { GenreWeight } from './types'
import { trapezoid } from './fuzzyLogic'
import { calculateBayesianScore } from './bayesian'
import { aStarSearch, GameNode } from './classicalSearch'
import { runSimulatedAnnealing, CandidateGame } from './sa'

export * from './types'
export * from './pso'
export * from './aco'
export * from './classicalSearch'
export * from './bayesian'
export * from './sa'

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
      // Fallback if genres are missing but game exists
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

export async function generateEnsembleRecommendations(
  userGames: any[],
  allAvailableGames: any[],
  count: number = 10
): Promise<CandidateGame[]> {
  const preferences = calculateGenrePreferences(userGames)
  
  // 1. Generate Candidates using Bayesian
  const bayesianCandidates: CandidateGame[] = allAvailableGames.map(game => {
    let genres = game.genres?.map((g: any) => typeof g === 'string' ? g : g.description) || []
    if (genres.length === 0) genres = ['Indie', 'Action'] // Fallback for missing tags
    const bScore = calculateBayesianScore(genres, userGames)
    return {
      appid: game.appid,
      name: game.name,
      genres,
      score: 0.5 + (bScore * 0.5) // Boost base score to ensure visibility
    }
  })

  // 2. Generate Candidates using A* (Similarity paths)
  // We'll take top played game as start
  const topGame = userGames.sort((a, b) => b.playtime_forever - a.playtime_forever)[0]
  let aStarCandidates: CandidateGame[] = []
  
  if (topGame) {
    const startNode: GameNode = { 
      id: topGame.appid, 
      name: topGame.name, 
      genres: topGame.genres?.map((g: any) => typeof g === 'string' ? g : g.description) || [] 
    }
    
    // Pick a few random store games as goals to find paths
    const goals = allAvailableGames.sort(() => 0.5 - Math.random()).slice(0, 5)
    goals.forEach(goal => {
      const goalNode: GameNode = { 
        id: goal.appid, 
        name: goal.name, 
        genres: goal.genres?.map((g: any) => typeof g === 'string' ? g : g.description) || [] 
      }
      const path = aStarSearch(startNode, goalNode, allAvailableGames.map(g => ({
        id: g.appid,
        name: g.name,
        genres: g.genres?.map((g: any) => typeof g === 'string' ? g : g.description) || []
      })))
      
      if (path.length > 0) {
        // Path members get a similarity boost
        path.forEach(node => {
          aStarCandidates.push({
            appid: node.id,
            name: node.name,
            genres: node.genres,
            score: 0.8 // high base score for being in path
          })
        })
      }
    })
  }

  // Combine all candidates
  const combined = [...bayesianCandidates, ...aStarCandidates]
  
  // Remove duplicates and keep highest score
  const uniqueMap = new Map<number, CandidateGame>()
  combined.forEach(c => {
    if (!uniqueMap.has(c.appid) || uniqueMap.get(c.appid)!.score < c.score) {
      uniqueMap.set(c.appid, c)
    }
  })

  // 3. Final Selection using Simulated Annealing (Diversity & Relevance)
  return runSimulatedAnnealing(Array.from(uniqueMap.values()), count)
}

import { calculateGenrePreferences } from '../../../algorithm'
import { calculateBayesianScore } from './bayesian'
import { runSimulatedAnnealing, CandidateGame } from './sa'
import { aStarSearch, GameNode } from '../../coop/algorithm/classicalSearch'

export * from './bayesian'
export * from './sa'
export type { CandidateGame }

export async function generateEnsembleRecommendations(
  userGames: any[],
  allAvailableGames: any[],
  count: number = 10
): Promise<CandidateGame[]> {
  const preferences = calculateGenrePreferences(userGames)
  
  // 1. Generate Candidates using Bayesian
  const bayesianCandidates: CandidateGame[] = allAvailableGames.map(game => {
    let genres = game.genres?.map((g: any) => typeof g === 'string' ? g : g.description) || []
    if (genres.length === 0) genres = ['Indie', 'Action']
    const bScore = calculateBayesianScore(genres, userGames)
    return {
      appid: game.appid,
      name: game.name,
      genres,
      score: 0.5 + (bScore * 0.5)
    }
  })

  // 2. Generate Candidates using A* (Similarity paths)
  const topGame = userGames.sort((a, b) => b.playtime_forever - a.playtime_forever)[0]
  let aStarCandidates: CandidateGame[] = []
  
  if (topGame) {
    const startNode: GameNode = { 
      id: topGame.appid, 
      name: topGame.name, 
      genres: topGame.genres?.map((g: any) => typeof g === 'string' ? g : g.description) || [] 
    }
    
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
        path.forEach(node => {
          aStarCandidates.push({
            appid: node.id,
            name: node.name,
            genres: node.genres,
            score: 0.8
          })
        })
      }
    })
  }

  const combined = [...bayesianCandidates, ...aStarCandidates]
  const uniqueMap = new Map<number, CandidateGame>()
  combined.forEach(c => {
    if (!uniqueMap.has(c.appid) || uniqueMap.get(c.appid)!.score < c.score) {
      uniqueMap.set(c.appid, c)
    }
  })

  return runSimulatedAnnealing(Array.from(uniqueMap.values()), count)
}

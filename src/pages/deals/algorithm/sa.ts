export interface CandidateGame {
  appid: number
  name: string
  genres: string[]
  score: number
}

export function runSimulatedAnnealing(
  candidates: CandidateGame[],
  count: number = 10
): CandidateGame[] {
  // Objective: Maximize total score + Diversity penalty
  // Initial solution: Take top N by score
  let currentSolution = [...candidates]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(count, candidates.length))
  
  if (currentSolution.length === 0) return []
  
  let currentEnergy = calculateEnergy(currentSolution)
  
  let temp = 100
  const coolingRate = 0.95

  while (temp > 1) {
    // Neighbor: Replace one game from solution with a random one from candidates
    let nextSolution = [...currentSolution]
    const idxToRemove = Math.floor(Math.random() * currentSolution.length)
    const idxToAdd = Math.floor(Math.random() * candidates.length)
    
    // Ensure we don't add a duplicate
    if (!nextSolution.some(g => g.appid === candidates[idxToAdd].appid)) {
      nextSolution[idxToRemove] = candidates[idxToAdd]
      
      const nextEnergy = calculateEnergy(nextSolution)
      
      // We want to MAXIMIZE energy, so higher is better
      if (nextEnergy > currentEnergy || Math.random() < Math.exp((nextEnergy - currentEnergy) / temp)) {
        currentSolution = nextSolution
        currentEnergy = nextEnergy
      }
    }

    temp *= coolingRate
  }

  return currentSolution.sort((a, b) => b.score - a.score)
}

function calculateEnergy(solution: CandidateGame[]): number {
  const totalScore = solution.reduce((sum, g) => sum + g.score, 0)
  
  // Diversity: Count unique genres
  const uniqueGenres = new Set(solution.flatMap(g => g.genres))
  const diversityScore = uniqueGenres.size / 10 // Weight diversity
  
  return totalScore + diversityScore
}
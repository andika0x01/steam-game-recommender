export interface CandidateGame {
  appid: number
  name: string
  genres: string[]
  score: number
}

export function runSimulatedAnnealing(
  candidates: CandidateGame[],
  count: number = 12
): CandidateGame[] {
  if (candidates.length === 0) return []
  
  // Initial solution: Take top N by score
  let currentSolution = [...candidates]
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(count, candidates.length))
  
  let currentEnergy = calculateEnergy(currentSolution)
  
  let temp = 100
  const coolingRate = 0.96

  while (temp > 1) {
    let nextSolution = [...currentSolution]
    const idxToRemove = Math.floor(Math.random() * currentSolution.length)
    const idxToAdd = Math.floor(Math.random() * candidates.length)
    
    // Attempt swap
    if (!nextSolution.some(g => g.appid === candidates[idxToAdd].appid)) {
      nextSolution[idxToRemove] = candidates[idxToAdd]
      
      const nextEnergy = calculateEnergy(nextSolution)
      
      // Metropolis Criterion: Accept if better or with prob exp(deltaE/T)
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
  const totalAffinity = solution.reduce((sum, g) => sum + g.score, 0)
  
  // Diversity Scoring: Genre Saturation Penalty
  // If many games share the same genre, the reward for that genre diminishes
  const genreCounts: Record<string, number> = {}
  solution.flatMap(g => g.genres).forEach(genre => {
    genreCounts[genre] = (genreCounts[genre] || 0) + 1
  })

  let diversityScore = 0
  Object.values(genreCounts).forEach(count => {
    // Reward unique genres, penalize over-saturation
    // log2(count + 1) provides diminishing returns
    diversityScore += Math.log2(count + 1)
  })

  // We want to MAXIMIZE totalAffinity and MINIMIZE diversityScore (penalty for redundancy)
  // Or rather, we want a healthy mix. 
  // Let's maximize (Affinity + Unique Genre Count / 10)
  const uniqueGenreCount = Object.keys(genreCounts).length
  
  return totalAffinity + (uniqueGenreCount / 10)
}
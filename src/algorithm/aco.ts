export interface Edge {
  from: number
  to: number
  pheromone: number
  distance: number
}

export function runACO(
  nodes: number[],
  edges: Edge[],
  numAnts: number = 10,
  iterations: number = 5
): number[] {
  // Initialize pheromones
  edges.forEach(e => e.pheromone = 0.1)

  let bestPath: number[] = []
  let bestDistance = Infinity

  for (let i = 0; i < iterations; i++) {
    for (let ant = 0; ant < numAnts; ant++) {
      let currentPath = [nodes[Math.floor(Math.random() * nodes.length)]]
      let visited = new Set(currentPath)

      while (visited.size < nodes.length && visited.size < 5) { // Max trail length 5
        const lastNode = currentPath[currentPath.length - 1]
        const nextNode = selectNextNode(lastNode, edges, visited)
        if (!nextNode) break
        
        currentPath.push(nextNode)
        visited.add(nextNode)
      }

      const d = calculatePathDistance(currentPath, edges)
      if (d < bestDistance) {
        bestDistance = d
        bestPath = currentPath
      }
    }

    // Evaporate and deposit pheromones
    edges.forEach(e => e.pheromone *= 0.9)
    // Deposit on best path
    for (let j = 0; j < bestPath.length - 1; j++) {
      const edge = edges.find(e => e.from === bestPath[j] && e.to === bestPath[j+1])
      if (edge) edge.pheromone += (1 / bestDistance)
    }
  }

  return bestPath
}

function selectNextNode(current: number, edges: Edge[], visited: Set<number>): number | null {
  const candidates = edges.filter(e => e.from === current && !visited.has(e.to))
  if (candidates.length === 0) return null

  // Roulette wheel selection based on pheromone and distance
  const scores = candidates.map(e => Math.pow(e.pheromone, 1) * Math.pow(1 / e.distance, 2))
  const totalScore = scores.reduce((a, b) => a + b, 0)
  
  let r = Math.random() * totalScore
  for (let i = 0; i < candidates.length; i++) {
    r -= scores[i]
    if (r <= 0) return candidates[i].to
  }
  return candidates[0].to
}

function calculatePathDistance(path: number[], edges: Edge[]): number {
  let d = 0
  for (let i = 0; i < path.length - 1; i++) {
    const edge = edges.find(e => e.from === path[i] && e.to === path[i+1])
    d += edge ? edge.distance : 100
  }
  return d || Infinity
}

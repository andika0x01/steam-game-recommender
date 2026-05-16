export interface GameNode {
  id: number
  name: string
  genres: string[]
}

export function aStarSearch(
  start: GameNode,
  goal: GameNode,
  allGames: GameNode[]
): GameNode[] {
  const openSet: GameNode[] = [start]
  const cameFrom: Map<number, GameNode> = new Map()
  
  const gScore: Map<number, number> = new Map()
  gScore.set(start.id, 0)
  
  const fScore: Map<number, number> = new Map()
  fScore.set(start.id, heuristic(start, goal))

  while (openSet.length > 0) {
    // Get node with lowest fScore
    openSet.sort((a, b) => (fScore.get(a.id) || Infinity) - (fScore.get(b.id) || Infinity))
    const current = openSet.shift()!

    if (current.id === goal.id) {
      return reconstructPath(cameFrom, current)
    }

    const neighbors = getNeighbors(current, allGames)
    for (let neighbor of neighbors) {
      const tentativeGScore = (gScore.get(current.id) || Infinity) + distance(current, neighbor)
      
      if (tentativeGScore < (gScore.get(neighbor.id) || Infinity)) {
        cameFrom.set(neighbor.id, current)
        gScore.set(neighbor.id, tentativeGScore)
        fScore.set(neighbor.id, tentativeGScore + heuristic(neighbor, goal))
        
        if (!openSet.find(n => n.id === neighbor.id)) {
          openSet.push(neighbor)
        }
      }
    }
  }

  return []
}

function heuristic(a: GameNode, b: GameNode): number {
  // Similarity based on genre intersection
  const intersection = a.genres.filter(g => b.genres.includes(g))
  const union = new Set([...a.genres, ...b.genres])
  return 1 - (intersection.length / union.size)
}

function distance(a: GameNode, b: GameNode): number {
  return heuristic(a, b) // In this case, distance and heuristic are similar
}

function getNeighbors(node: GameNode, allGames: GameNode[]): GameNode[] {
  // Increase neighbor count to ensure connectivity in small or sparse graphs
  return allGames
    .filter(g => g.id !== node.id)
    .sort((a, b) => distance(node, a) - distance(node, b))
    .slice(0, 10)
}

function reconstructPath(cameFrom: Map<number, GameNode>, current: GameNode): GameNode[] {
  const path = [current]
  while (cameFrom.has(current.id)) {
    current = cameFrom.get(current.id)!
    path.unshift(current)
  }
  return path
}

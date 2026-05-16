export interface Particle {
  position: number[]
  velocity: number[]
  bestPosition: number[]
  bestFitness: number
  fitness: number
}

export function createParticle(dim: number): Particle {
  const pos = Array.from({ length: dim }, () => Math.random())
  return {
    position: pos,
    velocity: Array.from({ length: dim }, () => (Math.random() - 0.5) * 0.1),
    bestPosition: [...pos],
    bestFitness: -Infinity,
    fitness: 0
  }
}

export function runPSO(
  fitnessFn: (params: number[]) => number,
  dim: number,
  iterations: number = 20,
  numParticles: number = 20
): number[] {
  let particles = Array.from({ length: numParticles }, () => createParticle(dim))
  let globalBestPosition = [...particles[0].position]
  let globalBestFitness = -Infinity

  const w = 0.5  // inertia
  const c1 = 1.5 // cognitive (personal best)
  const c2 = 1.5 // social (global best)

  for (let i = 0; i < iterations; i++) {
    for (let p of particles) {
      p.fitness = fitnessFn(p.position)
      
      if (p.fitness > p.bestFitness) {
        p.bestFitness = p.fitness
        p.bestPosition = [...p.position]
      }

      if (p.fitness > globalBestFitness) {
        globalBestFitness = p.fitness
        globalBestPosition = [...p.position]
      }
    }

    for (let p of particles) {
      for (let d = 0; d < dim; d++) {
        const r1 = Math.random()
        const r2 = Math.random()
        
        p.velocity[d] = w * p.velocity[d] +
          c1 * r1 * (p.bestPosition[d] - p.position[d]) +
          c2 * r2 * (globalBestPosition[d] - p.position[d])
        
        p.position[d] += p.velocity[d]
        
        // Clamp position between 0 and 1 for weights
        p.position[d] = Math.max(0, Math.min(1, p.position[d]))
      }
    }
  }

  return globalBestPosition
}

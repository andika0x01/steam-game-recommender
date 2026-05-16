import { trapezoid } from './fuzzyLogic'

export interface Chromosome {
  params: number[]
  fitness: number
}

// Chromosome structure:
// 0: low_c, 1: low_d
// 2: med_a, 3: med_b, 4: med_c, 5: med_d
// 6: high_a, 7: high_b
// 8: w_low, 9: w_med, 10: w_high

export function createRandomChromosome(): Chromosome {
  return {
    params: [
      Math.random() * 2, Math.random() * 10, // low
      Math.random() * 5, Math.random() * 10, Math.random() * 20, Math.random() * 40, // med
      Math.random() * 30, Math.random() * 60, // high
      Math.random(), Math.random(), Math.random() // weights
    ],
    fitness: 0
  }
}

export function calculateFitness(chromosome: Chromosome, games: any[]): number {
  const p = chromosome.params
  let totalError = 0

  games.forEach(game => {
    const hours = game.playtime_forever / 60
    
    const low = trapezoid(hours, 0, 0, p[0], p[1])
    const medium = trapezoid(hours, p[2], p[3], p[4], p[5])
    const high = trapezoid(hours, p[6], p[7], 10000, 10000)

    const predictedEngagement = (low * p[8]) + (medium * p[9]) + (high * p[10])
    
    // Target engagement: 
    // If hours > 50 -> 1.0
    // If hours < 1 -> 0.1
    let target = 0.5
    if (hours > 50) target = 1.0
    if (hours < 2) target = 0.1
    
    totalError += Math.pow(predictedEngagement - target, 2)
  })

  return 1 / (1 + totalError)
}

export function evolve(population: Chromosome[], games: any[]): Chromosome[] {
  // Sort by fitness
  const sorted = [...population].sort((a, b) => b.fitness - a.fitness)
  const nextGen: Chromosome[] = sorted.slice(0, 2) // Elitism

  while (nextGen.length < population.length) {
    // Selection (Tournament)
    const parentA = sorted[Math.floor(Math.random() * (population.length / 2))]
    const parentB = sorted[Math.floor(Math.random() * (population.length / 2))]

    // Crossover
    const childParams = parentA.params.map((p, i) => Math.random() > 0.5 ? p : parentB.params[i])
    
    // Mutation
    if (Math.random() < 0.1) {
      const idx = Math.floor(Math.random() * childParams.length)
      childParams[idx] += (Math.random() - 0.5) * 5
    }

    nextGen.push({ params: childParams, fitness: 0 })
  }

  // Update fitness
  nextGen.forEach(c => c.fitness = calculateFitness(c, games))
  return nextGen
}

export function runGA(games: any[], generations = 10): number[] {
  let population = Array.from({ length: 20 }, createRandomChromosome)
  population.forEach(c => c.fitness = calculateFitness(c, games))

  for (let i = 0; i < generations; i++) {
    population = evolve(population, games)
  }

  return population.sort((a, b) => b.fitness - a.fitness)[0].params
}

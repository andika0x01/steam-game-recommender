import { calculateUserGenreProfile, calculateBayesianPreferenceScore } from './bayesian'

export * from './bayesian'
export * from './fuzzyLogic'
export * from './sa'

/**
 * Dashboard-specific profiling logic (if needed in the future)
 */
export function calculateGenrePreferences(games: any[]) {
  return calculateUserGenreProfile(games)
}

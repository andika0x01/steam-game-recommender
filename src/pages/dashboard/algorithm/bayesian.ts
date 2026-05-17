import { calculateNormalizedProfile, calculateAffinityScore, trapezoid, GenreProfile } from '../../../lib/algorithm/core'

export type UserGenreProfile = GenreProfile

export function calculateUserGenreProfile(library: any[]): UserGenreProfile[] {
  return calculateNormalizedProfile(library, (g) => {
    const hours = (g.playtime_forever || 0) / 60
    return trapezoid(hours, 0, 2, 1000, 1000)
  })
}

export function calculateBayesianPreferenceScore(gameGenres: string[], userProfile: UserGenreProfile[]): number {
  return calculateAffinityScore(gameGenres, userProfile)
}

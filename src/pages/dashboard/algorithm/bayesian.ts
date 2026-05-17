import { calculateNormalizedProfile, calculateAffinityScore, trapezoid, GenreProfile } from '../../../lib/algorithm/core'

export type UserGenreProfile = GenreProfile

export function calculateUserGenreProfile(library: any[]): UserGenreProfile[] {
  return calculateNormalizedProfile(library, (g) => {
    const hours = (g.playtime_forever || 0) / 60
    return 0.2 + (trapezoid(hours, 0, 2, 1000, 1000) * 0.8)
  })
}

export function calculateBayesianPreferenceScore(gameGenres: string[], userProfile: UserGenreProfile[]): number {
  return calculateAffinityScore(gameGenres, userProfile)
}

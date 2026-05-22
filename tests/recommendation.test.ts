import { describe, it, expect } from 'vitest';
import { calculateWeightedSimilarity } from '../src/lib/simple-recommendation';

describe('calculateWeightedSimilarity', () => {
  it('should calculate weighted similarity correctly', () => {
    const candidateTags = ['Action', 'RPG', 'Indie'];
    const userWeights = {
      'action': 10,
      'rpg': 5,
      'adventure': 2
    };

    // intersectionWeight: 10 (Action) + 5 (RPG) = 15
    // maxPossibleWeight: top 3 weights from userWeights = 10 + 5 + 2 = 17
    // Similarity = 15 / 17
    expect(calculateWeightedSimilarity(candidateTags, userWeights)).toBeCloseTo(15 / 17, 4);
  });

  it('should be case insensitive', () => {
    const candidateTags = ['Action', 'RPG'];
    const userWeights = {
      'action': 10,
      'rpg': 5
    };
    
    // intersectionWeight: 15
    // maxPossibleWeight: 15
    expect(calculateWeightedSimilarity(candidateTags, userWeights)).toBe(1.0);
  });

  it('should return 0 when candidate tags or profile weights are empty', () => {
    expect(calculateWeightedSimilarity([], {'action': 10})).toBe(0);
    expect(calculateWeightedSimilarity(['Action'], {})).toBe(0);
  });
});

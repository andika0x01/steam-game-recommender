import { describe, it, expect } from 'vitest';
import { calculateSimilarity } from '../src/lib/simple-recommendation';

describe('calculateSimilarity', () => {
  it('should calculate Overlap Coefficient correctly', () => {
    const tags1 = ['Action', 'RPG', 'Adventure'];
    const tags2 = ['Action', 'RPG', 'Indie'];

    // Intersection: ['Action', 'RPG'] (size 2)
    // Smallest set: tags1 or tags2 (size 3)
    // Score: 2/3 = 0.666...

    expect(calculateSimilarity(tags1, tags2)).toBeCloseTo(0.666, 2);
  });

  it('should be case insensitive', () => {
    const tags1 = ['Action', 'RPG'];
    const tags2 = ['action', 'rpg'];
    expect(calculateSimilarity(tags1, tags2)).toBe(1.0);
  });

  it('should return 0 for empty tags', () => {
    expect(calculateSimilarity([], ['Action'])).toBe(0);
    expect(calculateSimilarity(['Action'], [])).toBe(0);
  });
});

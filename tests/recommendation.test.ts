import { describe, it, expect } from 'vitest';
import { calculateSimilarity } from '../src/lib/simple-recommendation';

describe('calculateSimilarity', () => {
  it('should calculate Jaccard similarity correctly', () => {
    const tags1 = ['Action', 'RPG', 'Adventure'];
    const tags2 = ['Action', 'RPG', 'Indie'];

    // Intersection: ['Action', 'RPG'] (size 2)
    // Union: ['Action', 'RPG', 'Adventure', 'Indie'] (size 4)
    // Score: 2/4 = 0.5

    expect(calculateSimilarity(tags1, tags2)).toBe(0.5);
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

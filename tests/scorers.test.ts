import { describe, it, expect } from 'vitest';
import { FuzzyBayesianScorer } from '../src/lib/fuzzy-bayesian';
import { PureFuzzyScorer } from '../src/lib/pure-fuzzy';

const mockGames = [
  {
    appid: 10,
    name: 'Counter-Strike',
    playtime_forever: 10000,
    playtime_2weeks: 500,
    rtime_last_played: Math.floor(Date.now() / 1000) - 86400, // 1 day ago
  },
  {
    appid: 20,
    name: 'Team Fortress Classic',
    playtime_forever: 100,
    playtime_2weeks: 0,
    rtime_last_played: Math.floor(Date.now() / 1000) - (86400 * 365), // 1 year ago
  }
];

const mockReviews = {
  10: 0.9, // Very positive
  20: 0.4, // Mixed/Low
};

describe('FuzzyBayesianScorer', () => {
  it('should give higher score to active games with positive reviews', () => {
    const scorer = new FuzzyBayesianScorer(mockGames as any, mockReviews);
    const highMatch = scorer.getGameScore(10);
    const lowMatch = scorer.getGameScore(20);
    
    expect(highMatch).toBeGreaterThan(lowMatch);
    expect(highMatch).toBeGreaterThan(0.5);
  });
});

describe('PureFuzzyScorer', () => {
  it('should give higher score to active games', () => {
    const scorer = new PureFuzzyScorer(mockGames as any, mockReviews);
    const highMatch = scorer.getGameScore(10);
    const lowMatch = scorer.getGameScore(20);
    
    expect(highMatch).toBeGreaterThan(lowMatch);
  });
});

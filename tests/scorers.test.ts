import { describe, it, expect } from "vitest";
import { FuzzyOwnGamesScorer } from "../src/lib/fuzzy-own-games-scorer";
import { FuzzyNonOwnGamesScorer } from "../src/lib/fuzzy-non-own-games-scorer";

const mockGames = [
  {
    appid: 10,
    name: "Counter-Strike",
    playtime_forever: 10000,
    playtime_2weeks: 500,
    rtime_last_played: Math.floor(Date.now() / 1000) - 86400,
    playtime_windows_forever: 10000,
    playtime_mac_forever: 0,
    playtime_linux_forever: 0,
  },
  {
    appid: 20,
    name: "Team Fortress Classic",
    playtime_forever: 100,
    playtime_2weeks: 0,
    rtime_last_played: Math.floor(Date.now() / 1000) - 86400 * 365,
    playtime_windows_forever: 100,
    playtime_mac_forever: 0,
    playtime_linux_forever: 0,
  },
];

describe("FuzzyOwnGamesScorer", () => {
  it("should calculate higher score for active games", () => {
    const scorer = new FuzzyOwnGamesScorer(mockGames);
    const score10 = scorer.getGameScore(10);
    const score20 = scorer.getGameScore(20);

    expect(score10).toBeGreaterThan(score20);
    expect(score10).toBeGreaterThan(0.5);
    expect(score20).toBeLessThan(0.5);
  });

  it("should return 0.5 for unknown games", () => {
    const scorer = new FuzzyOwnGamesScorer(mockGames);
    expect(scorer.getGameScore(999)).toBe(0);
  });

  it("should expose a full fuzzy process breakdown", () => {
    const scorer = new FuzzyOwnGamesScorer(mockGames);
    const detailed = scorer.getGameScoreDetailed(10);

    expect(detailed.details.process.inference.rules.length).toBeGreaterThan(0);
    expect(detailed.details.process.defuzzification.score).toBeCloseTo(detailed.score, 10);
  });
});

describe("FuzzyNonOwnGamesScorer", () => {
  const scorer = new FuzzyNonOwnGamesScorer();

  it("should favor high similarity, high reviews and known publisher", () => {
    const highMatch = scorer.getGameScore(0.9, 0.9, 10000, 0.9);
    const lowMatch = scorer.getGameScore(0.5, 0.2, 100, 0.1);

    expect(highMatch).toBeGreaterThan(lowMatch);
    expect(highMatch).toBeGreaterThan(0.7);
  });

  it("should give decent score to high similarity even with low reviews", () => {
    const score = scorer.getGameScore(0.8, 0.9, 50, 0.5);
    expect(score).toBeGreaterThan(0.4);
  });

  it("should penalize bad reviews even if similar and good publisher", () => {
    const goodReview = scorer.getGameScore(0.9, 0.8, 1000, 0.8);
    const badReview = scorer.getGameScore(0.2, 0.8, 1000, 0.8);
    expect(goodReview).toBeGreaterThan(badReview);
  });

  it("should boost score for favorite publishers", () => {
    const favPub = scorer.getGameScore(0.8, 0.7, 1000, 0.9);
    const unknownPub = scorer.getGameScore(0.8, 0.7, 1000, 0.1);
    expect(favPub).toBeGreaterThan(unknownPub);
  });
});

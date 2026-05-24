import { SteamAPI, SteamGame, isGame18Plus } from "./steam";
import { FuzzyOwnGamesScorer } from "./fuzzy-own-games-scorer";
import { FuzzyNonOwnGamesScorer } from "./fuzzy-non-own-games-scorer";

export interface RecommendationResult {
  appId: number;
  name: string;
  headerImage: string;
  score: number;
  tags: string[];
}

export function calculateWeightedSimilarity(candidateTags: string[], userTagWeights: Record<string, number>): number {
  if (candidateTags.length === 0 || Object.keys(userTagWeights).length === 0) return 0;

  const lowerTagWeights: Record<string, number> = {};
  for (const [tag, weight] of Object.entries(userTagWeights)) {
    lowerTagWeights[tag.toLowerCase()] = weight;
  }

  const set1 = new Set(candidateTags.map((t) => t.toLowerCase()));
  let intersectionWeight = 0;

  for (const tag of set1) {
    if (lowerTagWeights[tag]) {
      intersectionWeight += lowerTagWeights[tag];
    }
  }

  const sortedWeights = Object.values(userTagWeights).sort((a, b) => b - a);
  const maxPossibleWeight = sortedWeights.slice(0, set1.size).reduce((sum, w) => sum + w, 0);

  return maxPossibleWeight > 0 ? intersectionWeight / maxPossibleWeight : 0;
}

export async function buildUserProfile(api: SteamAPI, ownedGames: SteamGame[], steamId?: string) {
  const cacheKey = steamId ? `user_profile_v3_${steamId}` : null;
  if (cacheKey && (api as any).kv) {
    const cached = await (api as any).kv.get(cacheKey, "json");
    if (cached) return cached;
  }

  const ownScorer = new FuzzyOwnGamesScorer(ownedGames);

  const topPlayed = ownedGames
    .filter((g) => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 15);

  const details = await api.getAppStoreDetailsBatch(
    topPlayed.map((g) => g.appid),
    "english",
    "id"
  );

  const tagWeights: Record<string, number> = {};
  const publisherStats: Record<string, { weightedScore: number; playtime: number }> = {};
  let totalLibraryPlaytime = 0;
  let totalTagWeight = 0;

  details.forEach((detail, idx) => {
    if (!detail) return;
    const game = topPlayed[idx];
    const score = ownScorer.getGameScore(game.appid);

    const tags = detail.normalized_tags || [];

    tags.forEach((tag) => {
      tagWeights[tag] = (tagWeights[tag] || 0) + score;
      totalTagWeight += score;
    });

    if (detail.publishers) {
      detail.publishers.forEach((pub) => {
        if (!publisherStats[pub]) publisherStats[pub] = { weightedScore: 0, playtime: 0 };
        publisherStats[pub].weightedScore += score * game.playtime_forever;
        publisherStats[pub].playtime += game.playtime_forever;
      });
    }
    totalLibraryPlaytime += game.playtime_forever;
  });

  const publisherScores: Record<string, number> = {};
  Object.entries(publisherStats).forEach(([pub, stats]) => {
    publisherScores[pub] = stats.playtime > 0 ? stats.weightedScore / stats.playtime : 0;
  });

  const maxPS = Math.max(...Object.values(publisherScores), 0.001);
  Object.keys(publisherScores).forEach((pub) => {
    publisherScores[pub] = Math.min(1, publisherScores[pub] / maxPS);
  });

  const profile = { tagWeights, totalTagWeight, publisherScores, userProfileTags: Object.keys(tagWeights) };

  if (cacheKey && (api as any).kv && totalTagWeight > 0) {
    await (api as any).kv.put(cacheKey, JSON.stringify(profile), { expirationTtl: 86400 });
  }

  return profile;
}

export async function getSimpleRecommendations(api: SteamAPI, ownedGames: SteamGame[], amount: number = 12, page: number = 1, steamId?: string): Promise<RecommendationResult[]> {
  if (ownedGames.length === 0) return [];

  const { tagWeights, totalTagWeight, publisherScores, userProfileTags } = await buildUserProfile(api, ownedGames, steamId);
  const nonOwnScorer = new FuzzyNonOwnGamesScorer();

  console.log(`[Engine] totalTagWeight: ${totalTagWeight}, profile tags: ${userProfileTags.length}`);
  if (Object.keys(tagWeights).length === 0) return [];

  const sortedTags = Object.entries(tagWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const searchResults: SteamSearchResult[] = [];
  for (const [tag, weight] of sortedTags) {
    const start = (page - 1) * 50;
    console.log(`[Engine] Fetching for tag: ${tag}, start: ${start}`);
    try {
      const res = await api.searchGames({ term: tag, sort_by: "Reviews_DESC", start, cc: "id" });
      searchResults.push(...res);
      console.log(`[Engine] Tag ${tag} got ${res.length} items`);
    } catch (e) {
      console.warn(`Search failed for tag ${tag}:`, e);
    }
  }

  const uniqueIds = [...new Set(searchResults.map((r) => r.id).filter((id): id is number => id !== undefined))];

  const ownedIds = new Set(ownedGames.map((g) => g.appid));
  const newIds = uniqueIds.filter((id) => !ownedIds.has(id)).slice(0, 20);

  console.log(`[Engine] Found ${uniqueIds.length} unique candidates. Filtered to ${newIds.length} new IDs.`);

  const candidateDetails = await api.getAppStoreDetailsBatch(newIds, "english", "id");

  const candidateReviews = [];
  for (const id of newIds) {
    candidateReviews.push(await api.getAppReviews(id));
  }

  const results: RecommendationResult[] = [];

  candidateDetails.forEach((detail, idx) => {
    if (!detail || detail.type !== "game") return;

    const reviews = candidateReviews[idx];

    const candidateTags = detail.normalized_tags || [];

    let candidatePS = 0;
    if (detail.publishers) {
      candidatePS = detail.publishers.reduce((max, pub) => Math.max(max, publisherScores[pub] || 0), 0);
    }

    const positivity = reviews ? reviews.total_positive / (reviews.total_reviews || 1) : 0.5;
    const similarity = calculateWeightedSimilarity(candidateTags, tagWeights);
    const volume = reviews ? reviews.total_reviews : 0;

    const finalScore = nonOwnScorer.getGameScore(positivity, similarity, volume, candidatePS);

    results.push({
      appId: detail.steam_appid,
      name: detail.name,
      headerImage: detail.header_image,
      score: finalScore,
      tags: candidateTags,
    });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, amount);
}

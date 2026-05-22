import { SteamAPI, SteamGame, SteamStoreAppDetails } from './steam';
import { FuzzyOwnGamesScorer } from './fuzzy-own-games-scorer';
import { FuzzyNonOwnGamesScorer } from './fuzzy-non-own-games-scorer';

export interface RecommendationResult {
  appId: number;
  name: string;
  headerImage: string;
  score: number;
  tags: string[];
}

/**
 * Menghitung Overlap Coefficient antara dua set tag.
 * Lebih adil untuk game dengan jumlah tag sedikit.
 */
export function calculateSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 || tags2.length === 0) return 0;
  
  const set1 = new Set(tags1.map(t => t.toLowerCase()));
  const set2 = new Set(tags2.map(t => t.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Overlap Coefficient: |A ∩ B| / min(|A|, |B|)
  return intersection.size / Math.min(set1.size, set2.size);
}

/**
 * Membangun profil selera pengguna (Tags & Publisher Scores)
 * berdasarkan game yang dimiliki di library.
 */
export async function buildUserProfile(api: SteamAPI, ownedGames: SteamGame[], steamId?: string) {
  // 1. Cek Cache KV jika ada steamId
  const cacheKey = steamId ? `user_profile_${steamId}` : null;
  if (cacheKey && (api as any).kv) {
    const cached = await (api as any).kv.get(cacheKey, 'json');
    if (cached) return cached;
  }

  const ownScorer = new FuzzyOwnGamesScorer(ownedGames);
  
  const topPlayed = ownedGames
    .filter(g => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 15); // Kurangi dari 30 ke 15 untuk menghemat subrequest

  const details = await api.getAppStoreDetailsBatch(topPlayed.map(g => g.appid));

  const tagWeights: Record<string, number> = {};
  const publisherStats: Record<string, { weightedScore: number, playtime: number }> = {};
  let totalLibraryPlaytime = 0;
  let totalTagWeight = 0;

  details.forEach((detail, idx) => {
    if (!detail) return;
    const game = topPlayed[idx];
    const score = ownScorer.getGameScore(game.appid);
    
    const tags = [
      ...(detail.genres || []).map(g => g.description),
      ...(detail.categories || []).map(c => c.description)
    ];

    tags.forEach(tag => {
      tagWeights[tag] = (tagWeights[tag] || 0) + score;
      totalTagWeight += score;
    });

    if (detail.publishers) {
      detail.publishers.forEach(pub => {
        if (!publisherStats[pub]) publisherStats[pub] = { weightedScore: 0, playtime: 0 };
        publisherStats[pub].weightedScore += (score * game.playtime_forever);
        publisherStats[pub].playtime += game.playtime_forever;
      });
    }
    totalLibraryPlaytime += game.playtime_forever;
  });

  const publisherScores: Record<string, number> = {};
  Object.entries(publisherStats).forEach(([pub, stats]) => {
    publisherScores[pub] = totalLibraryPlaytime > 0 ? stats.weightedScore / totalLibraryPlaytime : 0;
  });

  const maxPS = Math.max(...Object.values(publisherScores), 0.001);
  Object.keys(publisherScores).forEach(pub => {
    publisherScores[pub] = Math.min(1, publisherScores[pub] / maxPS);
  });

  const profile = { tagWeights, totalTagWeight, publisherScores, userProfileTags: Object.keys(tagWeights) };

  // 2. Simpan ke Cache KV (TTL 24 jam)
  if (cacheKey && (api as any).kv) {
    await (api as any).kv.put(cacheKey, JSON.stringify(profile), { expirationTtl: 86400 });
  }

  return profile;
}

/**
 * Mesin Rekomendasi Utama
 * 
 * Perbaikan: Memperluas jangkauan pencarian untuk Discovery Engine.
 */
export async function getSimpleRecommendations(
  api: SteamAPI,
  ownedGames: SteamGame[],
  amount: number = 12,
  page: number = 1,
  steamId?: string
): Promise<RecommendationResult[]> {
  if (ownedGames.length === 0) return [];

  const { tagWeights, totalTagWeight, publisherScores, userProfileTags } = await buildUserProfile(api, ownedGames, steamId);
  const nonOwnScorer = new FuzzyNonOwnGamesScorer();

  if (totalTagWeight === 0) return [];

  const sortedTags = Object.entries(tagWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Kurangi dari 10 ke 5 untuk menghemat subrequest

  const fetchPromises = sortedTags.map(async ([tag, weight]) => {
    const proportion = weight / totalTagWeight;
    const count = Math.max(8, Math.ceil((amount * 3) * proportion)); // Perkecil count
    // Offset lebih rapat agar tidak kehabisan hasil dari pencarian "term"
    const start = (page - 1) * 15; 
    return api.searchGames({ term: tag, sort_by: 'Reviews_DESC', start }).then(res => res.slice(0, count));
  });

  const searchResults = (await Promise.all(fetchPromises)).flat();
  const uniqueIds = [...new Set(searchResults.map(r => r.id).filter((id): id is number => id !== undefined))];

  const ownedIds = new Set(ownedGames.map(g => g.appid));
  const newIds = uniqueIds.filter(id => !ownedIds.has(id)).slice(0, 20); // Batasi maks 20 kandidat (sebelumnya 60)

  const candidateDetails = await api.getAppStoreDetailsBatch(newIds);
  const candidateReviewsPromises = newIds.map(id => api.getAppReviews(id));
  const candidateReviews = await Promise.all(candidateReviewsPromises);

  const results: RecommendationResult[] = [];

  candidateDetails.forEach((detail, idx) => {
    if (!detail || detail.type !== 'game') return;
    const reviews = candidateReviews[idx];
    if (!reviews) return;

    const candidateTags = [
      ...(detail.genres || []).map(g => g.description),
      ...(detail.categories || []).map(c => c.description)
    ];

    let candidatePS = 0;
    if (detail.publishers) {
      candidatePS = detail.publishers.reduce((max, pub) => Math.max(max, publisherScores[pub] || 0), 0);
    }

    const positivity = reviews.total_positive / (reviews.total_reviews || 1);
    const similarity = calculateSimilarity(candidateTags, userProfileTags);
    const volume = reviews.total_reviews;

    const finalScore = nonOwnScorer.getGameScore(positivity, similarity, volume, candidatePS);

    results.push({
      appId: detail.steam_appid,
      name: detail.name,
      headerImage: detail.header_image,
      score: finalScore,
      tags: candidateTags
    });
  });

  return results.sort((a, b) => b.score - a.score).slice(0, amount);
}

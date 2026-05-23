import { SteamAPI, SteamGame, isAllowedSteamTag, isGame18Plus } from './steam';
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
/**
 * Menghitung Weighted Overlap Coefficient berdasarkan bobot tag dari profil pengguna.
 * 
 * Catatan Normalisasi:
 * maxPossibleWeight dihitung dari top-N tag weights di seluruh profil user berdasarkan ukuran candidate set,
 * bukan dari batas atas candidate tersebut. Ini adalah intentional trade-off untuk memastikan
 * candidate yang hanya memiliki sedikit tag dominan (misal semua cocok namun termasuk tag yang berbobot kecil)
 * tetap tidak bisa mengalahkan candidate yang memuat tag-tag dengan bobot tertinggi dari profil user.
 */
export function calculateWeightedSimilarity(candidateTags: string[], userTagWeights: Record<string, number>): number {
  const allowedCandidateTags = candidateTags.filter(isAllowedSteamTag);
  const allowedUserTagWeights = Object.fromEntries(
    Object.entries(userTagWeights).filter(([tag]) => isAllowedSteamTag(tag))
  ) as Record<string, number>;

  if (allowedCandidateTags.length === 0 || Object.keys(allowedUserTagWeights).length === 0) return 0;
  
  const lowerTagWeights: Record<string, number> = {};
  for (const [tag, weight] of Object.entries(allowedUserTagWeights)) {
    lowerTagWeights[tag.toLowerCase()] = weight;
  }
  
  const set1 = new Set(allowedCandidateTags.map(t => t.toLowerCase()));
  let intersectionWeight = 0;
  
  for (const tag of set1) {
    if (lowerTagWeights[tag]) {
      intersectionWeight += lowerTagWeights[tag];
    }
  }
  
  const sortedWeights = Object.values(allowedUserTagWeights).sort((a, b) => b - a);
  const maxPossibleWeight = sortedWeights.slice(0, set1.size).reduce((sum, w) => sum + w, 0);

  return maxPossibleWeight > 0 ? intersectionWeight / maxPossibleWeight : 0;
}

/**
 * Membangun profil selera pengguna (Tags & Publisher Scores)
 * berdasarkan game yang dimiliki di library.
 */
export async function buildUserProfile(api: SteamAPI, ownedGames: SteamGame[], steamId?: string) {
  // 1. Cek Cache KV jika ada steamId
  const cacheKey = steamId ? `user_profile_v3_${steamId}` : null;
  if (cacheKey && (api as any).kv) {
    const cached = await (api as any).kv.get(cacheKey, 'json');
    if (cached) return cached;
  }

  const ownScorer = new FuzzyOwnGamesScorer(ownedGames);
  
  const topPlayed = ownedGames
    .filter(g => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 15); // Kurangi dari 30 ke 15 untuk menghemat subrequest

  const details = await api.getAppStoreDetailsBatch(topPlayed.map(g => g.appid), 'english', 'id');

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
    ].filter(isAllowedSteamTag);

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
    publisherScores[pub] = stats.playtime > 0 ? stats.weightedScore / stats.playtime : 0;
  });

  const maxPS = Math.max(...Object.values(publisherScores), 0.001);
  Object.keys(publisherScores).forEach(pub => {
    publisherScores[pub] = Math.min(1, publisherScores[pub] / maxPS);
  });

  const profile = { tagWeights, totalTagWeight, publisherScores, userProfileTags: Object.keys(tagWeights) };

  // 2. Simpan ke Cache KV (TTL 24 jam)
  // Jangan cache profile kosong: jika Steam gagal mengembalikan tags, kita harus mencoba lagi nanti.
  if (cacheKey && (api as any).kv && totalTagWeight > 0) {
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
  const allowedTagWeights = Object.fromEntries(
    Object.entries(tagWeights).filter(([tag]) => isAllowedSteamTag(tag))
  ) as Record<string, number>;
  const nonOwnScorer = new FuzzyNonOwnGamesScorer();

  console.log(`[Engine] totalTagWeight: ${totalTagWeight}, profile tags: ${userProfileTags.length}`);
  if (Object.keys(allowedTagWeights).length === 0) return [];

  const sortedTags = Object.entries(allowedTagWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Kurangi dari 10 ke 5 untuk menghemat subrequest

  const searchResults: SteamSearchResult[] = [];
  for (const [tag, weight] of sortedTags) {
    // Offset lompat per 50 item as per Steam's default pagination
    const start = (page - 1) * 50; 
    console.log(`[Engine] Fetching for tag: ${tag}, start: ${start}`);
    try {
      // Hilangkan batasan 'count' statis, ambil seluruh 50 hasil per tag agar kolam probabilitas > 200 kandidat.
      // Hal ini mencegah "Popularity Bias Empty Array" di mana user kebetulan sudah punya semua top 10 game genre tersebut!
      const res = await api.searchGames({ term: tag, sort_by: 'Reviews_DESC', start, cc: 'id' });
      searchResults.push(...res);
      console.log(`[Engine] Tag ${tag} got ${res.length} items`);
    } catch (e) {
      console.warn(`Search failed for tag ${tag}:`, e);
    }
  }

  // Acak secara deterministik atau biarkan steam ranking, lalu filter unik
  const uniqueIds = [...new Set(searchResults.map(r => r.id).filter((id): id is number => id !== undefined))];

  const ownedIds = new Set(ownedGames.map(g => g.appid));
  const newIds = uniqueIds.filter(id => !ownedIds.has(id)).slice(0, 20); // Maksimalkan dapat 20 kandidat bersih

  console.log(`[Engine] Found ${uniqueIds.length} unique candidates. Filtered to ${newIds.length} new IDs.`);

  const candidateDetails = await api.getAppStoreDetailsBatch(newIds, 'english', 'id');
  
  const candidateReviews = [];
  for (const id of newIds) {
    candidateReviews.push(await api.getAppReviews(id));
  }

  const results: RecommendationResult[] = [];

  candidateDetails.forEach((detail, idx) => {
    if (!detail || detail.type !== 'game') return;
    
    // Filter game 18+
    if (isGame18Plus(detail)) return;

    const reviews = candidateReviews[idx];

    const candidateTags = [
      ...(detail.genres || []).map(g => g.description),
      ...(detail.categories || []).map(c => c.description)
    ].filter(isAllowedSteamTag);

    let candidatePS = 0;
    if (detail.publishers) {
      candidatePS = detail.publishers.reduce((max, pub) => Math.max(max, publisherScores[pub] || 0), 0);
    }

    const positivity = reviews ? (reviews.total_positive / (reviews.total_reviews || 1)) : 0.5;
    const similarity = calculateWeightedSimilarity(candidateTags, allowedTagWeights);
    const volume = reviews ? reviews.total_reviews : 0;

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

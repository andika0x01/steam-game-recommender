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
 * Menghitung Jaccard Similarity antara dua set tag.
 * Rumus: (Irisan Set) / (Gabungan Set)
 */
export function calculateSimilarity(tags1: string[], tags2: string[]): number {
  if (tags1.length === 0 || tags2.length === 0) return 0;
  
  const set1 = new Set(tags1.map(t => t.toLowerCase()));
  const set2 = new Set(tags2.map(t => t.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

/**
 * Mesin Rekomendasi Utama
 * 
 * Fungsi ini mengorkestrasi seluruh proses rekomendasi:
 * 1. Menganalisis library pengguna untuk membangun profil tag favorit.
 * 2. Mengambil kandidat game dari Steam Store secara proporsional.
 * 3. Menilai setiap kandidat menggunakan logika fuzzy non-owned.
 * 4. Mengurutkan dan mengembalikan hasil terbaik.
 */
export async function getSimpleRecommendations(
  api: SteamAPI,
  ownedGames: SteamGame[],
  amount: number = 12
): Promise<RecommendationResult[]> {
  if (ownedGames.length === 0) return [];

  const ownScorer = new FuzzyOwnGamesScorer(ownedGames);
  const nonOwnScorer = new FuzzyNonOwnGamesScorer();

  const topPlayed = ownedGames
    .filter(g => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 20);

  const detailPromises = topPlayed.map(g => api.getAppStoreDetails(g.appid));
  const details = await Promise.all(detailPromises);

  const tagWeights: Record<string, number> = {};
  let totalWeight = 0;

  details.forEach((detail, idx) => {
    if (!detail) return;
    const gameId = topPlayed[idx].appid;
    const score = ownScorer.getGameScore(gameId);
    
    const tags = [
      ...(detail.genres || []).map(g => g.description),
      ...(detail.categories || []).map(c => c.description)
    ];

    tags.forEach(tag => {
      tagWeights[tag] = (tagWeights[tag] || 0) + score;
      totalWeight += score;
    });
  });

  if (totalWeight === 0) return [];

  const sortedTags = Object.entries(tagWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); 

  const candidatesPerTag = amount * 3; 
  const fetchPromises = sortedTags.map(async ([tag, weight]) => {
    const proportion = weight / totalWeight;
    const count = Math.max(5, Math.ceil(candidatesPerTag * proportion));
    return api.searchGames({ term: tag, sort_by: 'Reviews_DESC' }).then(res => res.slice(0, count));
  });

  const searchResults = (await Promise.all(fetchPromises)).flat();
  const uniqueIds = [...new Set(searchResults.map(r => r.id).filter((id): id is number => id !== undefined))];

  const ownedIds = new Set(ownedGames.map(g => g.appid));
  const newIds = uniqueIds.filter(id => !ownedIds.has(id)).slice(0, amount * 2);

  const candidateDetailPromises = newIds.map(id => api.getAppStoreDetails(id));
  const candidateDetails = await Promise.all(candidateDetailPromises);
  const candidateReviewsPromises = newIds.map(id => api.getAppReviews(id));
  const candidateReviews = await Promise.all(candidateReviewsPromises);

  const userProfileTags = Object.keys(tagWeights);
  const results: RecommendationResult[] = [];

  candidateDetails.forEach((detail, idx) => {
    if (!detail || detail.type !== 'game') return;
    const reviews = candidateReviews[idx];
    if (!reviews) return;

    const candidateTags = [
      ...(detail.genres || []).map(g => g.description),
      ...(detail.categories || []).map(c => c.description)
    ];

    const positivity = reviews.total_positive / (reviews.total_reviews || 1);
    const similarity = calculateSimilarity(candidateTags, userProfileTags);
    const volume = reviews.total_reviews;

    const finalScore = nonOwnScorer.getGameScore(positivity, similarity, volume);

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

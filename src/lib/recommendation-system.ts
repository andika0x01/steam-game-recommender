import { SteamAPI, SteamStoreAppDetails } from './steam';

export interface ScoredGame {
  appId: number;
  score: number; // 0 to 1 preference score
  tags: string[]; // List of tag names or descriptions
}

export interface RecommendationResult {
  appId: number;
  name: string;
  headerImage: string;
  score: number; // MMR score
  tags: string[];
}

/**
 * Calculates Jaccard Similarity between two sets of tags.
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
 * Recommends games using the Maximal Marginal Relevance (MMR) algorithm.
 * 
 * MMR = Argmax_{d_i \in R \ S} [ \lambda * Sim_1(d_i, Q) - (1 - \lambda) * max_{d_j \in S} Sim_2(d_i, d_j) ]
 * 
 * @param api SteamAPI instance
 * @param scoredGames List of games the user has already scored/interacted with
 * @param amount Number of games to recommend
 * @param lambda Balance between relevance (1.0) and diversity (0.0)
 */
export async function getRecommendedGames(
  api: SteamAPI,
  scoredGames: ScoredGame[],
  amount: number = 10,
  lambda: number = 0.7
): Promise<RecommendationResult[]> {
  if (scoredGames.length === 0) return [];

  // 1. Extract user profile tags weighted by score
  const tagWeights: Record<string, number> = {};
  scoredGames.forEach(game => {
    game.tags.forEach(tag => {
      tagWeights[tag] = (tagWeights[tag] || 0) + game.score;
    });
  });

  // Get top tags to search for
  const topTags = Object.entries(tagWeights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  // 2. Fetch candidate games from Steam
  // Since searchGames takes numeric tags, we might need a mapping or just search by term
  // For now, let's use the first top tag as a search term or find a way to get many candidates
  const candidatePool: Map<number, SteamStoreAppDetails> = new Map();
  
  // Search for games in top tags
  // Note: Steam search by term can be broad. Ideally we'd have a tag ID mapping.
  // We'll search for each of the top 3 tags to get a diverse pool
  const searchPromises = topTags.slice(0, 3).map(tag => 
    api.searchGames({ term: tag, sort_by: 'Reviews_DESC' })
  );

  const searchResults = (await Promise.all(searchPromises)).flat();
  const uniqueCandidateIds = [...new Set(searchResults.map(r => r.id).filter((id): id is number => id !== undefined))];

  // Filter out games user already scored
  const scoredIds = new Set(scoredGames.map(g => g.appId));
  const newCandidateIds = uniqueCandidateIds.filter(id => !scoredIds.has(id)).slice(0, 30); // Limit pool size for performance

  // 3. Get details for candidates to get their full tags/genres
  const detailPromises = newCandidateIds.map(id => api.getAppStoreDetails(id));
  const details = await Promise.all(detailPromises);

  details.forEach((detail: any) => {
    // Strictly only include "game" types and exclude Software, DLC, etc.
    if (detail && detail.type === 'game') {
      candidatePool.set(detail.steam_appid, detail);
    }
  });

  // 4. MMR Selection
  const selectedGames: RecommendationResult[] = [];
  const candidates = Array.from(candidatePool.values());
  
  // Combine all tags from scored games as user profile for similarity
  const userProfileTags = Object.keys(tagWeights);

  while (selectedGames.length < amount && candidates.length > 0) {
    let bestScore = -Infinity;
    let bestIndex = -1;

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      const candidateTags = [
        ...(candidate.genres || []).map(g => g.description),
        ...(candidate.categories || []).map(c => c.description)
      ];

      // Relevance: Similarity to user profile
      const relevance = calculateSimilarity(candidateTags, userProfileTags);

      // Diversity: Similarity to already selected games
      let maxSimilarityToSelected = 0;
      if (selectedGames.length > 0) {
        maxSimilarityToSelected = Math.max(
          ...selectedGames.map(s => calculateSimilarity(candidateTags, s.tags))
        );
      }

      const mmrScore = (lambda * relevance) - ((1 - lambda) * maxSimilarityToSelected);

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }

    if (bestIndex !== -1) {
      const [bestCandidate] = candidates.splice(bestIndex, 1);
      selectedGames.push({
        appId: bestCandidate.steam_appid,
        name: bestCandidate.name,
        headerImage: bestCandidate.header_image,
        score: bestScore,
        tags: [
          ...(bestCandidate.genres || []).map(g => g.description),
          ...(bestCandidate.categories || []).map(c => c.description)
        ]
      });
    } else {
      break;
    }
  }

  return selectedGames;
}

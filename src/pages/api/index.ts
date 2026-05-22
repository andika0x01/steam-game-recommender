import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { SteamAPI, isAllowedSteamTag } from '../../lib/steam'
import { getSimpleRecommendations, buildUserProfile, calculateWeightedSimilarity } from '../../lib/simple-recommendation'
import { FuzzyNonOwnGamesScorer } from '../../lib/fuzzy-non-own-games-scorer'

const app = new Hono<{ Bindings: any, Variables: any }>()

app.get('/recommendations', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.json({ error: 'Unauthorized' }, 401)

  const page = parseInt(c.req.query('page') || '1')
  const amount = 12

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  
  try {
    const games = await steamAPI.getOwnedGames(steamId)
    const recommendations = await getSimpleRecommendations(steamAPI, games, amount, page, steamId)
    return c.json(recommendations)
  } catch (error) {
    console.error('Error in /api/recommendations:', error)
    return c.json({ error: 'Failed to fetch recommendations' }, 500)
  }
})

app.get('/recommendation-deals', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.json({ error: 'Unauthorized' }, 401)

  const page = parseInt(c.req.query('page') || '1')
  const amount = 15 // Kurangi dari 24 ke 15 agar total subrequest aman (<50)

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  
  try {
    const userGames = await steamAPI.getOwnedGames(steamId)
    
    /**
     * Menggunakan FuzzyNonOwnGamesScorer untuk game di store.
     * Kita perlu profil selera user (tags & publisher scores).
     */
    const { publisherScores, tagWeights } = await buildUserProfile(steamAPI, userGames, steamId);
    const allowedTagWeights = Object.fromEntries(
      Object.entries(tagWeights).filter(([tag]) => isAllowedSteamTag(tag))
    ) as Record<string, number>;
    const nonOwnScorer = new FuzzyNonOwnGamesScorer();

    const start = (page - 1) * amount
    const saleResults = await steamAPI.searchGames({ specials: true, cc: 'id', start })
    const candidateIds = saleResults.slice(0, amount).map(r => r.id).filter(Boolean) as number[]
    
    const rawDetails = await steamAPI.getAppStoreDetailsBatch(candidateIds, 'english', 'id')
    const candidateReviewsPromises = candidateIds.map(id => steamAPI.getAppReviews(id))
    const candidateReviews = await Promise.all(candidateReviewsPromises)
    
    const deals = rawDetails
      .map((d: any, idx: number) => ({ d, reviews: candidateReviews[idx] }))
      .filter(({ d }: any) => d && d.price_overview)
      .map(({ d, reviews }: any) => {
        const candidateTags = [
          ...(d.genres || []).map((g: any) => g.description),
          ...(d.categories || []).map((c: any) => c.description)
        ].filter(isAllowedSteamTag);

        let candidatePS = 0;
        if (d.publishers) {
          candidatePS = d.publishers.reduce((max: number, pub: string) => Math.max(max, publisherScores[pub] || 0), 0);
        }

        const positivity = reviews ? (reviews.total_positive / (reviews.total_reviews || 1)) : 0.5;
        const similarity = calculateWeightedSimilarity(candidateTags, allowedTagWeights);
        const volume = reviews ? reviews.total_reviews : 0;
        
        const detailed = nonOwnScorer.getGameScoreDetailed(positivity, similarity, volume, candidatePS);
        const score = detailed.score;
        const lowerTagWeights: Record<string, number> = {};
        Object.entries(allowedTagWeights).forEach(([tag, weight]) => {
          lowerTagWeights[tag.toLowerCase()] = weight as number;
        });
        const matchedTags = candidateTags
          .filter((tag: string) => lowerTagWeights[tag.toLowerCase()])
          .sort((left: string, right: string) => lowerTagWeights[right.toLowerCase()] - lowerTagWeights[left.toLowerCase()])
          .slice(0, 8);
        const floatPrice = d!.price_overview!.final / 100;
        const density = score / (floatPrice > 0 ? floatPrice : 1);

        return {
          appid: d!.steam_appid,
          name: d!.name,
          price: d!.price_overview!.final_formatted,
          originalPrice: d!.price_overview!.initial_formatted,
          discount: d!.price_overview!.discount_percent.toString(),
          score: score,
          density: density,
          tags: candidateTags,
          hideScore: false,
          analyzerData: {
            appId: d!.steam_appid,
            name: d!.name,
            score,
            fuzzyStats: detailed.details,
            source: {
              reviewPositivity: positivity,
              tagSimilarity: similarity,
              reviewVolume: volume,
              publisherScore: candidatePS,
              matchedTags,
              publishers: d.publishers || [],
              price: d!.price_overview!.final_formatted,
              originalPrice: d!.price_overview!.initial_formatted,
              discount: d!.price_overview!.discount_percent.toString()
            }
          }
        }
      })

    return c.json(deals)
  } catch (error) {
    console.error('Error in /api/recommendation-deals:', error)
    return c.json({ error: 'Failed to fetch recommendations' }, 500)
  }
})

app.get('/game/:appid', async (c) => {
  try {
    const appId = parseInt(c.req.param('appid'))
    const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
    const detail = await steamAPI.getAppStoreDetails(appId, 'english', 'id')
    if (!detail) return c.json({ error: 'Not found' }, 404)
    return c.json(detail)
  } catch (error) {
    console.error('Error in /api/game:', error)
    return c.json({ error: 'Internal Server Error' }, 500)
  }
})

export default app

import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { SteamAPI, isAllowedSteamTag, isGame18Plus } from '../../lib/steam'
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
    const ownedAppIds = new Set(userGames.map(g => g.appid))
    const uniqueIds = [...new Set(saleResults.map(r => r.id).filter(Boolean) as number[])]
    const newIds = uniqueIds.filter(id => !ownedAppIds.has(id))
    const candidateIds = newIds.slice(0, amount)
    
    const rawDetails = await steamAPI.getAppStoreDetailsBatch(candidateIds, 'english', 'id')
    const candidateReviewsPromises = candidateIds.map(id => steamAPI.getAppReviews(id))
    const candidateReviews = await Promise.all(candidateReviewsPromises)
    
    const deals = rawDetails
      .map((d: any, idx: number) => ({ d, reviews: candidateReviews[idx] }))
      .filter(({ d }: any) => d && d.price_overview && !isGame18Plus(d))
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

app.get('/optimization-candidates', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.json({ error: 'Unauthorized' }, 401)

  const budget = parseInt(c.req.query('budget') || '0')
  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  
  try {
    const userGames = await steamAPI.getOwnedGames(steamId)
    const { publisherScores, tagWeights } = await buildUserProfile(steamAPI, userGames, steamId);
    const allowedTagWeights = Object.fromEntries(
      Object.entries(tagWeights).filter(([tag]) => isAllowedSteamTag(tag))
    ) as Record<string, number>;
    const nonOwnScorer = new FuzzyNonOwnGamesScorer();

    const saleResults = await steamAPI.searchGames({ specials: true, cc: 'id' })
    const poolSize = budget > 0 ? Math.min(100, Math.max(30, Math.floor(budget / 5000))) : 40
    const ownedAppIds = new Set(userGames.map(g => g.appid))
    const uniqueIds = [...new Set(saleResults.map(r => r.id).filter(Boolean) as number[])]
    const newIds = uniqueIds.filter(id => !ownedAppIds.has(id))
    const candidateIds = newIds.slice(0, poolSize)
    
    const rawDetails = await steamAPI.getAppStoreDetailsBatch(candidateIds, 'english', 'id')
    const candidateReviewsPromises = candidateIds.map(id => steamAPI.getAppReviews(id))
    const candidateReviews = await Promise.all(candidateReviewsPromises)
    
    const candidates = rawDetails
      .map((d: any, idx: number) => ({ d, reviews: candidateReviews[idx] }))
      .filter(({ d }: any) => d && d.price_overview && !isGame18Plus(d))
      .map(({ d, reviews }: any) => {
        const price = d!.price_overview!.final / 100
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
        const safePrice = price > 0 ? price : 1;
        const density = score / safePrice;

        return {
          appid: d!.steam_appid,
          name: d!.name,
          salePrice: price,
          score: score,
          density: density,
          image: `https://cdn.akamai.steamstatic.com/steam/apps/${d!.steam_appid}/header.jpg`,
          fuzzyDetails: detailed.details,
          source: {
            reviewPositivity: positivity,
            tagSimilarity: similarity,
            reviewVolume: volume,
            publisherScore: candidatePS,
            publishers: d.publishers || [],
            price: d!.price_overview!.final_formatted,
            originalPrice: d!.price_overview!.initial_formatted,
            discount: d!.price_overview!.discount_percent.toString()
          }
        }
      })

    return c.json(candidates)
  } catch (error) {
    console.error('Error in /api/optimization-candidates:', error)
    return c.json({ error: 'Failed to fetch candidates' }, 500)
  }
})

app.get('/perform-optimization', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.json({ error: 'Unauthorized' }, 401)

  const budgetIDR = parseInt(c.req.query('budget') || '0')
  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  
  try {
    const userGames = await steamAPI.getOwnedGames(steamId)
    const { publisherScores, tagWeights } = await buildUserProfile(steamAPI, userGames, steamId);
    const allowedTagWeights = Object.fromEntries(
      Object.entries(tagWeights).filter(([tag]) => isAllowedSteamTag(tag))
    ) as Record<string, number>;
    const nonOwnScorer = new FuzzyNonOwnGamesScorer();

    const saleResults = await steamAPI.searchGames({ specials: true, cc: 'id' })
    const dynamicPoolSize = budgetIDR > 0 ? Math.min(200, Math.max(30, Math.floor(budgetIDR / 5000))) : 30
    const ownedAppIds = new Set(userGames.map(g => g.appid))
    const uniqueIds = [...new Set(saleResults.map(r => r.id).filter(Boolean) as number[])]
    const newIds = uniqueIds.filter(id => !ownedAppIds.has(id))
    const candidateIds = newIds.slice(0, dynamicPoolSize)
    
    const rawDetails = await steamAPI.getAppStoreDetailsBatch(candidateIds, 'english', 'id')
    const candidateReviewsPromises = candidateIds.map(id => steamAPI.getAppReviews(id))
    const candidateReviews = await Promise.all(candidateReviewsPromises)
    
    const scoredDeals = rawDetails
      .map((d: any, idx: number) => ({ d, reviews: candidateReviews[idx] }))
      .filter(({ d }: any) => d && d.price_overview && !isGame18Plus(d))
      .map(({ d, reviews }: any) => {
        const price = d!.price_overview!.final / 100
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
        const safePrice = price > 0 ? price : 1;
        const density = score / safePrice;

        return {
          appid: d!.steam_appid,
          name: d!.name,
          salePrice: price,
          score: score,
          density: density,
          image: `https://cdn.akamai.steamstatic.com/steam/apps/${d!.steam_appid}/header.jpg`,
          formattedPrice: d!.price_overview!.final_formatted,
          savings: d!.price_overview!.discount_percent.toString(),
          fuzzyDetails: detailed.details,
          source: {
            reviewPositivity: positivity,
            tagSimilarity: similarity,
            reviewVolume: volume,
            publisherScore: candidatePS,
            publishers: d.publishers || [],
            price: d!.price_overview!.final_formatted,
            originalPrice: d!.price_overview!.initial_formatted,
            discount: d!.price_overview!.discount_percent.toString()
          }
        }
      })

    // Start time tracking
    const startTime = performance.now();

    // Algoritma SA yang sama dengan di backend asli
    let currentBasket: any[] = []
    const sortedByPrice = [...scoredDeals].sort((a, b) => a.salePrice - b.salePrice)
    let tempCost = 0
    for (const deal of sortedByPrice) {
      if (tempCost + deal.salePrice <= budgetIDR) {
        currentBasket.push(deal)
        tempCost += deal.salePrice
      } else break
    }

    const getCost = (items: any[]) => items.reduce((sum, item) => sum + item.salePrice, 0)
    const getEnergy = (items: any[]) => {
      const cost = getCost(items)
      if (cost > budgetIDR || cost === 0) return Number.NEGATIVE_INFINITY
      const totalDensity = items.reduce((sum, item) => sum + item.density, 0)
      const budgetUtilization = cost / budgetIDR
      return totalDensity * Math.pow(budgetUtilization, 2)
    }

    let temp = 3000.0 
    const coolingRate = 0.998 
    let iteration = 0

    // Initial State Logs for Terminal
    console.log("\n" + "=".repeat(60));
    console.log("SIMULATED ANNEALING - ENGINE INITIALIZATION");
    console.log("=".repeat(60));
    console.log(`Target Budget    : Rp${budgetIDR.toLocaleString('id-ID')}`);
    console.log(`Candidate Pool   : ${scoredDeals.length} games`);
    console.log(`Initial Basket   : ${currentBasket.length} games`);
    console.log(`Initial Cost     : Rp${getCost(currentBasket).toLocaleString('id-ID')}`);
    console.log(`Initial Energy   : ${(getEnergy(currentBasket) * 1000).toFixed(4)} (Scaled x1000)`);
    console.log("-".repeat(60));

    while (temp > 1) {
      let neighbor = [...currentBasket]
      const action = Math.random()
      if (action < 0.4 && neighbor.length < scoredDeals.length) {
        const available = scoredDeals.filter(d => !neighbor.find(n => n.appid === d.appid))
        if (available.length > 0) {
          const randomItem = available[Math.floor(Math.random() * available.length)]
          if (getCost(neighbor) + randomItem.salePrice <= budgetIDR) neighbor.push(randomItem)
        }
      } else if (action < 0.6 && neighbor.length > 0) {
        neighbor.splice(Math.floor(Math.random() * neighbor.length), 1)
      } else if (neighbor.length > 0) {
        const idx = Math.floor(Math.random() * neighbor.length)
        const available = scoredDeals.filter(d => !neighbor.find(n => n.appid === d.appid))
        if (available.length > 0) {
          const newItem = available[Math.floor(Math.random() * available.length)]
          const costWithoutOld = getCost(neighbor) - neighbor[idx].salePrice
          if (costWithoutOld + newItem.salePrice <= budgetIDR) neighbor[idx] = newItem
        }
      }
      
      const currentEnergy = getEnergy(currentBasket)
      const neighborEnergy = getEnergy(neighbor)
      if (neighborEnergy > currentEnergy || Math.random() < Math.exp((neighborEnergy - currentEnergy) / temp)) {
        currentBasket = neighbor
      }

      // Per 500 Iterations Logs for Terminal
      if (iteration % 500 === 0) {
        const currentCost = getCost(currentBasket);
        const utilization = ((currentCost / budgetIDR) * 100).toFixed(2);
        const energyScaled = (getEnergy(currentBasket) * 1000).toFixed(4);
        console.log(`[ITER ${iteration.toString().padStart(4, ' ')}] T:${temp.toFixed(1).padStart(6, ' ')} | Cost: Rp${currentCost.toLocaleString('id-ID').padEnd(12)} | Util: ${utilization.padStart(6)}% | Energy: ${energyScaled}`);
      }

      temp *= coolingRate
      iteration++
    }

    const endTime = performance.now();
    const computationTimeMs = Math.round(endTime - startTime);

    const finalCost = getCost(currentBasket);
    const finalEnergy = getEnergy(currentBasket);
    console.log("-".repeat(60));
    console.log("SIMULATED ANNEALING - COMPLETED");
    console.log(`Final Iteration  : ${iteration}`);
    console.log(`Final Temp       : ${temp.toFixed(2)}`);
    console.log(`Final Cost       : Rp${finalCost.toLocaleString('id-ID')}`);
    console.log(`Final Energy     : ${(finalEnergy * 1000).toFixed(4)} (Scaled x1000)`);
    console.log(`Total Games      : ${currentBasket.length}`);
    console.log(`Computation Time : ${computationTimeMs}ms`);
    console.log("=".repeat(60));
    console.table(currentBasket.map(g => ({
      AppID: g.appid,
      Name: g.name.length > 30 ? g.name.substring(0, 27) + "..." : g.name,
      Price: `Rp${g.salePrice.toLocaleString('id-ID')}`,
      Score: g.score.toFixed(2),
      Density: g.density.toFixed(4)
    })));
    console.log("=".repeat(60) + "\n");

    return c.json({
      basket: currentBasket,
      totalCost: finalCost,
      computationTimeMs: computationTimeMs,
      candidates: scoredDeals.slice(0, 50) 
    })
  } catch (error) {
    console.error('Error in /api/perform-optimization:', error)
    return c.json({ error: 'Optimization failed' }, 500)
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

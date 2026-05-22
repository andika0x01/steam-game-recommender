import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { SteamAPI } from '../../lib/steam'
import { getSimpleRecommendations } from '../../lib/simple-recommendation'

const app = new Hono<{ Bindings: any, Variables: any }>()

app.get('/recommendations', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.json({ error: 'Unauthorized' }, 401)

  const page = parseInt(c.req.query('page') || '1')
  const amount = 12

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  const games = await steamAPI.getOwnedGames(steamId)

  // Fetch more recommendations based on page
  // amount * page ensures we bypass already seen items if needed, 
  // but simple-recommendation currently returns a fresh set.
  // We can pass a seed or offset if the engine supports it.
  const recommendations = await getSimpleRecommendations(steamAPI, games, amount)

  return c.json(recommendations)
})

app.get('/deals', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.json({ error: 'Unauthorized' }, 401)

  const page = parseInt(c.req.query('page') || '1')
  const amount = 24

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  const userGames = await steamAPI.getOwnedGames(steamId)

  // Fetch search results with offset
  // Steam search results are usually small per request, we can use 'start' parameter if supported by Steam storefront search
  // or just fetch a larger pool and slice.
  const saleResults = await steamAPI.searchGames({ specials: true, cc: 'id' })
  const offset = (page - 1) * amount
  const candidateIds = saleResults.slice(offset, offset + amount).map(r => r.id).filter(Boolean) as number[]
  
  const detailPromises = candidateIds.map(id => steamAPI.getAppStoreDetails(id, 'english', 'id'))
  const rawDetails = await Promise.all(detailPromises)

  // We can reuse FuzzyOwnGamesScorer if we had the class accessible, 
  // for simplicity in API we just return raw data or basic scores.
  // Actually, let's just return the formatted deal objects.
  
  const deals = rawDetails
    .filter((d: any) => d && d.price_overview)
    .map((d: any) => ({
      appid: d!.steam_appid,
      name: d!.name,
      price: d!.price_overview!.final_formatted,
      originalPrice: d!.price_overview!.initial_formatted,
      discount: d!.price_overview!.discount_percent.toString(),
      tags: (d!.genres || []).map((g: any) => g.description)
    }))

  return c.json(deals)
})

export default app

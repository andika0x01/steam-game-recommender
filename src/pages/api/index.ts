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

  // Gunakan parameter 'page' untuk mengambil set rekomendasi berikutnya
  const recommendations = await getSimpleRecommendations(steamAPI, games, amount, page)

  return c.json(recommendations)
})

app.get('/deals', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.json({ error: 'Unauthorized' }, 401)

  const page = parseInt(c.req.query('page') || '1')
  const amount = 24

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  const userGames = await steamAPI.getOwnedGames(steamId)

  // Gunakan 'start' offset pada pencarian Steam untuk mendapatkan data baru
  const start = (page - 1) * amount
  const saleResults = await steamAPI.searchGames({ specials: true, cc: 'id', start })
  const candidateIds = saleResults.slice(0, amount).map(r => r.id).filter(Boolean) as number[]
  
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

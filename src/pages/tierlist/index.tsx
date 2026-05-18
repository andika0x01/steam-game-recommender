import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import React from 'react'
import { getOwnedGames } from '../../lib/steam'
import { TierList } from '../../components/TierList'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  let savedTiers: any[] = []
  try {
    const result = await c.env.DB.prepare('SELECT game_appid, tier FROM tier_lists WHERE user_id = ?')
      .bind(steamId)
      .all()
    savedTiers = result.results || []
  } catch (e) { console.error('DB Error fetching tiers:', e) }

  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  const topGames = games.sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, 40)
  
  const initialGames = topGames.map(g => ({ appid: g.appid, name: g.name || 'Unknown' }))

  return c.render(
    <div 
      data-hydrate="TierList"
      data-props={JSON.stringify({ initialGames, initialSavedTiers: savedTiers })}
      className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20"
    >
      <TierList initialGames={initialGames} initialSavedTiers={savedTiers} />
    </div>,
    { title: 'Tier List Nexus' } as any
  )
})

app.post('/save', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  const body = await c.req.parseBody()
  const appid = body['appid'] as string
  const tier = body['tier'] as string
  if (!steamId || !appid || !tier) return c.json({ success: false })
  try {
    await c.env.DB.prepare('INSERT OR REPLACE INTO tier_lists (user_id, game_appid, tier) VALUES (?, ?, ?)')
      .bind(steamId, parseInt(appid), tier)
      .run()
    return c.json({ success: true })
  } catch (e) { return c.json({ success: false }) }
})

app.post('/remove', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  const body = await c.req.parseBody()
  const appid = body['appid'] as string
  if (!steamId || !appid) return c.json({ success: false })
  try {
    await c.env.DB.prepare('DELETE FROM tier_lists WHERE user_id = ? AND game_appid = ?')
      .bind(steamId, parseInt(appid))
      .run()
    return c.json({ success: true })
  } catch (e) { return c.json({ success: false }) }
})

app.post('/reset', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.json({ success: false })
  try {
    await c.env.DB.prepare('DELETE FROM tier_lists WHERE user_id = ?')
      .bind(steamId)
      .run()
    return c.json({ success: true })
  } catch (e) { return c.json({ success: false }) }
})

export default app

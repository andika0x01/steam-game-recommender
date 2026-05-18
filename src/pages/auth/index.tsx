import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { getSteamAuthUrl, verifySteamAuth } from '../../lib/auth'
import { getPlayerSummaries } from '../../lib/steam'

const app = new Hono<{ Bindings: any }>()

app.get('/login', (c) => {
  const host = c.env.HOST_URL || new URL(c.req.url).origin
  const returnUrl = `${host}/auth/callback`
  return c.redirect(getSteamAuthUrl(returnUrl))
})

app.get('/callback', async (c) => {
  const steamId = await verifySteamAuth(c.req.url)
  if (steamId) {
    try {
      const player = await getPlayerSummaries(c.env.STEAM_API_KEY, steamId) as any
      if (player && !Array.isArray(player)) {
        await c.env.DB.prepare(
          'INSERT OR REPLACE INTO users (id, name, avatar, last_login) VALUES (?, ?, ?, CURRENT_TIMESTAMP)'
        ).bind(steamId, player.personaname, player.avatarfull).run()
      }
    } catch (e) {
      console.error('DB Error in auth callback:', e)
    }

    setCookie(c, 'steam_id', steamId, {
      path: '/',
      secure: true,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    })
    return c.redirect('/dashboard')
  }
  return c.redirect('/')
})

app.get('/logout', (c) => {
  deleteCookie(c, 'steam_id', { path: '/' })
  return c.redirect('/')
})

export default app

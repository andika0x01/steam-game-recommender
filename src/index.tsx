import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { renderer } from './renderer'

// Import Halaman (Pages)
import homeApp from './pages/home'
import authApp from './pages/auth'
import dashboardApp from './pages/dashboard'
import engineApp from './pages/engine'
import backlogApp from './pages/backlog'
import coopApp from './pages/coop'
import tierlistApp from './pages/tierlist'
import dealsApp from './pages/deals'

type Bindings = {
  STEAM_API_KEY: string
  HOST_URL: string
  ASSETS: Fetcher
  DB: D1Database
}

type Variables = {
  steamId?: string
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()

// Middleware untuk menyajikan aset statis (CSS, JS, Gambar)
const serveAssets = async (c: any, next: any) => {
  if (c.env.ASSETS) {
    try {
      const res = await c.env.ASSETS.fetch(c.req.raw)
      if (res.status !== 404) return res
    } catch (e) {
      console.error('ASSETS fetch error:', e)
    }
  }
  await next()
}

app.use('/favicon.ico', serveAssets)
app.use('/assets/*', serveAssets)
app.use('/static/*', serveAssets)
app.use('/src/*', serveAssets)

// Middleware untuk mendeteksi sesi pengguna
app.use('*', async (c, next) => {
  const steamId = getCookie(c, 'steam_id')
  c.set('steamId', steamId)
  await next()
})

app.use(renderer)

/**
 * Mounting Sub-Aplikasi per Halaman
 * Setiap halaman memiliki router dan logika algoritmanya sendiri
 * yang terisolasi di folder src/pages/[nama-halaman]
 */
app.route('/', homeApp)
app.route('/auth', authApp)
app.route('/dashboard', dashboardApp)
app.route('/engine', engineApp)
app.route('/backlog', backlogApp)
app.route('/coop', coopApp)
app.route('/tierlist', tierlistApp)
app.route('/deals', dealsApp)

export default app

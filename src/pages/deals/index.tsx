import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames } from '../../lib/steam'
import { calculateBayesianScore } from '../engine/algorithm/bayesian'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')
  
  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  const playedGames = games.filter(g => Number(g.playtime_forever) > 0)
  const ownedAppIds = new Set(games.map(g => g.appid))
  
  const cheapSharkUrl = 'https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=50&onSale=1'
  let rawDeals: any[] = []
  
  try {
    const res = await fetch(cheapSharkUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    if (res.ok) {
      const data = await res.json()
      rawDeals = Array.isArray(data) ? data : []
    }
  } catch (e) { 
    console.error('CheapShark critical error:', e) 
  }

  if (rawDeals.length === 0) {
    rawDeals = [
      { title: 'The Witcher 3: Wild Hunt', salePrice: '9.99', normalPrice: '39.99', savings: '75', steamAppID: '292030', dealID: 'mock1', thumb: '' },
      { title: 'Cyberpunk 2077', salePrice: '29.99', normalPrice: '59.99', savings: '50', steamAppID: '1091500', dealID: 'mock2', thumb: '' },
      { title: 'Hades', salePrice: '12.49', normalPrice: '24.99', savings: '50', steamAppID: '1145360', dealID: 'mock3', thumb: '' },
      { title: 'Stardew Valley', salePrice: '8.99', normalPrice: '14.99', savings: '40', steamAppID: '413150', dealID: 'mock4', thumb: '' }
    ]
  }

  let dealParams = [0.3, 0.5, 0.2]
  try {
    const user = await c.env.DB.prepare('SELECT deals_params FROM users WHERE id = ?').bind(steamId).first()
    if (user && (user as any).deals_params) {
      dealParams = JSON.parse((user as any).deals_params)
    }
  } catch (e) { console.error('DB Error fetching deals_params:', e) }

  const scoredDeals = rawDeals
    .filter((deal: any) => {
      const appId = parseInt(deal.steamAppID)
      return !isNaN(appId) && !ownedAppIds.has(appId)
    })
    .map((deal: any) => {
      const bScore = calculateBayesianScore(['Indie', 'Action', 'Adventure'], playedGames)
      const savings = (parseFloat(deal.savings) || 0) / 100
      const salePrice = parseFloat(deal.salePrice) || 0
      const priceScore = salePrice > 0 ? Math.min(1, 20 / salePrice) : 1
      const finalScore = (bScore * dealParams[0]) + (savings * dealParams[1]) + (priceScore * dealParams[2])
      
      return {
        ...deal,
        match: Math.min(0.99, 0.45 + (finalScore * 0.54))
      }
    })
    .sort((a, b) => b.match - a.match)
    .slice(0, 24)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">PSO Value Optimizer Active</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Deal <br /><span className="text-white">Hunter</span></h2>
          <p className="text-zinc-400 text-base md:text-lg">Peluang akuisisi yang dioptimasi oleh afinitas Bayesian dan bobot nilai PSO yang dinamis.</p>
        </div>
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <form method="POST" action={dealParams[0] !== 0.3 ? "/deals/reset" : "/deals/tune"} className="w-full">
            <button 
              type="submit" 
              className={`w-full md:w-auto px-10 py-4 ${dealParams[0] !== 0.3 ? 'bg-white/5 border border-white/10 text-white hover:bg-rose-500/20 hover:border-rose-500/40' : 'bg-white text-black hover:scale-105'} text-xs font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all shadow-2xl text-center`}
            >
              {dealParams[0] !== 0.3 ? 'Batalkan Optimasi' : 'Optimasi Value (PSO)'}
            </button>
          </form>
        </div>
      </div>
      {scoredDeals.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
          {scoredDeals.map((deal: any) => (
            <div key={deal.dealID} className="group space-y-3 transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[3/4] bg-zinc-900 rounded-xl md:rounded-2xl overflow-hidden relative transition-all duration-500">
                <img 
                  src={deal.steamAppID ? `https://cdn.akamai.steamstatic.com/steam/apps/${deal.steamAppID}/library_600x900.jpg` : deal.thumb} 
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                  alt={deal.title}
                  onError={(e: any) => (e.currentTarget.src = deal.thumb)}
                />
                <div className="absolute top-2 right-2 bg-white text-black px-2 py-0.5 rounded-full border border-white/10 shadow-xl z-20">
                  <p className="text-[8px] font-mono font-black">{(deal.match * 100).toFixed(0)}% Cocok</p>
                </div>
                <div className="absolute top-10 right-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-xl">
                  <p className="text-[9px] font-mono font-black">-{Math.floor(parseFloat(deal.savings))}%</p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-4">
                   <div className="text-center">
                      <p className="text-[18px] font-black text-white leading-tight">${deal.salePrice}</p>
                      <p className="text-[10px] text-zinc-400 line-through">${deal.normalPrice}</p>
                   </div>
                   <a 
                    href={`https://www.cheapshark.com/redirect?dealID=${deal.dealID}`}
                    target="_blank"
                    className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-all shadow-xl"
                  >
                    Dapatkan
                  </a>
                </div>
              </div>
              <div className="pt-1 px-1">
                 <p className="text-[9px] font-bold uppercase tracking-tighter truncate text-zinc-400 group-hover:text-white transition-colors">{deal.title}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-20 rounded-[3rem] text-center border border-dashed border-white/10">
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Tidak ada diskon terdeteksi dalam transmisi saat ini. Coba lagi nanti.</p>
        </div>
      )}
    </div>,
    { title: 'Deal Hunter' } as any
  )
})

app.post('/tune', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  const playedGames = games.filter(g => Number(g.playtime_forever) > 0)
  
  const { runPSO } = await import('./algorithm/pso')
  
  const fitnessFn = (params: number[]) => {
    const total = params.reduce((a, b) => a + b, 0) || 1
    const p = params.map(v => v / total)
    return p[0] * 0.5 + p[1] * 0.3 + p[2] * 0.2
  }

  const optimizedWeights = runPSO(fitnessFn, 3, 20, 15)
  const normalizedWeights = optimizedWeights.map(v => v / (optimizedWeights.reduce((a, b) => a + b, 0) || 1))

  try {
    await c.env.DB.prepare(`
      INSERT INTO users (id, name, avatar, deals_params) 
      VALUES (?, 'Operative', '', ?)
      ON CONFLICT(id) DO UPDATE SET deals_params = excluded.deals_params
    `)
      .bind(steamId, JSON.stringify(normalizedWeights))
      .run()
  } catch (e: any) {
    console.error(`[DB CRITICAL ERROR] Failed to upsert deals_params: ${e.message}`)
  }

  return c.redirect('/deals')
})

app.post('/reset', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')
  try {
    await c.env.DB.prepare('UPDATE users SET deals_params = NULL WHERE id = ?').bind(steamId).run()
  } catch (e) { console.error('DB Error resetting deals_params:', e) }
  return c.redirect('/deals')
})

export default app

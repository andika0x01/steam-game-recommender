import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames, getTopStoreGames } from '../../lib/steam'
import { generateEnsembleRecommendations, runGA } from './algorithm'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const error = c.req.query('error')
  
  let customParams = undefined
  try {
    const user = await c.env.DB.prepare('SELECT engine_params FROM users WHERE id = ?').bind(steamId).first()
    if (user && (user as any).engine_params) {
      customParams = JSON.parse((user as any).engine_params)
    }
  } catch (e) {
    console.error('DB Error fetching engine_params:', e)
  }

  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  const playedGames = games.filter(g => Number(g.playtime_forever) > 0)
  
  // REAL API FETCH: Discovery dari game terpopuler saat ini di Steam (via SteamSpy)
  const realStoreGames = await getTopStoreGames()

  const ownedAppIds = new Set(games.map(g => g.appid))
  const discoveryCandidates = realStoreGames.filter(g => !ownedAppIds.has(g.appid))

  const recommendations = await generateEnsembleRecommendations(playedGames, discoveryCandidates, 12)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Neural Nexus Active</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">CI Ensemble <br /><span className="text-white/20 outline-text">Discovery</span></h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Pipeline multi-agen yang memanfaatkan probabilitas Bayesian, graf kemiripan A*, dan Simulated Annealing untuk mengkurasi obsesi digital Anda berikutnya.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <form method="POST" action={customParams ? "/engine/reset" : "/engine/tune"} className="w-full">
            <button 
              type="submit" 
              className={`w-full md:w-auto px-10 py-4 ${customParams ? 'bg-white/5 border border-white/10 text-white hover:bg-rose-500/20 hover:border-rose-500/40' : 'bg-white text-black hover:scale-105'} text-xs font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all shadow-2xl text-center`}
            >
              {customParams ? 'Batalkan Optimasi' : 'Inisialisasi PSO'}
            </button>
          </form>
          {customParams && (
            <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest text-right px-2">Status Evolusi: Teroptimasi</p>
          )}
        </div>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6 md:gap-10">
          {recommendations.map((game, idx) => (
            <div key={game.appid} className="group space-y-4 animate-in fade-in zoom-in-95 duration-700" style={{ animationDelay: `${idx * 50}ms` }}>
              <div className="aspect-[3/4] bg-zinc-900 rounded-[2rem] overflow-hidden relative border border-white/5 group-hover:border-white/20 transition-all duration-500 shadow-2xl group-hover:shadow-white/5">
              <img 
                src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`}
                className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
                alt={game.name}
                onError={(e: any) => (e.currentTarget.src = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`)}
              />
                <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-full z-20">
                  <p className="text-[10px] font-mono font-black text-white">{(game.score * 100).toFixed(0)}%</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 gap-5">
                   <div className="space-y-2">
                      <h3 className="text-base font-black tracking-tight text-white leading-tight uppercase">{game.name}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {game.genres.slice(0, 2).map(g => (
                          <span key={g} className="text-[8px] font-black uppercase tracking-widest text-white/70 bg-white/10 px-2 py-1 rounded-lg backdrop-blur-md border border-white/5">
                            {g}
                          </span>
                        ))}
                      </div>
                   </div>
                   <a 
                    href={`steam://run/${game.appid}`}
                    className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-200 transition-all text-center"
                  >
                    Eksekusi
                  </a>
                </div>
              </div>
              <div className="px-2">
                 <p className="text-[10px] font-black uppercase tracking-tighter truncate text-zinc-500 group-hover:text-white transition-colors duration-500">{game.name}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-16 md:p-32 rounded-[4rem] text-center space-y-8 border-dashed border-white/10">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-zinc-600" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="space-y-3">
            <p className="text-white text-xl font-bold uppercase tracking-widest">Kekosongan Terdeteksi</p>
            <p className="text-zinc-500 font-light text-base md:text-lg max-w-md mx-auto">Mesin ensemble memerlukan densitas data interaksi yang lebih tinggi untuk menghasilkan set rekomendasi yang valid.</p>
          </div>
          <a href="/dashboard" className="inline-block px-10 py-4 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all">
            Kembali ke Komando
          </a>
        </div>
      )}
    </div>,
    { title: 'CI Ensemble Engine' } as any
  )
})

app.post('/tune', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  if (games.length < 1) return c.redirect('/engine?error=too_few_games')

  const optimizedParams = runGA(games, 20)

  try {
    await c.env.DB.prepare(`
      INSERT INTO users (id, name, avatar, engine_params) 
      VALUES (?, 'Operative', '', ?)
      ON CONFLICT(id) DO UPDATE SET engine_params = excluded.engine_params
    `)
      .bind(steamId, JSON.stringify(optimizedParams))
      .run()
  } catch (e: any) {
    console.error(`[DB CRITICAL ERROR] Failed to upsert engine_params: ${e.message}`)
  }

  return c.redirect('/engine')
})

app.post('/reset', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')
  try {
    await c.env.DB.prepare('UPDATE users SET engine_params = NULL WHERE id = ?').bind(steamId).run()
  } catch (e) { console.error('DB Error resetting engine_params:', e) }
  return c.redirect('/engine')
})

export default app

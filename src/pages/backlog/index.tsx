import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames } from '../../lib/steam'
import { calculateGenrePreferences, scoreGameRecommendation } from './algorithm'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  const routeTrigger = c.req.query('route') === 'true'
  
  // 1. Fuzzy Logic sebagai mesin RATING untuk SEMUA game koleksi
  const ratedGames = games.map(game => {
    const genres = game.genres?.map((g: any) => typeof g === 'string' ? g : g.description) || ['Indie']
    const playedGames = games.filter(g => g.playtime_forever > 0)
    const preferences = calculateGenrePreferences(playedGames)
    const fuzzyScore = scoreGameRecommendation(genres, preferences)
    
    return {
      ...game,
      fuzzyRating: 0.1 + (fuzzyScore * 0.9)
    }
  }).sort((a, b) => b.fuzzyRating - a.fuzzyRating)

  // 2. Algoritma ACO hanya berjalan jika dipicu manual via tombol
  let campaignTrail: any[] = []
  if (routeTrigger && ratedGames.length > 1) {
    const topCandidates = ratedGames.slice(0, 15)
    const nodes = topCandidates.map(g => g.appid)
    const edges: any[] = []
    
    topCandidates.forEach(g1 => {
      topCandidates.forEach(g2 => {
        if (g1.appid !== g2.appid) {
          const diff = Math.abs(g1.fuzzyRating - g2.fuzzyRating)
          edges.push({ from: g1.appid, to: g2.appid, distance: diff * 10 + 1, pheromone: 0.1 })
        }
      })
    })

    const { runACO } = await import('./algorithm/aco')
    const trailIds = runACO(nodes, edges, 20, 10)
    campaignTrail = trailIds.map(id => ratedGames.find(g => g.appid === id)).filter(Boolean)
  }

  const backlogCount = games.filter(g => g.playtime_forever < 120).length
  const wastedHours = (backlogCount * 10)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Inventory Rating Engine</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">Campaign <br /><span className="text-white/20 outline-text">Map</span></h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Sistem telah merating ke-{ratedGames.length} game koleksi Anda menggunakan Fuzzy Logic. Tekan tombol di samping untuk menyusun rute bermain menggunakan algoritma ACO.
          </p>
        </div>
        
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <a 
            href="/backlog?route=true" 
            className={`px-10 py-4 ${routeTrigger ? 'bg-emerald-500 text-black' : 'bg-white text-black'} text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl text-center`}
          >
            {routeTrigger ? 'Buat Ulang Rute (ACO)' : 'Buat Rute Campaign (ACO)'}
          </a>
          {routeTrigger && (
             <a href="/backlog" className="text-center text-[10px] font-mono text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">Bersihkan Rute</a>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 pb-4 border-b border-white/5">
          <div className="glass px-8 py-4 rounded-3xl border border-white/5 flex items-center gap-6 group hover:border-white/10 transition-all shadow-2xl">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Indikator Penyesalan</p>
                <p className="text-2xl font-black text-white group-hover:text-rose-500 transition-colors duration-500">~{wastedHours}j</p>
             </div>
          </div>
          <p className="text-zinc-500 text-xs font-mono uppercase">Waktu yang terbuang untuk {backlogCount} game yang belum diselesaikan.</p>
      </div>

      {campaignTrail.length > 0 && (
        <div className="space-y-10 glass p-8 md:p-12 rounded-[4rem] border-emerald-500/20 bg-emerald-500/[0.02] relative overflow-hidden animate-in fade-in zoom-in-95 duration-700">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          <p className="text-[11px] font-black tracking-[0.4em] uppercase text-emerald-500 relative z-10">Titik Jalan ACO (Teroptimasi)</p>
          <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center overflow-x-auto pb-6 custom-scrollbar">
            {campaignTrail.map((game, idx) => (
              <React.Fragment key={game.appid}>
                <div className="shrink-0 w-48 text-center space-y-4">
                  <div className="aspect-[3/4] bg-zinc-900 rounded-[2rem] overflow-hidden border-2 border-emerald-500/30 relative shadow-2xl">
                    <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-emerald-500 text-black px-2 py-0.5 rounded-full font-mono text-[9px] font-black">
                      #{idx + 1}
                    </div>
                  </div>
                  <p className="text-[9px] font-black uppercase truncate text-white">{game.name}</p>
                </div>
                {idx < campaignTrail.length - 1 && (
                  <div className="hidden md:block text-emerald-500/20">
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 animate-pulse" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        <div className="flex items-center justify-between px-2">
           <p className="text-[11px] font-black tracking-[0.4em] uppercase text-zinc-500">Portofolio Library Lengkap</p>
           <span className="text-[10px] font-mono text-zinc-600">Urut berdasarkan Afinitas</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-10">
          {ratedGames.map((game, idx) => (
            <div key={game.appid} className="group space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 30}ms` }}>
              <div className="aspect-[3/4] bg-zinc-900 rounded-[2rem] overflow-hidden relative border border-white/5 group-hover:border-white/20 transition-all duration-500 shadow-2xl">
                <img 
                  src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} 
                  alt={game.name}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                  onError={(e: any) => (e.currentTarget.src = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`)}
                />
                <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-full">
                  <p className="text-[10px] font-mono font-black text-white">{(game.fuzzyRating * 100).toFixed(0)}%</p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-6">
                   <a href={`steam://run/${game.appid}`} className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-all">Luncurkan</a>
                </div>
              </div>
              <div className="px-2 text-center">
                <p className="text-[10px] font-black uppercase tracking-tighter truncate text-zinc-500 group-hover:text-white transition-colors">{game.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    { title: 'Campaign Map' } as any
  )
})

export default app

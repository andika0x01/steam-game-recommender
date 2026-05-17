import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames, getPlayerSummaries, resolveVanityURL, getAppDetails } from '../../lib/steam'
import { calculateUserGenreProfile, getCoopConvergence } from './algorithm'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const friendsQuery = c.req.query('friends') || ''
  
  const resolveInputToSteamId = async (input: string) => {
    input = input.trim()
    if (!input) return null
    if (/^[0-9]{17}$/.test(input)) return input
    const profileMatch = input.match(/\/profiles\/([0-9]{17})/)
    if (profileMatch) return profileMatch[1]
    const vanityMatch = input.match(/\/id\/([^\/]+)/)
    const vanityId = vanityMatch ? vanityMatch[1] : (!input.includes('/') ? input : null)
    if (vanityId) return await resolveVanityURL(c.env.STEAM_API_KEY, vanityId)
    return null
  }

  const friendIdsResults = await Promise.all(
    friendsQuery.split(',').map(resolveInputToSteamId)
  )
  const friendIds = [steamId, ...friendIdsResults.filter((id): id is string => id !== null && id !== steamId)]
  
  // 1. Profiling Multi-Agen: Ambil genre asli untuk SETIAP member
  const groupProfiles = await Promise.all(
    friendIds.map(async (fId) => {
      const games = await getOwnedGames(c.env.STEAM_API_KEY, fId)
      const profile = await getPlayerSummaries(c.env.STEAM_API_KEY, fId)
      
      const libraryCandidates = games
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .slice(0, 50) // Ambil lebih banyak untuk cakupan library

      const enrichedLibrary = (await Promise.all(
        libraryCandidates.map(async (game) => {
          const details = await getAppDetails(c.env.KV, game.appid)
          if (details?.type !== 'game') return null
          return { ...game, genres: details?.genres?.map((g: any) => g.description) || [] }
        })
      )).filter((g): g is any => g !== null).slice(0, 30)

      return { id: fId, profile, games, profileData: calculateUserGenreProfile(enrichedLibrary) }
    })
  )

  const friendSummaries = groupProfiles.map(d => d.profile).filter(Boolean).slice(1)
  
  // 2. Filter game milik bersama (Intersection)
  let sharedGames = groupProfiles[0].games
  for (let i = 1; i < groupProfiles.length; i++) {
    const fAppIds = new Set(groupProfiles[i].games.map(g => g.appid))
    sharedGames = sharedGames.filter(g => fAppIds.has(g.appid))
  }

  // 3. Konvergensi Bayesian: Cari game yang memuaskan SEMUA profil secara kolektif
  const candidatePool = sharedGames.slice(0, 100)
  
  const enrichedSharedGames = (await Promise.all(
    candidatePool.map(async (g) => {
      const details = await getAppDetails(c.env.KV, g.appid)
      if (details?.type !== 'game') return null

      // Multiplayer Categories Filter (1: Multi-player, 9: Co-op, 36: Online PvP, 38: Online Co-op)
      const categories = details?.categories?.map((cat: any) => cat.id) || []
      const isMultiplayer = categories.some((id: number) => [1, 9, 36, 38].includes(id))
      if (!isMultiplayer) return null

      const genres = details?.genres?.map((gen: any) => gen.description) || ['Multiplayer']
      return { ...g, genres }
    })
  )).filter((g): g is any => g !== null)

  const recommendations = await getCoopConvergence(groupProfiles, enrichedSharedGames)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16">
       <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
      <aside className="w-full lg:w-96 flex flex-col gap-10 shrink-0">
        <div className="space-y-6">
           <div className="space-y-3">
              <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Convergence Engine Ready</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85]">Co-op <br /><span className="text-white/20 outline-text">Nexus</span></h2>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-[0.2em]">Analisis Minat Kolektif Multi-Agen</p>
           </div>
           <div className="glass p-6 rounded-[2.5rem] border border-white/5 bg-white/[0.01] shadow-2xl">
              <form method="get" action="/coop" className="flex flex-col gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Deploy Kredensial Agen</p>
                  <input 
                    type="text" 
                    name="friends" 
                    placeholder="SteamID atau Tautan Profil..." 
                    defaultValue={friendsQuery}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-xs font-mono shadow-inner"
                  />
                </div>
                <button type="submit" className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-[10px] shadow-xl">
                  Sinkronkan Agen
                </button>
              </form>
           </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        {friendIds.length > 1 ? (
          <div className="space-y-16">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-white/5 pb-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-6 flex-wrap">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-emerald-500 bg-emerald-500/5 px-4 py-1.5 rounded-full border border-emerald-500/10 shadow-lg animate-glow">Nexus Terjalin</p>
                    <div className="flex -space-x-4">
                      {groupProfiles.map((d, i) => d.profile && (
                        <img 
                          key={d.id} 
                          src={d.profile.avatarfull} 
                          className="w-12 h-12 rounded-2xl border-4 border-[#09090b] ring-1 ring-white/10 relative shadow-2xl hover:translate-y-[-4px] transition-transform duration-500" 
                          style={{ zIndex: groupProfiles.length - i }}
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white leading-[0.9]">
                    {sharedGames.length} Game <br /><span className="text-white/20 outline-text text-5xl md:text-7xl">Konvergensi</span>
                  </h3>
                </div>
             </header>

            <div className="space-y-10">
               <p className="text-[11px] font-black tracking-[0.5em] uppercase text-zinc-500 px-2">Rekomendasi Sesi Bermain Grup (SA Optimized)</p>
               <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8 pt-4">
                {recommendations.map((game, idx) => (
                  <div key={game.appid} className="group space-y-4 animate-in fade-in zoom-in-95 duration-700 hover:-translate-y-2" style={{ animationDelay: `${idx * 30}ms` }}>
                    <div className="aspect-[3/4] bg-zinc-900 rounded-[2rem] overflow-hidden relative transition-all duration-500 border border-white/5 group-hover:border-white/20 shadow-2xl">
                      <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} alt={game.name} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" />
                      <div className="absolute top-4 left-4 glass px-2 py-0.5 rounded-full font-mono text-[9px] font-black text-white z-20">
                        {(game.score * 100).toFixed(0)}% Group Match
                      </div>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-6">
                          <a href={`https://store.steampowered.com/app/${game.appid}`} target="_blank" className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl">Lihat</a>
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-tighter truncate text-zinc-500 group-hover:text-white transition-colors duration-500">{game.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[600px] flex items-center justify-center">
            <div className="glass p-16 md:p-24 rounded-[4rem] text-center space-y-10 max-w-xl border-dashed relative overflow-hidden group">
              <div className="relative z-10 space-y-5">
                <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">Standby <br />Operasional</h3>
                <p className="text-zinc-500 font-light text-base md:text-lg leading-relaxed">Sinkronkan minimal satu teman untuk memulai analisis konvergensi minat bermain.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>,
    { title: 'Co-op Nexus' } as any
  )
})

export default app
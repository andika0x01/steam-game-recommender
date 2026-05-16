import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames, getPlayerSummaries, resolveVanityURL, getAppDetails } from '../../lib/steam'
import { findSharedGroupRecommendations } from './algorithm'

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
  
  // 1. Ambil Profil & Library untuk SEMUA member di Nexus
  const groupData = await Promise.all(
    friendIds.map(async (fId) => {
      const games = await getOwnedGames(c.env.STEAM_API_KEY, fId)
      const profile = await getPlayerSummaries(c.env.STEAM_API_KEY, fId)
      
      // Enrichment untuk top 15 game setiap member (untuk akurasi Bayesian)
      const topPlayed = games
        .filter(g => Number(g.playtime_forever) > 0)
        .sort((a, b) => b.playtime_forever - a.playtime_forever)
        .slice(0, 15)

      const enrichedLibrary = await Promise.all(
        topPlayed.map(async (game) => {
          const details = await getAppDetails(c.env.KV, game.appid)
          return {
            ...game,
            genres: details?.genres?.map((g: any) => g.description) || []
          }
        })
      )

      return { id: fId, profile, games, enrichedLibrary }
    })
  )

  const friendSummaries = groupData.map(d => d.profile).filter(Boolean).slice(1) // skip current user
  
  // 2. Filter game milik bersama (Intersection)
  let sharedGames = groupData[0].games
  for (let i = 1; i < groupData.length; i++) {
    const fAppIds = new Set(groupData[i].games.map(g => g.appid))
    sharedGames = sharedGames.filter(g => fAppIds.has(g.appid))
  }

  const coOpTrigger = c.req.query('route') === 'true'

  // 3. Konvergensi Bayesian & SA - Menemukan game yang beneran disukai SEMUA orang
  let coOpTrail: any[] = []
  if (coOpTrigger && sharedGames.length >= 1) {
    const candidateGames = await Promise.all(
      sharedGames.slice(0, 30).map(async (g) => {
        const details = await getAppDetails(c.env.KV, g.appid)
        return {
          ...g,
          genres: details?.genres?.map((gen: any) => gen.description) || ['Multiplayer']
        }
      })
    )

    coOpTrail = findSharedGroupRecommendations(
      candidateGames,
      groupData.map(d => d.enrichedLibrary),
      12
    )
  }

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16">
       <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
      <aside className="w-full lg:w-96 flex flex-col gap-10 shrink-0">
        <div className="space-y-6">
           <div className="space-y-3">
              <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Agent Sync Ready</span>
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85]">Co-op <br /><span className="text-white/20 outline-text">Nexus</span></h2>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-[0.2em]">Konvergensi Inteligensi Multi-Agen</p>
           </div>
           <div className="glass p-6 rounded-[2.5rem] border border-white/5 bg-white/[0.01] shadow-2xl">
              <form method="get" action="/coop" className="flex flex-col gap-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Deploy Kredensial</p>
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
                      {groupData.map((d, i) => d.profile && (
                        <img 
                          key={d.id} 
                          src={d.profile.avatarfull} 
                          className="w-12 h-12 rounded-2xl border-4 border-[#09090b] ring-1 ring-white/10 relative shadow-2xl hover:translate-y-[-4px] transition-transform duration-500" 
                          style={{ zIndex: groupData.length - i }}
                          title={d.profile.personaname} 
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white leading-[0.9]">
                    {sharedGames.length} Aset Taktis <br /><span className="text-white/20 outline-text text-5xl md:text-7xl">Konvergensi</span>
                  </h3>
                </div>
                <div className="flex flex-col gap-4 w-full md:w-auto">
                   <a 
                    href={`/coop?friends=${friendsQuery}&route=true`}
                    className={`px-10 py-4 ${coOpTrigger ? 'bg-emerald-500 text-black' : 'bg-white text-black'} text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl text-center`}
                  >
                    {coOpTrigger ? 'Evolusi Nexus (SA)' : 'Buat Map Nexus (SA)'}
                  </a>
                </div>
             </header>

            {coOpTrail.length > 0 && (
              <div className="space-y-10 glass p-10 md:p-12 rounded-[3.5rem] border-emerald-500/10 bg-emerald-500/[0.02] relative overflow-hidden group animate-in fade-in zoom-in-95 duration-700">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-emerald-500/10" />
                <div className="flex items-center justify-between relative z-10">
                   <p className="text-[11px] font-black tracking-[0.4em] uppercase text-emerald-500/80">Analisis Konvergensi SA Optimized</p>
                   <div className="h-px flex-1 mx-8 bg-emerald-500/10 hidden md:block" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center overflow-x-auto pb-6 custom-scrollbar">
                  {coOpTrail.map((node, idx) => (
                    <React.Fragment key={node.appid}>
                      <div className="shrink-0 w-44 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationDelay: `${idx * 150}ms` }}>
                         <div className="aspect-[3/4] bg-zinc-900 rounded-[2rem] overflow-hidden border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.5)] group relative">
                            <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${node.appid}/library_600x900.jpg`} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="absolute top-4 left-4 glass px-2 py-0.5 rounded-full font-mono text-[9px] font-black text-white">
                              {(node.score * 100).toFixed(0)}%
                            </div>
                         </div>
                         <p className="text-[10px] font-black uppercase tracking-widest truncate text-zinc-400 group-hover:text-emerald-500 transition-colors duration-500">{node.name}</p>
                      </div>
                      {idx < coOpTrail.length - 1 && (
                        <div className="text-emerald-500/20 shrink-0 hidden md:block">
                          <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 animate-pulse" stroke="currentColor" strokeWidth="4">
                            <path d="M5 12h14" strokeLinecap="round" />
                          </svg>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8 pt-4">
              {sharedGames.map((game, idx) => (
                <div key={game.appid} className="group space-y-4 animate-in fade-in zoom-in-95 duration-700 hover:-translate-y-2" style={{ animationDelay: `${idx * 30}ms` }}>
                  <div className="aspect-[3/4] bg-zinc-900 rounded-[2rem] overflow-hidden relative transition-all duration-500 border border-white/5 group-hover:border-white/20 shadow-2xl">
                     <img 
                      src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} 
                      alt={game.name}
                      className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                      onError={(e: any) => (e.currentTarget.src = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`)}
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-6">
                        <a 
                          href={`https://store.steampowered.com/app/${game.appid}`}
                          target="_blank"
                          className="px-4 py-1.5 bg-white text-black text-[8px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-all shadow-xl"
                        >
                          Lihat Game
                        </a>
                     </div>
                  </div>
                  <div className="px-2">
                    <p className="text-[10px] font-black uppercase tracking-tighter truncate text-zinc-500 group-hover:text-white transition-colors duration-500">{game.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[600px] flex items-center justify-center">
            <div className="glass p-16 md:p-24 rounded-[4rem] text-center space-y-10 max-w-xl border-dashed relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/[0.01] animate-pulse" />
              <div className="relative z-10 w-28 h-28 mx-auto">
                 <div className="absolute inset-0 bg-white/5 rounded-full animate-ping opacity-20 scale-150" />
                 <div className="relative w-full h-full bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-2xl">
                    <svg viewBox="0 0 24 24" fill="none" className="w-12 h-12 text-zinc-600 group-hover:text-zinc-400 transition-colors duration-700" stroke="currentColor" strokeWidth="1">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                 </div>
              </div>
              <div className="relative z-10 space-y-5">
                <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">Standby <br />Operasional</h3>
                <p className="text-zinc-500 font-light text-base md:text-lg leading-relaxed">Mesin konvergensi sedang menganggur. Deploy kredensial agen untuk memulai analisis sinkron terhadap aset taktis milik bersama.</p>
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

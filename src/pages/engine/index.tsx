import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames, getDiscoveryCandidates, getAppDetails } from '../../lib/steam'
import { calculateUserGenreProfile, getSmartRecommendations } from './algorithm'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  
  // 1. Profiling: Analisis genre mendalam dari library yang sudah dimainkan
  const playedGames = games
    .filter(g => Number(g.playtime_forever) > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 40)

  const enrichedLibrary = await Promise.all(
    playedGames.map(async (game) => {
      const details = await getAppDetails(c.env.KV, game.appid)
      return { ...game, genres: details?.genres?.map((g: any) => g.description) || [] }
    })
  )

  const userProfile = calculateUserGenreProfile(enrichedLibrary)
  const top3Genres = userProfile.slice(0, 3).map(p => p.genre)

  // 2. Genre Stacking: Fetch ~300 target candidates berdasarkan top 3 genre user
  const rawCandidates = await getDiscoveryCandidates(top3Genres)
  const ownedAppIds = new Set(games.map(g => g.appid))
  
  // Filter & Ambil 60 kandidat untuk di-enrich (KV Cache akan sangat membantu di sini)
  const discoveryCandidates = rawCandidates.filter(g => !ownedAppIds.has(g.appid)).slice(0, 60)

  const enrichedCandidates = await Promise.all(
    discoveryCandidates.map(async (game) => {
      const details = await getAppDetails(c.env.KV, game.appid)
      return { ...game, genres: details?.genres?.map((g: any) => g.description) || ['Indie'] }
    })
  )

  // 3. Smart Recommendations: Bayesian + SA
  const recommendations = await getSmartRecommendations(enrichedLibrary, enrichedCandidates, 12)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Deep Preference Intelligence Active</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">Personal <br /><span className="text-white/20 outline-text">Discovery</span></h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Menembus batas algoritma populer. Mesin ini mempelajari sidik jari genre Anda ({top3Genres.join(', ')}) untuk menyusun set penemuan yang beneran personal.
          </p>
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
                  <p className="text-[10px] font-mono font-black text-white">{(game.score * 100).toFixed(0)}% Match</p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 gap-5">
                   <div className="space-y-2">
                      <h3 className="text-sm font-black tracking-tight text-white leading-tight uppercase truncate">{game.name}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {game.genres.slice(0, 2).map(g => (
                          <span key={g} className="text-[8px] font-black uppercase tracking-widest text-white/70 bg-white/10 px-2 py-1 rounded-lg border border-white/5">
                            {g}
                          </span>
                        ))}
                      </div>
                   </div>
                   <a href={`https://store.steampowered.com/app/${game.appid}`} target="_blank" className="w-full py-3 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-200 transition-all text-center shadow-xl">Lihat Game</a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-16 md:p-32 rounded-[4rem] text-center space-y-8 border-dashed border-white/10">
          <p className="text-zinc-500 font-light text-base md:text-lg max-w-md mx-auto">Menganalisa library dan melakukan crawling kandidat yang presisi...</p>
        </div>
      )}
    </div>,
    { title: 'Discovery Engine' } as any
  )
})

export default app

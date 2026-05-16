import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames, getAppDetails } from '../../lib/steam'
import { calculateUserGenreProfile, calculateBayesianPreferenceScore } from '../engine/algorithm'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  
  // 1. Data Enrichment: Profiling mendalam
  const topPlayed = games
    .filter(g => Number(g.playtime_forever) > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 30)

  const enrichedPlayed = await Promise.all(
    topPlayed.map(async (game) => {
      const details = await getAppDetails(c.env.KV, game.appid)
      return { ...game, genres: details?.genres?.map((g: any) => g.description) || [] }
    })
  )

  const userProfile = calculateUserGenreProfile(enrichedPlayed)

  // 2. Bayesian Scoring untuk Backlog (Playtime < 2 Jam)
  const backlogCandidates = games.filter(g => g.playtime_forever < 120).slice(0, 50)

  const ratedBacklog = await Promise.all(
    backlogCandidates.map(async (game) => {
      const details = await getAppDetails(c.env.KV, game.appid)
      const genres = details?.genres?.map((g: any) => g.description) || ['Indie']
      const score = calculateBayesianPreferenceScore(genres, userProfile)
      return { ...game, genres, personalMatch: score }
    })
  )

  const sortedBacklog = ratedBacklog.sort((a, b) => b.personalMatch - a.personalMatch)
  const topRecommendation = sortedBacklog[0]

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Inventory Priority Engine</span>
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">Backlog <br /><span className="text-white/20 outline-text">Priority</span></h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Berhenti bingung memilih game. Kami telah merating {ratedBacklog.length} game backlog Anda menggunakan Bayesian Inference untuk menemukan apa yang harus Anda mainkan berikutnya.
          </p>
        </div>
      </div>

      {topRecommendation && (
        <div className="glass p-10 md:p-16 rounded-[4rem] border-indigo-500/20 bg-indigo-500/[0.02] relative overflow-hidden group animate-in fade-in zoom-in-95 duration-1000">
           <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
           <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
              <div className="w-64 md:w-80 shrink-0 aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/5 group-hover:border-indigo-500/20 transition-all duration-700">
                <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${topRecommendation.appid}/library_600x900.jpg`} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              </div>
              <div className="space-y-8 flex-1 text-center md:text-left">
                 <div className="space-y-2">
                    <p className="text-indigo-500 font-black uppercase tracking-[0.4em] text-xs">Rekomendasi Utama</p>
                    <h3 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none">{topRecommendation.name}</h3>
                 </div>
                 <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {topRecommendation.genres.map(g => (
                      <span key={g} className="px-5 py-2 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400">{g}</span>
                    ))}
                 </div>
                 <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="px-8 py-4 bg-indigo-600 text-white rounded-3xl font-black text-xl shadow-2xl shadow-indigo-500/20">
                       {(topRecommendation.personalMatch * 100).toFixed(0)}% Match
                    </div>
                    <a href={`https://store.steampowered.com/app/${topRecommendation.appid}`} target="_blank" className="px-10 py-5 bg-white text-black rounded-3xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl">Eksekusi Game</a>
                 </div>
              </div>
           </div>
        </div>
      )}

      <div className="space-y-10">
        <p className="text-[11px] font-black tracking-[0.5em] uppercase text-zinc-500 px-2 text-center md:text-left">Antrean Prioritas Berdasarkan Afinitas</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-10">
          {sortedBacklog.slice(1).map((game, idx) => (
            <div key={game.appid} className="group space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
              <div className="aspect-[3/4] bg-zinc-900 rounded-[2rem] overflow-hidden relative border border-white/5 group-hover:border-white/20 transition-all duration-500 shadow-2xl">
                <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110" />
                <div className="absolute top-4 right-4 glass px-3 py-1.5 rounded-full">
                  <p className="text-[10px] font-mono font-black text-white">{(game.personalMatch * 100).toFixed(0)}%</p>
                </div>
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-6">
                   <a href={`https://store.steampowered.com/app/${game.appid}`} target="_blank" className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-xl">Lihat</a>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-tighter truncate text-zinc-500 text-center">{game.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>,
    { title: 'Backlog Priority' } as any
  )
})

export default app

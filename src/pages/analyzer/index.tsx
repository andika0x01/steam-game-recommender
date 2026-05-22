import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import React from 'react'
import { SteamAPI } from '../../lib/steam'
import { FuzzyOwnGamesScorer } from '../../lib/fuzzy-own-games-scorer'
import { GameCard } from '../../components/GameCard'
import { buildUserProfile } from '../../lib/simple-recommendation'

const app = new Hono<{ Bindings: any, Variables: any }>()

/**
 * Halaman Library Analysis (Analyzer)
 * 
 * Melakukan analisis mendalam terhadap seluruh koleksi game yang dimiliki pengguna.
 * Setiap game dinilai menggunakan logika fuzzy untuk menentukan skor preferensi
 * berdasarkan perilaku bermain pengguna.
 */
app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  const games = await steamAPI.getOwnedGames(steamId)

  const scorer = new FuzzyOwnGamesScorer(games)

  const analyzedGames = games.map(game => ({
    ...game,
    personalMatch: scorer.getGameScore(game.appid)
  })).sort((a, b) => b.personalMatch - a.personalMatch)

  const userProfile = await buildUserProfile(steamAPI, games, steamId)
  
  const topTags = Object.entries(userProfile.tagWeights)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 12)
    
  const topPublishers = Object.entries(userProfile.publisherScores)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 8)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6 max-w-3xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Library Analysis Active</span>
            </div>
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">Library <br /><span className="text-white/20 outline-text">Analysis</span></h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Menganalisis seluruh library Anda ({analyzedGames.length} game) menggunakan Fuzzy Logic untuk membedah skor preferensi setiap judul.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Tags */}
        <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
          <h3 className="text-lg font-black tracking-widest uppercase text-white/80 border-b border-white/10 pb-4">Top 12 Preferred Tags</h3>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, score]) => {
              const displayScore = (score as number).toFixed(1);
              return (
                <div key={tag} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors border border-white/10 px-3 py-2 rounded-xl">
                  <span className="text-sm font-bold text-white/90">{tag}</span>
                  <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-md">{displayScore}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Publishers */}
        <div className="glass p-6 md:p-8 rounded-3xl border border-white/5 space-y-6">
          <h3 className="text-lg font-black tracking-widest uppercase text-white/80 border-b border-white/10 pb-4">Top 8 Affinity Publishers</h3>
          <div className="flex flex-col gap-3">
            {topPublishers.map(([pub, score]) => {
              const percentage = Math.round((score as number) * 100);
              return (
                <div key={pub} className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                  <span className="text-sm font-bold text-white/90 truncate max-w-[70%]">{pub}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-black/50 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-600 to-amber-400 rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="text-xs font-mono text-zinc-400 w-8 text-right">{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-10">
        <p className="text-[11px] font-black tracking-[0.5em] uppercase text-zinc-500 px-2 text-center md:text-left">Distribusi Skor Preferensi Library</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6 md:gap-10">
          {analyzedGames.map((game, idx) => (
            <GameCard 
              key={game.appid}
              appId={game.appid}
              name={game.name || 'Unknown'}
              score={game.personalMatch}
            />
          ))}
        </div>
      </div>
    </div>,
    { title: 'Library Analysis' } as any
  )
})

export default app

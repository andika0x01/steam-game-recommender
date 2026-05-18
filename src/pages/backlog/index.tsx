import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import React from 'react'
import { SteamAPI } from '../../lib/steam'
import { FuzzyBayesianScorer } from '../../lib/fuzzy-bayesian'
import { PureFuzzyScorer } from '../../lib/pure-fuzzy'
import { GameCard } from '../../components/GameCard'
import { ScoringToggle } from '../../components/ScoringToggle'

const app = new Hono<{ Bindings: any, Variables: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  const scoringMode = c.var.scoringMode || 'fuzzy'
  if (!steamId) return c.redirect('/')

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  const games = await steamAPI.getOwnedGames(steamId)

  // Ambil review data untuk pembobotan (hanya untuk sample games agar performa terjaga)
  // Kita ambil top played games untuk prioritas review data
  const sampleGames = games.sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, 30)

  const reviewPromises = sampleGames.map(async (g) => {
    const reviews = await steamAPI.getAppReviews(g.appid)
    return { appid: g.appid, reviews }
  })

  const reviewData = await Promise.all(reviewPromises)
  const reviewsRecord: Record<number, number> = {}
  reviewData.forEach(({ appid, reviews }) => {
    if (reviews) {
      reviewsRecord[appid] = reviews.total_positive / (reviews.total_reviews || 1)
    }
  })

  const scorer = scoringMode === 'bayesian' 
    ? new FuzzyBayesianScorer(games, reviewsRecord)
    : new PureFuzzyScorer(games, reviewsRecord)

  const analyzedGames = games.map(game => ({
    ...game,
    personalMatch: scorer.getGameScore(game.appid)
  })).sort((a, b) => b.personalMatch - a.personalMatch)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6 max-w-3xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Library Analysis Active</span>
            </div>
            <ScoringToggle scoringMode={scoringMode} />
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">Library <br /><span className="text-white/20 outline-text">Analysis</span></h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Menganalisis seluruh library Anda ({analyzedGames.length} game) menggunakan {scoringMode === 'bayesian' ? 'Bayesian Inference' : 'Fuzzy Logic'} untuk membedah skor preferensi setiap judul.
          </p>
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

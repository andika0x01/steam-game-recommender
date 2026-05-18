import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import React from 'react'
import { SteamAPI } from '../../lib/steam'
import { FuzzyBayesianScorer } from '../../lib/fuzzy-bayesian'
import { PureFuzzyScorer } from '../../lib/pure-fuzzy'
import { getRecommendedGames, ScoredGame } from '../../lib/recommendation-system'
import { GameCard } from '../../components/GameCard'
import { ScoringToggle } from '../../components/ScoringToggle'

const app = new Hono<{ Bindings: any, Variables: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  const scoringMode = c.var.scoringMode || 'fuzzy'
  
  if (!steamId) return c.redirect('/')

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  const games = await steamAPI.getOwnedGames(steamId)

  // 1. Ambil Top Games untuk membangun profil minat
  const topPlayed = games
    .filter(g => g.playtime_forever > 0)
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 15)

  // 2. Ambil detail AppDetails & Review untuk scoring dan ekstraksi tag
  const gameDataPromises = topPlayed.map(async (g) => {
    const [details, reviews] = await Promise.all([
      steamAPI.getAppStoreDetails(g.appid),
      steamAPI.getAppReviews(g.appid)
    ])
    return { appid: g.appid, details, reviews }
  })

  const gameData = await Promise.all(gameDataPromises)
  
  const reviewsRecord: Record<number, number> = {}
  const scoredGames: ScoredGame[] = []
  const allTags = new Set<string>()

  gameData.forEach(({ appid, details, reviews }) => {
    if (reviews) {
      reviewsRecord[appid] = reviews.total_positive / (reviews.total_reviews || 1)
    }
    
    // Ekstrak tag dari genres & categories (Steam Storefront API)
    const tags: string[] = []
    if (details) {
      details.genres?.forEach((g: any) => tags.push(g.description))
      details.categories?.forEach((c: any) => tags.push(c.description))
    }
    tags.forEach(t => allTags.add(t))

    // Hitung skor internal untuk pembobotan tag
    const scorer = scoringMode === 'bayesian' 
      ? new FuzzyBayesianScorer(topPlayed, reviewsRecord)
      : new PureFuzzyScorer(topPlayed, reviewsRecord)
    
    scoredGames.push({
      appId: appid,
      score: scorer.getGameScore(appid),
      tags: tags
    })
  })

  const top3Genres = Array.from(allTags).slice(0, 3)

  // 3. Jalankan Engine Rekomendasi (MMR)
  const recommendations = await getRecommendedGames(steamAPI, scoredGames, 12, 0.7)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6 max-w-3xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                {scoringMode === 'bayesian' ? 'Deep Bayesian Intelligence Active' : 'Fuzzy Logic Preference Active'}
              </span>
            </div>
            <div data-hydrate="ScoringToggle" data-props={JSON.stringify({ scoringMode })}>
              <ScoringToggle scoringMode={scoringMode} />
            </div>
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">Personal <br /><span className="text-white/20 outline-text">Discovery</span></h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Menembus batas algoritma populer. Mesin ini mempelajari sidik jari minat Anda {top3Genres.length > 0 && `(seperti ${top3Genres.join(', ')})`} untuk menyusun set penemuan yang beneran personal.
          </p>
        </div>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6 md:gap-10">
          {recommendations.map((game, idx) => (
            <GameCard 
              key={game.appId}
              appId={game.appId}
              name={game.name}
              score={game.score}
              tags={game.tags}
              hideScore={true}
            />
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

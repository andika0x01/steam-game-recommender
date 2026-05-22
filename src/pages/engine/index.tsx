import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import React from 'react'
import { SteamAPI } from '../../lib/steam'
import { getSimpleRecommendations } from '../../lib/simple-recommendation'
import { InfiniteGrid } from '../../components/InfiniteGrid'

const app = new Hono<{ Bindings: any, Variables: any }>()

/**
 * Halaman Discovery Engine
 * 
 * Fitur utama untuk menemukan game baru yang sangat personal.
 * Menggunakan algoritma proporsional tag yang menganalisis sidik jari
 * minat pengguna dari library mereka untuk mencari kandidat yang paling relevan.
 * Mendukung pemuatan data berkelanjutan (Infinite Scrolling).
 */
app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  const games = await steamAPI.getOwnedGames(steamId)

  const recommendations = await getSimpleRecommendations(steamAPI, games, 12)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-20">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-6 max-w-3xl">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                Fuzzy Discovery Engine Active
              </span>
            </div>
          </div>
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">Personal <br /><span className="text-white/20 outline-text">Discovery</span></h2>
          <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-2xl">
            Menembus batas algoritma populer. Mesin ini mempelajari sidik jari minat Anda untuk menyusun set penemuan yang beneran personal.
          </p>
        </div>
      </div>

      {recommendations.length > 0 ? (
        <div data-hydrate="InfiniteGrid" data-props={JSON.stringify({ initialItems: recommendations, endpoint: '/api/recommendations', type: 'game' })}>
          <InfiniteGrid initialItems={recommendations} endpoint="/api/recommendations" type="game" />
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

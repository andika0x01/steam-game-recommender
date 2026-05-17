import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames, getAppDetails, getSteamSpyDetails } from '../../lib/steam'
import { getDealRecommendations } from './algorithm'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  // Currency Conversion: Fetch rate from Wise API or KV
  let idrRate = 16000 // Fallback
  try {
    const cachedRate = await c.env.KV.get('usd_to_idr_rate')
    if (cachedRate) {
      idrRate = parseFloat(cachedRate)
    } else {
      const rateRes = await fetch('https://api.wise.com/v1/rates?source=USD&target=IDR', {
        headers: { 'Authorization': `Bearer ${c.env.WISE_API_KEY}` }
      })
      if (rateRes.ok) {
        const rates = await rateRes.json() as any[]
        if (rates.length > 0 && rates[0].rate) {
          idrRate = rates[0].rate
          await c.env.KV.put('usd_to_idr_rate', idrRate.toString(), { expirationTtl: 86400 })
        }
      }
    }
  } catch (e) {
    console.error('Wise API error:', e)
  }

  const formatIDR = (price: string | number) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price
    const converted = numericPrice * idrRate
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(converted)
  }
  
  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  
  // 1. Profiling: Ambil genre asli dari seluruh library
  const libraryCandidates = games
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 60) // Ambil lebih banyak untuk kompensasi filter non-game

  const enrichedLibrary = (await Promise.all(
    libraryCandidates.map(async (game) => {
      const [details, spyDetails] = await Promise.all([
        getAppDetails(c.env.KV, game.appid),
        getSteamSpyDetails(c.env.KV, game.appid)
      ])
      if (details?.type !== 'game') return null
      return { 
        ...game, 
        genres: details?.genres?.map((g: any) => g.description) || [],
        tags: spyDetails?.tags || {}
      }
    })
  )).filter((g): g is any => g !== null).slice(0, 40)
  
  const ownedAppIds = new Set(games.map(g => g.appid))
  
  // 2. Fetch Candidates: Ambil 3 halaman CheapShark (180 deals) untuk pool yang luas
  const pages = [0, 1, 2]
  let rawDeals: any[] = []
  
  try {
    const results = await Promise.all(pages.map(p => 
      fetch(`https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=50&onSale=1&pageNumber=${p}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(res => res.json())
    ))
    
    const uniqueDeals: Record<number, any> = {}
    results.flat().forEach((deal: any) => {
      const appId = parseInt(deal.steamAppID)
      if (!isNaN(appId) && !ownedAppIds.has(appId)) {
        // Simpan deal dengan diskon tertinggi jika ada duplikat AppID
        if (!uniqueDeals[appId] || parseFloat(deal.savings) > parseFloat(uniqueDeals[appId].savings)) {
          uniqueDeals[appId] = deal
        }
      }
    })
    rawDeals = Object.values(uniqueDeals)
  } catch (e) { 
    console.error('CheapShark fetch error:', e) 
  }

  // 3. Enrichment & Scoring: Proses 50 kandidat terbaik secara mendalam
  const candidateDeals = rawDeals.slice(0, 50)

  const enrichedDeals = (await Promise.all(
    candidateDeals.map(async (deal) => {
      const appId = parseInt(deal.steamAppID)
      const [details, spyDetails] = await Promise.all([
        getAppDetails(c.env.KV, appId),
        getSteamSpyDetails(c.env.KV, appId)
      ])
      
      // Absolute Software Filter: Check Type and official Software Genre IDs
      const type = details?.type
      const genres = details?.genres || []
      const genreIds = genres.map((g: any) => parseInt(g.id))
      
      // Blacklisted IDs: 51, 53, 55, 57, 58, 60
      const isSoftware = genreIds.some((id: number) => [51, 53, 55, 57, 58, 60].includes(id))
      const isGame = type === 'game'

      if (!isGame || isSoftware) return null
      
      const genreNames = genres.map((g: any) => g.description)
      return { 
        ...deal, 
        appid: appId, 
        name: deal.title, 
        genres: genreNames.length > 0 ? genreNames : ['Indie'],
        tags: spyDetails?.tags || {},
        positive: spyDetails?.positive || 0,
        negative: spyDetails?.negative || 0,
        release_date: details?.release_date || ""
      }
    })
  )).filter((d): d is any => d !== null)

  const recommendations = await getDealRecommendations(enrichedLibrary, enrichedDeals)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Value Intelligence Active</span>
            <div className="w-[1px] h-3 bg-white/10 mx-1" />
            <span className="text-[10px] font-mono font-bold text-emerald-500">1 USD = {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(idrRate)}</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Deal <br /><span className="text-white">Hunter</span></h2>
          <p className="text-zinc-400 text-base md:text-lg">Berburu diskon dengan presisi Bayesian. Kami menyaring ratusan penawaran untuk menemukan titik temu antara selera Anda dan efisiensi ekonomi.</p>
        </div>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
          {recommendations.map((deal: any) => {
             const originalDeal = rawDeals.find(d => parseInt(d.steamAppID) === deal.appid)
             return (
              <div key={deal.appid} className="group space-y-3 transition-all duration-500 hover:-translate-y-2">
                <div className="aspect-[3/4] bg-zinc-900 rounded-xl md:rounded-2xl overflow-hidden relative transition-all duration-500 shadow-2xl">
                  <img 
                    src={`https://cdn.akamai.steamstatic.com/steam/apps/${deal.appid}/library_600x900.jpg`} 
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                    alt={deal.name}
                  />
                  <div className="absolute top-2 right-2 bg-white text-black px-2 py-0.5 rounded-full border border-white/10 shadow-xl z-20">
                    <p className="text-[8px] font-mono font-black">{(deal.score * 100).toFixed(0)}% Match</p>
                  </div>
                  {originalDeal && (
                    <div className="absolute top-10 right-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-xl">
                      <p className="text-[9px] font-mono font-black">-{Math.floor(parseFloat(originalDeal.savings))}%</p>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-4">
                    {originalDeal && (
                      <div className="text-center">
                          <p className="text-[12px] font-black text-white leading-tight">{formatIDR(originalDeal.salePrice)}</p>
                          <p className="text-[8px] text-zinc-400 line-through">{formatIDR(originalDeal.normalPrice)}</p>
                      </div>
                    )}
                    <a href={`https://www.cheapshark.com/redirect?dealID=${originalDeal?.dealID}`} target="_blank" className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-all shadow-xl">Dapatkan</a>
                  </div>
                </div>
                <p className="text-[9px] font-bold uppercase tracking-tighter truncate text-zinc-400 group-hover:text-white transition-colors">{deal.name}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="glass p-20 rounded-[3rem] text-center border border-dashed border-white/10">
          <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Menganalisa frekuensi diskon untuk presisi belanja maksimal...</p>
        </div>
      )}
    </div>,
    { title: 'Deal Hunter' } as any
  )
})

export default app
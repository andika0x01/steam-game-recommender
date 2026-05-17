import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames, getAppDetails, getSteamSpyDetails } from '../../lib/steam'
import { getDealRecommendations } from './algorithm'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const budgetQuery = c.req.query('budget')
  const budgetIDR = budgetQuery ? parseInt(budgetQuery) : 0

  let idrRate = 16000 
  try {
    const cachedRate = await c.env.KV.get('usd_to_idr_rate')
    if (cachedRate) {
      idrRate = parseFloat(cachedRate)
    } else {
      const rateRes = await fetch('https://api.wise.com/v1/rates?source=USD&target=IDR', {
        headers: { 'Authorization': `Bearer ${c.env.WISE_API_TOKEN}` }
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

  const budgetUSD = budgetIDR > 0 ? budgetIDR / idrRate : undefined

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
  
  const libraryCandidates = games
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 60) 

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
  
  // 2. Fetch Candidates: Massive expansion (20 pages = 1,200 deals)
  const pages = Array.from({ length: 20 }, (_, i) => i)
  let rawDeals: any[] = []
  
  try {
    const results = await Promise.all(pages.map(p => 
      fetch(`https://www.cheapshark.com/api/1.0/deals?storeID=1&pageNumber=${p}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      }).then(res => res.json())
    ))
    
    const uniqueDeals: Record<number, any> = {}
    results.flat().forEach((deal: any) => {
      if (!deal || !deal.steamAppID) return
      const appId = parseInt(deal.steamAppID)
      if (!isNaN(appId) && !ownedAppIds.has(appId)) {
        if (!uniqueDeals[appId] || parseFloat(deal.savings) > parseFloat(uniqueDeals[appId].savings)) {
          uniqueDeals[appId] = deal
        }
      }
    })
    rawDeals = Object.values(uniqueDeals)
  } catch (e) { 
    console.error('CheapShark fetch error:', e) 
  }

  // 3. Enrichment & Scoring: Radical Pool (500)
  const topExpensive = [...rawDeals].sort((a, b) => parseFloat(b.salePrice || "0") - parseFloat(a.salePrice || "0")).slice(0, 300)
  const topRated = [...rawDeals].sort((a, b) => parseFloat(b.dealRating) - parseFloat(a.dealRating)).slice(0, 300) 
  const uniqueCandidates = new Map()
  topExpensive.forEach(d => uniqueCandidates.set(d.steamAppID, d))
  topRated.forEach(d => uniqueCandidates.set(d.steamAppID, d))
  const candidateDeals = Array.from(uniqueCandidates.values()).slice(0, 500)
  
  const enrichedDeals = (await Promise.all(
    candidateDeals.map(async (deal) => {
      const appId = parseInt(deal.steamAppID)
      const [details, spyDetails] = await Promise.all([
        getAppDetails(c.env.KV, appId),
        getSteamSpyDetails(c.env.KV, appId)
      ])
      
      const type = details?.type
      const genreIds = (details?.genres || []).map((g: any) => parseInt(g.id))
      const isSoftware = genreIds.some((id: number) => [51, 53, 55, 57, 58, 60].includes(id))
      
      // Removed strict server-side HEAD asset check to prevent pool depletion
      if (type !== 'game' || isSoftware) return null
      
      const genreNames = (details?.genres || []).map((g: any) => g.description)
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

  // Dynamic recommendations count: For big budgets, we need more slots
  const recommendationsCount = budgetUSD && budgetUSD > 500 ? 100 : (budgetUSD ? 50 : 60)
  let recommendations = await getDealRecommendations(enrichedLibrary, enrichedDeals, recommendationsCount, budgetUSD)

  // Greedy Fill Pass: If we have budget left, fill it aggressively
  if (budgetUSD && budgetUSD > 0) {
    let currentCost = recommendations.reduce((sum, r) => sum + parseFloat(r.salePrice || "0"), 0)
    const selectedIds = new Set(recommendations.map(r => r.appid))
    const sortedRemaining = enrichedDeals
        .filter(d => !selectedIds.has(d.appid))
        .sort((a, b) => parseFloat(b.salePrice) - parseFloat(a.salePrice))

    for (const item of sortedRemaining) {
        const itemCost = parseFloat(item.salePrice)
        if (currentCost + itemCost <= budgetUSD && recommendations.length < 150) {
            recommendations.push(item)
            currentCost += itemCost
        }
    }
  }

  const totalCostUSD = recommendations.reduce((sum: number, r: any) => sum + parseFloat(r.salePrice || "0"), 0)
  const totalCostIDR = totalCostUSD * idrRate
  const remainingIDR = budgetIDR > 0 ? Math.max(0, budgetIDR - totalCostIDR) : 0
  const basketItems = budgetUSD ? recommendations : []
  
  const discoveryCount = 60
  const scoredPool = await getDealRecommendations(enrichedLibrary, enrichedDeals, 200, undefined)
  let discoveryItems = scoredPool.filter(p => !basketItems.find(b => b.appid === p.appid)).slice(0, discoveryCount)

  // Ultimate Discovery Guard: Always show 60 items
  if (discoveryItems.length < 30) {
    const basketIds = new Set(basketItems.map(b => b.appid))
    const seenIds = new Set(discoveryItems.map(d => d.appid))
    const extra = rawDeals
        .filter(d => !basketIds.has(parseInt(d.steamAppID)) && !seenIds.has(parseInt(d.steamAppID)))
        .slice(0, 60)
        .map(d => ({ ...d, appid: parseInt(d.steamAppID), name: d.title, score: 0.5 }))
    discoveryItems = [...discoveryItems, ...extra].slice(0, discoveryCount)
  }

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-16 md:space-y-24">
      <div id="global-loader" className="hidden fixed top-0 left-0 w-screen h-screen z-[99999] flex items-center justify-center bg-[#050505]">
        <div className="flex flex-col items-center gap-10 p-12 text-center">
            <div className="relative">
                <div className="w-48 h-48 border-4 border-emerald-500/5 rounded-full animate-[spin_5s_linear_infinite]" />
                <div className="absolute inset-0 w-48 h-48 border-t-4 border-emerald-500 rounded-full animate-spin" />
                <div className="absolute inset-6 bg-emerald-500/5 rounded-full animate-pulse flex items-center justify-center">
                   <div className="w-20 h-16 bg-emerald-500 rounded-full blur-3xl opacity-30" />
                </div>
            </div>
            <div className="space-y-8 flex flex-col items-center">
                <div className="space-y-3 flex flex-col items-center text-center">
                  <h2 className="text-5xl font-black text-white uppercase tracking-tighter italic leading-none">Optimizing Basket</h2>
                  <p className="text-emerald-500 font-mono text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse">Neural Value Analysis Active</p>
                </div>
                <div className="w-72 h-1 bg-white/5 rounded-full overflow-hidden mx-auto border border-white/5">
                    <div className="h-full bg-emerald-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '30%' }} />
                </div>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] max-w-[340px] leading-relaxed opacity-60 text-center mx-auto">
                  Memverifikasi integritas aset Steam & mencocokkan profil bermain Anda dengan 720 penawaran pasar...
                </p>
            </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes loading {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(350%); }
        }
        #global-loader.flex { display: flex !important; }
      `}} />

      <script dangerouslySetInnerHTML={{ __html: `
        // Ensure loader is hidden on initial load (client-side safety)
        const loader = document.getElementById('global-loader');
        if (loader) {
            loader.classList.add('hidden');
            loader.classList.remove('flex');
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
        }

        document.addEventListener('submit', (e) => {
          const form = e.target;
          if (form.getAttribute('action') === '/deals') {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.classList.remove('hidden');
                loader.classList.add('flex');
                document.body.style.overflow = 'hidden';
                document.documentElement.style.overflow = 'hidden';
            }
          }
        });
      `}} />

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
        <div className="space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Value Intelligence Active</span>
            <div className="w-[1px] h-3 bg-white/10 mx-1" />
            <span className="text-[10px] font-mono font-bold text-emerald-500">1 USD = {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(idrRate)}</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">Deal <br /><span className="text-white/20">Hunter</span></h2>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed">Sistem kami memindai pasar global untuk menemukan penawaran yang paling sesuai dengan profil bermain Anda menggunakan optimasi Simulated Annealing.</p>
          
          <form method="get" action="/deals" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <input 
                type="number" 
                name="budget" 
                placeholder="Target Budget (IDR)..." 
                defaultValue={budgetIDR > 0 ? budgetIDR.toString() : ''}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-zinc-500">IDR</div>
            </div>
            <button type="submit" className="px-8 py-4 bg-emerald-500 text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-emerald-400 active:scale-95 transition-all shadow-xl shadow-emerald-500/10">
              Mulai Optimasi
            </button>
          </form>
        </div>

        {budgetIDR > 0 && (
          <div className="w-full lg:w-auto">
            <div className="glass p-8 rounded-[2.5rem] border-white/10 space-y-8 relative overflow-hidden group min-w-[340px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all duration-700" />
              <div className="space-y-1 relative">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500">Optimization Result</p>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Budget Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-8 relative">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Belanja</p>
                  <p className="text-2xl md:text-3xl font-black text-white leading-none">{formatIDR(totalCostUSD)}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sisa Budget</p>
                  <p className="text-sm font-mono font-bold text-emerald-500">+{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(remainingIDR)}</p>
                </div>
              </div>
              <div className="space-y-3 relative">
                <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-zinc-500">Target Efisiensi</p>
                    <p className="text-xs font-black text-zinc-300">Target: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(budgetIDR)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <span className="text-emerald-500">{Math.round((totalCostUSD / (budgetUSD || 1)) * 100)}% Used</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" 
                      style={{ width: `${Math.min(100, (totalCostUSD / (budgetUSD || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {budgetUSD && basketItems.length > 0 && (
        <div className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <h3 className="text-xs font-black uppercase tracking-[0.5em] text-emerald-500 whitespace-nowrap bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/20">Optimized Selection</h3>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {basketItems.map((deal: any) => {
              const originalDeal = rawDeals.find(d => parseInt(d.steamAppID) === deal.appid)
              return (
                <div key={deal.appid} className="group relative">
                  <div className="aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden relative ring-2 ring-emerald-500/20 group-hover:ring-emerald-500 transition-all duration-500 shadow-2xl">
                    <img 
                      src={`https://cdn.akamai.steamstatic.com/steam/apps/${deal.appid}/library_600x900.jpg`} 
                      className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700" 
                      alt={deal.name}
                      onLoad={(e) => {
                        const target = e.target as any;
                        if (target.naturalWidth < 300 || target.src.includes('unknown_app.png')) {
                          target.src = `https://cdn.akamai.steamstatic.com/steam/apps/${deal.appid}/header.jpg`;
                          target.classList.remove('object-cover');
                          target.classList.add('object-contain', 'p-2');
                        }
                      }}
                      onError={(e) => {
                        const target = e.target as any;
                        target.src = `https://cdn.akamai.steamstatic.com/steam/apps/${deal.appid}/header.jpg`;
                        target.classList.remove('object-cover');
                        target.classList.add('object-contain', 'p-2');
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-emerald-500 text-black px-2 py-0.5 rounded-md font-mono font-black text-[9px] z-20 shadow-lg uppercase">
                      Selected
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                      <p className="text-[10px] font-black text-white uppercase truncate leading-none">{deal.name}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 font-mono font-bold text-[10px]">{formatIDR(deal.salePrice)}</span>
                        <span className="bg-white/10 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-tighter">-{Math.floor(parseFloat(deal.savings))}%</span>
                      </div>
                    </div>
                    <a href={`https://www.cheapshark.com/redirect?dealID=${originalDeal?.dealID}`} target="_blank" className="absolute inset-0 z-30 opacity-0" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-10">
        <div className="flex items-center gap-6">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <h3 className="text-xs font-black uppercase tracking-[0.5em] text-zinc-500 whitespace-nowrap">
            {budgetUSD ? 'Market Discovery' : 'Top Recommendation'}
          </h3>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
        {discoveryItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
            {discoveryItems.map((deal: any) => {
               const originalDeal = rawDeals.find(d => parseInt(d.steamAppID) === deal.appid)
               return (
                <div key={deal.appid} className="group space-y-3 transition-all duration-500 hover:-translate-y-2 opacity-60 hover:opacity-100">
                  <div className="aspect-[3/4] bg-zinc-900 rounded-xl md:rounded-2xl overflow-hidden relative transition-all duration-500 shadow-2xl">
                    <img 
                      src={`https://cdn.akamai.steamstatic.com/steam/apps/${deal.appid}/library_600x900.jpg`} 
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                      alt={deal.name}
                      onLoad={(e) => {
                        const target = e.target as any;
                        if (target.naturalWidth < 300 || target.src.includes('unknown_app.png')) {
                          target.src = `https://cdn.akamai.steamstatic.com/steam/apps/${deal.appid}/header.jpg`;
                          target.classList.remove('object-cover');
                          target.classList.add('object-contain', 'p-2');
                        }
                      }}
                      onError={(e) => {
                        const target = e.target as any;
                        target.src = `https://cdn.akamai.steamstatic.com/steam/apps/${deal.appid}/header.jpg`;
                        target.classList.remove('object-cover');
                        target.classList.add('object-contain', 'p-2');
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-white text-black px-2 py-0.5 rounded-full border border-white/10 shadow-xl z-20">
                      <p className="text-[8px] font-mono font-black">{Math.min(100, Math.round(deal.score * 100))}% Match</p>
                    </div>
                    {originalDeal && (
                      <div className="absolute top-10 right-2 bg-zinc-800 text-white px-2 py-0.5 rounded-full shadow-xl border border-white/5">
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
      </div>
    </div>,
    { title: 'Deal Hunter' } as any
  )
})

export default app

import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import React from 'react'
import { SteamAPI } from '../../lib/steam'
import { FuzzyOwnGamesScorer } from '../../lib/fuzzy-own-games-scorer'
import { GameCard } from '../../components/GameCard'
import { getIdrRate } from '../../lib/currency'

const app = new Hono<{ Bindings: any, Variables: any }>()

/**
 * Halaman Deal Hunter
 * 
 * Mengoptimalkan anggaran pengguna untuk mendapatkan kombinasi game terbaik
 * yang sedang diskon di Steam Store. Menggunakan algoritma Simulated Annealing
 * untuk menyelesaikan masalah optimasi kombinatorial dengan mempertimbangkan 
 * 'density' (skor preferensi per satuan harga).
 */
app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const idrRate = await getIdrRate(c)
  const budgetQuery = c.req.query('budget')
  const budgetIDR = budgetQuery ? parseInt(budgetQuery) : 0

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  const userGames = await steamAPI.getOwnedGames(steamId)

  let scoredDeals: any[] = []
  try {
    const basePoolSize = 30
    const dynamicPoolSize = budgetIDR > 0 ? Math.min(500, Math.max(basePoolSize, Math.floor(budgetIDR / 5000))) : basePoolSize
    
    const saleResults = await steamAPI.searchGames({ specials: true, cc: 'id' })
    const candidateIds = saleResults.slice(0, dynamicPoolSize).map(r => r.id).filter(Boolean) as number[]
    
    const detailPromises = candidateIds.map(id => steamAPI.getAppStoreDetails(id, 'english', 'id'))
    const rawDetails = await Promise.all(detailPromises)

    const scorer = new FuzzyOwnGamesScorer(userGames)

    scoredDeals = rawDetails
      .filter((d: any) => d && d.price_overview)
      .map((d: any) => {
        const score = scorer.getGameScore(d!.steam_appid) || 0.5
        const price = d!.price_overview!.final / 100
        return {
          appid: d!.steam_appid,
          name: d!.name,
          salePrice: price, 
          normalPrice: d!.price_overview!.initial / 100,
          savings: d!.price_overview!.discount_percent.toString(),
          score: score,
          density: score / (price || 1), // Menghitung skor per rupiah
          formattedPrice: d!.price_overview!.final_formatted,
          formattedInitial: d!.price_overview!.initial_formatted,
          tags: (d!.genres || []).map((g: any) => g.description).concat((d!.categories || []).map((c: any) => c.description))
        }
      })
  } catch (e) {
    console.error('Steam Search error:', e)
  }

  let basketItems: any[] = []
  let totalCostIDR = 0
  if (budgetIDR > 0 && scoredDeals.length > 0) {
    let currentBasket = scoredDeals.filter(() => Math.random() > 0.8)
    const getCost = (items: any[]) => items.reduce((sum, item) => sum + item.salePrice, 0)
    
    /**
     * getScore menggunakan density (skor/harga)
     * Memastikan game yang murah tapi disukai user mendapatkan prioritas lebih.
     */
    const getScore = (items: any[]) => items.reduce((sum, item) => sum + item.density, 0)

    let temp = 2000.0
    const coolingRate = 0.995 

    while (temp > 1) {
      const neighborSize = Math.floor(Math.random() * 8) + 1
      const neighbor = [...scoredDeals].sort(() => Math.random() - 0.5).slice(0, neighborSize)
      
      const currentCost = getCost(currentBasket)
      const neighborCost = getCost(neighbor)

      if (neighborCost <= budgetIDR) {
        const currentScore = getScore(currentBasket)
        const neighborScore = getScore(neighbor)

        if (neighborScore > currentScore || Math.random() < Math.exp((neighborScore - currentScore) / temp)) {
          currentBasket = neighbor
        }
      }
      temp *= coolingRate
    }
    basketItems = currentBasket
    totalCostIDR = getCost(basketItems)
  }

  const remainingIDR = budgetIDR - totalCostIDR

  /**
   * Discovery items diurutkan berdasarkan density (terbaik nilainya terhadap harga)
   */
  const discoveryItems = [...scoredDeals]
    .sort((a, b) => b.density - a.density)
    .slice(0, 24)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-16 md:space-y-24">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-12">
        <div className="space-y-6 max-w-2xl">
          <div className="flex flex-col gap-4">
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Pure Steam Value Engine Active</span>
            </div>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">Deal <br /><span className="text-white/20 outline-text">Hunter</span></h2>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed">Sistem kami memindai katalog resmi Steam Indonesia untuk menemukan penawaran yang paling sesuai dengan profil bermain Anda.</p>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Kurs Konversi Wise</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-[0.9]">1 USD = Rp{idrRate.toLocaleString('id-ID')}</h1>
          </div>
          
          <form method="get" action="/deals" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
            <div className="relative flex-1 max-w-sm">
              <input 
                type="number" 
                name="budget" 
                placeholder="Target Budget (IDR)..." 
                defaultValue={budgetIDR > 0 ? budgetIDR.toString() : ''}
                className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-zinc-500">IDR</div>
            </div>
            <button type="submit" className="px-8 py-4 bg-orange-500 text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-orange-400 active:scale-95 transition-all shadow-xl shadow-orange-500/10">
              Mulai Optimasi
            </button>
          </form>
        </div>

        {budgetIDR > 0 && (
          <div className="w-full lg:w-auto">
            <div className="glass p-8 rounded-[2.5rem] border-white/10 space-y-8 relative overflow-hidden group min-w-[340px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-700" />
              <div className="space-y-1 relative">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Steam Optimization</p>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Budget Summary</h3>
              </div>
              <div className="grid grid-cols-2 gap-8 relative">
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Belanja</p>
                  <p className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">Rp{totalCostIDR.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sisa Budget</p>
                  <p className={`text-3xl md:text-5xl font-mono font-black ${remainingIDR >= 0 ? 'text-orange-500' : 'text-rose-500'}`}>
                    {remainingIDR >= 0 ? '+' : ''}Rp{remainingIDR.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="space-y-3 relative">
                <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target Efisiensi</p>
                    <p className="text-xs font-black text-zinc-300">Target: Rp{budgetIDR.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <span className="text-orange-500">{Math.round((totalCostIDR / (budgetIDR || 1)) * 100)}% Used</span>
                  </div>
                  <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                      style={{ width: `${Math.min(100, (totalCostIDR / (budgetIDR || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {budgetIDR > 0 && basketItems.length > 0 && (
        <div className="space-y-10">
          <div className="flex items-center gap-6">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <h3 className="text-xs font-black uppercase tracking-[0.5em] text-orange-500 whitespace-nowrap bg-orange-500/10 px-6 py-2 rounded-full border border-orange-500/20">Optimized Selection</h3>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            {basketItems.map((deal: any) => (
              <GameCard 
                key={deal.appid}
                appId={deal.appid}
                name={deal.name}
                score={deal.score}
                price={deal.formattedPrice}
                discount={deal.savings}
                hideScore={true}
                hideTags={true}
                actionLabel="Lihat di Steam"
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-10">
        <div className="flex items-center gap-6">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <h3 className="text-xs font-black uppercase tracking-[0.5em] text-zinc-500 whitespace-nowrap">
            {budgetIDR > 0 ? 'Market Discovery (Highest Price First)' : 'Active Steam Specials'}
          </h3>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
        {discoveryItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 2xl:grid-cols-6 gap-6 md:gap-8">
            {discoveryItems.map((deal: any) => (
              <GameCard 
                key={deal.appid}
                appId={deal.appid}
                name={deal.name}
                score={deal.score}
                price={deal.formattedPrice}
                originalPrice={deal.formattedInitial}
                discount={deal.savings}
                tags={deal.tags}
                hideScore={true}
                hideTags={true}
                actionLabel="Lihat di Steam"
              />
            ))}
          </div>
        ) : (
          <div className="glass p-20 rounded-[3rem] text-center border border-dashed border-white/10">
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Mencari penawaran aktif di database Steam Indonesia...</p>
          </div>
        )}
      </div>
    </div>,
    { title: 'Deal Hunter' } as any
  )
})

export default app

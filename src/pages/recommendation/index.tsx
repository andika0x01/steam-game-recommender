import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import React from 'react'
import { SteamAPI } from '../../lib/steam'
import { FuzzyOwnGamesScorer } from '../../lib/fuzzy-own-games-scorer'
import { FuzzyNonOwnGamesScorer } from '../../lib/fuzzy-non-own-games-scorer'
import { GameCard } from '../../components/GameCard'
import { getIdrRate } from '../../lib/currency'
import { InfiniteGrid } from '../../components/InfiniteGrid'
import { buildUserProfile, calculateSimilarity, calculateWeightedSimilarity } from '../../lib/simple-recommendation'

const app = new Hono<{ Bindings: any, Variables: any }>()

/**
 * Halaman Recommendation
 * 
 * Mengoptimalkan anggaran pengguna untuk mendapatkan kombinasi game terbaik
 * yang sedang diskon di Steam Store. Menggunakan algoritma Simulated Annealing
 * untuk menyelesaikan masalah optimasi kombinatorial dengan mempertimbangkan 
 * 'density' (skor preferensi per satuan harga) dan maksimalisasi budget.
 * Mendukung eksplorasi pasar berkelanjutan (Infinite Scrolling).
 */
app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const idrRate = await getIdrRate(c)
  const budgetQuery = c.req.query('budget')
  const budgetIDR = budgetQuery ? parseInt(budgetQuery) : 0

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  const userGames = await steamAPI.getOwnedGames(steamId)

  const { publisherScores, userProfileTags, tagWeights } = await buildUserProfile(steamAPI, userGames);
  const nonOwnScorer = new FuzzyNonOwnGamesScorer();

  let scoredDeals: any[] = []
  try {
    const basePoolSize = 30
    const dynamicPoolSize = budgetIDR > 0 ? Math.min(500, Math.max(basePoolSize, Math.floor(budgetIDR / 5000))) : basePoolSize
    
    const saleResults = await steamAPI.searchGames({ specials: true, cc: 'id' })
    const candidateIds = saleResults.slice(0, dynamicPoolSize).map(r => r.id).filter(Boolean) as number[]
    
    const detailPromises = candidateIds.map(id => steamAPI.getAppStoreDetails(id, 'english', 'id'))
    const rawDetails = await Promise.all(detailPromises)
    const reviewPromises = candidateIds.map(id => steamAPI.getAppReviews(id))
    const rawReviews = await Promise.all(reviewPromises)

    scoredDeals = rawDetails
      .map((d: any, idx: number) => ({ d, reviews: rawReviews[idx] }))
      .filter(({ d }: any) => d && d.price_overview)
      .map(({ d, reviews }: any) => {
        const price = d!.price_overview!.final / 100
        const candidateTags = [
          ...(d.genres || []).map((g: any) => g.description),
          ...(d.categories || []).map((c: any) => c.description)
        ];

        let candidatePS = 0;
        if (d.publishers) {
          candidatePS = d.publishers.reduce((max: number, pub: string) => Math.max(max, publisherScores[pub] || 0), 0);
        }

        const positivity = reviews ? (reviews.total_positive / (reviews.total_reviews || 1)) : 0.5;
        const similarity = calculateWeightedSimilarity(candidateTags, tagWeights);
        const volume = reviews ? reviews.total_reviews : 0;

        const score = nonOwnScorer.getGameScore(positivity, similarity, volume, candidatePS);
        
        /**
         * Penanganan Game Gratis (Price = 0)
         * Gunakan minimal Rp1 untuk menghindari Division by Zero.
         */
        const safePrice = price > 0 ? price : 1;
        const density = score / safePrice;

        return {
          appid: d!.steam_appid,
          name: d!.name,
          salePrice: price, 
          normalPrice: d!.price_overview!.initial / 100,
          savings: d!.price_overview!.discount_percent.toString(),
          score: score,
          density: density,
          formattedPrice: d!.price_overview!.final_formatted,
          formattedInitial: d!.price_overview!.initial_formatted,
          tags: candidateTags
        }
      })
  } catch (e) {
    console.error('Steam Search error:', e)
  }

  let basketItems: any[] = []
  let totalCostIDR = 0
  if (budgetIDR > 0 && scoredDeals.length > 0) {
    /**
     * Solusi Awal: Ambil set acak yang PASTI di bawah budget.
     * Jika tidak ada yang di bawah budget, basket kosong.
     */
    let currentBasket: any[] = []
    const sortedByPrice = [...scoredDeals].sort((a, b) => a.salePrice - b.salePrice)
    let tempCost = 0
    for (const deal of sortedByPrice) {
      if (tempCost + deal.salePrice <= budgetIDR) {
        currentBasket.push(deal)
        tempCost += deal.salePrice
      } else {
        break
      }
    }

    const getCost = (items: any[]) => items.reduce((sum, item) => sum + item.salePrice, 0)
    
    /**
     * getEnergy: Prioritaskan solusi dalam budget.
     * Solusi overbudget diberi nilai negatif sangat besar.
     */
    const getEnergy = (items: any[]) => {
      const cost = getCost(items)
      if (cost > budgetIDR || cost === 0) return Number.NEGATIVE_INFINITY
      
      const totalDensity = items.reduce((sum, item) => sum + item.density, 0)
      const budgetUtilization = cost / budgetIDR
      
      return totalDensity * Math.pow(budgetUtilization, 2)
    }

    let temp = 3000.0 
    const coolingRate = 0.998 

    while (temp > 1) {
      let neighbor = [...currentBasket]
      const action = Math.random()
      
      if (action < 0.4 && neighbor.length < scoredDeals.length) {
        // Tambah item: Pastikan hanya tambah jika masih muat budget
        const available = scoredDeals.filter(d => !neighbor.find(n => n.appid === d.appid))
        if (available.length > 0) {
          const randomItem = available[Math.floor(Math.random() * available.length)]
          if (getCost(neighbor) + randomItem.salePrice <= budgetIDR) {
             neighbor.push(randomItem)
          }
        }
      } else if (action < 0.6 && neighbor.length > 0) {
        // Hapus item
        neighbor.splice(Math.floor(Math.random() * neighbor.length), 1)
      } else if (neighbor.length > 0) {
        // Ganti item: Pastikan penggantinya tidak bikin overbudget
        const idx = Math.floor(Math.random() * neighbor.length)
        const available = scoredDeals.filter(d => !neighbor.find(n => n.appid === d.appid))
        if (available.length > 0) {
          const newItem = available[Math.floor(Math.random() * available.length)]
          const costWithoutOld = getCost(neighbor) - neighbor[idx].salePrice
          if (costWithoutOld + newItem.salePrice <= budgetIDR) {
            neighbor[idx] = newItem
          }
        }
      }
      
      const currentEnergy = getEnergy(currentBasket)
      const neighborEnergy = getEnergy(neighbor)

      if (neighborEnergy > currentEnergy || Math.random() < Math.exp((neighborEnergy - currentEnergy) / temp)) {
        currentBasket = neighbor
      }
      temp *= coolingRate
    }
    basketItems = currentBasket
    totalCostIDR = getCost(basketItems)
  }

  const remainingIDR = budgetIDR - totalCostIDR

  const discoveryItems = [...scoredDeals]
    .sort((a, b) => b.density - a.density)
    .slice(0, 24)
    .map(d => ({
       appid: d.appid,
       name: d.name,
       score: d.score,
       price: d.formattedPrice,
       originalPrice: d.formattedInitial,
       discount: d.savings,
       tags: d.tags,
       hideScore: false,
       hideTags: true,
       density: d.density
    }))

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
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9]">Recom<br /><span className="text-white/20 outline-text">mendation</span></h2>
          <p className="text-zinc-400 text-base md:text-lg leading-relaxed">Sistem kami memindai katalog resmi Steam Indonesia untuk menemukan penawaran yang paling sesuai dengan profil bermain Anda.</p>
          
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Kurs Konversi Wise</p>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white uppercase leading-[0.9]">1 USD = Rp{idrRate.toLocaleString('id-ID')}</h1>
          </div>
          
          <form method="get" action="/recommendation" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
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
                hideScore={false}
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
            Market Discovery
          </h3>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
        {discoveryItems.length > 0 ? (
          <div data-hydrate="InfiniteGrid" data-props={JSON.stringify({ initialItems: discoveryItems, endpoint: '/api/recommendation-deals', type: 'deal' })}>
            <InfiniteGrid initialItems={discoveryItems} endpoint="/api/recommendation-deals" type="deal" />
          </div>
        ) : (
          <div className="glass p-20 rounded-[3rem] text-center border border-dashed border-white/10">
            <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">Mencari penawaran aktif di database Steam Indonesia...</p>
          </div>
        )}
      </div>
    </div>,
    { title: 'Recommendation' } as any
  )
})

export default app

import React, { useEffect, useRef, useState } from 'react'
import { GameCard } from './GameCard'

interface InfiniteGridProps {
  initialItems: any[]
  endpoint: string
  type: 'game' | 'deal'
}

/**
 * Komponen InfiniteGrid
 * 
 * Perbaikan: Meningkatkan limit percobaan retry dan memastikan
 * deduplikasi ID bekerja dengan benar untuk menghindari stall.
 */
export const InfiniteGrid: React.FC<InfiniteGridProps> = ({ initialItems, endpoint, type }) => {
  const [items, setItems] = useState(() => {
    const list = [...initialItems];
    if (type === 'deal') {
      return list.sort((a, b) => (b.density || 0) - (a.density || 0));
    } else {
      return list.sort((a, b) => (b.score || 0) - (a.score || 0));
    }
  })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setPageHasMore] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const [autoLoad, setAutoLoad] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Jika komponen di-mount tanpa data awal, langsung load data pertama
    if (items.length === 0 && hasMore && !loading) {
      loadMore()
    }
  }, [items])

  useEffect(() => {
    if (!autoLoad) return

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore()
      }
    }, { threshold: 0.1 }) // Mengurangi threshold agar lebih responsif

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [page, hasMore, loading, autoLoad])

  const loadMore = async () => {
    setLoading(true)
    try {
      const nextPage = items.length === 0 ? 1 : page + 1
      const response = await fetch(`${endpoint}?page=${nextPage}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      
      const newItems = await response.json() as any[]
      
      if (!Array.isArray(newItems) || newItems.length === 0) {
        setPageHasMore(false)
      } else {
        const existingIds = new Set(items.map(i => i.appid || i.appId))
        const uniqueNewItems = newItems.filter(i => !existingIds.has(i.appid || i.appId))
        
        if (uniqueNewItems.length > 0) {
          setItems(prev => {
            const combined = [...prev, ...uniqueNewItems];
            if (type === 'deal') {
              return combined.sort((a, b) => (b.density || 0) - (a.density || 0));
            } else {
              // type === 'game' -> /engine
              return combined.sort((a, b) => (b.score || 0) - (a.score || 0));
            }
          })
          setPage(nextPage)
          setRetryCount(0) // Reset retry jika berhasil dapat item baru
        } else if (retryCount < 10) { 
          // Jika semua duplikat, coba lagi ke halaman berikutnya (limit 10 kali)
          setPage(nextPage)
          setRetryCount(prev => prev + 1)
        } else {
          setPageHasMore(false)
        }
      }
    } catch (e) {
      console.error('Failed to load more items:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div /> {/* Spacer */}
        <button 
          onClick={() => setAutoLoad(!autoLoad)}
          className={`group flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em] ${
            autoLoad 
              ? 'bg-orange-500/10 border-orange-500/20 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.1)]' 
              : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-white/10 hover:text-zinc-400'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${
              autoLoad ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-zinc-700'
            }`} />
            {autoLoad && (
              <div className="absolute w-2 h-2 rounded-full bg-orange-500 animate-ping opacity-75" />
            )}
          </div>
          {autoLoad ? 'Auto-Load Active' : 'Manual Mode'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6 md:gap-10">
        {items.map((item, idx) => (
          <GameCard 
            key={`${item.appid || item.appId}-${idx}`}
            appId={item.appid || item.appId}
            name={item.name}
            score={item.score}
            tags={item.tags}
            price={item.price}
            originalPrice={item.originalPrice}
            discount={item.discount}
            hideScore={item.hideScore}
            hideTags={item.hideTags}
          />
        ))}
      </div>
      
      {hasMore && (
        <div ref={loaderRef} className="py-20 flex flex-col items-center gap-8">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Scanning Database...</p>
            </div>
          ) : !autoLoad ? (
            <button 
              onClick={() => loadMore()}
              className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group flex items-center gap-4 active:scale-95"
            >
              <span className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400 group-hover:text-white transition-colors">
                Load More Results
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 group-hover:text-orange-500 transition-colors">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          ) : (
            <div className="h-20" /> /* Spacer for intersection observer when auto-loading */
          )}
        </div>
      )}
    </div>
  )
}

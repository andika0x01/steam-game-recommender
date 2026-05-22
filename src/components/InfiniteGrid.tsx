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
 * Menangani pemuatan data tambahan secara otomatis saat pengguna
 * melakukan scroll ke dasar halaman menggunakan Intersection Observer.
 */
export const InfiniteGrid: React.FC<InfiniteGridProps> = ({ initialItems, endpoint, type }) => {
  const [items, setItems] = useState(initialItems)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setPageHasMore] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadMore()
      }
    }, { threshold: 1.0 })

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => observer.disconnect()
  }, [page, hasMore, loading])

  const loadMore = async () => {
    setLoading(true)
    try {
      const nextPage = page + 1
      const response = await fetch(`${endpoint}?page=${nextPage}`)
      const newItems = await response.json() as any[]
      
      if (newItems.length === 0) {
        setPageHasMore(false)
      } else {
        setItems(prev => [...prev, ...newItems])
        setPage(nextPage)
      }
    } catch (e) {
      console.error('Failed to load more items:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-10">
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
            hideScore={type === 'game' || item.hideScore}
            hideTags={item.hideTags}
          />
        ))}
      </div>
      
      {hasMore && (
        <div ref={loaderRef} className="py-20 flex justify-center">
          <div className="flex flex-col items-center gap-4">
             <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Scanning Database...</p>
          </div>
        </div>
      )}
    </div>
  )
}

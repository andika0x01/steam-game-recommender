import React from 'react'

interface GameCardProps {
  appId: number;
  name: string;
  score?: number;
  tags?: string[];
  price?: string;
  originalPrice?: string;
  discount?: string;
  actionUrl?: string;
  actionLabel?: string;
  className?: string;
  hideScore?: boolean;
  hideTags?: boolean;
}

export const GameCard = ({
  appId,
  name,
  score,
  tags = [],
  price,
  originalPrice,
  discount,
  actionUrl,
  actionLabel = "Lihat Game",
  className = "",
  hideScore = false,
  hideTags = false
}: GameCardProps) => {
  const hasDiscount = discount && discount !== "0";

  return (
    <div className={`group space-y-3 animate-in fade-in zoom-in-95 duration-700 ${className}`}>
      <div className="aspect-[3/4] bg-zinc-900 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative border border-white/5 group-hover:border-orange-500/50 transition-all duration-500 shadow-2xl group-hover:shadow-orange-500/10">
        <img 
          src={`https://cdn.akamai.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`}
          className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1"
          alt={name}
        />
        
        {/* Score Badge (Top Right) */}
        {score !== undefined && !hideScore && (
          <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full z-20 border border-white/20 bg-zinc-950/90 backdrop-blur-md shadow-2xl">
            <p className="text-[10px] font-mono font-black text-white">{(score * 100).toFixed(0)}% Match</p>
          </div>
        )}

        {/* Improved Price & Discount Display (Bottom Left) */}
        {(price || hasDiscount) && (
          <div className="absolute bottom-4 left-4 z-20">
            <div className="flex items-stretch overflow-hidden rounded-xl shadow-2xl border border-white/5 bg-zinc-950/80 backdrop-blur-md w-fit">
              {hasDiscount && (
                <div className="bg-orange-600 px-3 flex items-center justify-center border-r border-white/10">
                  <span className="text-white font-black text-xs">-{discount}%</span>
                </div>
              )}
              <div className="px-3 py-2 flex flex-col justify-center items-end">
                <span className="text-orange-400 font-mono font-black text-[11px] leading-none">{price}</span>
                {originalPrice && (
                  <span className="text-zinc-500 font-mono text-[9px] line-through leading-none mt-1 opacity-60">{originalPrice}</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hover Overlay (Actions) */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center p-6 gap-4 z-30 backdrop-blur-[2px]">
           <h3 className="text-sm font-black tracking-tight text-white leading-tight uppercase text-center drop-shadow-lg">{name}</h3>
           
           {!hideTags && tags.length > 0 && (
             <div className="flex flex-wrap justify-center gap-1.5">
               {tags.slice(0, 2).map(tag => (
                 <span key={tag} className="text-[8px] font-black uppercase tracking-widest text-orange-200/70 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">
                   {tag}
                 </span>
               ))}
             </div>
           )}

           <a 
            href={actionUrl || `https://store.steampowered.com/app/${appId}`} 
            target="_blank" 
            className="px-8 py-3 bg-orange-500 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-orange-400 transition-all text-center shadow-xl shadow-orange-500/20 active:scale-95"
           >
            {actionLabel}
           </a>
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-tighter truncate text-zinc-500 group-hover:text-orange-500 transition-colors text-center px-4">{name}</p>
    </div>
  )
}

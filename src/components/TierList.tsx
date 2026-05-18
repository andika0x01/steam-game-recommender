import React, { useState, useEffect } from 'react'

interface Game {
  appid: number;
  name: string;
}

interface SavedTier {
  game_appid: string;
  tier: string;
}

interface TierListProps {
  initialGames: Game[];
  initialSavedTiers: SavedTier[];
}

export const TierList = ({ initialGames, initialSavedTiers }: TierListProps) => {
  const [savedTiers, setSavedTiers] = useState(initialSavedTiers);
  const [games, setGames] = useState(initialGames);

  const tiers = [
    { label: 'S-TIER', key: 'S', color: 'border-amber-500/30 text-amber-500', bg: 'bg-amber-500/5' },
    { label: 'A-TIER', key: 'A', color: 'border-indigo-500/30 text-indigo-500', bg: 'bg-indigo-500/5' },
    { label: 'BACKLOG', key: 'B', color: 'border-emerald-500/30 text-emerald-500', bg: 'bg-emerald-500/5' },
    { label: 'SHAME', key: 'X', color: 'border-rose-500/30 text-rose-500', bg: 'bg-rose-500/5' },
  ];

  const handleDragStart = (e: React.DragEvent, appId: number) => {
    e.dataTransfer.setData('text/plain', appId.toString());
  };

  const handleDrop = async (e: React.DragEvent, targetTier: string | null) => {
    e.preventDefault();
    const appId = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (targetTier) {
      // Add or update tier
      const newTiers = [...savedTiers.filter(t => parseInt(t.game_appid) !== appId), { game_appid: appId.toString(), tier: targetTier }];
      setSavedTiers(newTiers);
      
      await fetch('/tierlist/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `appid=${appId}&tier=${targetTier}`
      });
    } else {
      // Remove from tier (move to unassigned)
      setSavedTiers(savedTiers.filter(t => parseInt(t.game_appid) !== appId));
      
      await fetch('/tierlist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `appid=${appId}`
      });
    }
  };

  const assignedIds = new Set(savedTiers.map(t => parseInt(t.game_appid)));
  const unassignedGames = games.filter(g => !assignedIds.has(g.appid));

  return (
    <div 
      data-hydrate="TierList"
      data-props={JSON.stringify({ initialGames, initialSavedTiers })}
      className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Command <br /><span className="text-white">Tier List</span></h2>
          <p className="text-zinc-400 text-base md:text-lg">Seret dan lepas aset untuk mengklasifikasikan warisan digital Anda. Perubahan disimpan secara otomatis.</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
        >
          Reset Sesi UI
        </button>
      </div>

      <div className="space-y-8">
        {tiers.map(tier => {
          const tierGames = savedTiers
            .filter(t => t.tier === tier.key)
            .map(t => games.find(g => g.appid === parseInt(t.game_appid)))
            .filter((g): g is Game => g !== undefined);

          return (
            <div 
              key={tier.key} 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, tier.key)}
              className={`glass p-6 md:p-8 rounded-[2.5rem] border ${tier.color} ${tier.bg} min-h-[180px] space-y-6 transition-all duration-300`}
            >
              <p className={`text-[10px] font-black tracking-[0.4em] uppercase ${tier.color}`}>{tier.label}</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-4 tier-grid">
                {tierGames.map(game => (
                  <div 
                    key={game.appid} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, game.appid)}
                    className="aspect-[3/4] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:scale-105"
                  >
                    <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} className="w-full h-full object-cover pointer-events-none" alt={game.name} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Aset Belum Terklasifikasi</p>
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, null)}
          className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-4 min-h-[100px]"
        >
          {unassignedGames.map(game => (
            <div 
              key={game.appid} 
              draggable
              onDragStart={(e) => handleDragStart(e, game.appid)}
              className="aspect-[3/4] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:scale-105"
            >
               <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} className="w-full h-full object-cover pointer-events-none" alt={game.name} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

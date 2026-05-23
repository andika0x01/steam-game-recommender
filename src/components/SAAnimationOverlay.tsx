import React, { useState, useEffect, useRef } from 'react';

export interface Candidate {
  appid: number;
  name: string;
  salePrice: number;
  score: number;
  density: number;
  image: string;
  formattedPrice?: string;
  savings?: string;
  fuzzyDetails?: any;
  source?: any;
}

export const PLACEHOLDER_IMAGE = 'https://placehold.co/600x900/18181b/71717a?text=No+Image';

interface SAAnimationOverlayProps {
  budget: number;
  candidates: Candidate[];
  onFinish: (basket: Candidate[]) => void;
}

/**
 * SAAnimationOverlay
 * Tema warna Orange. Slot dinamis (Portrait). Responsive.
 */
export const SAAnimationOverlay = ({ budget, candidates, onFinish }: SAAnimationOverlayProps) => {
  const [temp, setTemp] = useState(3000.0);
  const [currentBasket, setCurrentBasket] = useState<Candidate[]>([]);
  const [iteration, setIteration] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);
  
  const currentBasketRef = useRef<Candidate[]>([]);
  const tempRef = useRef(3000.0);

  const getCost = (items: Candidate[]) => items.reduce((sum, item) => sum + item.salePrice, 0);
  
  const getEnergy = (items: Candidate[]) => {
    const cost = getCost(items);
    if (cost > budget || cost === 0) return -1000000;
    const totalDensity = items.reduce((sum, item) => sum + item.density, 0);
    const budgetUtilization = cost / budget;
    return totalDensity * Math.pow(budgetUtilization, 2);
  };

  useEffect(() => {
    const affordable = candidates.filter(c => c.salePrice <= budget);
    let initial: Candidate[] = [];
    if (affordable.length > 0) {
      initial = [affordable[Math.floor(Math.random() * affordable.length)]];
    }
    setCurrentBasket(initial);
    currentBasketRef.current = initial;
    
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [candidates, budget]);

  useEffect(() => {
    if (isDone || candidates.length === 0 || (currentBasketRef.current.length === 0 && iteration > 0)) return;

    const timer = setTimeout(() => {
      const coolingRate = 0.98;
      const t = tempRef.current;
      
      let neighbor = [...currentBasketRef.current];
      const actionRoll = Math.random();
      let actionName = "";
      let gameName = "";
      
      if (actionRoll < 0.4 && neighbor.length < candidates.length) {
        actionName = "ADD";
        const available = candidates.filter(c => !neighbor.find(n => n.appid === c.appid));
        if (available.length > 0) {
          const rand = available[Math.floor(Math.random() * available.length)];
          if (getCost(neighbor) + rand.salePrice <= budget) {
            neighbor.push(rand);
            gameName = rand.name;
          }
        }
      } else if (actionRoll < 0.6 && neighbor.length > 1) {
        actionName = "REMOVE";
        const idx = Math.floor(Math.random() * neighbor.length);
        gameName = neighbor[idx].name;
        neighbor.splice(idx, 1);
      } else if (neighbor.length > 0) {
        actionName = "SWAP";
        const idx = Math.floor(Math.random() * neighbor.length);
        const oldGame = neighbor[idx];
        const available = candidates.filter(c => !neighbor.find(n => n.appid === c.appid));
        if (available.length > 0) {
          const rand = available[Math.floor(Math.random() * available.length)];
          const costWithout = getCost(neighbor) - oldGame.salePrice;
          if (costWithout + rand.salePrice <= budget) {
            neighbor[idx] = rand;
            gameName = `${oldGame.name.slice(0, 8)}.. -> ${rand.name.slice(0, 8)}..`;
          }
        }
      }

      if (!actionName) return;

      const eCurrent = getEnergy(currentBasketRef.current);
      const eNeighbor = getEnergy(neighbor);
      const dE = eNeighbor - eCurrent;
      
      const prob = Math.exp(dE / t);
      const metropolis = Math.random() < prob;
      const accept = dE > 0 || metropolis;
      
      let reason = "REJECTED";
      if (dE > 0) reason = "IMPROVED";
      else if (metropolis) reason = `METROPOLIS (P=${(prob*100).toFixed(1)}%)`;

      if (accept) {
        currentBasketRef.current = neighbor;
        setCurrentBasket(neighbor);
      }

      const costK = (getCost(neighbor) / 1000).toFixed(0);
      const logT = t.toFixed(0).padStart(4, ' ');
      const newLog = `[T:${logT}] ${actionName.padEnd(6)}: ${gameName.slice(0, 15).padEnd(15)} | dE:${(dE >= 0 ? '+' : '')}${dE.toExponential(1)} | Rp${costK}k | ${reason}`;
      setLogs(prev => [newLog, ...prev].slice(0, 15));
      
      tempRef.current = t * coolingRate;
      setTemp(tempRef.current);
      setIteration(i => i + 1);

      if (tempRef.current < 40 || iteration > 400) {
        setIsDone(true);
      }
    }, 40);

    return () => clearTimeout(timer);
  }, [iteration, isDone, candidates, budget]);

  const totalCost = getCost(currentBasket);
  const slotCount = Math.max(4, currentBasket.length + 1);

  return (
    <div className="fixed inset-0 z-[100] bg-zinc-950/98 backdrop-blur-2xl transition-all duration-500 font-sans overflow-y-auto">
      <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-8 md:p-12">
        <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 md:gap-8 items-stretch lg:items-start py-10">
          
          <div className="flex-1 space-y-6">
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
               <div>
                 <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic leading-none">Value Engine</h2>
                 <p className="text-[9px] md:text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mt-2">Simulated Annealing v2.4.0</p>
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Efficiency</p>
                  <p className="text-xl md:text-2xl font-mono font-black text-orange-500 mt-1">{Math.round((totalCost/budget)*100)}%</p>
               </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {[...Array(slotCount)].map((_, i) => {
                const item = currentBasket[i];
                return (
                  <div key={i} className={`aspect-[3/4] rounded-2xl border-2 transition-all duration-300 overflow-hidden relative group ${item ? 'border-orange-500/50 bg-zinc-900 shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 'border-white/5 bg-white/[0.02] border-dashed'}`}>
                    {item ? (
                      <>
                        <img 
                          src={`https://cdn.akamai.steamstatic.com/steam/apps/${item.appid}/library_600x900.jpg`}
                          onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE }}
                          className="w-full h-full object-cover animate-in fade-in zoom-in duration-300" 
                          alt={item.name} 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3">
                           <p className="text-[8px] md:text-[9px] font-black text-white truncate uppercase leading-tight">{item.name}</p>
                           <p className="text-[10px] md:text-[11px] font-mono font-bold text-orange-400 mt-0.5">Rp{item.salePrice.toLocaleString('id-ID')}</p>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-1.5 h-1.5 bg-white/10 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="glass p-4 md:p-6 rounded-3xl border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between text-[10px] font-black uppercase tracking-widest gap-2">
                 <span className="text-zinc-500">Current Cost: <span className="text-white">Rp{totalCost.toLocaleString('id-ID')}</span></span>
                 <span className="text-zinc-500">Target: <span className="text-orange-500">Rp{budget.toLocaleString('id-ID')}</span></span>
              </div>
              <div className="h-3 md:h-4 bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                 <div 
                   className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]" 
                   style={{ width: `${Math.min(100, (totalCost/budget)*100)}%` }}
                 />
              </div>
            </div>
          </div>

          <div className="w-full lg:w-[480px] flex flex-col gap-6">
             <div className="glass p-6 md:p-8 rounded-[2.5rem] border-orange-500/20 bg-orange-500/[0.02] space-y-6 md:space-y-8 flex-1">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center border bg-orange-500/20 border-orange-500/50 shrink-0">
                      {isDone ? (
                        <svg className="w-5 h-5 md:w-6 md:h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter leading-tight truncate">{isDone ? 'OPTIMAL' : 'PROCESSING'}</h3>
                      <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest truncate">{isDone ? 'Combination Found' : 'Iterating Candidates'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 font-mono">
                     <div className="bg-black/40 rounded-2xl p-3 md:p-4 border border-white/5">
                        <p className="text-[8px] text-zinc-500 uppercase mb-1">Temp (T)</p>
                        <p className="text-lg md:text-xl font-black text-orange-400 tabular-nums">{temp.toFixed(1)}</p>
                     </div>
                     <div className="bg-black/40 rounded-2xl p-3 md:p-4 border border-white/5">
                        <p className="text-[8px] text-zinc-500 uppercase mb-1">Iter</p>
                        <p className="text-lg md:text-xl font-black text-white tabular-nums">{iteration}</p>
                     </div>
                  </div>
                </div>

                {isDone ? (
                  <button 
                    onClick={() => onFinish(currentBasket)}
                    className="w-full py-4 md:py-5 bg-orange-500 text-black text-xs font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-orange-400 active:scale-95 transition-all shadow-xl shadow-orange-500/20"
                  >
                    Tampilkan Hasil
                  </button>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-[9px] md:text-[10px] font-bold text-zinc-600 uppercase animate-pulse">Running Heat Diffusion...</p>
                  </div>
                )}

                <div className="bg-black/60 rounded-2xl p-4 md:p-5 border border-white/5 h-[300px] md:h-[450px] overflow-hidden font-mono text-[9px] md:text-[10px] leading-relaxed">
                   <p className="text-[8px] text-zinc-700 uppercase mb-3 tracking-widest">Deep Engine Logs</p>
                   <div className="space-y-1.5">
                     {logs.map((log, i) => (
                       <div key={i} className={`${i === 0 ? 'text-orange-400' : 'text-zinc-600'} transition-opacity truncate`} style={{ opacity: 1 - i * 0.08 }}>
                         {log}
                       </div>
                     ))}
                   </div>
                </div>
             </div>
          </div>
      </div>
    </div>
  </div>
);
};

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { GameCard } from './GameCard';
import { SAAnimationOverlay, Candidate, PLACEHOLDER_IMAGE } from './SAAnimationOverlay';

interface OptimizationAppProps {
  defaultBudget: number;
}

/**
 * OptimizationApp
 * Komponen utama yang menangani form, animasi SA, dan penampilan hasil.
 */
export const OptimizationApp = ({ defaultBudget }: OptimizationAppProps) => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [basket, setBasket] = useState<Candidate[]>([]);
  const [computationTime, setComputationTime] = useState<number | null>(null);
  const [budgetValue, setBudgetValue] = useState(defaultBudget > 0 ? defaultBudget.toString() : '');
  const [hasRun, setHasRun] = useState(false);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);
  const methodologyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPortalNode(document.getElementById('optimization-results-portal'));
  }, []);

  // Fix LaTeX Rendering: Manually trigger MathJax on client-side update
  useEffect(() => {
    if (basket.length > 0 && typeof window !== 'undefined' && (window as any).MathJax) {
      const mathJax = (window as any).MathJax;
      if (methodologyRef.current) {
        mathJax.typesetPromise([methodologyRef.current]).catch((err: any) => console.error('MathJax error:', err));
      }
    }
  }, [basket]);

  useEffect(() => {
    if (defaultBudget > 0 && !hasRun) {
      handleStart(null, defaultBudget.toString());
    }
  }, [defaultBudget]);

  const handleStart = async (e: React.FormEvent | null, forcedBudget?: string) => {
    if (e) e.preventDefault();
    const targetBudget = forcedBudget || budgetValue;
    if (!targetBudget) return;

    setIsLoading(true);
    setHasRun(true);
    setComputationTime(null);
    
    // Update URL agar bisa di-refresh/share
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('budget', targetBudget);
      window.history.pushState({}, '', url.toString());
    }

    try {
      // Panggil server-side optimization untuk men-trigger logs di terminal
      const res = await fetch(`/api/perform-optimization?budget=${targetBudget}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Simpan data untuk digunakan nanti setelah animasi
      setCandidates(data.candidates);
      setComputationTime(data.computationTimeMs);
      
      // Aktifkan overlay animasi (client-side SA tetap jalan sebagai visual)
      setIsOptimizing(true);
    } catch (err) {
      console.error("Failed to perform optimization", err);
      alert("Gagal menjalankan optimasi di server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = (finalBasket: Candidate[]) => {
    setBasket(finalBasket);
    setIsOptimizing(false);
    setTimeout(() => {
      document.getElementById('basket-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const totalCost = basket.reduce((sum, item) => sum + item.salePrice, 0);
  const targetBudgetNum = parseInt(budgetValue) || 0;
  const remainingBudget = targetBudgetNum - totalCost;

  const resultsUI = basket.length > 0 && (
    <div id="basket-section" className="space-y-10 py-24 border-t border-white/5 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      <div className="flex flex-col lg:flex-row gap-12 items-start justify-between">
         <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-3 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">Optimization Result Ready</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter italic">Engine Results</h3>
            <p className="text-zinc-500 text-sm md:text-base leading-relaxed">Sistem telah berhasil menyusun kombinasi game optimal dari katalog Steam Indonesia menggunakan budget Rp{targetBudgetNum.toLocaleString('id-ID')}.</p>
            {computationTime !== null && (
              <div className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Server Computation Time</p>
                <p className="text-lg font-black text-orange-500 font-mono">{computationTime}ms</p>
              </div>
            )}
         </div>
         
         <div className="w-full lg:w-auto shrink-0">
           <div className="glass p-6 md:p-8 rounded-[2.5rem] border-white/10 space-y-8 relative overflow-hidden group min-w-full sm:min-w-[340px]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-[80px] -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all duration-700" />
              <div className="space-y-1 relative">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">Steam Budget Summary</p>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Basket Analysis</h3>
              </div>
              <div className="grid grid-cols-2 gap-6 md:gap-8 relative">
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Belanja</p>
                  <p className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">Rp{totalCost.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sisa Budget</p>
                  <p className={`text-2xl md:text-4xl font-mono font-black ${remainingBudget >= 0 ? 'text-orange-500' : 'text-rose-500'}`}>
                    {remainingBudget >= 0 ? '+' : ''}Rp{remainingBudget.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="space-y-2 relative">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    <span className="text-orange-500">{Math.round((totalCost / (targetBudgetNum || 1)) * 100)}% Used</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.3)]" 
                      style={{ width: `${Math.min(100, (totalCost / (targetBudgetNum || 1)) * 100)}%` }}
                    />
                  </div>
              </div>
           </div>
         </div>
      </div>

      {/* Grid yang sama persis dengan Market Discovery */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6 md:gap-10">
        {basket.map((deal) => {
          const gameData = {
            appId: deal.appid,
            name: deal.name,
            score: deal.score,
            fuzzyStats: deal.fuzzyDetails,
            source: deal.source
          };

          return (
            <div
              key={deal.appid}
              className="cursor-pointer recommendation-card-trigger"
              onClick={() => {
                 window.dispatchEvent(new CustomEvent('open-analyzer-modal', { detail: gameData }));
              }}
            >
              <GameCard 
                appId={deal.appid}
                name={deal.name}
                score={deal.score}
                price={deal.formattedPrice || `Rp${deal.salePrice.toLocaleString('id-ID')}`}
                discount={deal.savings || '0'}
                hideScore={false}
                hideTags={true}
                actionLabel="Lihat Analisis"
                isActionDiv={true}
              />
            </div>
          );
        })}
      </div>

      {/* Technical Methodology Section */}
      <div ref={methodologyRef} className="mt-32 space-y-12 border-t border-white/5 pt-24">
         <div className="max-w-2xl space-y-4">
            <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Engine Logic: Simulated Annealing</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">Penjelasan teknis mengenai bagaimana algoritma mengevaluasi dan menerima kombinasi game berdasarkan budget Anda.</p>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Column: Initial State & Energy */}
            <div className="space-y-10">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs">01</div>
                     <h4 className="text-xs font-black text-white uppercase tracking-widest">Initial State & Scoring</h4>
                  </div>
                  <div className="glass p-6 rounded-3xl border-orange-500/10 bg-orange-500/[0.02] space-y-4">
                     <div className="text-zinc-300">
                        {`\\[ d_i = \\frac{\\text{Score}_i}{\\text{Price}_i} \\]`}
                        {`\\[ E(S) = \\left( \\sum_{i \\in S} d_i \\right) \\times \\left( \\frac{\\text{Cost}(S)}{\\text{Budget}} \\right)^2 \\]`}
                     </div>
                     <p className="text-[11px] text-zinc-500 leading-relaxed italic border-l-2 border-orange-500/30 pl-4">
                        Sistem memulai dengan mengurutkan kandidat berdasarkan densitas skor. Fungsi Energi (E) dihitung untuk memaksimalkan total relevansi sekaligus memberikan penalti berat bagi sisa budget yang tidak terpakai.
                     </p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs">02</div>
                     <h4 className="text-xs font-black text-white uppercase tracking-widest">Neighbor Perturbation</h4>
                  </div>
                  <div className="p-6 space-y-3">
                     <p className="text-[11px] text-zinc-500 leading-relaxed">Setiap iterasi, sistem melakukan perubahan kecil (mutasi) pada keranjang belanja:</p>
                     <ul className="space-y-2 text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full"/> TAMBAH: Memasukkan game baru jika budget tersedia.</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full"/> HAPUS: Mengeluarkan game secara acak (eksplorasi).</li>
                        <li className="flex items-center gap-2"><div className="w-1 h-1 bg-orange-500 rounded-full"/> GANTI: Menukar game terpilih dengan kandidat lain.</li>
                     </ul>
                  </div>
               </div>
            </div>

            {/* Right Column: Acceptance Rules & Cooling */}
            <div className="space-y-10">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs">03</div>
                     <h4 className="text-xs font-black text-white uppercase tracking-widest">Metropolis Acceptance Rules</h4>
                  </div>
                  <div className="glass p-6 rounded-3xl border-orange-500/10 bg-orange-500/[0.02] space-y-4">
                     <div className="text-zinc-300">
                        {`\\[ P(\\text{accept}) = \\begin{cases} 1 & \\Delta E > 0 \\\\ e^{\\frac{\\Delta E}{T}} & \\Delta E \\leq 0 \\end{cases} \\]`}
                     </div>
                     <p className="text-[11px] text-zinc-500 leading-relaxed italic border-l-2 border-orange-500/30 pl-4">
                        Kombinasi yang lebih baik selalu diterima. Namun, kombinasi yang lebih buruk terkadang diterima dengan probabilitas P untuk mencegah sistem terjebak dalam solusi lokal yang tidak optimal.
                     </p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold text-xs">04</div>
                     <h4 className="text-xs font-black text-white uppercase tracking-widest">Cooling & Stopping Criteria</h4>
                  </div>
                  <div className="glass p-6 rounded-3xl border-white/5 bg-white/[0.01] space-y-4">
                     <div className="text-zinc-300">
                        {`\\[ T_{n+1} = T_n \\times 0.985 \\]`}
                        {`\\[ \\text{Stop Criteria: } T < 40 \\quad | \\quad n_{max} = 400 \\]`}
                     </div>
                     <p className="text-[11px] text-zinc-500 leading-relaxed">
                        Algoritma berhenti mencari ketika suhu mencapai titik beku (T &lt; 40) atau mencapai batas iterasi maksimum (400 kali). Parameter ini menjaga keseimbangan antara kualitas solusi dan efisiensi waktu proses.
                     </p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8" onSubmit={handleStart}>
        <div className="relative flex-1 max-w-sm">
          <input 
            type="number" 
            name="budget" 
            placeholder="Target Budget (IDR)..." 
            value={budgetValue}
            onChange={(e) => setBudgetValue(e.target.value)}
            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
            required
            min="1000"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-zinc-500 pointer-events-none">IDR</div>
        </div>
        <button 
          type="submit" 
          disabled={isLoading || isOptimizing}
          className={`px-8 py-4 bg-orange-500 text-black text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-orange-400 active:scale-95 transition-all shadow-xl shadow-orange-500/10 whitespace-nowrap ${(isLoading || isOptimizing) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Menyiapkan Engine...' : 'Mulai Optimasi'}
        </button>
      </form>

      {isOptimizing && (
        <SAAnimationOverlay 
          budget={targetBudgetNum} 
          candidates={candidates} 
          onFinish={handleFinish} 
        />
      )}

      {portalNode ? createPortal(resultsUI, portalNode) : resultsUI}
    </div>
  );
};

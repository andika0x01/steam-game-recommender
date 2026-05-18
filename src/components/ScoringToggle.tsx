import React, { useState } from 'react'

export const ScoringToggle = ({ scoringMode: initialScoringMode }: { scoringMode: 'bayesian' | 'fuzzy' }) => {
  const [scoringMode, setScoringMode] = useState(initialScoringMode);

  const toggleScoring = () => {
    const next = scoringMode === 'fuzzy' ? 'bayesian' : 'fuzzy';
    document.cookie = `scoring_mode=${next}; path=/; max-age=31536000`;
    setScoringMode(next);
    window.location.reload();
  };

  return (
    <div 
      data-hydrate="ScoringToggle" 
      data-props={JSON.stringify({ scoringMode: initialScoringMode })}
      className="flex items-center gap-3 w-fit"
    >
      <span className={`text-[10px] font-black uppercase tracking-widest ${scoringMode === 'fuzzy' ? 'text-orange-500' : 'text-zinc-500'}`}>Fuzzy</span>
      <button 
        id="scoring-toggle"
        onClick={toggleScoring}
        className="relative w-10 h-5 bg-white/10 rounded-full transition-all duration-300"
      >
        <div className={`absolute top-1 w-3 h-3 rounded-full bg-orange-500 transition-all duration-300 ${scoringMode === 'bayesian' ? 'left-6' : 'left-1'}`} />
      </button>
      <span className={`text-[10px] font-black uppercase tracking-widest ${scoringMode === 'bayesian' ? 'text-orange-500' : 'text-zinc-500'}`}>Bayesian</span>
    </div>
  )
}

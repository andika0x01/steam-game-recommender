import React from "react";

export const Nav = ({ steamId }: { steamId?: string }) => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pointer-events-none">
      {}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md border-b border-white/5 pointer-events-auto h-full" />

      <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        {}
        <a href="/" className="group flex flex-col relative z-50 pointer-events-auto">
          <span className="font-black tracking-tighter text-2xl md:text-3xl leading-none text-white">STEAM GAME</span>
          <span className="font-black tracking-tighter text-2xl md:text-3xl leading-none text-white">RECOMMENDER</span>
        </a>

        {}
        <div className="flex items-center gap-4 pointer-events-auto">
          {}
          <input type="checkbox" id="nav-toggle" className="peer hidden" />
          <label
            htmlFor="nav-toggle"
            className="md:hidden relative z-50 flex flex-col gap-1.5 cursor-pointer p-3 glass rounded-xl border-white/10 active:scale-90 transition-transform"
          >
            <div className="w-6 h-0.5 bg-white transition-all duration-300 peer-checked:rotate-45 peer-checked:translate-y-2" />
            <div className="w-6 h-0.5 bg-white transition-all duration-300 peer-checked:opacity-0" />
            <div className="w-6 h-0.5 bg-white transition-all duration-300 peer-checked:-rotate-45 peer-checked:-translate-y-2" />
          </label>

          {}
          <div
            className="
            fixed inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6 
            transition-all duration-500 ease-in-out opacity-0 pointer-events-none -translate-y-10
            peer-checked:opacity-100 peer-checked:pointer-events-auto peer-checked:translate-y-0
            md:relative md:inset-auto md:bg-transparent md:backdrop-blur-none md:flex-row md:opacity-100 md:pointer-events-auto md:translate-y-0 md:gap-2 md:glass md:px-2 md:py-2 md:rounded-2xl md:border-white/5
          "
          >
            {!steamId ? (
              <>
                <NavLink href="/" label="Home" isLarge />
                <a
                  href="/auth/login"
                  className="px-10 md:px-5 py-5 md:py-2.5 bg-white text-black text-sm md:text-xs font-black uppercase tracking-[0.2em] rounded-2xl md:rounded-xl hover:bg-zinc-200 transition-all"
                >
                  Login
                </a>
              </>
            ) : (
              <>
                <NavLink href="/dashboard" label="Dashboard" isLarge />
                <NavLink href="/recommendation" label="Recommendation" isLarge />
                <NavLink href="/analyzer" label="Analyzer" isLarge />
                <NavLink href="/settings" label="Settings" isLarge />
                <a href="/auth/logout" className="px-4 py-2 font-black uppercase tracking-[0.2em] text-red-500 hover:text-red-400 transition-colors text-2xl md:text-xs">
                  Logout
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ href, label, isLarge }: { href: string; label: string; isLarge?: boolean }) => (
  <a href={href} className={`px-4 py-2 font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors ${isLarge ? "text-2xl md:text-xs" : "text-xs"}`}>
    {label}
  </a>
);

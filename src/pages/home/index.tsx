import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import React from 'react'

const app = new Hono<{ Bindings: any }>()

app.get('/', (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (steamId) {
    return c.redirect('/dashboard')
  }
  return c.render(
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-700" />
      
      <div className="relative z-10 max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-9xl font-bold tracking-tighter leading-[0.8] uppercase">
            Steam <br />
            <span className="text-white/20 outline-text">Recommender</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-2xl max-w-2xl mx-auto font-light tracking-tight">
            Mesin rekomendasi canggih berbasis algoritma kecerdasan komputasional untuk menemukan obsesi digital Anda berikutnya. 
            Dirancang khusus untuk pemain yang sangat teliti.
          </p>
        </div>

        <div className="flex justify-center pt-8">
          <a 
            href="/auth/login"
            className="group relative px-10 py-4 md:px-12 md:py-5 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
            <span className="relative z-10 flex items-center gap-2">
              Mulai Sekarang
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 transition-transform group-hover:translate-x-1" stroke="currentColor" strokeWidth="3">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </a>
        </div>
      </div>

      <footer className="absolute bottom-8 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">
        Ditenagai oleh Valve & Kecerdasan Komputasional
      </footer>
    </div>
  )
})

export default app

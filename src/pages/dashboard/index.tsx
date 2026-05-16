import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getPlayerSummaries, getOwnedGames } from '../../lib/steam'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const player = await getPlayerSummaries(c.env.STEAM_API_KEY, steamId)
  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)

  if (!player) return c.redirect('/auth/logout')

  const topGames = games.sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, 4)
  
  // Persona Logic
  const totalPlaytimeMinutes = games.reduce((acc, g) => acc + g.playtime_forever, 0)
  const totalPlaytimeHours = (totalPlaytimeMinutes / 60).toFixed(0)
  const avgPlaytime = games.length > 0 ? totalPlaytimeMinutes / games.length : 0
  
  let archetype = "The Initiate"
  let badgeColor = "bg-zinc-500"
  
  if (games.length > 100 && avgPlaytime < 300) {
    archetype = "The Collector"
    badgeColor = "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
  } else if (avgPlaytime > 3000) {
    archetype = "The Completionist"
    badgeColor = "bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
  } else if (games.length < 20 && totalPlaytimeMinutes > 10000) {
    archetype = "The Specialist"
    badgeColor = "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
  } else if (games.length > 50) {
    archetype = "The Explorer"
    badgeColor = "bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
  }

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-12 border-b border-white/5 pb-12">
        <div className="flex items-center gap-6 md:gap-8">
          <div className="relative group shrink-0">
            <div className="absolute -inset-2 bg-gradient-to-tr from-white/20 to-transparent rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
            <img 
              src={player.avatarfull} 
              alt={player.personaname} 
              className="relative w-20 h-20 md:w-32 md:h-32 rounded-2xl transition-all duration-700 border border-white/10"
            />
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter truncate">{player.personaname}</h2>
              <span className={`${badgeColor} text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white`}>
                {archetype}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${player.personastate > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} />
              <p className="text-zinc-400 font-mono text-[10px] md:text-xs uppercase tracking-widest truncate">
                {player.personastate > 0 ? 'Online' : 'Offline'} • {steamId}
              </p>
            </div>
          </div>
        </div>
      </header>

      {games.length === 0 && (
        <div className="glass p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border-white/10 bg-white/[0.02] space-y-8 max-w-3xl mx-auto md:mx-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 shrink-0" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className="text-lg md:text-xl font-black tracking-tight uppercase">Akses Library Diperlukan</h3>
            </div>
            <p className="text-zinc-400 text-sm">Steam mengembalikan koleksi kosong. Ikuti langkah-langkah ini untuk menyinkronkan library Anda:</p>
          </div>

          <div className="space-y-6">
            <ol className="space-y-4">
              {[
                { step: "01", text: "Buka Profil Steam Anda di browser atau aplikasi." },
                { step: "02", text: "Klik tombol 'Edit Profile'." },
                { step: "03", text: "Navigasi ke tab 'Privacy Settings' di sidebar." },
                { step: "04", text: "Atur 'Game Details' menjadi 'Public'." }
              ].map((item) => (
                <li key={item.step} className="flex gap-4 md:gap-6 group">
                  <span className="font-mono text-zinc-500 text-xs pt-1 group-hover:text-white transition-colors">{item.step}</span>
                  <p className="text-zinc-300 text-sm group-hover:text-zinc-100 transition-colors">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="pt-4 border-t border-white/5">
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest leading-relaxed">
              Catatan: Item dari Steam Family Sharing yang tidak dimiliki oleh akun ini dibatasi oleh protokol API Valve.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 glass p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] flex flex-col justify-between group">
          <div className="space-y-2">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Total Library</p>
            <p className="text-6xl md:text-8xl font-black tracking-tighter group-hover:scale-110 transition-transform origin-left">{games.length}</p>
          </div>
          <div className="space-y-4">
            <div className="pt-4 border-t border-white/5">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Investasi Waktu</p>
              <p className="text-3xl font-black tracking-tighter">{totalPlaytimeHours}j</p>
            </div>
            <p className="text-zinc-400 text-sm">Aplikasi unik ditemukan di dalam Vault Steam Anda.</p>
          </div>
        </div>

        <div className="md:col-span-8 glass p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Mastery Spectrum</p>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Paling sering dimainkan</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {topGames.map(game => (
              <div key={game.appid} className="group space-y-3 transition-all duration-500 hover:-translate-y-1">
                <div className="aspect-[3/4] bg-zinc-900 rounded-xl md:rounded-2xl overflow-hidden relative transition-all duration-500">
                   <img 
                    src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} 
                    alt={game.name}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                   />
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 gap-4">
                      <p className="text-[10px] font-mono uppercase text-white">{(game.playtime_forever / 60).toFixed(1)}j Dimainkan</p>
                      <a 
                        href={`https://store.steampowered.com/app/${game.appid}`}
                        target="_blank"
                        className="px-6 py-2 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-all shadow-xl"
                      >
                        Lihat Game
                      </a>
                   </div>
                </div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-tighter truncate text-zinc-400 group-hover:text-white transition-colors">{game.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    { title: 'Dashboard' } as any
  )
})

export default app

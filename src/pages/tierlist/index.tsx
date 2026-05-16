import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import * as React from 'hono/jsx'
import { getOwnedGames } from '../../lib/steam'

const app = new Hono<{ Bindings: any }>()

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  let savedTiers: any[] = []
  try {
    const result = await c.env.DB.prepare('SELECT game_appid, tier FROM tier_lists WHERE user_id = ?')
      .bind(steamId)
      .all()
    savedTiers = result.results || []
  } catch (e) { console.error('DB Error fetching tiers:', e) }

  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  const topGames = games.sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, 40)
  const assignedIds = new Set(savedTiers.map(t => Number(t.game_appid)))
  const unassignedGames = topGames.filter(g => !assignedIds.has(g.appid))

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div className="space-y-4 max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Command <br /><span className="text-white">Tier List</span></h2>
          <p className="text-zinc-400 text-base md:text-lg">Seret dan lepas aset untuk mengklasifikasikan warisan digital Anda. Perubahan disimpan secara otomatis.</p>
        </div>
        <button 
          onClick="window.location.reload()"
          className="px-6 py-3 bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
        >
          Reset Sesi UI
        </button>
      </div>
      <div className="space-y-8">
        {[
          { label: 'S-TIER', key: 'S', color: 'border-amber-500/30 text-amber-500', bg: 'bg-amber-500/5' },
          { label: 'A-TIER', key: 'A', color: 'border-indigo-500/30 text-indigo-500', bg: 'bg-indigo-500/5' },
          { label: 'BACKLOG', key: 'B', color: 'border-emerald-500/30 text-emerald-500', bg: 'bg-emerald-500/5' },
          { label: 'SHAME', key: 'X', color: 'border-rose-500/30 text-rose-500', bg: 'bg-rose-500/5' },
        ].map(tier => {
          const tierGames = savedTiers
            .filter(t => t.tier === tier.key)
            .map(t => games.find(g => g.appid === Number(t.game_appid)))
            .filter(g => g !== undefined)
          return (
            <div 
              key={tier.key} 
              id={`tier-${tier.key}`}
              onDragOver="event.preventDefault(); this.classList.add('bg-white/10')"
              onDragLeave="this.classList.remove('bg-white/10')"
              onDrop={`
                event.preventDefault();
                this.classList.remove('bg-white/10');
                const appid = event.dataTransfer.getData('text/plain');
                const element = document.getElementById('game-' + appid);
                this.querySelector('.tier-grid').appendChild(element);
                fetch('/tierlist/save', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: 'appid=' + appid + '&tier=${tier.key}'
                });
              `}
              className={`glass p-6 md:p-8 rounded-[2.5rem] border ${tier.color} ${tier.bg} min-h-[180px] space-y-6 transition-all duration-300`}
            >
              <p className={`text-[10px] font-black tracking-[0.4em] uppercase ${tier.color}`}>{tier.label}</p>
              <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-4 tier-grid">
                {tierGames.map(game => (
                  <div 
                    key={game?.appid} 
                    id={`game-${game?.appid}`}
                    draggable="true"
                    onDragStart={`event.dataTransfer.setData('text/plain', '${game?.appid}')`}
                    className="aspect-[3/4] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:scale-105"
                  >
                    <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${game?.appid}/library_600x900.jpg`} className="w-full h-full object-cover pointer-events-none" alt={game?.name} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <div className="space-y-6">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Aset Belum Terklasifikasi</p>
        <div 
          id="tier-unassigned"
          onDragOver="event.preventDefault()"
          onDrop={`
            event.preventDefault();
            const appid = event.dataTransfer.getData('text/plain');
            const element = document.getElementById('game-' + appid);
            this.appendChild(element);
            fetch('/tierlist/remove', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: 'appid=' + appid
            });
          `}
          className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-4 min-h-[100px]"
        >
          {unassignedGames.map(game => (
            <div 
              key={game.appid} 
              id={`game-${game.appid}`}
              draggable="true"
              onDragStart={`event.dataTransfer.setData('text/plain', '${game.appid}')`}
              className="aspect-[3/4] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all hover:scale-105"
            >
               <img src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} className="w-full h-full object-cover pointer-events-none" alt={game.name} />
            </div>
          ))}
        </div>
      </div>
    </div>,
    { title: 'Tier List Nexus' } as any
  )
})

app.post('/save', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  const body = await c.req.parseBody()
  const appid = body['appid'] as string
  const tier = body['tier'] as string
  if (!steamId || !appid || !tier) return c.json({ success: false })
  try {
    await c.env.DB.prepare('INSERT OR REPLACE INTO tier_lists (user_id, game_appid, tier) VALUES (?, ?, ?)')
      .bind(steamId, parseInt(appid), tier)
      .run()
    return c.json({ success: true })
  } catch (e) { return c.json({ success: false }) }
})

app.post('/remove', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  const body = await c.req.parseBody()
  const appid = body['appid'] as string
  if (!steamId || !appid) return c.json({ success: false })
  try {
    await c.env.DB.prepare('DELETE FROM tier_lists WHERE user_id = ? AND game_appid = ?')
      .bind(steamId, parseInt(appid))
      .run()
    return c.json({ success: true })
  } catch (e) { return c.json({ success: false }) }
})

export default app

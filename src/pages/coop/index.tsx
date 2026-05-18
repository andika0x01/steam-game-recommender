import { Hono } from 'hono'
import { getCookie } from 'hono/cookie'
import { SteamAPI, resolveVanityURL, getPlayerSummaries, getOwnedGames } from '../../lib/steam'
import { FuzzyBayesianScorer } from '../../lib/fuzzy-bayesian'
import { PureFuzzyScorer } from '../../lib/pure-fuzzy'
import { GameCard } from '../../components/GameCard'
import { ScoringToggle } from '../../components/ScoringToggle'

const app = new Hono<{ Bindings: any, Variables: any }>()

const resolveInputToSteamId = async (apiKey: string, input: string) => {
  input = input.trim()
  if (!input) return null
  if (/^[0-9]{17}$/.test(input)) return input
  const profileMatch = input.match(/\/profiles\/([0-9]{17})/)
  if (profileMatch) return profileMatch[1]
  const vanityMatch = input.match(/\/id\/([^\/]+)/)
  const vanityId = vanityMatch ? vanityMatch[1] : (!input.includes('/') ? input : null)
  if (vanityId) return await resolveVanityURL(apiKey, vanityId)
  return null
}

app.post('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const body = await c.req.parseBody()
  const friendsInput = body['friends'] as string
  if (!friendsInput) return c.redirect('/coop')

  const inputs = friendsInput.split(',').map(s => s.trim()).filter(Boolean)
  for (const input of inputs) {
    const fId = await resolveInputToSteamId(c.env.STEAM_API_KEY, input)
    if (fId && fId !== steamId) {
      const player = await getPlayerSummaries(c.env.STEAM_API_KEY, fId) as any
      if (player) {
        await c.env.DB.prepare(
          'INSERT OR REPLACE INTO users (id, name, avatar) VALUES (?, ?, ?)'
        ).bind(fId, player.personaname, player.avatarfull).run()
        
        await c.env.DB.prepare(
          'INSERT OR IGNORE INTO friends (user_id, friend_id) VALUES (?, ?)'
        ).bind(steamId, fId).run()
      }
    }
  }
  return c.redirect('/coop')
})

app.post('/remove', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  const body = await c.req.parseBody()
  const friendId = body['friendId'] as string
  if (!steamId || !friendId) return c.redirect('/coop')
  await c.env.DB.prepare('DELETE FROM friends WHERE user_id = ? AND friend_id = ?').bind(steamId, friendId).run()
  return c.redirect('/coop')
})

app.post('/clear', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/coop')
  await c.env.DB.prepare('DELETE FROM friends WHERE user_id = ?').bind(steamId).run()
  return c.redirect('/coop')
})

app.get('/', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  const scoringMode = c.var.scoringMode || 'fuzzy'
  if (!steamId) return c.redirect('/')

  const steamAPI = new SteamAPI(c.env.STEAM_API_KEY, c.env.KV)
  
  const savedFriendsResult = await c.env.DB.prepare(
    'SELECT f.friend_id, u.name, u.avatar FROM friends f JOIN users u ON f.friend_id = u.id WHERE f.user_id = ?'
  ).bind(steamId).all()
  const savedFriends = savedFriendsResult.results || []
  
  const allAgents = [steamId, ...savedFriends.map((f: any) => f.friend_id)]
  const agentProfiles = await steamAPI.getPlayerSummaries(allAgents)

  let sharedGames: any[] = []
  let recommendations: any[] = []

  if (allAgents.length > 1) {
    // Fetch owned games for all agents
    const ownedGamesPromises = allAgents.map(id => steamAPI.getOwnedGames(id))
    const ownedGamesLists = await Promise.all(ownedGamesPromises)

    // Find mutually owned games
    const gamesCount: Record<number, { count: number, game: any }> = {}
    ownedGamesLists.forEach(list => {
      list.forEach(game => {
        if (!gamesCount[game.appid]) {
          gamesCount[game.appid] = { count: 0, game }
        }
        gamesCount[game.appid].count++
      })
    })

    const mutualAppIds = Object.keys(gamesCount)
      .filter(id => gamesCount[parseInt(id)].count === allAgents.length)
      .map(id => parseInt(id))

    // Filter for Multiplayer/Co-op (requires App Details)
    // Limit to 30 mutual games for performance
    const candidateIds = mutualAppIds.slice(0, 30)
    const detailsPromises = candidateIds.map(id => steamAPI.getAppStoreDetails(id))
    const details = await Promise.all(detailsPromises)

    const coopGames = details.filter((d: any) => {
      if (!d || !d.categories) return false
      const categories = d.categories.map((c: any) => c.id)
      return categories.includes(1) || categories.includes(9) || categories.includes(38) // Multiplayer, Co-op, Online Co-op
    })

    // Score for each agent
    const reviewsRecord: Record<number, number> = {} // Simpified, using average review score for all
    
    recommendations = await Promise.all(coopGames.map(async (game: any) => {
      if (!game) return null
      
      // Calculate average score across all agents
      let totalScore = 0
      for (let i = 0; i < allAgents.length; i++) {
        const scorer = scoringMode === 'bayesian' 
          ? new FuzzyBayesianScorer(ownedGamesLists[i], reviewsRecord)
          : new PureFuzzyScorer(ownedGamesLists[i], reviewsRecord)
        totalScore += scorer.getGameScore(game.steam_appid)
      }

      return {
        appid: game.steam_appid,
        name: game.name,
        score: totalScore / allAgents.length,
        tags: (game.genres || []).map((g: any) => g.description)
      }
    }))

    recommendations = recommendations
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15)
    
    sharedGames = coopGames
  }

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16">
       <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
      <aside className="w-full lg:w-96 flex flex-col gap-10 shrink-0">
        <div className="space-y-6">
           <div className="space-y-3">
              <div className="flex flex-col gap-4">
                <div className="inline-flex items-center gap-3 px-3 py-1 bg-white/5 border border-white/10 rounded-full w-fit">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Convergence Engine Ready</span>
                </div>
                <ScoringToggle scoringMode={scoringMode} />
              </div>
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85]">Co-op <br /><span className="text-white/20 outline-text">Nexus</span></h2>
              <p className="text-zinc-500 text-xs font-mono uppercase tracking-[0.2em]">Analisis Minat Kolektif Multi-Agen</p>
           </div>
           <div className="glass p-6 rounded-[2.5rem] border border-white/5 bg-white/[0.01] shadow-2xl space-y-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 px-1">Registrasi Agen Baru</p>
                <form method="post" action="/coop" className="flex flex-col gap-4">
                  <input 
                    type="text" 
                    name="friends" 
                    placeholder="SteamID atau Tautan Profil..." 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-xs font-mono shadow-inner"
                  />
                  <button type="submit" className="w-full py-4 bg-orange-500 text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-[1.02] active:scale-95 transition-all text-[10px] shadow-xl">
                    Sinkronkan Agen
                  </button>
                </form>
              </div>

              {savedFriends.length > 0 && (
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Agen Terdaftar ({savedFriends.length})</p>
                      <form method="post" action="/coop/clear">
                        <button type="submit" className="text-[9px] font-black uppercase tracking-widest text-rose-500/50 hover:text-rose-500 transition-colors">Hapus Semua</button>
                      </form>
                   </div>
                   <div className="space-y-2">
                      {savedFriends.map((f: any) => (
                        <div key={f.friend_id} className="flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-2xl group/item">
                          <div className="flex items-center gap-3">
                            <img src={f.avatar} className="w-8 h-8 rounded-xl border border-white/10" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-white truncate max-w-[120px]">{f.name}</span>
                              <span className="text-[8px] font-mono text-zinc-500 uppercase">{f.friend_id.slice(-4)}</span>
                            </div>
                          </div>
                          <form method="post" action="/coop/remove">
                            <input type="hidden" name="friendId" value={f.friend_id} />
                            <button type="submit" className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 text-zinc-500 hover:bg-rose-500/10 hover:text-rose-500 transition-all opacity-0 group-hover/item:opacity-100">
                              <span className="text-lg leading-none">×</span>
                            </button>
                          </form>
                        </div>
                      ))}
                   </div>
                </div>
              )}
           </div>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        {agentProfiles.length > 1 ? (
          <div className="space-y-16">
             <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 border-b border-white/5 pb-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-6 flex-wrap">
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-500 bg-orange-500/5 px-4 py-1.5 rounded-full border border-orange-500/10 shadow-lg animate-glow">Nexus Terjalin</p>
                    <div className="flex -space-x-4">
                      {agentProfiles.map((p, i) => (
                        <div key={p.steamid} className="relative group/avatar" style={{ zIndex: agentProfiles.length - i }}>
                          {p.steamid !== steamId && (
                            <form method="post" action="/coop/remove" className="absolute -top-2 -right-2 z-30 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                              <input type="hidden" name="friendId" value={p.steamid} />
                              <button type="submit" className="bg-rose-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] border-2 border-[#09090b] font-bold hover:scale-110 active:scale-90 transition-all">×</button>
                            </form>
                          )}
                          <img 
                            src={p.avatarfull} 
                            className="w-12 h-12 rounded-2xl border-4 border-[#09090b] ring-1 ring-white/10 shadow-2xl hover:translate-y-[-4px] transition-transform duration-500" 
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white leading-[0.9]">
                    {sharedGames.length} Game <br /><span className="text-white/20 outline-text text-5xl md:text-7xl">Mabar</span>
                  </h3>
                </div>
             </header>

            <div className="space-y-10">
               <p className="text-[11px] font-black tracking-[0.5em] uppercase text-zinc-500 px-2">Rekomendasi Sesi Bermain Grup (Sorted by Relevance)</p>
               <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8 pt-4">
                {recommendations.map((game, idx) => (
                  <GameCard 
                    key={game.appid}
                    appId={game.appid}
                    name={game.name}
                    score={game.score}
                    tags={game.tags}
                    actionLabel="Mabar"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full min-h-[600px] flex items-center justify-center">
            <div className="glass p-16 md:p-24 rounded-[4rem] text-center space-y-10 max-w-xl border-dashed relative overflow-hidden group border-white/10">
              <div className="relative z-10 space-y-5">
                <h3 className="text-3xl font-black tracking-tight text-white uppercase leading-none">Standby <br />Operasional</h3>
                <p className="text-zinc-500 font-light text-base md:text-lg leading-relaxed">Sinkronkan minimal satu teman untuk memulai analisis konvergensi minat bermain.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>,
    { title: 'Co-op Nexus' } as any
  )
})

export default app

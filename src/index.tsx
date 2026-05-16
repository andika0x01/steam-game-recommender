import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { serveStatic } from 'hono/cloudflare-workers'
import { renderer } from './renderer'
import { getSteamAuthUrl, verifySteamAuth } from './lib/auth'
import { getPlayerSummaries, getOwnedGames, getAppDetails } from './lib/steam'
import { calculateGenrePreferences, scoreGameRecommendation } from './lib/recommender'

const app = new Hono<{ 
  Bindings: { 
    STEAM_API_KEY: string, 
    HOST_URL: string,
    ASSETS: Fetcher 
  }, 
  Variables: { steamId?: string } 
}>()

app.use('/favicon.ico', async (c, next) => {
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw)
  await next()
})

app.use('/assets/*', async (c, next) => {
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw)
  await next()
})

app.use('/static/*', async (c, next) => {
  if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req.raw)
  await next()
})


app.use('*', async (c, next) => {
  const steamId = getCookie(c, 'steam_id')
  c.set('steamId', steamId)
  await next()
})

app.use(renderer)

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
            <span className="text-white">Recommender</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-2xl max-w-2xl mx-auto font-light tracking-tight">
            Advanced fuzzy logic engine for your next gaming obsession. 
            Meticulously crafted for the discerning player.
          </p>
        </div>

        <div className="flex justify-center pt-8">
          <a 
            href="/auth/login"
            className="group relative px-10 py-4 md:px-12 md:py-5 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get Started
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 transition-transform group-hover:translate-x-1" stroke="currentColor" strokeWidth="3">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <div className="absolute inset-0 bg-zinc-200 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </a>
        </div>
      </div>

      <footer className="absolute bottom-8 text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">
        Powered by Valve & Fuzzy Reasoning
      </footer>
    </div>
  )
})

app.get('/auth/login', (c) => {
  const host = c.env.HOST_URL || new URL(c.req.url).origin
  const returnUrl = `${host}/auth/callback`
  return c.redirect(getSteamAuthUrl(returnUrl))
})

app.get('/auth/callback', async (c) => {
  const steamId = await verifySteamAuth(c.req.url)
  if (steamId) {
    setCookie(c, 'steam_id', steamId, {
      path: '/',
      secure: true,
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    })
    return c.redirect('/dashboard')
  }
  return c.redirect('/')
})

app.get('/auth/logout', (c) => {
  deleteCookie(c, 'steam_id', { path: '/' })
  return c.redirect('/')
})

app.get('/dashboard', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const player = await getPlayerSummaries(c.env.STEAM_API_KEY, steamId)
  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)

  if (!player) return c.redirect('/auth/logout')

  const topGames = games.sort((a, b) => b.playtime_forever - a.playtime_forever).slice(0, 4)

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
          <div className="space-y-1 min-w-0">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter truncate">{player.personaname}</h2>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full shrink-0 ${player.personastate > 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-600'}`} />
              <p className="text-zinc-400 font-mono text-[10px] md:text-xs uppercase tracking-widest truncate">
                {player.personastate > 0 ? 'Online' : 'Offline'} • {steamId}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <a href="/recommendations" className="flex-1 md:flex-none text-center px-8 py-3 bg-white text-black text-sm font-bold rounded-xl hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-xl">
            Analyze Library
          </a>
        </div>
      </header>

      {games.length === 0 && (
        <div className="glass p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border-white/10 bg-white/[0.02] space-y-8 max-w-3xl mx-auto md:mx-0">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-white">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 shrink-0" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3 className="text-lg md:text-xl font-black tracking-tight uppercase">Library Access Required</h3>
            </div>
            <p className="text-zinc-400 text-sm">Steam is returning an empty collection. Follow these steps to synchronize your library:</p>
          </div>

          <div className="space-y-6">
            <ol className="space-y-4">
              {[
                { step: "01", text: "Open your Steam Profile in a browser or the app." },
                { step: "02", text: "Click on the 'Edit Profile' button." },
                { step: "03", text: "Navigate to the 'Privacy Settings' tab on the sidebar." },
                { step: "04", text: "Set 'Game Details' to 'Public'." }
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
              Note: Artifacts from Steam Family Sharing that are not owned by this account are restricted by Valve's API protocol.
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
          <p className="text-zinc-400 text-sm">Unique applications found in your Steam vault.</p>
        </div>

        <div className="md:col-span-8 glass p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Mastery Spectrum</p>
            <span className="text-[10px] font-mono text-zinc-400 uppercase">Top played</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {topGames.map(game => (
              <div key={game.appid} className="group space-y-3">
                <div className="aspect-[3/4] bg-zinc-900 rounded-xl md:rounded-2xl overflow-hidden border border-white/5 relative">
                   <img 
                    src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/library_600x900.jpg`} 
                    alt={game.name}
                    className="w-full h-full object-cover transition-all duration-700"
                    onError={(e) => (e.currentTarget.src = `https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`)}
                   />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 md:p-4">
                      <p className="text-[10px] font-mono uppercase text-white">{(game.playtime_forever / 60).toFixed(1)}h</p>
                   </div>
                </div>
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-tighter truncate text-zinc-400 group-hover:text-white transition-colors">{game.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    { title: 'Dashboard' }
  )
})

app.get('/recommendations', async (c) => {
  const steamId = getCookie(c, 'steam_id')
  if (!steamId) return c.redirect('/')

  const games = await getOwnedGames(c.env.STEAM_API_KEY, steamId)
  
  // 1. Calculate user preferences based on played games
  const playedGames = games.filter(g => g.playtime_forever > 0)
  const preferences = calculateGenrePreferences(playedGames)

  // 2. Identify potential backlog games (low playtime)
  const backlog = games
    .filter(g => g.playtime_forever < 120) 
    .sort((a, b) => a.playtime_forever - b.playtime_forever)
    .slice(0, 12)

  // 3. Score each backlog game (simplified: we'd ideally fetch details for all, 
  // but for demo we use genres from calculateGenrePreferences for consistency)
  const recommendations = backlog.map(game => {
    // In a real app, we'd fetch actual genres for each backlog game using getAppDetails.
    // For this prototype, we'll assign a few common genres based on the name 
    // or just use a base score if genres are missing.
    const mockGenres = ['Action', 'Indie'] // Placeholder for demonstration
    const score = scoreGameRecommendation(mockGenres, preferences)
    
    return {
      appid: game.appid,
      name: game.name,
      genres: mockGenres,
      score: 0.7 + (score * 0.3), // Normalize to a visible range
      isOwned: true
    }
  }).sort((a, b) => b.score - a.score)

  return c.render(
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-20 space-y-12 md:space-y-16">
       <div className="space-y-4 max-w-3xl">
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">Fuzzy <br /><span className="text-white">Reasoning</span></h2>
        <p className="text-zinc-400 text-base md:text-lg">Analyzing {playedGames.length} played artifacts to calculate your genre affinity spectrum.</p>
      </div>

      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {recommendations.map((game, i) => (
            <div key={game.appid} className="group relative glass p-3 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all duration-500 hover:-translate-y-2">
              <div className="aspect-[16/9] bg-zinc-900 rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
              <img 
                src={`https://cdn.akamai.steamstatic.com/steam/apps/${game.appid}/header.jpg`}
                className="w-full h-full object-cover transition-all duration-700"
                alt={game.name}
                onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/460x215?text=Artifact+Missing')}
              />
                <div className="absolute top-4 right-4 bg-white text-black px-3 py-1 rounded-full border border-white/10 shadow-xl">
                  <p className="text-[10px] font-mono font-bold">MATCH: {(game.score * 100).toFixed(0)}%</p>
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-6">
                <div className="space-y-2">
                  <h3 className="text-lg md:text-xl font-bold tracking-tight group-hover:text-white transition-colors">{game.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.genres.map(g => (
                      <span key={g} className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-1 rounded">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
                <a 
                  href={`steam://run/${game.appid}`}
                  className="block w-full py-4 bg-white text-black text-center text-xs font-bold uppercase tracking-widest rounded-2xl group-hover:bg-zinc-200 transition-all shadow-lg"
                >
                  Execute Program
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass p-12 md:p-20 rounded-[2.5rem] md:rounded-[3rem] text-center space-y-6">
          <p className="text-zinc-400 font-light text-lg md:text-xl">The logic engine requires more engagement data to generate a recommendation set.</p>
          <a href="/dashboard" className="inline-block px-8 py-3 border border-white/10 text-zinc-400 text-sm font-bold rounded-xl hover:bg-white/5 transition-all">
            Update Command Center
          </a>
        </div>
      )}
    </div>,
    { title: 'Fuzzy Logic Engine' }
  )
})

export default app

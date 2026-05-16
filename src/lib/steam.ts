export interface SteamPlayer {
  steamid: string
  personaname: string
  profileurl: string
  avatarfull: string
  personastate: number
}

export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number
  img_icon_url: string
}

export async function getPlayerSummaries(apiKey: string, steamId: string): Promise<SteamPlayer | null> {
  const url = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return data?.response?.players?.[0] || null
  } catch (e) {
    console.error('getPlayerSummaries error:', e)
    return null
  }
}

export async function getOwnedGames(apiKey: string, steamId: string): Promise<SteamGame[]> {
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&appids_filter=0&format=json`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data?.response?.games || []
  } catch (e) {
    console.error('getOwnedGames error:', e)
    return []
  }
}

export async function getAppDetails(kv: KVNamespace, appId: number) {
  const cacheKey = `app_details:${appId}`
  try {
    const cached = await kv.get(cacheKey, 'json')
    if (cached) return cached

    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data && data[appId] && data[appId].success) {
      const appData = data[appId].data
      // Cache the relevant data permanently (genres rarely change)
      await kv.put(cacheKey, JSON.stringify(appData))
      return appData
    }
  } catch (e) {
    console.error(`getAppDetails error for ${appId}:`, e)
  }
  return null
}

export async function getTopStoreGames(): Promise<any[]> {
  // Mengambil data dari dua endpoint SteamSpy untuk cakupan kandidat yang lebih luas (~200 game)
  const endpoints = [
    'https://steamspy.com/api.php?request=top100in2weeks',
    'https://steamspy.com/api.php?request=top100forever'
  ]
  
  try {
    const results = await Promise.all(endpoints.map(url => fetch(url).then(res => res.json())))
    const combinedGames: Record<number, any> = {}
    
    results.forEach(data => {
      Object.values(data).forEach((g: any) => {
        if (g.appid) {
          combinedGames[g.appid] = {
            appid: g.appid,
            name: g.name,
            genres: [] // Will be enriched later via KV
          }
        }
      })
    })

    return Object.values(combinedGames).slice(0, 200)
  } catch (e) {
    console.error('getTopStoreGames error:', e)
    return []
  }
}

export async function resolveVanityURL(apiKey: string, vanityId: string): Promise<string | null> {
  const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${vanityId}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    if (data && data.response && data.response.success === 1) {
      return data.response.steamid
    }
  } catch (e) {
    console.error(`resolveVanityURL error for ${vanityId}:`, e)
  }
  return null
}

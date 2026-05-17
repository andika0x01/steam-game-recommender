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
  const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${apiKey}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&include_free_sub=1&skip_unvetted_apps=0&include_free_license=1&format=json`
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

export async function getGamesByTag(tag: string): Promise<any[]> {
  const url = `https://steamspy.com/api.php?request=tag&tag=${encodeURIComponent(tag)}`
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return Object.values(data).slice(0, 100).map((g: any) => ({
      appid: g.appid,
      name: g.name,
      genres: [] // To be enriched
    }))
  } catch (e) {
    console.error(`getGamesByTag error for ${tag}:`, e)
    return []
  }
}

export async function getDiscoveryCandidates(topGenres: string[]): Promise<any[]> {
  // Genre Stacking: Fetch 100 games for each of the top genres
  const results = await Promise.all(topGenres.map(tag => getGamesByTag(tag)))
  const combined: Record<number, any> = {}
  
  results.flat().forEach(g => {
    if (g.appid) combined[g.appid] = g
  })

  return Object.values(combined)
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

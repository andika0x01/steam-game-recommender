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
    
    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return null
    }

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

    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return []
    }

    const data = await res.json()
    return data?.response?.games || []
  } catch (e) {
    console.error('getOwnedGames error:', e)
    return []
  }
}

export async function getAppDetails(appId: number) {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}`
  try {
    const res = await fetch(url)
    if (!res.ok) return null

    const contentType = res.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return null
    }

    const data = await res.json()
    if (data && data[appId] && data[appId].success) {
      return data[appId].data
    }
  } catch (e) {
    console.error(`getAppDetails error for ${appId}:`, e)
  }
  return null
}

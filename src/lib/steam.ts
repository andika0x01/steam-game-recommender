export const ALLOWED_STEAM_TAGS = new Set([
  "Indie", "Action", "Adventure", "Casual", "Singleplayer", "Simulation", "RPG", "Strategy", "2D", "Early Access", "3D", "Free to Play",
  "Atmospheric", "Colorful", "Story Rich", "Exploration", "Fantasy", "Multiplayer", "Cute", "Pixel Graphics", "Puzzle", "Combat",
  "First-Person", "Action-Adventure", "Relaxing", "Funny", "Stylized", "Arcade", "Anime", "Controller", "Horror", "Sci-fi", "Sports",
  "Massively Multiplayer", "PvE", "Third Person", "Violent", "Choices Matter", "Shooter", "Retro", "Family Friendly", "Female Protagonist",
  "Top-Down", "Sexual Content", "Co-op", "Racing", "Realistic", "Dark", "PvP", "Nudity", "Linear", "Open World", "Mystery", "Survival",
  "Multiple Endings", "Character Customization", "Comedy", "Cartoony", "Gore", "Visual Novel", "Platformer", "Physics", "Psychological Horror",
  "Online Co-Op", "2D Platformer", "Roguelike", "Magic", "Roguelite", "Management", "Sandbox", "FPS", "Medieval", "Tactical",
  "Resource Management", "Hand-drawn", "Action RPG", "Old School", "Immersive Sim", "Minimalist", "Futuristic", "Crafting", "Building",
  "Point & Click", "Emotional", "Dark Fantasy", "Cartoon", "Action Roguelike", "Difficult", "Space", "3D Platformer",
  "Procedural Generation", "Romance", "Choose Your Own Adventure", "Interactive Fiction", "Nature", "Survival Horror", "Logic",
  "Turn-Based Combat", "Turn-Based Tactics", "Turn-Based Strategy", "Local Multiplayer", "Hentai", "1990's", "Base Building",
  "Hack and Slash", "Surreal", "VR", "Hidden Object", "Dating Sim", "Side Scroller", "Bullet Hell", "Puzzle Platformer",
  "Post-apocalyptic", "Education", "Walking Simulator", "Incremental", "Dungeon Crawler", "Cinematic", "Shoot 'Em Up", "Lore-Rich",
  "War", "Life Sim", "Dialogue Heavy", "Score Attack", "Great Soundtrack", "Card Game", "Text-Based", "Inventory Management",
  "Tabletop", "Zombies", "JRPG", "Psychological", "LGBTQ+", "Stealth", "1980s", "Economy", "Local Co-Op", "Investigation",
  "Thriller", "2.5D", "Historical", "Idler", "Supernatural", "Isometric", "Party-Based RPG", "Tutorial", "Dark Humor", "Nonlinear",
  "Third-Person Shooter", "Military", "Time Management", "Top-Down Shooter", "Replay Value", "Deckbuilding", "Demons", "Team-Based",
  "Artificial Intelligence", "Aliens", "Strategy RPG", "Loot", "Cyberpunk", "Robots", "Detective", "Collectathon", "Turn-Based",
  "Dystopian", "Modern", "Real Time Tactics", "Abstract", "Perma Death", "Tower Defense", "Driving", "RTS", "Precision Platformer",
  "Board Game", "Arena Shooter", "Souls-like", "Comic Book", "Psychedelic", "Tactical RPG", "Card Battler", "City Builder", "Memes",
  "Mythology", "Alternate History", "Automation", "Cats", "Wargame", "Capitalism", "4 Player Local", "Creature Collector",
  "Grid-Based Movement", "Short", "Crime", "Cozy", "Beat 'em up", "Flight", "Destruction", "Metroidvania", "Parkour", "Fast-Paced",
  "CRPG", "Level Editor", "Class-Based", "Runner", "Moddable", "Philosophical", "Music", "Dark Comedy", "2D Fighter", "Soundtrack",
  "Trading", "Gun Customization", "Automobile Sim", "Farming Sim", "Cooking", "3D Fighter", "Rhythm", "Competitive", "Fighting",
  "Auto Battler", "eSports", "Vehicular Combat", "MMORPG", "Co-op Campaign", "Lovecraftian", "Science", "Noir", "Swordplay",
  "Quick-Time Events", "Conspiracy", "Party Game", "Twin Stick Shooter", "Dragons", "Word Game", "Colony Sim", "Space Sim", "Satire",
  "Parody", "Gothic", "Grand Strategy", "Classic", "Experimental", "Dynamic Narration", "Looter Shooter", "Battle Royale", "Mining",
  "Mystery Dungeon", "Underground", "6DOF", "Split Screen", "Agriculture", "World War II", "Narrative", "Bullet Time",
  "Time Manipulation", "Fishing", "Political", "Martial Arts", "Wholesome", "Beautiful", "Roguelike Deckbuilder", "Hero Shooter",
  "Spectacle fighter", "Mechs", "Match 3", "Combat Racing", "Dogs", "Immersive", "Gambling", "Action RTS", "Open World Survival Craft",
  "Asynchronous Multiplayer", "Time Travel", "Voxel", "FMV", "Ninja", "Vampires", "Otome", "Trading Card Game", "God Game", "Solitaire",
  "Politics", "Steampunk", "Transportation", "Pirates", "Underwater", "Hunting", "Boomer Shooter", "Hex Grid", "Hacking", "Faith",
  "Shop Keeper", "Tanks", "Political Sim", "Trains", "MOBA", "Typing", "4X", "Sokoban", "Assassins", "Superhero", "Remake", "Party",
  "Character Action Game", "Dinosaurs", "Diplomacy", "Western", "Heist", "Minigames", "Cold War", "Mouse Only", "Naval", "Snow",
  "Transhumanism", "Traditional Roguelike", "Job Simulator", "Naval Combat", "Sailing", "Addictive", "Escape Room", "Archery", "Horses",
  "Real-Time", "Episodic", "Nostalgia", "Farming", "Epic", "Music-Based Procedural Generation", "Offroad", "Trivia", "Villain Protagonist",
  "Werewolves", "Football (Soccer)", "Sniper", "Real-Time with Pause", "On-Rails Shooter", "Time Attack", "Sequel", "Spelling", "Mars",
  "Outbreak Sim", "World War I", "Boxing", "Bullet Heaven", "Dwarves", "Chess", "Touch-Friendly", "Mod", "Spaceships", "Animals",
  "Basketball", "Golf", "Medical Sim", "Submarine", "Baseball", "Motorbike", "Extraction Shooter", "Jump Scare", "Gaming",
  "Social Deduction", "Rome", "Bikes", "Pinball", "Dice", "Electronic Music", "Asymmetric VR", "Wrestling", "Boss Rush",
  "Silent Protagonist", "Skateboarding", "Elves", "Instrumental Music", "Mini Golf", "Football (American)", "Billiards", "Skating",
  "Vikings", "Rock Music", "Cycling", "Tennis", "Motocross", "Birds", "Intentionally Awkward Controls", "Mahjong", "Bowling", "Hockey",
  "Based On A Novel", "ATV", "Lemmings", "8-bit Music", "Snowboarding", "Skiing", "Decorating", "Wuxia", "Foxes", "BMX", "Organizing",
  "Musou", "Cleaning", "Hobby Sim", "Espionage", "Xianxia", "Samurai", "Cult", "Poker", "Falling Blocks", "Volleyball", "Capybaras",
  "Cricket", "Language Learning", "Wolves", "Zoo", "Rugby", "Snooker", "Reboot"
]);

const ALLOWED_STEAM_TAGS_LOWER = new Set(
  Array.from(ALLOWED_STEAM_TAGS).map((tag) => tag.toLowerCase())
);

export const isAllowedSteamTag = (tag?: string | null) => {
  return Boolean(tag && ALLOWED_STEAM_TAGS_LOWER.has(tag.toLowerCase()));
};

export interface SteamPlayer {
  steamid: string;
  communityvisibilitystate: number;
  profilestate: number;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  lastlogoff: number;
  personastate: number;
  realname?: string;
  primaryclanid?: string;
  timecreated?: number;
  personastateflags?: number;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: number;
}

export interface SteamGame {
  appid: number;
  name?: string;
  playtime_2weeks?: number;
  playtime_forever: number;
  img_icon_url?: string;
  img_logo_url?: string;
  has_community_visible_stats?: boolean;
  playtime_windows_forever: number;
  playtime_mac_forever: number;
  playtime_linux_forever: number;
  rtime_last_played?: number;
}

export interface SteamFriend {
  steamid: string;
  relationship: string;
  friend_since: number;
}

export interface SteamGetFriendListResponse {
  friendslist: {
    friends: SteamFriend[];
  };
}

export interface SteamGetPlayerSummariesResponse {
  response: {
    players: SteamPlayer[];
  };
}

export interface SteamGetOwnedGamesResponse {
  response: {
    game_count: number;
    games?: SteamGame[];
  };
}

export interface SteamRecentlyPlayedGamesResponse {
  response: {
    total_count: number;
    games?: SteamGame[];
  };
}

export interface SteamGetCurrentPlayersResponse {
  response: {
    player_count: number;
    result: number;
  };
}

export interface SteamAppReviewSummary {
  num_reviews: number;
  review_score: number;
  review_score_desc: string;
  total_positive: number;
  total_negative: number;
  total_reviews: number;
}

export interface SteamAppReviewsResponse {
  success: number;
  query_summary: SteamAppReviewSummary;
}

export interface SteamStoreAppDetails {
  type: string;
  name: string;
  steam_appid: number;
  required_age: number;
  is_free: boolean;
  detailed_description: string;
  about_the_game: string;
  short_description: string;
  supported_languages: string;
  header_image: string;
  website: string;
  pc_requirements: {
    minimum: string;
    recommended: string;
  };
  developers: string[];
  publishers: string[];
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  categories: Array<{ id: number; description: string }>;
  genres: Array<{ id: string; description: string }>;
  screenshots: Array<{ id: number; path_thumbnail: string; path_full: string }>;
  release_date: {
    coming_soon: boolean;
    date: string;
  };
}

export interface SteamStoreAppDetailsResponse {
  [appid: string]: {
    success: boolean;
    data: SteamStoreAppDetails;
  };
}

export interface SteamSearchResult {
  name: string;
  logo: string;
  id?: number; 
}

export interface SteamSearchResponse {
  total_count?: number;
  items: SteamSearchResult[];
}

export interface SteamSearchOptions {
  term?: string;
  tags?: number[];
  genre?: string;
  category1?: number; 
  os?: 'win' | 'mac' | 'linux';
  sort_by?: 'Released_DESC' | 'Price_ASC' | 'Price_DESC' | 'Reviews_DESC' | 'Name_ASC';
  specials?: boolean;
  maxprice?: number | 'free';
  cc?: string;
  l?: string;
  start?: number; // Menambahkan dukungan offset pagination
}

/**
 * Wrapper API Steam
 * 
 * Kelas ini menangani semua komunikasi dengan API Web Steam dan API Toko Steam.
 * Mendukung caching menggunakan Cloudflare KV untuk mengoptimalkan performa
 * dan menghindari pembatasan rate limit dari Steam.
 */
export class SteamAPI {
  private apiKey: string;
  private kv?: KVNamespace;
  private baseUrl = 'https://api.steampowered.com';
  private storeUrl = 'https://store.steampowered.com/api';
  private storefrontUrl = 'https://store.steampowered.com';

  constructor(apiKey: string, kv?: KVNamespace) {
    this.apiKey = apiKey;
    this.kv = kv;
  }

  async getPlayerSummaries(steamIds: string[]): Promise<SteamPlayer[]> {
    const url = new URL(`${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/`);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('steamids', steamIds.join(','));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.statusText}`);
    }

    const data = (await response.json()) as SteamGetPlayerSummariesResponse;
    return data.response.players;
  }

  async getFriendList(steamId: string, relationship: 'friend' | 'all' = 'friend'): Promise<SteamFriend[]> {
    const url = new URL(`${this.baseUrl}/ISteamUser/GetFriendList/v0001/`);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('steamid', steamId);
    url.searchParams.append('relationship', relationship);

    const response = await fetch(url.toString());
    if (!response.ok) {
      if (response.status === 401) return []; 
      throw new Error(`Steam API error: ${response.statusText}`);
    }

    const data = (await response.json()) as SteamGetFriendListResponse;
    return data.friendslist.friends || [];
  }

  async searchGames(options: SteamSearchOptions = {}): Promise<SteamSearchResult[]> {
    const cacheKey = `steam_search_v3_${JSON.stringify(options)}`;
    if (this.kv) {
      const cached = await this.kv.get(cacheKey, 'json');
      if (cached) {
        return cached as SteamSearchResult[];
      }
    }

    const url = new URL(`${this.storefrontUrl}/search/results`);
    url.searchParams.append('json', '1');
    
    if (options.term) url.searchParams.append('term', options.term);
    if (options.tags && options.tags.length > 0) url.searchParams.append('tags', options.tags.join(','));
    if (options.genre) url.searchParams.append('genre', options.genre);
    
    const category = options.category1 || 998;
    url.searchParams.append('category1', category.toString());
    
    if (options.os) url.searchParams.append('os', options.os);
    if (options.sort_by) url.searchParams.append('sort_by', options.sort_by);
    if (options.specials) url.searchParams.append('specials', '1');
    if (options.maxprice) url.searchParams.append('maxprice', options.maxprice.toString());
    if (options.cc) url.searchParams.append('cc', options.cc);
    if (options.l) url.searchParams.append('l', options.l);
    if (options.start !== undefined) url.searchParams.append('start', options.start.toString());

      const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      console.warn(`Steam Search API error: ${response.status} ${response.statusText} for ${url}`);
      return [];
    }

    let data: SteamSearchResponse;
    try {
      data = (await response.json()) as SteamSearchResponse;
    } catch (e) {
      console.warn(`Steam Search API parsing error for ${url}:`, e);
      return [];
    }
    
    const results = (data.items || []).map(item => {
      const idMatch = item.logo.match(/\/apps\/(\d+)\//);
      return {
        ...item,
        id: idMatch ? parseInt(idMatch[1]) : undefined
      };
    });

    if (this.kv && results.length > 0) {
      // Cache pencarian bertahan 7 hari agar stabil tapi tetap bisa update mingguan
      await this.kv.put(cacheKey, JSON.stringify(results), { expirationTtl: 604800 });
    }

    return results;
  }

  private filterNonGames(games: SteamGame[]): SteamGame[] {
    const softwareKeywords = [
      'software', 'utility', 'utilities', 'tool', 'sdk', 'dedicated server', 
      'benchmark', 'modeling', 'animation', 'production', 'publishing', 'editing',
      'wallpaper engine', 'soundpad', 'rpg maker', 'game maker', 'test tool', 'beta'
    ];
    
    return games.filter(game => {
      if (!game.name) return true;
      const lowerName = game.name.toLowerCase();
      return !softwareKeywords.some(keyword => lowerName.includes(keyword));
    });
  }

  async getOwnedGames(steamId: string, includeAppInfo = true, includeFreeGames = true): Promise<SteamGame[]> {
    const url = new URL(`${this.baseUrl}/IPlayerService/GetOwnedGames/v0001/`);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('steamid', steamId);
    url.searchParams.append('format', 'json');
    if (includeAppInfo) {
      url.searchParams.append('include_appinfo', '1');
    }
    if (includeFreeGames) {
      url.searchParams.append('include_played_free_games', '1');
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.statusText}`);
    }

    const data = (await response.json()) as SteamGetOwnedGamesResponse;
    const games = data.response.games || [];
    return this.filterNonGames(games);
  }

  async getRecentlyPlayedGames(steamId: string, count?: number): Promise<SteamGame[]> {
    const url = new URL(`${this.baseUrl}/IPlayerService/GetRecentlyPlayedGames/v0001/`);
    url.searchParams.append('key', this.apiKey);
    url.searchParams.append('steamid', steamId);
    url.searchParams.append('format', 'json');
    if (count) {
      url.searchParams.append('count', count.toString());
    }

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.statusText}`);
    }

    const data = (await response.json()) as SteamRecentlyPlayedGamesResponse;
    const games = data.response.games || [];
    return this.filterNonGames(games);
  }

  async getCurrentPlayers(appId: number): Promise<number> {
    const url = new URL(`${this.baseUrl}/ISteamUserStats/GetNumberOfCurrentPlayers/v1/`);
    url.searchParams.append('appid', appId.toString());

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.statusText}`);
    }

    const data = (await response.json()) as SteamGetCurrentPlayersResponse;
    return data.response.player_count || 0;
  }

  async getAppReviews(appId: number): Promise<SteamAppReviewSummary | null> {
    const cacheKey = `steam_reviews_${appId}`;
    if (this.kv) {
      const cached = await this.kv.get(cacheKey, 'json');
      if (cached) {
        return cached as SteamAppReviewSummary;
      }
    }

    const url = new URL(`${this.storefrontUrl}/appreviews/${appId}`);
    url.searchParams.append('json', '1');
    url.searchParams.append('language', 'all');
    url.searchParams.append('purchase_type', 'all');

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn(`Steam App Reviews API error: ${response.status} ${response.statusText} for app ${appId}`);
      return null;
    }

    let data: SteamAppReviewsResponse;
    try {
      data = (await response.json()) as SteamAppReviewsResponse;
    } catch (e) {
      console.warn(`Steam App Reviews API parsing error for app ${appId}:`, e);
      return null;
    }
    
    if (data.success !== 1) {
      return null;
    }

    if (this.kv) {
      // Cache review permanen (tanpa TTL) karena volume besar jarang berubah drastis proporsinya
      await this.kv.put(cacheKey, JSON.stringify(data.query_summary));
    }

    return data.query_summary;
  }
  async getAppStoreDetails(appId: number | string, language: string = 'english', cc?: string): Promise<SteamStoreAppDetails | null> {
    const cacheKey = `steam_appdetails_${appId}_${language}_${cc || ''}`;
    if (this.kv) {
      const cached = await this.kv.get(cacheKey, 'json');
      if (cached) {
        return cached as SteamStoreAppDetails;
      }
    }

    const url = new URL('https://store.steampowered.com/api/appdetails');
    url.searchParams.append('appids', appId.toString());
    url.searchParams.append('l', language);
    if (cc) {
      url.searchParams.append('cc', cc);
    }

    const response = await fetch(url.toString(), {
      headers: { 'Accept-Language': 'en-US,en;q=0.9' }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json() as any;
    
    if (!data[appId.toString()] || !data[appId.toString()].success) {
      return null;
    }
    
    const result = data[appId.toString()].data as SteamStoreAppDetails;

    if (this.kv) {
      // Cache detail game permanen untuk efisiensi API
      await this.kv.put(cacheKey, JSON.stringify(result));
    }

    return result;
  }

  /**
   * Mengambil detail untuk beberapa appId sekaligus.
   * Steam API mendukung pemisahan koma untuk appids.
   */
  async getAppStoreDetailsBatch(appIds: number[], language: string = 'english', cc?: string): Promise<(SteamStoreAppDetails | null)[]> {
    if (appIds.length === 0) return [];

    const results = new Array(appIds.length).fill(null);
    const missingIndices: number[] = [];
    const missingIds: number[] = [];

    // 1. Cek KV untuk setiap ID
    if (this.kv) {
      const cachePromises = appIds.map(async (id, idx) => {
        const cacheKey = `steam_appdetails_${id}_${language}_${cc || ''}`;
        const cached = await this.kv!.get(cacheKey, 'json');
        if (cached) {
          results[idx] = cached as SteamStoreAppDetails;
        } else {
          missingIndices.push(idx);
          missingIds.push(id);
        }
      });
      await Promise.all(cachePromises);
    } else {
      appIds.forEach((id, idx) => {
        missingIndices.push(idx);
        missingIds.push(id);
      });
    }

    if (missingIds.length === 0) return results;

    // 2. Ambil dari Steam API secara individual karena Steam memblokir multi-appid 
    // jika tanpa parameter spesifik (mengembalikan null).
    for (let i = 0; i < missingIds.length; i += 1) {
      const id = missingIds[i];
      const originalIdx = missingIndices[i];
      const url = new URL('https://store.steampowered.com/api/appdetails');
      url.searchParams.append('appids', id.toString());
      url.searchParams.append('l', language);
      if (cc) url.searchParams.append('cc', cc);

      try {
        const response = await fetch(url.toString(), {
          headers: { 'Accept-Language': 'en-US,en;q=0.9' }
        });
        if (!response.ok) continue;

        const data = await response.json() as any;
        
        if (data && data[id.toString()] && data[id.toString()].success) {
          const gameData = data[id.toString()].data as SteamStoreAppDetails;
          results[originalIdx] = gameData;
          
          // Simpan ke KV
          if (this.kv) {
            const cacheKey = `steam_appdetails_${id}_${language}_${cc || ''}`;
            await this.kv.put(cacheKey, JSON.stringify(gameData));
          }
        }
      } catch (e) {
        console.error(`Error fetching detail for ${id}:`, e);
      }
      
      // Delay kecil untuk mencegah rate limit 429
      if (i < missingIds.length - 1) {
        await new Promise(res => setTimeout(res, 200));
      }
    }

    return results;
  }

}

export async function resolveVanityURL(apiKey: string, vanityId: string): Promise<string | null> {
  const url = new URL('https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('vanityurl', vanityId);

  const response = await fetch(url.toString());
  if (!response.ok) return null;
  const data = (await response.json()) as any;
  return data.response.success === 1 ? data.response.steamid : null;
}

export async function getOwnedGames(apiKey: string, steamId: string): Promise<SteamGame[]> {
  const api = new SteamAPI(apiKey);
  return await api.getOwnedGames(steamId);
}

export async function getPlayerSummaries(apiKey: string, steamIds: string | string[]): Promise<SteamPlayer | SteamPlayer[] | null> {
  const api = new SteamAPI(apiKey);
  const ids = Array.isArray(steamIds) ? steamIds : [steamIds];
  const players = await api.getPlayerSummaries(ids);
  return Array.isArray(steamIds) ? players : (players[0] || null);
}

export async function getAppDetails(appId: number): Promise<SteamStoreAppDetails | null> {
  const api = new SteamAPI(''); 
  return await api.getAppStoreDetails(appId);
}

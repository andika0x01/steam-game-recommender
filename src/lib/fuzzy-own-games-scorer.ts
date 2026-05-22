import { SteamGame } from './steam';

/**
 * Kelas FuzzyOwnGamesScorer
 * 
 * Perbaikan: Menambahkan Linear Tie-Breaker untuk memastikan skor bervariasi
 * dan tidak menumpuk di nilai bulat (seperti 30%, 50%).
 */
export class FuzzyOwnGamesScorer {
  private maxPlaytimeForever: number = 0;
  private maxPlaytime2Weeks: number = 0;
  private userGames: Map<number, SteamGame> = new Map();

  constructor(userGames: SteamGame[]) {
    userGames.forEach((game) => {
      this.userGames.set(game.appid, game);
      if (game.playtime_forever > this.maxPlaytimeForever) {
        this.maxPlaytimeForever = game.playtime_forever;
      }
      if ((game.playtime_2weeks || 0) > this.maxPlaytime2Weeks) {
        this.maxPlaytime2Weeks = game.playtime_2weeks || 0;
      }
    });
  }

  private trapMF(x: number, a: number, b: number, c: number, d: number): number {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x > a && x < b) return (x - a) / (b - a);
    if (x > c && x < d) return (d - x) / (d - c);
    return 0;
  }

  getGameScore(gameId: number): number {
    const game = this.userGames.get(gameId);
    if (!game) return 0;

    const playtimeNorm = this.maxPlaytimeForever > 0 ? game.playtime_forever / this.maxPlaytimeForever : 0;
    const activityNorm = this.maxPlaytime2Weeks > 0 ? (game.playtime_2weeks || 0) / this.maxPlaytime2Weeks : 0;
    const daysSincePlayed = game.rtime_last_played 
      ? (Date.now() / 1000 - game.rtime_last_played) / 86400 
      : 365;

    const playtime = {
      tidak_dimainkan: this.trapMF(playtimeNorm, -0.1, 0, 0.02, 0.08),
      dicoba: this.trapMF(playtimeNorm, 0.02, 0.08, 0.15, 0.25),
      cukup: this.trapMF(playtimeNorm, 0.15, 0.25, 0.45, 0.55),
      sering: this.trapMF(playtimeNorm, 0.45, 0.55, 0.75, 0.85),
      sangat_banyak: this.trapMF(playtimeNorm, 0.75, 0.85, 1.0, 1.1),
    };

    const recency = {
      baru_main: this.trapMF(daysSincePlayed, -1, 0, 7, 14),
      agak_lama: this.trapMF(daysSincePlayed, 7, 14, 30, 45),
      lama: this.trapMF(daysSincePlayed, 30, 45, 90, 120),
      sangat_lama: this.trapMF(daysSincePlayed, 90, 120, 180, 240),
      ditinggal: this.trapMF(daysSincePlayed, 180, 240, 10000, 10001),
    };

    const activity = {
      tidak_aktif: this.trapMF(activityNorm, -0.1, 0, 0, 0.1),
      sesekali: this.trapMF(activityNorm, 0, 0.1, 0.25, 0.4),
      aktif: this.trapMF(activityNorm, 0.25, 0.4, 0.6, 0.75),
      sangat_aktif: this.trapMF(activityNorm, 0.6, 0.75, 1.0, 1.1),
    };

    const activation = {
      SANGAT_RENDAH: 0,
      RENDAH: 0,
      SEDANG: 0,
      TINGGI: 0,
      SANGAT_TINGGI: 0,
    };

    activation.SANGAT_TINGGI = Math.max(Math.min(playtime.sangat_banyak, recency.baru_main), Math.min(playtime.sering, activity.sangat_aktif));
    activation.TINGGI = Math.max(Math.min(playtime.sering, activity.aktif), Math.min(playtime.cukup, activity.sangat_aktif));
    activation.SEDANG = Math.max(playtime.cukup, activity.sesekali);
    activation.RENDAH = Math.max(Math.min(playtime.dicoba, recency.lama), activity.tidak_aktif);
    activation.SANGAT_RENDAH = Math.max(playtime.tidak_dimainkan, recency.ditinggal);

    const weights = {
      SANGAT_RENDAH: 0.1,
      RENDAH: 0.3,
      SEDANG: 0.5,
      TINGGI: 0.7,
      SANGAT_TINGGI: 0.9,
    };

    let numerator = 0;
    let denominator = 0;
    for (const key in activation) {
      const k = key as keyof typeof activation;
      if (activation[k] > 0) {
        numerator += activation[k] * weights[k];
        denominator += activation[k];
      }
    }

    const fuzzyScore = denominator > 0 ? numerator / denominator : 0.5;
    
    /**
     * Linear Tie-Breaker:
     * Mencampurkan 10% nilai input mentah untuk memberikan variasi
     * pada game dalam kategori yang sama.
     */
    const rawBias = (playtimeNorm * 0.05) + (activityNorm * 0.05);
    return Math.min(1, fuzzyScore * 0.9 + rawBias);
  }
}

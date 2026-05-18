import { SteamGame } from './steam';

export class FuzzyBayesianScorer {
  private maxPlaytimeForever: number = 0;
  private maxPlaytime2Weeks: number = 0;
  private userGames: Map<number, SteamGame> = new Map();
  private gameReviews: Map<number, number> = new Map();

  constructor(userGames: SteamGame[], gameReviews: Record<number, number>) {
    userGames.forEach((game) => {
      this.userGames.set(game.appid, game);
      if (game.playtime_forever > this.maxPlaytimeForever) {
        this.maxPlaytimeForever = game.playtime_forever;
      }
      if ((game.playtime_2weeks || 0) > this.maxPlaytime2Weeks) {
        this.maxPlaytime2Weeks = game.playtime_2weeks || 0;
      }
    });

    for (const [appid, score] of Object.entries(gameReviews)) {
      this.gameReviews.set(Number(appid), score);
    }
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

    const reviewPositivity = this.gameReviews.get(gameId) ?? 0.5;

    // 1. Normalisasi
    const playtimeNorm = this.maxPlaytimeForever > 0 ? game.playtime_forever / this.maxPlaytimeForever : 0;
    const activityNorm = this.maxPlaytime2Weeks > 0 ? (game.playtime_2weeks || 0) / this.maxPlaytime2Weeks : 0;
    const daysSincePlayed = game.rtime_last_played 
      ? (Date.now() / 1000 - game.rtime_last_played) / 86400 
      : 365;

    // 2. Fuzzifikasi
    const playtime = {
      tidak_dimainkan: this.trapMF(playtimeNorm, -0.1, 0, 0.02, 0.05),
      dicoba: this.trapMF(playtimeNorm, 0.02, 0.05, 0.15, 0.2),
      cukup: this.trapMF(playtimeNorm, 0.1, 0.2, 0.4, 0.5),
      sering: this.trapMF(playtimeNorm, 0.3, 0.4, 0.7, 0.8),
      sangat_banyak: this.trapMF(playtimeNorm, 0.6, 0.8, 1.0, 1.1),
    };

    const recency = {
      baru_main: this.trapMF(daysSincePlayed, -1, 0, 5, 7),
      agak_lama: this.trapMF(daysSincePlayed, 5, 10, 25, 30),
      lama: this.trapMF(daysSincePlayed, 20, 30, 80, 90),
      sangat_lama: this.trapMF(daysSincePlayed, 60, 90, 150, 180),
      ditinggal: this.trapMF(daysSincePlayed, 150, 180, 100000, 100001),
    };

    const activity = {
      tidak_aktif: this.trapMF(activityNorm, -0.1, 0, 0, 0.05),
      sesekali: this.trapMF(activityNorm, 0, 0.05, 0.2, 0.3),
      aktif: this.trapMF(activityNorm, 0.2, 0.3, 0.6, 0.7),
      sangat_aktif: this.trapMF(activityNorm, 0.5, 0.7, 1.0, 1.1),
    };

    // 3. Rule Evaluation (MIN for AND, MAX for same output)
    const activation = {
      SANGAT_RENDAH: 0,
      RENDAH: 0,
      SEDANG: 0,
      TINGGI: 0,
      SANGAT_TINGGI: 0,
    };

    // R1: IF playtime IS sangat_banyak AND recency IS baru_main THEN suka = SANGAT_TINGGI
    activation.SANGAT_TINGGI = Math.max(activation.SANGAT_TINGGI, Math.min(playtime.sangat_banyak, recency.baru_main));
    
    // R2: IF playtime IS sering AND activity IS aktif THEN suka = TINGGI
    activation.TINGGI = Math.max(activation.TINGGI, Math.min(playtime.sering, activity.aktif));
    
    // R3: IF playtime IS cukup AND recency IS lama THEN suka = SEDANG
    activation.SEDANG = Math.max(activation.SEDANG, Math.min(playtime.cukup, recency.lama));
    
    // R4: IF playtime IS dicoba AND recency IS ditinggal THEN suka = RENDAH
    activation.RENDAH = Math.max(activation.RENDAH, Math.min(playtime.dicoba, recency.ditinggal));
    
    // R5: IF playtime IS tidak_dimainkan THEN suka = SANGAT_RENDAH
    activation.SANGAT_RENDAH = Math.max(activation.SANGAT_RENDAH, playtime.tidak_dimainkan);
    
    // R6: IF playtime IS sangat_banyak AND recency IS ditinggal THEN suka = SEDANG
    activation.SEDANG = Math.max(activation.SEDANG, Math.min(playtime.sangat_banyak, recency.ditinggal));

    // 4. Defuzzifikasi (Weighted Average)
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

    // 5. Bayesian Update
    const likelihood = fuzzyScore;
    const prior = reviewPositivity;
    
    // P(perilaku) = P(perilaku|suka) * P(suka) + P(perilaku|tidak_suka) * P(tidak_suka)
    const pPerilaku = (likelihood * prior) + ((1 - likelihood) * (1 - prior));
    
    if (pPerilaku === 0) return 0;
    
    const posterior = (likelihood * prior) / pPerilaku;
    return posterior;
  }
}

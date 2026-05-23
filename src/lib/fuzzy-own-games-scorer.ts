import { SteamGame } from './steam';

/**
 * Kelas FuzzyOwnGamesScorer
 * 
 * Sistem inferensi fuzzy untuk mengevaluasi game di library pengguna.
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
    return this.getGameScoreDetailed(gameId).score;
  }

  getGameScoreDetailed(gameId: number): { 
    score: number; 
    details: { 
      playtime: any, 
      recency: any, 
      activity: any, 
      activation: any,
      process: {
        fuzzification: {
          inputs: {
            playtime_forever: number,
            playtime_2weeks: number,
            days_since_played: number,
            max_playtime_forever: number,
            max_playtime_2weeks: number
          },
          normalization: {
            playtime: number,
            activity: number
          },
          memberships: {
            playtime: any,
            recency: any,
            activity: any
          }
        },
        inference: {
          rules: Array<{
            output: string,
            label: string,
            antecedents: Array<{
              variable: string,
              term: string,
              value: number
            }>,
            alpha: number,
            expression: string
          }>,
          activation: any
        },
        defuzzification: {
          weights: Record<string, number>,
          numerator: number,
          denominator: number,
          score: number,
          usedFallback: boolean,
          formula: string
        }
      }
    } 
  } {
    const game = this.userGames.get(gameId);
    if (!game) return { 
      score: 0, 
      details: { 
        playtime: {}, 
        recency: {}, 
        activity: {}, 
        activation: {},
        process: {
          fuzzification: {
            inputs: {
              playtime_forever: 0,
              playtime_2weeks: 0,
              days_since_played: 0,
              max_playtime_forever: 0,
              max_playtime_2weeks: 0
            },
            normalization: {
              playtime: 0,
              activity: 0
            },
            memberships: {
              playtime: {},
              recency: {},
              activity: {}
            }
          },
          inference: {
            rules: [],
            activation: {}
          },
          defuzzification: {
            weights: {},
            numerator: 0,
            denominator: 0,
            score: 0,
            usedFallback: true,
            formula: '\\[\\text{score} = 0\\]'
          }
        }
      } 
    };

    const playtimeRaw = game.playtime_forever;
    const activityRaw = game.playtime_2weeks || 0;
    const daysSincePlayed = game.rtime_last_played 
      ? (Date.now() / 1000 - game.rtime_last_played) / 86400 
      : 365;

    const playtime = {
      tidak_dimainkan: this.trapMF(playtimeRaw, -1, 0, 30, 60),
      dicoba: this.trapMF(playtimeRaw, 30, 60, 300, 600),
      cukup: this.trapMF(playtimeRaw, 300, 600, 3000, 6000),
      sering: this.trapMF(playtimeRaw, 3000, 6000, 9000, 12000),
      sangat_banyak: this.trapMF(playtimeRaw, 9000, 12000, 99999, 100000),
    };

    const recency = {
      baru_main: this.trapMF(daysSincePlayed, -1, 0, 7, 14),
      agak_lama: this.trapMF(daysSincePlayed, 7, 14, 30, 45),
      lama: this.trapMF(daysSincePlayed, 30, 45, 90, 120),
      sangat_lama: this.trapMF(daysSincePlayed, 90, 120, 180, 240),
      ditinggal: this.trapMF(daysSincePlayed, 180, 240, 10000, 10001),
    };

    const activity = {
      tidak_aktif: this.trapMF(activityRaw, -1, 0, 30, 120),
      sesekali: this.trapMF(activityRaw, 30, 120, 420, 840),
      aktif: this.trapMF(activityRaw, 420, 840, 1680, 2520),
      sangat_aktif: this.trapMF(activityRaw, 1680, 2520, 99999, 100000),
    };

    const ruleDefinitions = [
      {
        output: 'SANGAT_TINGGI',
        label: 'Sangat tinggi',
        antecedents: [
          { variable: 'playtime', term: 'sangat_banyak', value: playtime.sangat_banyak },
          { variable: 'recency', term: 'baru_main', value: recency.baru_main }
        ]
      },
      {
        output: 'SANGAT_TINGGI',
        label: 'Sangat tinggi',
        antecedents: [
          { variable: 'playtime', term: 'sering', value: playtime.sering },
          { variable: 'activity', term: 'sangat_aktif', value: activity.sangat_aktif },
          { variable: 'recency', term: 'baru_main', value: recency.baru_main }
        ]
      },
      {
        output: 'TINGGI',
        label: 'Tinggi',
        antecedents: [
          { variable: 'playtime', term: 'sangat_banyak', value: playtime.sangat_banyak },
          { variable: 'recency', term: 'agak_lama', value: recency.agak_lama }
        ]
      },
      {
        output: 'TINGGI',
        label: 'Tinggi',
        antecedents: [
          { variable: 'playtime', term: 'sering', value: playtime.sering },
          { variable: 'activity', term: 'aktif', value: activity.aktif }
        ]
      },
      {
        output: 'TINGGI',
        label: 'Tinggi',
        antecedents: [
          { variable: 'playtime', term: 'sering', value: playtime.sering },
          { variable: 'recency', term: 'baru_main', value: recency.baru_main }
        ]
      },
      {
        output: 'SEDANG',
        label: 'Sedang',
        antecedents: [
          { variable: 'playtime', term: 'cukup', value: playtime.cukup },
          { variable: 'recency', term: 'agak_lama', value: recency.agak_lama }
        ]
      },
      {
        output: 'SEDANG',
        label: 'Sedang',
        antecedents: [
          { variable: 'playtime', term: 'cukup', value: playtime.cukup },
          { variable: 'activity', term: 'sesekali', value: activity.sesekali }
        ]
      },
      {
        output: 'SEDANG',
        label: 'Sedang',
        antecedents: [
          { variable: 'playtime', term: 'sering', value: playtime.sering },
          { variable: 'recency', term: 'lama', value: recency.lama }
        ]
      },
      {
        output: 'RENDAH',
        label: 'Rendah',
        antecedents: [
          { variable: 'playtime', term: 'dicoba', value: playtime.dicoba },
          { variable: 'recency', term: 'lama', value: recency.lama }
        ]
      },
      {
        output: 'RENDAH',
        label: 'Rendah',
        antecedents: [
          { variable: 'playtime', term: 'cukup', value: playtime.cukup },
          { variable: 'recency', term: 'sangat_lama', value: recency.sangat_lama }
        ]
      },
      {
        output: 'RENDAH',
        label: 'Rendah',
        antecedents: [
          { variable: 'playtime', term: 'dicoba', value: playtime.dicoba },
          { variable: 'activity', term: 'tidak_aktif', value: activity.tidak_aktif }
        ]
      },
      {
        output: 'SANGAT_RENDAH',
        label: 'Sangat rendah',
        antecedents: [
          { variable: 'playtime', term: 'tidak_dimainkan', value: playtime.tidak_dimainkan }
        ]
      },
      {
        output: 'SANGAT_RENDAH',
        label: 'Sangat rendah',
        antecedents: [
          { variable: 'recency', term: 'ditinggal', value: recency.ditinggal },
          { variable: 'playtime', term: 'dicoba', value: playtime.dicoba }
        ]
      },
      {
        output: 'SANGAT_RENDAH',
        label: 'Sangat rendah',
        antecedents: [
          { variable: 'recency', term: 'ditinggal', value: recency.ditinggal },
          { variable: 'activity', term: 'tidak_aktif', value: activity.tidak_aktif }
        ]
      }
    ] as const;

    const activation = {
      SANGAT_RENDAH: 0,
      RENDAH: 0,
      SEDANG: 0,
      TINGGI: 0,
      SANGAT_TINGGI: 0,
    };

    const ruleResults = ruleDefinitions.map((rule) => {
      const alpha = rule.antecedents.reduce((minValue, antecedent) => Math.min(minValue, antecedent.value), 1)
      return {
        output: rule.output,
        label: rule.label,
        antecedents: rule.antecedents,
        alpha,
        expression: `\\(${rule.antecedents.map((antecedent) => `\\mu_{${antecedent.variable},${antecedent.term}}`).join(' \\wedge ')}\\)`
      }
    })

    for (const output of Object.keys(activation) as Array<keyof typeof activation>) {
      activation[output] = ruleResults
        .filter((rule) => rule.output === output)
        .reduce((maxValue, rule) => Math.max(maxValue, rule.alpha), 0)
    }

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

    const score = denominator > 0 ? numerator / denominator : 0.5;
    const usedFallback = denominator === 0;
    
    return {
      score,
      details: {
        playtime,
        recency,
        activity,
        activation,
        process: {
          fuzzification: {
            inputs: {
              playtime_forever: game.playtime_forever,
              playtime_2weeks: game.playtime_2weeks || 0,
              days_since_played: daysSincePlayed,
              max_playtime_forever: this.maxPlaytimeForever,
              max_playtime_2weeks: this.maxPlaytime2Weeks
            },
            normalization: {
              playtime: playtimeNorm,
              activity: activityNorm
            },
            memberships: {
              playtime,
              recency,
              activity
            }
          },
          inference: {
            rules: ruleResults,
            activation
          },
          defuzzification: {
            weights,
            numerator,
            denominator,
            score,
            usedFallback,
            formula: usedFallback
              ? '\\[\\text{score} = 0.5\\]'
              : '\\[\\begin{aligned}\\text{score} &= \\frac{\\sum(\\alpha_i \\cdot w_i)}{\\sum \\alpha_i}\\end{aligned}\\]'
          }
        }
      }
    };
  }
}

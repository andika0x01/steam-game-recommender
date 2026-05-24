export class FuzzyNonOwnGamesScorer {
  private trapMF(x: number, a: number, b: number, c: number, d: number): number {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x > a && x < b) return (x - a) / (b - a);
    if (x > c && x < d) return (d - x) / (d - c);
    return 0;
  }

  getGameScore(reviewPositivity: number, tagSimilarity: number, reviewVolume: number, publisherScore: number): number {
    return this.getGameScoreDetailed(reviewPositivity, tagSimilarity, reviewVolume, publisherScore).score;
  }

  getGameScoreDetailed(reviewPositivity: number, tagSimilarity: number, reviewVolume: number, publisherScore: number) {
    const review = {
      buruk: this.trapMF(reviewPositivity, -0.1, 0, 0.4, 0.5),
      mixed: this.trapMF(reviewPositivity, 0.4, 0.5, 0.6, 0.7),
      bagus: this.trapMF(reviewPositivity, 0.6, 0.7, 0.8, 0.9),
      sangat_bagus: this.trapMF(reviewPositivity, 0.8, 0.9, 1.0, 1.1),
    };

    const similarity = {
      tidak_cocok: this.trapMF(tagSimilarity, -0.1, 0, 0.2, 0.35),
      lumayan: this.trapMF(tagSimilarity, 0.2, 0.35, 0.5, 0.65),
      cocok: this.trapMF(tagSimilarity, 0.5, 0.65, 0.8, 0.95),
      sangat_cocok: this.trapMF(tagSimilarity, 0.8, 0.95, 1.0, 1.1),
    };

    const publisher = {
      low: this.trapMF(publisherScore, -0.1, 0, 0.3, 0.45),
      medium: this.trapMF(publisherScore, 0.3, 0.45, 0.6, 0.75),
      high: this.trapMF(publisherScore, 0.6, 0.75, 1.0, 1.1),
    };

    const logVolume = reviewVolume > 0 ? Math.log10(reviewVolume) : 0;
    const volume = {
      sedikit: this.trapMF(logVolume, -1, 0, 1.5, 2.5),
      sedang: this.trapMF(logVolume, 1.5, 2.5, 3.5, 4.5),
      banyak: this.trapMF(logVolume, 3.5, 4.5, 10, 11),
    };

    const ruleDefinitions = [
      {
        output: "SANGAT_TINGGI",
        label: "Sangat tinggi",
        antecedents: [
          { variable: "similarity", term: "sangat_cocok", value: similarity.sangat_cocok },
          { variable: "review", term: "sangat_bagus", value: review.sangat_bagus },
          { variable: "volume", term: "banyak", value: volume.banyak },
        ],
      },
      {
        output: "SANGAT_TINGGI",
        label: "Sangat tinggi",
        antecedents: [
          { variable: "similarity", term: "sangat_cocok", value: similarity.sangat_cocok },
          { variable: "review", term: "sangat_bagus", value: review.sangat_bagus },
          { variable: "volume", term: "sedang", value: volume.sedang },
        ],
      },
      {
        output: "SANGAT_TINGGI",
        label: "Sangat tinggi",
        antecedents: [
          { variable: "similarity", term: "cocok", value: similarity.cocok },
          { variable: "review", term: "sangat_bagus", value: review.sangat_bagus },
          { variable: "volume", term: "banyak", value: volume.banyak },
          { variable: "publisher", term: "high", value: publisher.high },
        ],
      },
      {
        output: "TINGGI",
        label: "Tinggi",
        antecedents: [
          { variable: "similarity", term: "sangat_cocok", value: similarity.sangat_cocok },
          { variable: "review", term: "bagus", value: review.bagus },
          { variable: "volume", term: "sedang", value: volume.sedang },
        ],
      },
      {
        output: "TINGGI",
        label: "Tinggi",
        antecedents: [
          { variable: "similarity", term: "cocok", value: similarity.cocok },
          { variable: "review", term: "sangat_bagus", value: review.sangat_bagus },
          { variable: "volume", term: "sedang", value: volume.sedang },
        ],
      },
      {
        output: "TINGGI",
        label: "Tinggi",
        antecedents: [
          { variable: "similarity", term: "cocok", value: similarity.cocok },
          { variable: "review", term: "bagus", value: review.bagus },
          { variable: "volume", term: "banyak", value: volume.banyak },
        ],
      },
      {
        output: "TINGGI",
        label: "Tinggi",
        antecedents: [
          { variable: "similarity", term: "cocok", value: similarity.cocok },
          { variable: "review", term: "bagus", value: review.bagus },
          { variable: "publisher", term: "high", value: publisher.high },
        ],
      },
      {
        output: "SEDANG",
        label: "Sedang",
        antecedents: [
          { variable: "similarity", term: "cocok", value: similarity.cocok },
          { variable: "review", term: "bagus", value: review.bagus },
          { variable: "volume", term: "sedang", value: volume.sedang },
        ],
      },
      {
        output: "SEDANG",
        label: "Sedang",
        antecedents: [
          { variable: "similarity", term: "cocok", value: similarity.cocok },
          { variable: "review", term: "bagus", value: review.bagus },
          { variable: "volume", term: "sedikit", value: volume.sedikit },
        ],
      },
      {
        output: "SEDANG",
        label: "Sedang",
        antecedents: [
          { variable: "similarity", term: "lumayan", value: similarity.lumayan },
          { variable: "review", term: "sangat_bagus", value: review.sangat_bagus },
          { variable: "volume", term: "sedang", value: volume.sedang },
        ],
      },
      {
        output: "SEDANG",
        label: "Sedang",
        antecedents: [
          { variable: "similarity", term: "sangat_cocok", value: similarity.sangat_cocok },
          { variable: "review", term: "mixed", value: review.mixed },
          { variable: "volume", term: "banyak", value: volume.banyak },
        ],
      },
      {
        output: "RENDAH",
        label: "Rendah",
        antecedents: [
          { variable: "similarity", term: "lumayan", value: similarity.lumayan },
          { variable: "review", term: "bagus", value: review.bagus },
          { variable: "volume", term: "sedikit", value: volume.sedikit },
        ],
      },
      {
        output: "RENDAH",
        label: "Rendah",
        antecedents: [
          { variable: "similarity", term: "tidak_cocok", value: similarity.tidak_cocok },
          { variable: "review", term: "sangat_bagus", value: review.sangat_bagus },
        ],
      },
      {
        output: "RENDAH",
        label: "Rendah",
        antecedents: [
          { variable: "similarity", term: "cocok", value: similarity.cocok },
          { variable: "review", term: "mixed", value: review.mixed },
        ],
      },
      {
        output: "RENDAH",
        label: "Rendah",
        antecedents: [
          { variable: "similarity", term: "lumayan", value: similarity.lumayan },
          { variable: "review", term: "mixed", value: review.mixed },
          { variable: "volume", term: "sedang", value: volume.sedang },
        ],
      },
      {
        output: "SANGAT_RENDAH",
        label: "Sangat rendah",
        antecedents: [
          { variable: "review", term: "buruk", value: review.buruk },
          { variable: "similarity", term: "tidak_cocok", value: similarity.tidak_cocok },
        ],
      },
      {
        output: "SANGAT_RENDAH",
        label: "Sangat rendah",
        antecedents: [
          { variable: "review", term: "buruk", value: review.buruk },
          { variable: "volume", term: "banyak", value: volume.banyak },
        ],
      },
      {
        output: "SANGAT_RENDAH",
        label: "Sangat rendah",
        antecedents: [{ variable: "similarity", term: "tidak_cocok", value: similarity.tidak_cocok }],
      },
    ] as const;

    const activation = {
      SANGAT_RENDAH: 0,
      RENDAH: 0,
      SEDANG: 0,
      TINGGI: 0,
      SANGAT_TINGGI: 0,
    };

    const ruleResults = ruleDefinitions.map((rule) => {
      const alpha = rule.antecedents.reduce((minValue, antecedent) => Math.min(minValue, antecedent.value), 1);
      return {
        output: rule.output,
        label: rule.label,
        antecedents: rule.antecedents,
        alpha,
        expression: `\\(${rule.antecedents.map((antecedent) => `\\mu_{${antecedent.variable},${antecedent.term}}`).join(" \\wedge ")}\\)`,
      };
    });

    for (const output of Object.keys(activation) as Array<keyof typeof activation>) {
      activation[output] = ruleResults.filter((rule) => rule.output === output).reduce((maxValue, rule) => Math.max(maxValue, rule.alpha), 0);
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

    const score = denominator > 0 ? numerator / denominator : 0;

    return {
      score,
      details: {
        review,
        similarity,
        publisher,
        volume,
        activation,
        process: {
          kind: "recommendation",
          fuzzification: {
            inputs: {
              review_positivity: reviewPositivity,
              tag_similarity: tagSimilarity,
              review_volume: reviewVolume,
              log_review_volume: logVolume,
              publisher_score: publisherScore,
            },
            memberships: {
              review,
              similarity,
              publisher,
              volume,
            },
          },
          inference: {
            rules: ruleResults,
            activation,
          },
          defuzzification: {
            weights,
            numerator,
            denominator,
            score,
            usedFallback: denominator === 0,
            formula: denominator > 0 ? "\\[\\begin{aligned}\\text{score} &= \\frac{\\sum(A_k \\cdot w_k)}{\\sum A_k}\\end{aligned}\\]" : "\\[\\text{score} = 0\\]",
          },
        },
      },
    };
  }
}

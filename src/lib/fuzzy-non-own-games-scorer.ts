/**
 * Kelas FuzzyNonOwnGamesScorer
 * 
 * Sistem inferensi fuzzy untuk memprediksi tingkat ketertarikan pengguna
 * terhadap game yang belum mereka miliki.
 */
export class FuzzyNonOwnGamesScorer {
  private trapMF(x: number, a: number, b: number, c: number, d: number): number {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x > a && x < b) return (x - a) / (b - a);
    if (x > c && x < d) return (d - x) / (d - c);
    return 0;
  }

  getGameScore(reviewPositivity: number, tagSimilarity: number, reviewVolume: number, publisherScore: number): number {
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

    const activation = {
      SANGAT_RENDAH: 0,
      RENDAH: 0,
      SEDANG: 0,
      TINGGI: 0,
      SANGAT_TINGGI: 0,
    };

    activation.SANGAT_TINGGI = Math.max(
      Math.min(similarity.sangat_cocok, review.sangat_bagus, volume.banyak),
      Math.min(similarity.sangat_cocok, review.sangat_bagus, volume.sedang),
      Math.min(similarity.cocok, review.sangat_bagus, volume.banyak, publisher.high)
    );

    activation.TINGGI = Math.max(
      Math.min(similarity.sangat_cocok, review.bagus, volume.sedang),
      Math.min(similarity.cocok, review.sangat_bagus, volume.sedang),
      Math.min(similarity.cocok, review.bagus, volume.banyak),
      Math.min(similarity.cocok, review.bagus, publisher.high)
    );

    activation.SEDANG = Math.max(
      Math.min(similarity.cocok, review.bagus, volume.sedang),
      Math.min(similarity.cocok, review.bagus, volume.sedikit),
      Math.min(similarity.lumayan, review.sangat_bagus, volume.sedang),
      Math.min(similarity.sangat_cocok, review.mixed, volume.banyak)
    );

    activation.RENDAH = Math.max(
      Math.min(similarity.lumayan, review.bagus, volume.sedikit),
      Math.min(similarity.tidak_cocok, review.sangat_bagus),
      Math.min(similarity.cocok, review.mixed),
      Math.min(similarity.lumayan, review.mixed, volume.sedang)
    );

    activation.SANGAT_RENDAH = Math.max(
      Math.min(review.buruk, similarity.tidak_cocok),
      Math.min(review.buruk, volume.banyak),
      similarity.tidak_cocok
    );

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

    return denominator > 0 ? numerator / denominator : 0;
  }
}

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
      Math.min(similarity.sangat_cocok, review.sangat_bagus),
      Math.min(similarity.sangat_cocok, review.bagus),
      Math.min(similarity.cocok, review.sangat_bagus),
      Math.min(similarity.sangat_cocok, publisher.high)
    );
    activation.TINGGI = Math.max(
      Math.min(similarity.cocok, review.bagus),
      Math.min(similarity.lumayan, review.sangat_bagus),
      Math.min(similarity.sangat_cocok, review.mixed),
      Math.min(publisher.high, similarity.cocok),
      Math.min(publisher.high, review.bagus)
    );
    activation.SEDANG = Math.max(
      Math.min(similarity.lumayan, review.bagus),
      Math.min(similarity.cocok, review.mixed),
      Math.min(publisher.medium, similarity.lumayan),
      Math.min(publisher.medium, review.mixed),
      Math.min(review.mixed, volume.sedang)
    );
    activation.RENDAH = Math.max(
      Math.min(similarity.tidak_cocok, review.bagus),
      Math.min(similarity.lumayan, review.buruk),
      Math.min(publisher.low, review.mixed),
      Math.min(publisher.low, similarity.lumayan),
      Math.min(review.sangat_bagus, similarity.tidak_cocok) // Game bagus tapi beda genre = skor 20-30%
    );
    activation.SANGAT_RENDAH = Math.max(
      review.buruk,
      Math.min(similarity.tidak_cocok, review.buruk)
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

    const baseScore = denominator > 0 ? numerator / denominator : 0;
    
    // Memberikan bonus/penalti kecil berdasarkan publisher score secara langsung
    const publisherBonus = (publisherScore - 0.5) * 0.1; 
    
    return Math.max(0, Math.min(1, baseScore + publisherBonus));
  }
}

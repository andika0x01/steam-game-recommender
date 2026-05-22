/**
 * Kelas FuzzyNonOwnGamesScorer
 * 
 * Sistem inferensi fuzzy untuk memprediksi tingkat ketertarikan pengguna
 * terhadap game yang belum mereka miliki (kandidat dari Steam Store).
 * Menggunakan sentimen review, kemiripan tag dengan profil pengguna,
 * dan volume review untuk menentukan skor akhir.
 */
export class FuzzyNonOwnGamesScorer {
  /**
   * Fungsi Keanggotaan Trapezoidal (TrapMF)
   * 
   * Menghitung nilai keanggotaan fuzzy untuk variabel input.
   */
  private trapMF(x: number, a: number, b: number, c: number, d: number): number {
    if (x <= a || x >= d) return 0;
    if (x >= b && x <= c) return 1;
    if (x > a && x < b) return (x - a) / (b - a);
    if (x > c && x < d) return (d - x) / (d - c);
    return 0;
  }

  /**
   * Menghitung skor prediksi untuk game yang belum dimiliki.
   * 
   * @param reviewPositivity Rasio review positif (0-1)
   * @param tagSimilarity Kemiripan tag dengan profil selera pengguna (0-1)
   * @param reviewVolume Total jumlah review untuk validasi data
   * @param publisherMatch Seberapa dikenal/disukai publisher oleh user (0-1)
   */
  getGameScore(reviewPositivity: number, tagSimilarity: number, reviewVolume: number, publisherMatch: number): number {
    const review = {
      buruk: this.trapMF(reviewPositivity, -0.1, 0, 0.4, 0.5),
      mixed: this.trapMF(reviewPositivity, 0.4, 0.45, 0.6, 0.65),
      bagus: this.trapMF(reviewPositivity, 0.6, 0.65, 0.75, 0.8),
      sangat_bagus: this.trapMF(reviewPositivity, 0.75, 0.85, 1.0, 1.1),
    };

    const similarity = {
      tidak_cocok: this.trapMF(tagSimilarity, -0.1, 0, 0.2, 0.3),
      lumayan: this.trapMF(tagSimilarity, 0.2, 0.3, 0.5, 0.6),
      cocok: this.trapMF(tagSimilarity, 0.5, 0.6, 0.8, 0.9),
      sangat_cocok: this.trapMF(tagSimilarity, 0.8, 0.9, 1.0, 1.1),
    };

    const publisher = {
      asing: this.trapMF(publisherMatch, -0.1, 0, 0.02, 0.05),
      pernah_main: this.trapMF(publisherMatch, 0.05, 0.2, 0.3, 0.4),
      favorit: this.trapMF(publisherMatch, 0.4, 0.6, 1.0, 1.1),
    };

    const logVolume = reviewVolume > 0 ? Math.log10(reviewVolume) : 0;

    const volume = {
      sedikit: this.trapMF(logVolume, -1, 0, 1.5, 2),   
      sedang: this.trapMF(logVolume, 1.5, 2, 3, 3.5),  
      banyak: this.trapMF(logVolume, 3, 4, 10, 11),    
    };

    const activation = {
      SANGAT_RENDAH: 0,
      RENDAH: 0,
      SEDANG: 0,
      TINGGI: 0,
      SANGAT_TINGGI: 0,
    };

    // Rule 1: Similarity & Reviews combined
    activation.SANGAT_TINGGI = Math.max(activation.SANGAT_TINGGI, Math.min(similarity.sangat_cocok, review.sangat_bagus, publisher.favorit));
    activation.TINGGI = Math.max(activation.TINGGI, Math.min(similarity.cocok, review.bagus, publisher.pernah_main));
    activation.TINGGI = Math.max(activation.TINGGI, Math.min(similarity.sangat_cocok, review.bagus));
    activation.SEDANG = Math.max(activation.SEDANG, Math.min(similarity.lumayan, review.bagus));
    activation.SEDANG = Math.max(activation.SEDANG, Math.min(similarity.cocok, review.mixed));
    
    activation.TINGGI = Math.max(activation.TINGGI, Math.min(similarity.sangat_cocok, review.mixed, publisher.favorit));
    activation.SEDANG = Math.max(activation.SEDANG, Math.min(similarity.cocok, review.mixed));
    activation.RENDAH = Math.max(activation.RENDAH, Math.min(similarity.tidak_cocok, review.mixed));

    // Rule 2: Penalties for bad reviews
    activation.RENDAH = Math.max(activation.RENDAH, Math.min(similarity.lumayan, review.buruk));
    activation.RENDAH = Math.max(activation.RENDAH, Math.min(similarity.cocok, review.buruk));
    activation.SANGAT_RENDAH = Math.max(activation.SANGAT_RENDAH, Math.min(similarity.tidak_cocok, review.buruk));
    activation.SANGAT_RENDAH = Math.max(activation.SANGAT_RENDAH, Math.min(similarity.sangat_cocok, review.buruk)); 

    // Rule 3: Publisher specific boosts
    activation.SANGAT_TINGGI = Math.max(activation.SANGAT_TINGGI, Math.min(publisher.favorit, similarity.cocok, review.bagus));
    activation.SANGAT_TINGGI = Math.max(activation.SANGAT_TINGGI, Math.min(publisher.favorit, similarity.sangat_cocok));
    activation.TINGGI = Math.max(activation.TINGGI, Math.min(publisher.favorit, similarity.lumayan));
    activation.TINGGI = Math.max(activation.TINGGI, Math.min(publisher.pernah_main, similarity.cocok));
    
    // Direct influence of publisher on final categories
    activation.SANGAT_TINGGI = Math.max(activation.SANGAT_TINGGI, publisher.favorit); 
    activation.RENDAH = Math.max(activation.RENDAH, publisher.asing);
    activation.SANGAT_RENDAH = Math.max(activation.SANGAT_RENDAH, Math.min(publisher.asing, review.mixed));

    // Rule 4: Volume adds confidence to high scores
    activation.SANGAT_TINGGI = Math.max(activation.SANGAT_TINGGI, Math.min(similarity.sangat_cocok, volume.banyak, review.bagus));
    activation.SANGAT_RENDAH = Math.max(activation.SANGAT_RENDAH, Math.min(review.buruk, volume.banyak));
    
    // Rule 5: Small volume keeps it moderate even if looks good
    activation.SEDANG = Math.max(activation.SEDANG, Math.min(similarity.sangat_cocok, volume.sedikit));
    if (Math.max(...Object.values(activation)) === 0) {
      activation.SANGAT_TINGGI = similarity.sangat_cocok;
      activation.TINGGI = similarity.cocok;
      activation.SEDANG = similarity.lumayan;
      activation.RENDAH = similarity.tidak_cocok;
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

    return denominator > 0 ? numerator / denominator : 0.5;
  }
}

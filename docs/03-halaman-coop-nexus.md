# 03 - Alur Proses Halaman Co-op Nexus (Multi-Agent Convergence)

Halaman ini mengintegrasikan data dari banyak agen untuk mencari "Titik Temu" (Convergence) minat bermain di dalam grup.

---

## 1. Fase Sinkronisasi (Library Intersection)
Sistem melakukan operasi irisan himpunan pada ID game dari $N$ user untuk menemukan aset taktis yang dimiliki bersama:
$$S = Library_1 \cap Library_2 \cap \dots \cap Library_n$$

## 2. Fase Konvergensi: Group Naive Bayes Inference
Untuk setiap game di dalam set $S$, sistem menghitung "Group Match Score" ($G$). Skor ini adalah rata-rata probabilitas posterior dari model Naive Bayes setiap anggota grup:
$$G_{game} = \frac{\sum_{k=1}^{N} P(\text{Liked}_k | \text{Tags}_{game})}{N}$$
Model setiap pengguna dilatih secara mandiri menggunakan data SteamSpy Tags dan Fuzzy Playtime mereka.

## 3. Fase Optimasi: MMR Convergence
Sistem menyeleksi game terbaik menggunakan **Maximal Marginal Relevance (MMR)** untuk memastikan:
*   **Kolektifitas Tinggi**: Rata-rata skor grup yang maksimal.
*   **Diversitas Sesi**: Hasil akhir memberikan variasi jenis permainan (misal: satu game survival, satu game shooter, satu game sports) untuk mencegah kebosanan grup.

## 4. Fase Output
Menghasilkan visualisasi kartu game dengan indikator persentase "Group Match". Algoritma MMR memastikan sesi bermain yang disarankan adalah yang paling relevan namun tetap bervariasi bagi semua orang di dalam grup.

---
*Hasil Akhir: Strategi bermain grup yang berbasis data riil dan kepuasan kolektif.*

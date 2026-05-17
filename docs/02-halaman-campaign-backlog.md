# 02 - Alur Proses Halaman Backlog Priority

Halaman ini menggunakan kecerdasan komputasional untuk menyusun urutan prioritas bermain terbaik dari daftar backlog pengguna.

---

## 1. Fase Profiling: Naive Bayes Training
Sistem melatih model klasifikasi berdasarkan library yang sudah dimainkan oleh pengguna.
*   **Fuzzy Playtime**: Jam main dikonversi menjadi probabilitas "Liked" menggunakan fungsi trapesium.
*   **Tag Likelihood**: Menghitung probabilitas setiap tag SteamSpy muncul dalam game yang disukai vs tidak disukai.

## 2. Fase Scoring: Posterior Calculation
Setiap game backlog (playtime < 2 jam) dihitung probabilitas posteriornya.
*   **Bayesian Inference**: Mengalikan prior probability dengan likelihood setiap tag yang dimiliki game tersebut.
*   **Quality & Recency Adjustments**: Skor akhir dimodifikasi oleh persentase review positif dan faktor **Time Decay** untuk game lama.

## 3. Fase Optimasi: MMR Diversity
Menggunakan **Maximal Marginal Relevance (MMR)** untuk menampilkan daftar game yang memiliki skor tinggi namun tetap bervariasi secara tema/tag, mencegah daftar yang didominasi oleh satu genre saja.

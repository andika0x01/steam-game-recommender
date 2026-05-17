# 01 - Alur Proses Halaman Discovery Engine (Genre Stacking Edition)

Halaman **Discovery Engine** (`/engine`) telah dirombak total menggunakan strategi **Genre Stacking** untuk menjamin akurasi rekomendasi yang melampaui tren populer.

---

## 1. Fase Profiling: Genre Fingerprinting
Sistem tidak lagi sekadar melihat library, tapi menghitung "Sidik Jari Genre" Anda menggunakan **Fuzzy Logic**.
*   **Fuzzy Engagement**: Jam main dikonversi menjadi bobot kontinu $[0, 1]$ menggunakan fungsi Trapesium.
*   **Top Genre Extraction**: Sistem mengidentifikasi 3 genre yang paling mendominasi perilaku bermain Anda berdasarkan akumulasi bobot fuzzy.

## 2. Fase Discovery: Genre Stacking (Hyper-Targeted)
Alih-alih mengambil "Top 100 Global" yang membosankan, sistem melakukan **Crawling Bertarget**:
*   Mencari 100 game terbaik untuk **Genre A**.
*   Mencari 100 game terbaik untuk **Genre B**.
*   Mencari 100 game terbaik untuk **Genre C**.
*   **Hasil**: Pool **300 kandidat** yang sudah terfilter secara minat di level API.

## 3. Fase Scoring: Naive Bayes Classifier
Setiap kandidat dari pool game tersebut diskor menggunakan **Naive Bayes Classifier**.
*   **Tag-Based Likelihood**: Menggunakan top 5 tags paling populer per game untuk menghitung probabilitas posterior $P(\text{Liked} | \text{Tags})$ guna menghindari bias tag ganda.
*   **Review & Recency**: Mengintegrasikan skor review (SteamSpy) dan **Time Decay** (peluruhan eksponensial yang menurun mulus setiap tahun) ke dalam nilai akhir.

## 4. Fase Final: MMR Optimization (Maximal Marginal Relevance)
Menggantikan Simulated Annealing dengan **MMR** untuk menyeleksi 12 game terbaik secara deterministik:
*   **Relevance vs Diversity**: Menyeimbangkan antara skor prediksi tinggi dan keunikan tags dibanding game yang sudah terpilih.
*   **Cosine Similarity**: Menghitung kemiripan antar game menggunakan bobot/vote dari tags untuk mencegah saturasi tag yang sama di hasil akhir.

---
*Hasil Akhir: Penemuan game yang benar-benar personal, cerdas, dan bervariasi.*

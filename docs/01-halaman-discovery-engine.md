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

## 3. Fase Scoring: Bayesian Preference
Setiap kandidat dari pool 300 game tersebut diskor menggunakan probabilitas Bayesian terhadap seluruh profil library Anda:
$$Score = \frac{\sum P(Genre_j | UserProfile)}{|Genres_{game}|}$$

## 4. Fase Final: Simulated Annealing (Diversity & Saturation Penalty)
SA menyeleksi 12 game terbaik dengan fungsi energi yang menghukum keseragaman:
$$E = \text{TotalAffinity} + \lambda \cdot \text{UniqueGenreCount}$$
Hal ini memastikan hasil akhir tidak berisi 12 game dengan genre yang identik, melainkan kombinasi yang seimbang dari minat Anda.

---
*Hasil Akhir: Penemuan game yang benar-benar personal, cerdas, dan bervariasi.*

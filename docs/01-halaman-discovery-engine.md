# 01 - Alur Proses Halaman Discovery Engine

Halaman **Discovery Engine** (`/engine`) mendemonstrasikan penggabungan (ensemble) beberapa algoritma CI melalui alur kronologis berikut.

---

## 1. Fase Input & Pre-processing
Sistem menarik data tren dari SteamSpy API. Game yang sudah dimiliki pengguna difilter keluar. Data mentah (genre) disiapkan sebagai atribut fitur.

## 2. Fase Profiling: Genetic Algorithm (GA)
GA digunakan untuk mencari parameter optimal ($P$) bagi fungsi keanggotaan Fuzzy.
*   **Kromosom**: Vektor parameter $[a, b, c, d]$.
*   **Fitness Function**: Memaksimalkan separabilitas data engagement:
    $$f(P) = \sum_{i=1}^{n} \text{Engagement}_i(P)$$
*   **Evolusi**: Menggunakan seleksi elitism, crossover seragam, dan mutasi Gaussian untuk konvergensi global.

## 3. Fase Scoring: Bayesian Inference
Sistem menghitung probabilitas ketertarikan menggunakan rumus Bayes:
$$P(Like|Genres) = \frac{P(Genres|Like) \times P(Like)}{P(Genres)}$$
Dimana:
*   $P(Like)$: Rasio game yang dimainkan $> 2$ jam di library.
*   $P(Genres|Like)$: Probabilitas munculnya genre tertentu pada game yang disukai.
*   Digunakan **Laplace Smoothing** untuk menangani genre baru: $\frac{count + 1}{total + 2}$.

## 4. Fase Similarity: A* Search
Membangun rute kemiripan dari game terpopuler user ke kandidat baru.
*   **Fungsi Evaluasi**: $f(n) = g(n) + h(n)$
*   **Cost $g(n)$**: Akumulasi jarak kemiripan genre.
*   **Heuristic $h(n)$**: Jarak genre antara node saat ini dengan target:
    $$h(n) = 1 - \frac{|Genres_{current} \cap Genres_{target}|}{|Genres_{current} \cup Genres_{target}|}$$

## 5. Fase Final: Simulated Annealing (SA)
SA menyeleksi 12 game terbaik dari ratusan kandidat dengan menjaga diversitas.
*   **Energi Sistem ($E$)**: Kombinasi skor afinitas ($S$) dan penalti keseragaman ($D$):
    $$E = \sum S_i + \lambda \cdot Count(\text{Unique Genres})$$
*   **Kriteria Penerimaan (Boltzmann)**: Probabilitas menerima solusi yang lebih buruk untuk menghindari *local optima*:
    $$P = \exp\left(\frac{\Delta E}{T}\right)$$
    Dimana $T$ (suhu) menurun secara eksponensial: $T_{new} = T_{old} \times \alpha$.

---
*Hasil Akhir: Daftar rekomendasi yang akurat secara matematis namun tetap bervariasi.*

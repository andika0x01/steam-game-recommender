# 01 - Alur Proses Halaman Discovery Engine (Deep Personalization Edition)

Halaman **Discovery Engine** (`/engine`) telah dirombak total untuk memberikan personalisasi mendalam dengan meninggalkan metode mainstream. Sistem ini sekarang menggunakan fusi **Fuzzy Logic** dan **Bayesian Inference** yang dioptimalkan oleh **Simulated Annealing**.

---

## 1. Fase Input & Discovery Expansion
Sistem menarik kandidat dari dua sumber sekaligus (Top 100 2 Weeks & Top 100 Forever) untuk menciptakan pool **200+ game**. Game yang sudah dimiliki difilter, dan kandidat yang tersisa diperkaya (Enriched) dengan data genre asli dari Steam Store melalui **Cloudflare KV Cache**.

## 2. Fase Profiling: Fuzzy Engagement Modeling
Alih-alih menggunakan ambang batas (threshold) kaku, sistem menggunakan **Fuzzy Logic** untuk menilai seberapa besar user menyukai sebuah game di library mereka.
*   **Variabel Input**: Playtime (Jam).
*   **Fungsi Keanggotaan**: Trapesium ($\mu(x)$) digunakan untuk menghitung bobot keterikatan user ($W$):
    $$W_i = \text{trapezoid}(\text{playtime}_i, 0, 2, 1000, 1000)$$
    *Game dengan playtime sangat rendah (< 2 jam) memiliki bobot rendah, sementara game kronis memiliki bobot penuh (1.0).*

## 3. Fase Scoring: Fuzzy-Bayesian Fusion
Sistem menghitung probabilitas ketertarikan menggunakan rumus Bayes yang telah dimodifikasi untuk menerima input kontinu dari Fuzzy Logic:
$$P(Like|Genres) = \frac{P(Genres|Like) \times P(Like)}{P(Genres)}$$

Dimana:
*   **Prior $P(Like)$**: Total Fuzzy Weight dibagi jumlah game di library.
    $$P(Like) = \frac{\sum W_i}{N}$$
*   **Likelihood $P(Genre|Like)$**: Menggunakan bobot fuzzy sebagai sinyal probabilitas:
    $$P(Genre|Like) = \frac{\sum (W_i \cdot I(G_{ij})) + \epsilon}{\sum W_i + \alpha}$$
    Dimana $I(G_{ij})$ adalah indikator (1 jika game $i$ memiliki genre $j$, 0 jika tidak).

## 4. Fase Final: Simulated Annealing (Diversity Optimizer)
SA menyeleksi 12 game terbaik dengan memaksimalkan skor Bayesian sambil menjaga variasi genre agar tidak membosankan.
*   **Energi Sistem ($E$)**:
    $$E = \sum P(Like|Genres)_k + \lambda \cdot Count(\text{Unique Genres})$$
*   **Optimization**: Sistem melakukan iterasi pendinginan (cooling) untuk menemukan kombinasi 12 game yang memiliki skor personalisasi tertinggi namun tetap beragam secara genre.

---
*Hasil Akhir: Rekomendasi yang secara genetik sangat mirip dengan perilaku bermain user (bukan sekadar game populer).*

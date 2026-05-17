# 04 - Alur Proses Halaman Deal Hunter (Deep Value Optimizer)

Halaman ini melakukan optimasi multi-kriteria untuk menemukan penawaran diskon yang paling bernilai bagi profil personal pengguna.

---

## 1. Fase Input & Enrichment
Sistem menarik data diskon dari CheapShark API dan memperkaya metadata setiap diskon dengan genre asli dari Steam via **KV Cache**.

## 2. Fase Scoring: Naive Bayes Value Metric
Skor dasar setiap deal ($M$) dihitung menggunakan kombinasi personal match dan nilai ekonomi:
1.  **Naive Bayes Match ($B$)**: Probabilitas seleramu berdasarkan top 5 SteamSpy Tags, Review Score, dan **Time Decay** (Peluruhan eksponensial). Bobot: 50%.
2.  **Savings Factor ($S$)**: Persentase diskon dari CheapShark. Mengutamakan besarnya diskon daripada batasan harga absolut. Bobot: 50%.

$$Match = (B \cdot 0.5) + (S \cdot 0.5)$$

## 3. Fase Optimasi: MMR Selection
Menggunakan **Maximal Marginal Relevance (MMR)** untuk memilih 24 penawaran terbaik.
*   **Diverse Value**: Menghindari penumpukan game dari satu genre/tag (misal: tidak menampilkan 24 game RPG sekaligus) menggunakan **Cosine Similarity**.
*   **Deterministic Ranking**: Hasil yang stabil dan dapat diprediksi tanpa elemen acak dari Simulated Annealing.

---
*Hasil Akhir: Rekomendasi belanja yang cerdas, personal, dan teroptimasi secara ekonomi.*

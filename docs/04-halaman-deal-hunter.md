# 04 - Alur Proses Halaman Deal Hunter (Deep Value Optimizer)

Halaman ini melakukan optimasi multi-kriteria untuk menemukan penawaran diskon yang paling bernilai bagi profil personal pengguna.

---

## 1. Fase Input & Enrichment
Sistem menarik data diskon dari CheapShark API dan memperkaya metadata setiap diskon dengan genre asli dari Steam via **KV Cache**.

## 2. Fase Scoring: Naive Bayes Value Metric
Skor dasar setiap deal ($M$) dihitung menggunakan kombinasi linier dari faktor personal dan ekonomi:
1.  **Naive Bayes Match ($B$)**: Probabilitas seleramu berdasarkan SteamSpy Tags, Review Score, dan **Time Decay** (Bobot: 60%).
2.  **Savings Factor ($S$)**: Persentase diskon dari CheapShark (Bobot: 30%).
3.  **Price Efficiency ($P$)**: Skor efisiensi harga nominal (Bobot: 10%).

$$Match = (B \cdot 0.6) + (S \cdot 0.3) + (P \cdot 0.1)$$

## 3. Fase Optimasi: MMR Selection
Menggunakan **Maximal Marginal Relevance (MMR)** untuk memilih 24 penawaran terbaik.
*   **Diverse Value**: Menghindari penumpukan game dari satu genre/tag (misal: tidak menampilkan 24 game RPG sekaligus).
*   **Deterministic Ranking**: Hasil yang stabil dan dapat diprediksi tanpa elemen acak dari Simulated Annealing.

---
*Hasil Akhir: Rekomendasi belanja yang cerdas, personal, dan teroptimasi secara ekonomi.*

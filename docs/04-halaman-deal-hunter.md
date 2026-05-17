# 04 - Alur Proses Halaman Deal Hunter (Deep Value Optimizer)

Halaman ini melakukan optimasi multi-kriteria untuk menemukan penawaran diskon yang paling bernilai bagi profil personal pengguna.

---

## 1. Fase Input & Enrichment
Sistem menarik data diskon dari CheapShark API dan memperkaya metadata setiap diskon dengan genre asli dari Steam via **KV Cache**.

## 2. Fase Scoring: Naive Bayes Value Metric
Skor dasar setiap deal ($M$) dihitung menggunakan model **Multiplikatif** untuk memastikan diskon besar hanya mem-boost game yang benar-benar relevan:
1.  **Base Match Score ($B$)**: Probabilitas seleramu berdasarkan top 5 SteamSpy Tags, Review Score, dan **Time Decay**.
2.  **Savings Boost ($S$)**: Persentase diskon dari CheapShark dihitung sebagai pengali $(1 + \text{Savings})$.

$$FinalScore = B \cdot (1 + S)$$

## 3. Fase Optimasi: MMR Selection
Menggunakan **Maximal Marginal Relevance (MMR)** untuk memilih 24 penawaran terbaik.
*   **Diverse Value**: Menghindari penumpukan genre menggunakan **Weighted Cosine Similarity** (TF-IDF).
*   **Deterministic Ranking**: Hasil yang stabil dan dapat diprediksi tanpa elemen acak.

---
*Hasil Akhir: Rekomendasi belanja yang cerdas, personal, dan teroptimasi secara ekonomi.*

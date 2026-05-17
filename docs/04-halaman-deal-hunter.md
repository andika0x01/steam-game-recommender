# 04 - Alur Proses Halaman Deal Hunter (Deep Value Optimizer)

Halaman ini melakukan optimasi multi-kriteria untuk menemukan penawaran diskon yang paling bernilai bagi profil personal pengguna, dengan kemampuan optimasi budget yang sangat dalam.

---

## 1. Fase Input & Data Integrity
Sistem menarik data diskon dari CheapShark API secara masif (720 deal terbaru) dan melakukan proses **Data Integrity**:
*   **Enrichment**: Metadata diperkaya dengan genre Steam via **KV Cache**.
*   **Asset Validation**: Server melakukan verifikasi aset (HEAD/GET) ke Steam CDN. Game tanpa cover tegak atau yang diarahkan ke placeholder `unknown_app.png` secara otomatis dibuang untuk menjamin kualitas visual.
*   **Deep Pool**: Mengolah hingga 400 kandidat terverifikasi untuk memastikan variasi game premium dan budget.

## 2. Fase Scoring: Naive Bayes Value Metric
Skor dasar setiap deal dihitung menggunakan model **Multiplikatif**:
1.  **Base Match Score ($B$)**: Probabilitas seleramu berdasarkan top 5 SteamSpy Tags, Review Score, dan **Time Decay**.
2.  **Savings Boost ($S$)**: Persentase diskon dari CheapShark dihitung sebagai pengali $(1 + \text{Savings})$.

---

## 3. Fase Optimasi
Terdapat dua mode optimasi tergantung pada input pengguna:

### A. Mode Standard (Tanpa Budget)
Menggunakan **Maximal Marginal Relevance (MMR)** untuk memilih 24 penawaran terbaik dengan diversitas genre yang terjaga.

### B. Mode Deep Optimization (Dengan Budget)
Menggunakan algoritma **Simulated Annealing (SA)** untuk memecahkan masalah *Bounded Knapsack*:
*   **Dynamic Item Limit**: Jumlah game yang dipilih menyesuaikan besar budget (hingga 100 game).
*   **Exploration-Exploitation**: Melakukan 10.000 iterasi untuk mencari kombinasi game terbaik yang memaksimalkan skor total tanpa melewati budget.
*   **Multi-Item Swapping**: Algoritma dapat menukar sekelompok game murah dengan 1 game premium mahal jika terbukti meningkatkan relevansi belanja.

---
*Hasil Akhir: Rekomendasi belanja yang cerdas, personal, dan teroptimasi secara ekonomi dengan visual aset yang sempurna.*

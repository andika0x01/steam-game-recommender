# 04 - Alur Proses Halaman Deal Hunter (Deep Value Optimizer)

Halaman ini melakukan optimasi multi-kriteria untuk menemukan penawaran diskon yang paling bernilai bagi profil personal pengguna, dengan kemampuan optimasi budget yang sangat dalam dan agresif.

---

## 1. Fase Input & Data Integrity
Sistem menarik data diskon dari CheapShark API secara masif (**1.200 deal terbaru** dari 20 halaman) dan melakukan proses **Data Integrity**:
*   **Enrichment**: Metadata diperkaya dengan genre Steam via **KV Cache**.
*   **Asset Validation**: Menggunakan pendeteksian client-side berbasis resolusi (`naturalWidth`) untuk memastikan aset visual yang ditampilkan bukan placeholder `unknown_app.png`.
*   **Radical Pool**: Mengolah hingga 500 kandidat terverifikasi untuk memastikan ketersediaan game premium guna menghabiskan budget besar.

## 2. Fase Scoring: Naive Bayes Value Metric
Skor dasar setiap deal dihitung menggunakan model **Multiplikatif**:
1.  **Base Match Score ($B$)**: Probabilitas seleramu berdasarkan top 5 SteamSpy Tags, Review Score, dan **Time Decay**.
2.  **Savings Boost ($S$)**: Persentase diskon dari CheapShark dihitung sebagai pengali $(1 + \text{Savings})$.

---

## 3. Fase Optimasi & Budget Maximization
Terdapat dua lapis optimasi untuk memastikan efisiensi maksimal:

### A. Core Optimization (Simulated Annealing)
Menggunakan algoritma SA (10.000 iterasi) untuk mencari kombinasi game terbaik yang memaksimalkan skor total tanpa melewati budget. Mendukung *multi-item swapping* untuk menukar banyak game murah dengan game AAA.

### B. Greedy-Fill Pass (Budget Exhaustion)
Jika setelah optimasi utama masih terdapat sisa budget yang signifikan, sistem menjalankan *Greedy-Fill*:
*   Memilih game termahal yang tersisa di pasar yang masih masuk dalam budget.
*   Memasukkan game tersebut ke keranjang secara agresif hingga budget mendekati nol atau batas 150 item tercapai.

### C. Ultimate Discovery Guard
Menjamin bagian **Market Discovery** selalu terisi minimal 60 game dengan cara menarik cadangan data dari pool mentah jika hasil seleksi personal terlalu sedikit.

---
*Hasil Akhir: Rekomendasi belanja yang cerdas, personal, dan dijamin menghabiskan budget secara maksimal dengan visual aset yang bersih.*

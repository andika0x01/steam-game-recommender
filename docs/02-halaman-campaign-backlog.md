# 02 - Alur Proses Halaman Campaign Map (Backlog)

Halaman ini menggunakan kecerdasan komputasional untuk menyusun rute bermain terbaik dari daftar backlog pengguna.

---

## 1. Fase Profiling: Fuzzy-Bayesian Affinity
Setiap game dalam backlog dianalisis kemiripannya dengan profil bermain user.
*   **Fuzzy Weighting**: Library utama user diberi bobot menggunakan fungsi trapesium berdasarkan playtime.
*   **Bayesian Rating**: Skor personal ($S$) dihitung menggunakan probabilitas Bayes untuk menentukan seberapa besar peluang user akan menikmati game tersebut.

## 2. Fase Optimasi: Simulated Annealing (SA)
Alih-alih sekadar mengurutkan berdasarkan skor tertinggi, sistem menggunakan SA untuk menyusun 10 "Waypoints" (titik jalan) yang memberikan pengalaman bermain paling memuaskan dan beragam.

### Fungsi Energi ($E$)
Sistem mencoba memaksimalkan total skor afinitas sambil menjaga keberagaman genre:
$$E = \sum S_i + \lambda \cdot \text{DiversityScore}$$

### Proses Evolusi Rute
1.  **Suhu Awal ($T$)**: 100.
2.  **Pertukaran Node**: Sistem secara acak mengganti satu game dalam rute dengan game backlog lain.
3.  **Kriteria Boltzmann**: Solusi baru diterima jika lebih baik, atau dengan probabilitas tertentu jika lebih buruk (untuk menghindari jebakan lokal):
    $$P = \exp\left(\frac{\Delta E}{T}\right)$$
4.  **Cooling**: $T$ menurun hingga mencapai kondisi stabil.

---
*Hasil Akhir: Rute bermain yang linear, teroptimasi secara personal, dan tidak membosankan.*

# 04 - Panduan Teknis & Pengembangan Sistem

Dokumen ini ditujukan bagi pengembang atau asisten laboratorium yang ingin memeriksa struktur kode atau memperluas fungsionalitas sistem ini.

---

## 1. Arsitektur Kode (Colocated Logic)

Kami menggunakan pola **Colocated Logic** untuk menyeimbangkan antara keterpakaian ulang kode (reusability) dan kejelasan domain bisnis per halaman.

*   **Pusat Fungsi Shared (`src/lib/algorithm.ts`)**: Berisi primitif matematika dan fungsi umum yang digunakan oleh banyak fitur (misal: `trapezoid` fuzzy, `trainNaiveBayes` untuk model probabilitas, `runMMROptimization` untuk diversitas, dan penghitungan `Time Decay`).
*   **Logika Spesifik Halaman (`src/pages/*/algorithm.ts`)**: Setiap folder halaman memiliki file algoritmanya sendiri. File ini mengimpor fungsi shared dari `lib` dan mengimplementasikan alur logika unik untuk fitur tersebut (misal: `getCoopConvergence` untuk fitur Co-op).
*   **Antarmuka UI (`src/pages/*/index.tsx`)**: File presentasi yang fokus pada rendering, interaksi pengguna, dan **Data Enrichment** (mengambil metadata Steam & SteamSpy secara paralel).

## 2. Integritas Data & Caching (KV Store)

Sistem menggunakan **Cloudflare KV** sebagai lapisan memori jangka panjang untuk metadata game.
*   **Deep Enrichment**: Aplikasi diwajibkan melakukan *enrichment* data dari dua sumber: Steam API (untuk genre & tipe) dan SteamSpy API (untuk tags & reviews).
*   **Efisiensi**: Metadata yang sudah di-cache akan tersedia secara instan untuk semua pengguna, menghindari rate limit API eksternal.

## 3. Instruksi Penambahan Fitur Baru

Jika Anda ingin menambahkan halaman rekomendasi baru:

1.  **Langkah 1**: Buat folder baru di `src/pages/nama-fitur/`.
2.  **Langkah 2**: Buat file `algorithm.ts`. Gunakan model `NaiveBayesModel` untuk scoring dan `runMMROptimization` untuk diversifikasi hasil.
3.  **Langkah 3**: Buat file `index.tsx`. Pastikan memanggil `getSteamSpyDetails` agar algoritma memiliki data tags yang valid.
4.  **Langkah 4**: Daftarkan rute baru di `src/index.tsx`.

## 4. Pengujian Stabilitas

1.  **Validasi Model**: Pastikan `trainNaiveBayes` menghasilkan probabilitas yang masuk akal berdasarkan tags pada library pengguna.
2.  **Uji MMR**: Verifikasi bahwa daftar hasil tidak didominasi oleh satu tag yang sama secara berlebihan (diversitas tinggi).

---
*Arsitektur ini memastikan bahwa kode tetap rapi seiring bertambahnya fitur baru.*

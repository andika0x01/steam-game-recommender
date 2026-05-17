# 04 - Panduan Teknis & Pengembangan Sistem

Dokumen ini ditujukan bagi pengembang atau asisten laboratorium yang ingin memeriksa struktur kode atau memperluas fungsionalitas sistem ini.

---

## 1. Arsitektur Kode (Colocated Logic)

Kami menggunakan pola **Colocated Logic** untuk menyeimbangkan antara keterpakaian ulang kode (reusability) dan kejelasan domain bisnis per halaman.

*   **Pusat Fungsi Shared (`src/lib/algorithm.ts`)**: Berisi primitif matematika dan fungsi umum yang digunakan oleh banyak fitur (misal: `trapezoid` fuzzy, `calculateAffinityScore` Bayesian, dan wrapper SA standar).
*   **Logika Spesifik Halaman (`src/pages/*/algorithm.ts`)**: Setiap folder halaman memiliki file algoritmanya sendiri. File ini mengimpor fungsi shared dari `lib` dan mengimplementasikan alur logika unik untuk fitur tersebut (misal: `getCoopConvergence` untuk fitur Co-op).
*   **Antarmuka UI (`src/pages/*/index.tsx`)**: File presentasi yang hanya fokus pada rendering dan interaksi pengguna, mengimpor logika dari file `algorithm.ts` di folder yang sama.

## 2. Integritas Data & Caching (KV Store)

Sistem menggunakan **Cloudflare KV** sebagai lapisan memori jangka panjang untuk metadata Steam.
*   **Enrichment**: Karena API Steam `GetOwnedGames` tidak menyertakan genre, sistem melakukan fetch detail secara real-time dan menyimpannya di KV.
*   **Efisiensi**: Metadata genre yang sudah di-cache akan tersedia secara instan untuk semua pengguna, menghindari rate limit API Steam.

## 3. Instruksi Penambahan Fitur Baru

Jika Anda ingin menambahkan halaman rekomendasi baru:

1.  **Langkah 1**: Buat folder baru di `src/pages/nama-fitur/`.
2.  **Langkah 2**: Buat file `algorithm.ts`. Impor utilitas dari `../../lib/algorithm` dan buat fungsi utama (misal: `getNewRecommendations`).
3.  **Langkah 3**: Buat file `index.tsx` untuk UI dan panggil fungsi dari `algorithm.ts`.
4.  **Langkah 4**: Daftarkan rute baru di `src/index.tsx`.

## 4. Pengujian Stabilitas

1.  **Validasi Profil**: Pastikan `calculateUserGenreProfile` (di `lib/algorithm.ts`) menghasilkan skor yang akurat berdasarkan playtime.
2.  **Uji Konvergensi**: Periksa apakah logika optimasi di `algorithm.ts` halaman terkait berhasil menyaring kandidat dengan skor tertinggi namun tetap bervariasi.

---
*Arsitektur ini memastikan bahwa kode tetap rapi seiring bertambahnya fitur baru.*

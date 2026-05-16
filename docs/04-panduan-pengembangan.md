# 04 - Panduan Teknis & Pengembangan Sistem

Dokumen ini ditujukan bagi pengembang atau asisten laboratorium yang ingin memeriksa struktur kode atau memperluas fungsionalitas sistem ini.

---

## 1. Arsitektur Kode (Logic Isolation)

Kami memisahkan total antara antarmuka (UI) dengan logika cerdas (Algorithm).
*   **Pusat Logika (`src/pages/engine/algorithm/`)**: Berisi otak utama aplikasi (Fuzzy, Bayesian, SA). Halaman lain mengimpor logika dari sini untuk menjaga konsistensi profil user.
*   **Folder `src/lib/`**: Berisi wrapper API (Steam, SteamSpy, CheapShark) dan manajemen **Cloudflare KV Cache** untuk metadata genre.
*   **File Halaman (`src/pages/*/index.tsx`)**: Bertindak sebagai konduktor yang mengatur alur data dan merender visualisasi.

## 2. Integritas Data & Caching (KV Store)

Sistem menggunakan **Cloudflare KV** sebagai lapisan memori jangka panjang untuk metadata Steam.
*   **Enrichment**: Karena API Steam `GetOwnedGames` tidak menyertakan genre, sistem melakukan fetch detail secara real-time dan menyimpannya di KV.
*   **Efisiensi**: Game yang sudah pernah di-enrich oleh satu user akan tersedia secara instan untuk user lainnya, meminimalkan hit ke API Steam Store yang memiliki rate limit ketat.

## 3. Instruksi Penambahan Algoritma Baru

Aplikasi ini didesain secara modular di dalam suite **Deep Personalization**:

1.  **Langkah 1**: Tambahkan fungsi matematis baru di `src/pages/engine/algorithm/`.
2.  **Langkah 2**: Integrasikan ke dalam pipeline di halaman tujuan (misal: Engine atau Deals).
3.  **Langkah 3**: Jika algoritma baru membutuhkan data tambahan, perbarui wrapper di `src/lib/steam.ts`.

## 4. Pengujian Stabilitas (Deep Personalization)

Algoritma dalam sistem ini bersifat deterministik pada tahap Bayesian, namun stokastik pada tahap **Simulated Annealing (SA)**.
1.  **Validasi Profil**: Pastikan `calculateUserGenreProfile` menghasilkan distribusi probabilitas yang logis sesuai library user.
2.  **Uji Konvergensi SA**: Jalankan rekomendasi berkali-kali. SA yang optimal akan menghasilkan set yang berbeda secara item namun konsisten secara kualitas (skor Match tetap tinggi).
3.  **Genre Balance**: Periksa apakah hasil akhir mengandung variasi genre yang sehat (efek dari *Saturation Penalty* di SA).

## 5. Deployment ke Produksi

Sistem ini dioptimasi untuk berjalan di **Cloudflare Workers**.
```bash
# Untuk mendeploy perubahan terbaru
npm run deploy
```
Pastikan `wrangler.jsonc` telah dikonfigurasi dengan binding D1 dan KV yang benar.

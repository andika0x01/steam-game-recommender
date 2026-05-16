# 04 - Panduan Teknis & Pengembangan Sistem

Dokumen ini ditujukan bagi pengembang atau asisten laboratorium yang ingin memeriksa struktur kode atau memperluas fungsionalitas sistem ini.

---

## 1. Arsitektur Kode (Logic Isolation)

Kami memisahkan total antara antarmuka (UI) dengan logika cerdas (Algorithm).
*   **Folder `src/algorithm/`**: Berisi file TypeScript murni tanpa ketergantungan pada React. Ini memudahkan pengujian matematis tanpa gangguan tampilan.
*   **Folder `src/lib/`**: Berisi wrapper API untuk berkomunikasi dengan Steam dan CheapShark.
*   **File `src/index.tsx`**: Bertindak sebagai "Konduktor" yang mengatur alur data dari API, memprosesnya melalui algoritma, dan mengirimkannya ke layar.

## 2. Cara Kerja Penyimpanan (D1 Database)

Sistem menggunakan database relasional SQLite di Edge (Cloudflare D1).
*   **Optimasi Persisten**: Saat user menekan tombol "Initialize PSO/GA", parameter yang dihasilkan algoritma disimpan di kolom `engine_params` atau `deals_params`.
*   **Efisiensi**: Sistem tidak perlu melakukan evolusi (GA/PSO) setiap kali halaman dimuat, cukup sekali saja dan hasilnya akan diingat selamanya hingga user melakukan Reset.

## 3. Instruksi Penambahan Algoritma Baru

Aplikasi ini didesain secara modular. Untuk menambahkan algoritma baru (misal: *Reinforcement Learning* sederhana):

1.  **Langkah 1**: Buat file di `src/algorithm/reinforcement.ts`.
2.  **Langkah 2**: Daftarkan fungsi tersebut di `src/algorithm/index.ts`.
3.  **Langkah 3**: Masukkan fungsi baru tersebut ke dalam *Ensemble Pipeline* di fungsi `generateEnsembleRecommendations`.
4.  **Langkah 4**: Perbarui UI di `index.tsx` jika ada parameter baru yang perlu ditampilkan.

## 4. Pengujian Stabilitas (Statistical Validation)

Karena algoritma CI seperti PSO, GA, dan ACO bersifat stokastik (ada unsur acak), kami menyarankan pengujian dengan cara:
1.  Jalankan fungsi rekomendasi 10 kali untuk user yang sama.
2.  Amati persentase kecocokan. Jika variasi hasilnya di bawah 5%, maka algoritma dianggap **Stabil**.
3.  Periksa log terminal server untuk melihat kurva fitnes/energi (jika log debug aktif).

## 5. Deployment ke Produksi

Sistem ini dioptimasi untuk berjalan di **Cloudflare Workers**.
```bash
# Untuk mendeploy perubahan terbaru ke internet secara global
npm run deploy
```
Pastikan seluruh file migrasi SQL di folder `migrations/` sudah diterapkan ke remote database menggunakan perintah `wrangler d1 migrations apply`.

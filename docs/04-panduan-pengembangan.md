# 04 - Panduan Pengembangan & Kontribusi

Sistem ini bersifat modular dan memisahkan antara UI (React) dengan Logic (TypeScript). Berikut adalah panduan jika Anda ingin melakukan kontribusi atau pengembangan lebih lanjut.

## Cara Menambah Algoritma Baru

Jika Anda ingin menambahkan algoritma CI baru (misal: Particle Filter atau Deep Learning Inference):

1.  **Logic Isolation**: Buat file baru di `src/algorithm/namaAlgoritma.ts`. Pastikan fungsi utama diekspor secara eksplisit.
2.  **Registration**: Tambahkan ekspor algoritma tersebut di `src/algorithm/index.ts`.
3.  **Pipeline Integration**: Tambahkan panggilan algoritma baru tersebut di dalam fungsi `generateEnsembleRecommendations` agar berkontribusi pada skor akhir.
4.  **UI Data**: Jika algoritma baru membutuhkan parameter khusus, tambahkan kolom baru di database D1 via migrasi SQL.

## Pengelolaan Database (Cloudflare D1)

Skema database saat ini mencakup:
*   `users`: Menyimpan profil dan parameter tuning (`engine_params`, `deals_params`).
*   `friends`: Menyimpan relasi antar agen.
*   `tier_lists`: Menyimpan klasifikasi manual game.

Untuk menerapkan perubahan skema:
```bash
# Tambahkan file .sql di folder migrations/
npx wrangler d1 migrations apply steam-recommender --local
```

## Pengujian Stabilitas
Beberapa algoritma CI bersifat stokastik (random). Untuk pengujian, sangat disarankan melakukan **Ensemble Testing**:
*   Jalankan algoritma 10x untuk input yang sama.
*   Pastikan varians hasil akhir tidak melebihi 5%.
*   Jika menggunakan GA/PSO, pastikan kurva fitnes selalu menunjukkan tren konvergensi di terminal log.

## Panduan Visual
Pastikan elemen UI baru mengikuti standar Tailwind yang ada di `src/style.css`, terutama pemanfaatan kelas `.glass` dan skema warna monochrome dengan aksen fungsional.

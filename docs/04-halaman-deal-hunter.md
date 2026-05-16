# 04 - Halaman Deal Hunter

Halaman **Deal Hunter** (`/deals`) adalah asisten belanja cerdas Anda untuk berburu diskon game di Steam.

## Fungsi Utama (Perspektif Pengguna)
Halaman ini mencari diskon terbaik dari berbagai toko digital (via CheapShark API) dan menampilkannya kepada Anda. Berbeda dengan daftar diskon biasa, Deal Hunter memprioritaskan "Value for Money" — yaitu keseimbangan antara harga yang murah dengan tingkat kecocokan game tersebut bagi Anda.

## Bagaimana Cara Kerjanya? (Algoritma CI)

### 1. Bayesian Interest Scoring
Setiap game diskon yang ditemukan akan dirating menggunakan profil Bayesian Anda. Sistem akan menebak: "Meskipun game ini sedang diskon 90%, apakah user ini sebenarnya akan menyukainya?"

### 2. Particle Swarm Optimization (PSO)
Saat Anda menekan tombol **Optimize Value (PSO)**, sistem menjalankan simulasi burung/partikel virtual.
*   **Masalah**: Bagaimana cara menyeimbangkan (1) Diskon Besar, (2) Harga Murah, dan (3) Keseruan Game?
*   **Logika**: Partikel-partikel virtual mencoba berbagai kombinasi bobot untuk ketiga variabel tersebut. Mereka saling berkomunikasi untuk menemukan "titik manis" yang memberikan rekomendasi diskon yang paling memuaskan dompet dan selera Anda.

### 3. Dynamic Filtering
Halaman ini secara cerdas menyaring game yang sudah Anda miliki. Ini memastikan Anda tidak membuang waktu melihat diskon untuk game yang sudah ada di library Anda.

---
*Fitur ini dirancang untuk menjawab pertanyaan: "Game murah apa yang paling layak saya beli saat ini?"*

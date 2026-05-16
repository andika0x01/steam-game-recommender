# 01 - Arsitektur Hybrid Parallel Ensemble

Sistem ini tidak mengandalkan satu algoritma tunggal. Sebaliknya, ia menggunakan arsitektur **Parallel Hybrid Ensemble** untuk menghasilkan rekomendasi yang seimbang antara akurasi (relevance) dan kejutan (novelty).

## Alur Kerja Pipeline

### 1. Data Processing (Fuzzy Profiling)
Sistem mengambil data library dan playtime Anda. Algoritma **Fuzzy Logic** dengan fungsi keanggotaan **Trapezoidal** (dioptimasi oleh GA) digunakan untuk mengubah angka mentah jam main menjadi kategori linguistik (Low, Medium, High engagement). Ini membangun profil preferensi genre yang lebih dinamis daripada sekadar angka rata-rata.

### 2. Candidate Generation (Parallel Agents)
Dua agen bekerja secara paralel untuk mencari kandidat game baru:
- **Bayesian Agent**: Menghitung probabilitas ketertarikan matematis berdasarkan sejarah genre di library Anda.
- **A* Search Agent**: Navigasi graf kemiripan genre untuk mencari game yang secara struktural "dekat" dengan game favorit Anda.

### 3. Selection & Diversity (Simulated Annealing)
Dari ratusan kandidat yang ditemukan agen, sistem menggunakan **Simulated Annealing (SA)** untuk memilih 12 game terbaik. SA bertugas mencari kombinasi game yang memiliki total skor afinitas tinggi namun tetap menjaga **keberagaman genre (diversity)** agar daftar tidak membosankan (misal: tidak RPG semua).

### 4. Continuous Evolution (GA & PSO)
Sistem memiliki memori di database D1 untuk menyimpan parameter yang sudah di-tune:
- **GA (Genetic Algorithm)**: Digunakan untuk menyesuaikan batas-batas kategori Fuzzy agar sesuai dengan gaya bermain Anda.
- **PSO (Particle Swarm Optimization)**: Digunakan untuk mencari bobot kepentingan kriteria (seperti diskon vs afinitas) pada fitur Deal Hunter.

## Struktur Komputasi di Edge
Seluruh logika ini dijalankan di **Cloudflare Workers**. Penggunaan TypeScript murni pada folder `src/algorithm/` memungkinkan eksekusi matematika CI yang sangat cepat dengan latensi rendah (cold-start mendekati nol), langsung di server yang paling dekat dengan lokasi fisik pengguna.

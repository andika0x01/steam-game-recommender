# 01 - Halaman Discovery Engine

Halaman **Discovery Engine** (`/engine`) adalah pusat penemuan game baru yang paling cocok dengan kepribadian bermain Anda.

## Fungsi Utama (Perspektif Pengguna)
Discovery Engine memindai ribuan game di Steam untuk menemukan "belahan jiwa digital" Anda berikutnya. Halaman ini tidak menampilkan game yang sudah Anda miliki, melainkan fokus pada apa yang harus Anda dapatkan selanjutnya agar waktu bermain Anda maksimal.

## Bagaimana Cara Kerjanya? (Algoritma CI)
Halaman ini bekerja secara prosedural menggunakan **Hybrid Ensemble Pipeline** yang terdiri dari beberapa algoritma cerdas:

### 1. Profiling dengan Genetic Algorithm (GA)
Saat Anda menekan tombol **Initialize PSO/GA**, sistem menjalankan algoritma evolusi. Ia mencoba berbagai kombinasi parameter untuk profil *Fuzzy Logic* Anda dan memilih yang paling akurat dalam mendeskripsikan library Anda saat ini.

### 2. Bayesian Scorer
Sistem menggunakan logika peluang **Bayesian**. Ia melihat genre apa yang paling sering Anda mainkan di masa lalu dan menghitung probabilitas matematis apakah Anda akan menyukai game baru tertentu. Game dengan genre yang sering Anda mainkan akan mendapatkan skor awal yang tinggi.

### 3. A* Similarity Search
Sistem membangun graf hubungan antar game. Algoritma **A*** mencari jalur terpendek (kesamaan fitur paling dekat) antara game favorit Anda dengan kandidat game baru di Steam Store. Ini memastikan rekomendasi tetap relevan secara mekanik permainan.

### 4. Simulated Annealing (SA)
Ini adalah tahap akhir. Setelah mendapatkan ratusan saran, algoritma **SA** memilih 12 game terbaik. SA memastikan daftar tersebut tidak membosankan (misal: tidak semuanya game tembak-tembakan). Ia sengaja menyisipkan variasi genre agar pengalaman penemuan Anda tetap segar.

---
*Fitur ini dirancang untuk memberikan jawaban atas pertanyaan: "Game hebat apa lagi yang belum saya punya?"*

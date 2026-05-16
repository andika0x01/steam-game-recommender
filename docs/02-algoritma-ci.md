# 02 - Ensiklopedia Algoritma CI: Penjelasan untuk Semua Orang

Dokumen ini membedah "cara berpikir" setiap algoritma yang ada di dalam aplikasi ini. Kami menjelaskannya menggunakan analogi sederhana agar mudah dipahami bahkan tanpa latar belakang IT.

---

## 1. Fuzzy Logic (Logika Samar)
**"Bukan sekadar Hitam dan Putih"**

*   **Masalah**: Komputer biasanya hanya tahu "Ya" atau "Tidak" (0 atau 1). Tapi, rasa suka manusia itu bertingkat.
*   **Analogi**: Bayangkan segelas kopi. Apakah kopi itu "Panas" atau "Dingin"? Jika suhunya 40°C, dia tidak benar-benar panas, tapi juga tidak dingin. Dia "Hangat". Fuzzy Logic memungkinkan komputer mengerti konsep "Hangat" ini.
*   **Cara Kerja di Sini**: Sistem melihat jam main Anda. Jika main 10 jam, sistem tidak langsung bilang Anda "Suka". Tapi dia bilang: "Anda 70% Suka (Medium) dan 20% Sangat Suka (High)". Ini membuat profil Anda jauh lebih akurat.

## 2. Genetic Algorithm (Algoritma Genetika)
**"Evolusi Parameter agar Semakin Cerdas"**

*   **Masalah**: Setiap orang punya gaya main berbeda. Ada yang merasa 10 jam itu sudah lama, ada yang merasa 100 jam itu baru pemanasan.
*   **Analogi**: Seperti menanam bunga. Anda menanam banyak benih, lalu Anda hanya memelihara bunga yang tumbuh paling indah. Bunga yang indah itu kemudian menghasilkan benih baru yang lebih kuat. Begitu seterusnya hingga Anda punya taman yang sempurna.
*   **Cara Kerja di Sini**: Sistem mencoba ratusan kombinasi "angka batasan" untuk profil Anda. Dia membuang yang salah dan memelihara yang benar hingga menemukan angka yang paling pas untuk mengenali gaya bermain unik Anda.

## 3. Particle Swarm Optimization / PSO (Optimasi Kerumunan Partikel)
**"Kerjasama Tim Mencari Diskon Terbaik"**

*   **Masalah**: Di fitur *Deal Hunter*, kita harus menyeimbangkan antara: (1) Murah, (2) Diskonnya besar, dan (3) Gamenya seru. Mencari titik tengah ini sulit.
*   **Analogi**: Bayangkan sekumpulan burung yang sedang mencari sumber makanan di hutan. Saat satu burung menemukan tempat makan yang bagus, dia akan berteriak memanggil kawanannya. Burung lain akan terbang mendekat, tapi sambil tetap mencari-cari kalau ada tempat yang lebih baik lagi. Akhirnya, seluruh kawanan berkumpul di tempat makan terbaik.
*   **Cara Kerja di Sini**: Sistem mengirimkan puluhan "partikel virtual" untuk mencoba berbagai bobot kepentingan. Akhirnya, mereka semua sepakat pada satu settingan bobot yang memberikan Anda rekomendasi "Paling Untung".

## 4. Bayesian Inference (Kesimpulan Bayesian)
**"Belajar dari Pengalaman Masa Lalu"**

*   **Masalah**: Bagaimana cara menebak Anda akan suka game baru yang belum pernah Anda sentuh?
*   **Analogi**: Jika Anda melihat teman Anda selalu memesan nasi goreng setiap kali ke restoran, Anda bisa menebak dengan probabilitas tinggi bahwa jika ada menu nasi goreng baru, dia pasti akan menyukainya.
*   **Cara Kerja di Sini**: Sistem menghitung statistik genre di library Anda. Jika 80% game Anda adalah 'Action', maka secara otomatis game baru bergenre 'Action' akan mendapatkan skor "Peluang Suka" yang tinggi.

## 5. Classical Search - A* (Pencarian Jalur Terpendek)
**"Mencari Jembatan Antar Genre"**

*   **Masalah**: Bagaimana cara menghubungkan game favorit Anda dengan game milik teman di fitur Co-op?
*   **Analogi**: Seperti Google Maps mencari jalan tercepat dari rumah ke kantor. Dia tidak hanya melihat jarak, tapi juga kemacetan.
*   **Cara Kerja di Sini**: Sistem menganggap setiap game adalah sebuah kota. Jalan antar kota adalah kesamaan genrenya. A* akan mencari urutan game (rute) yang transisi genrenya paling mulus, sehingga Anda dan teman tidak merasa kaget saat berpindah dari satu game ke game lain.

## 6. Ant Colony Optimization / ACO (Optimasi Koloni Semut)
**"Menemukan Jejak di Hutan Backlog"**

*   **Masalah**: Anda punya banyak game yang belum dimainkan. Mana yang harus dimainkan duluan?
*   **Analogi**: Semut mencari makanan dengan meninggalkan jejak bau (feromon). Semakin banyak semut lewat jalan itu, baunya makin kuat, dan semut lain akan ikut.
*   **Cara Kerja di Sini**: Sistem mensimulasikan "semut digital" yang berjalan di daftar backlog Anda. Jalur yang paling sering dilewati (karena skor Fuzzy-nya tinggi) akan menjadi rute utama di Campaign Map Anda.

## 7. Simulated Annealing / SA (Pendinginan Tiruan)
**"Memilih Daftar yang Tidak Membosankan"**

*   **Masalah**: Jika sistem hanya memberi yang paling mirip, daftar Anda akan berisi 12 game yang genrenya sama semua. Itu membosankan.
*   **Analogi**: Seperti membuat campuran kopi. Jika terlalu banyak gula, kemanisan. Jika terlalu banyak kopi, kepahitan. Kita mengocok bahan-bahannya saat masih "panas", lalu pelan-pelan kita biarkan "dingin" sampai komposisinya pas dan nikmat.
*   **Cara Kerja di Sini**: SA mengambil hasil dari algoritma lain, lalu "mengacaknya" sedikit. Dia membuang game yang terlalu mirip dan menggantinya dengan variasi lain yang tetap berkualitas, sehingga hasil akhirnya adalah daftar 12 game yang beragam tapi tetap Anda sukai.

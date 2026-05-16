# 01 - Arsitektur Hybrid Parallel Ensemble: Otak di Balik Rekomendasi

Dokumen ini menjelaskan "peta jalan" bagaimana aplikasi ini berpikir. Kita tidak menggunakan satu cara saja untuk memberi rekomendasi, melainkan menggabungkan banyak algoritma pintar yang bekerja bersamaan.

## Apa itu Hybrid Parallel Ensemble?

Bayangkan Anda ingin membeli mobil baru. Anda tentu tidak hanya bertanya pada satu orang, bukan?
1. Anda bertanya pada **ahli mesin** (data teknis).
2. Anda bertanya pada **teman yang hobi balap** (pengalaman emosional).
3. Anda melihat **daftar diskon** di koran (ekonomi).

Sistem kami bekerja persis seperti itu. Kami menjalankan beberapa "agen cerdas" secara paralel (bersamaan), lalu menggabungkan saran mereka menjadi satu daftar terbaik untuk Anda.

---

## Alur Kerja Sistem (Pipeline)

### Tahap 1: Mengenali Kepribadian Anda (User Profiling)
Sebelum memberi saran, sistem harus tahu siapa Anda.
*   **Algoritma**: *Fuzzy Logic* & *Genetic Algorithm*.
*   **Analogi**: Seperti koki yang mencicipi masakan Anda untuk tahu apakah Anda suka pedas atau manis. Sistem melihat jam main Anda dan menentukan: "Oh, orang ini adalah penggemar berat RPG, tapi hanya pemain kasual di game FPS."

### Tahap 2: Mencari Kandidat (The Search Party)
Sistem mulai mencari game di seluruh database Steam.
*   **Agen Bayesian**: Dia melihat data statistik. "Berdasarkan angka, ada peluang 90% Anda akan suka game ini."
*   **Agen A***: Dia melihat hubungan antar game. "Jika Anda suka Elden Ring, maka jalur terdekat secara mekanik permainan adalah menuju Dark Souls."
*   **Agen ACO**: Dia melihat tren. "Banyak pemain dengan selera seperti Anda berakhir sangat menyukai game tersembunyi ini."

### Tahap 3: Seleksi Final (The Quality Control)
Setelah dapat ratusan saran, sistem tidak langsung memberikan semuanya ke Anda.
*   **Algoritma**: *Simulated Annealing*.
*   **Analogi**: Seperti menyusun sebuah majalah. Anda tidak ingin isinya hanya tentang satu topik. Sistem memilih 12 game yang skornya paling tinggi, tapi tetap memastikan genrenya bervariasi (tidak RPG semua) agar Anda tidak bosan.

### Tahap 4: Optimasi Biaya (The Deal Finder)
Khusus untuk fitur diskon, sistem menjalankan agen tambahan.
*   **Algoritma**: *Particle Swarm Optimization*.
*   **Tujuan**: Mencari keseimbangan antara "sangat murah" dan "sangat cocok".

---

## Mengapa Menggunakan Arsitektur Ini?

1.  **Akurasi Tinggi**: Karena digarap oleh banyak algoritma sekaligus.
2.  **Kejutan (Serendipity)**: Anda bisa menemukan game yang tidak pernah Anda pikirkan sebelumnya, tapi ternyata sangat cocok.
3.  **Personalisasi**: Sistem "belajar" dan "berevolusi" setiap kali Anda menekan tombol optimasi, sehingga saran hari ini akan lebih pintar daripada saran kemarin.

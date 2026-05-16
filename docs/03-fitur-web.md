# 03 - Panduan Pengalaman Pengguna (Fitur Web)

Halaman ini menjelaskan bagaimana teknologi canggih di balik layar diubah menjadi fitur-fitur yang bisa Anda lihat dan klik di website ini.

---

## 1. Discovery Engine (`/engine`)
**"Mesin Pencari Jodoh Digital Anda"**

*   **Apa yang dilakukannya?**
    Discovery Engine memindai ribuan game di Steam untuk menemukan game yang Anda **belum miliki** tapi kemungkinan besar akan Anda **sangat sukai**.
*   **Bagaimana cara kerjanya?**
    Sistem menjalankan **Ensemble Pipeline** (Bayesian + A* + SA). Dia menghitung peluang kecocokan secara matematis dan memastikan 12 game yang tampil di layar memiliki genre yang bervariasi.
*   **Tombol Kontrol**: 
    - **Initialize PSO**: Mengaktifkan mesin optimasi.
    - **Cancel Optimization**: Mengembalikan ke setelan pabrik.

## 2. Campaign Map (`/backlog`)
**"Peta Jalan Menuju Bebas Backlog"**

*   **Apa yang dilakukannya?**
    Membantu Anda mengatasi "kebingungan memilih" (choice paralysis) dari banyaknya game yang sudah Anda beli tapi belum dimainkan.
*   **Langkah-langkah**:
    1. Sistem menampilkan semua koleksi Anda yang sudah dirating (0-100%) menggunakan **Fuzzy Logic**.
    2. Saat Anda menekan tombol **Generate Campaign Route**, sistem menjalankan **Ant Colony Optimization (ACO)**.
    3. ACO akan menyusun rute perjalanan (Waypoints) berisi urutan game yang paling seru untuk dimainkan secara berurutan.

## 3. Co-op Nexus Map (`/coop`)
**"Bermain Bersama Menjadi Lebih Mudah"**

*   **Apa yang dilakukannya?**
    Mencari game yang dimiliki oleh Anda dan teman-teman Anda, lalu menyusun rute bermain yang cocok untuk semua orang di grup tersebut.
*   **Fitur Utama**:
    - **Multi-select Friends**: Anda bisa memilih banyak teman sekaligus di panel kiri.
    - **A* Optimized Path**: Menggunakan algoritma **A*** untuk memastikan transisi antar game dalam sesi bermain bersama terasa mulus dan tidak membosankan bagi siapa pun.

## 4. Deal Hunter (`/deals`)
**"Belanja Cerdas dengan Kekuatan AI"**

*   **Apa yang dilakukannya?**
    Menyisir diskon game di CheapShark dan menampilkannya kepada Anda berdasarkan prinsip **Value-for-Money**.
*   **Algoritma Utama**: **PSO (Particle Swarm Optimization)**.
*   **Keunikan**: Sistem tidak hanya memberi tahu apa yang murah. Dia menyeimbangkan antara: "Seberapa besar diskonnya?", "Seberapa murah harganya?", dan "Seberapa cocok dengan selera Anda?".
*   **Fitur Reset**: Anda bisa membatalkan optimasi jika ingin melihat penawaran diskon yang lebih umum (tidak terlalu personal).

---

## Mengapa Antarmuka Kami Terasa "Berbeda"? (UI/UX Concept)

Kami menggunakan gaya desain **Glassmorphism**:
- **Transparansi**: Melambangkan kejujuran data yang diolah AI.
- **Aksen Warna Emerald/Amber**: Memberikan sinyal status mesin yang sedang bekerja (seperti Command Center).
- **Animasi Transisi**: Menunjukkan bahwa sistem kami "hidup" dan terus memproses data Anda secara real-time.

# 02 - Halaman Campaign Map (Backlog)

Halaman **Campaign Map** (`/backlog`) adalah asisten strategis Anda untuk menaklukkan tumpukan game yang sudah dibeli tapi belum pernah diselesaikan.

## Fungsi Utama (Perspektif Pengguna)
Halaman ini membantu Anda mengatasi *Choice Paralysis* (kebingungan memilih). Alih-alih melihat daftar panjang yang mengintimidasi, sistem akan menyusun sebuah "Peta Perjalanan" (Waypoints) berisi urutan game yang sebaiknya Anda mainkan sekarang hingga nanti.

## Bagaimana Cara Kerjanya? (Algoritma CI)

### 1. Fuzzy Logic Rating
Setiap game di library Anda (yang waktu mainnya < 2 jam) dirating secara otomatis. **Fuzzy Logic** memberikan nilai 0-100% berdasarkan kemiripan genre game tersebut dengan preferensi library Anda. Game yang paling Anda sukai akan mendapatkan skor rating tertinggi.

### 2. Ant Colony Optimization (ACO)
Saat Anda menekan tombol **Generate Campaign Route**, simulasi koloni semut virtual dijalankan.
*   **Logika**: Semut akan mencoba berbagai jalur di daftar game Anda.
*   **Feromon**: Jalur yang menghubungkan game-game dengan skor Fuzzy tinggi akan mendapatkan "feromon" yang lebih kuat.
*   **Hasil**: Sistem akan memilih jalur dengan akumulasi feromon terkuat sebagai rute utama Anda. Ini menghasilkan urutan main yang logis dan memuaskan.

### 3. Visualisasi Waypoint
Hasil dari algoritma ACO ditampilkan sebagai titik-titik perjalanan (Waypoint #1, #2, dst). Ini memberikan narasi visual bahwa Anda sedang berada dalam sebuah misi untuk menghabiskan backlog Anda.

---
*Fitur ini dirancang untuk menjawab pertanyaan: "Dari semua game yang saya punya, mana yang harus saya tamatkan duluan?"*

# 03 - Konsep Fitur & UI/UX

Aplikasi ini dirancang dengan antarmuka **High-Signal Glassmorphism** yang memberikan kesan futuristik dan teknis, selaras dengan pemanfaatan algoritma Computational Intelligence.

## 1. Discovery Engine (`/engine`)
*   **Tujuan**: Menemukan game baru (Discovery) yang belum dimiliki.
*   **UX**: Menggunakan *Ensemble Scorer*. Menampilkan persentase kecocokan yang sangat akurat.
*   **Kontrol**: Tombol tunggal **"Initialize PSO"** (untuk mengaktifkan tuning) atau **"Cancel Optimization"** (untuk reset). Ini memberi user kendali penuh atas kapan evolusi profil terjadi.

## 2. Campaign Map (`/backlog`)
*   **Tujuan**: Mengelola tumpukan game (backlog) secara strategis.
*   **UX**: Pertama-tama menampilkan seluruh koleksi yang dirating oleh Fuzzy Logic.
*   **Kontrol**: Tombol **"Generate Campaign Route (ACO)"** memicu simulasi semut untuk menyusun peta perjalanan bermain yang optimal (waypoint).

## 3. Co-op Nexus Map (`/coop`)
*   **Tujuan**: Menemukan game terbaik untuk dimainkan bersama teman.
*   **UX**: Panel kiri menampilkan arsip agen (teman) yang bisa dipilih secara massal (Multi-select).
*   **Kontrol**: Tombol **"Generate Nexus Map (A*)"** menyusun rute kemiripan genre khusus untuk game yang dimiliki bersama oleh seluruh anggota grup.

## 4. Deal Hunter (`/deals`)
*   **Tujuan**: Berburu diskon game dengan prinsip efisiensi biaya.
*   **UX**: Menampilkan kartu diskon yang dirating berdasarkan algoritma PSO (Value-for-Money).
*   **Filter**: Secara otomatis menyaring game yang sudah Anda miliki agar tidak muncul kembali.

## Estetika Visual (UI Language)
*   **Emerald (#10b981)**: Melambangkan koneksi aktif, rute optimal, dan penghematan biaya.
*   **Amber (#f59e0b)**: Melambangkan status tuning, optimasi, dan peringatan sistem.
*   **Zinc/Monochrome**: Warna dasar yang tenang untuk menjaga fokus pada data (game) dan skor rating.
*   **Mono Typography**: Menggunakan font monospace untuk angka dan status teknis agar memberikan nuansa "Command Center".

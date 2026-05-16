# 05 - Panduan Arsitektur Prosedural Modular

Aplikasi ini tidak mengikuti standar arsitektur perangkat lunak komersial pada umumnya. Sebaliknya, ia menggunakan pendekatan **Prosedural Murni per Halaman** yang dirancang khusus untuk transparansi akademik dan kemudahan pemahaman algoritma.

---

## 1. Konsep Dasar
Dalam arsitektur tradisional, pengembang cenderung menumpuk semua logika di satu tempat terpusat (Shared Library). Namun, pada proyek ini:
*   Setiap halaman (`/engine`, `/backlog`, dll) dianggap sebagai satu unit mandiri.
*   Logika algoritma berada di dalam folder halaman tersebut (`algorithm/`).
*   Proses berjalan secara linear: **Menerima Data API -> Memproses via Algoritma Lokal -> Merender UI**.

## 2. Alasan Akademis (Mengapa Prosedural?)
Pendekatan ini diambil untuk mempermudah penilaian Tugas Besar:
1.  **Transparansi Alur**: Penilai dapat melihat dengan jelas bagaimana data mengalir di satu halaman tanpa harus mencari file referensi di folder lain yang jauh.
2.  **Isolasi Kegagalan**: Jika ada perubahan pada algoritma di halaman Deals, hal tersebut tidak akan merusak kestabilan halaman Engine. Ini sangat penting saat melakukan eksperimen algoritma.
3.  **Independensi Modul**: Setiap folder halaman bisa dilepas dan dijalankan secara mandiri, memudahkan pengujian unit (unit testing) untuk setiap fitur spesifik.

## 3. Pembedahan Struktur Folder
Berikut adalah peta jalan kode sumber:

```text
src/
└── pages/
    ├── dashboard/       # Logika Persona & Profiling Dasar
    ├── engine/          # [Pusat CI] Pipeline Ensemble (Bayesian, A*, SA)
    │   └── algorithm/   # Otak cerdas khusus Discovery
    ├── backlog/         # [Pusat CI] Sequencing (ACO, Fuzzy)
    │   └── algorithm/   # Otak cerdas khusus Campaign Map
    ├── coop/            # [Pusat CI] Pathfinding (A*)
    │   └── algorithm/   # Otak cerdas khusus Nexus
    └── deals/           # [Pusat CI] Multi-Objective Opt (PSO)
        └── algorithm/   # Otak cerdas khusus Deal Hunter
```

## 4. Keunggulan untuk Pengembangan Masa Depan
Jika Anda ingin menambahkan fitur baru, Anda hanya perlu membuat satu folder baru di bawah `src/pages/`. Anda tidak perlu khawatir merusak logika yang sudah ada. Arsitektur ini mengutamakan **Integritas Data** dan **Kejujuran Algoritma** di atas efisiensi pengetikan kode.

---
*Kesimpulan: Arsitektur ini adalah jembatan antara dunia riset algoritma dengan aplikasi web modern.*

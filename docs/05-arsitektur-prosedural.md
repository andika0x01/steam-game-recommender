# 05 - Arsitektur Prosedural Modular

Dokumen ini menjelaskan struktur teknis kode sumber aplikasi ini. Aplikasi ini dibangun dengan prinsip **Prosedural Murni per Halaman**.

## Apa maksudnya Prosedural per Halaman?

Biasanya, pengembang perangkat lunak menumpuk semua algoritma di satu folder pusat. Namun, untuk aplikasi ini, kami mengambil pendekatan berbeda:
*   Setiap halaman (Page) adalah satu kesatuan yang utuh.
*   Logika algoritma berada langsung di dalam folder halaman tersebut (`src/pages/[nama-halaman]/algorithm/`).
*   Jika sebuah halaman membutuhkan algoritma Fuzzy, maka kode Fuzzy tersebut ada di dalam foldernya sendiri.

## Mengapa Pendekatan Ini Diambil?

1.  **Kemudahan Pemahaman**: Seseorang yang ingin mempelajari cara kerja "Campaign Map" tidak perlu mencari-cari kode di folder lain. Semuanya ada di `src/pages/backlog/`.
2.  **Isolasi Kegagalan**: Kesalahan pada algoritma di halaman Deals tidak akan mempengaruhi kinerja algoritma di halaman Engine.
3.  **Prosedural dari Nol**: Setiap halaman memulai operasinya secara mandiri, memudahkan penilaian akademis terhadap alur proses dari input (data Steam) hingga output (rekomendasi di UI).

## Struktur Folder Teknis

```text
src/
└── pages/
    ├── engine/             # Fitur Discovery
    │   ├── index.tsx       # Alur Prosedural Halaman
    │   └── algorithm/      # Otak Bayesian, SA, GA
    ├── backlog/            # Fitur Campaign Map
    │   ├── index.tsx       # Alur Prosedural Halaman
    │   └── algorithm/      # Otak ACO, Fuzzy
    ├── coop/               # Fitur Nexus
    │   ├── index.tsx       # Alur Prosedural Halaman
    │   └── algorithm/      # Otak A* Search
    └── ...
```

Pendekatan ini memastikan bahwa setiap baris kode memiliki "rumah" yang jelas dan tujuan yang spesifik dalam alur kerja pengguna.

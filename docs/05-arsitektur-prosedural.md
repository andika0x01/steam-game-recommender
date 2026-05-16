# 05 - Panduan Arsitektur Prosedural Modular

Aplikasi ini tidak mengikuti standar arsitektur perangkat lunak komersial pada umumnya. Sebaliknya, ia menggunakan pendekatan **Prosedural Murni per Halaman** yang dirancang khusus untuk transparansi akademik dan integritas algoritma.

---

## 1. Konsep Dasar
Dalam arsitektur ini, setiap fitur cerdas diisolasi ke dalam modul halamannya masing-masing. Hal ini memastikan bahwa logika personalisasi user diproses secara linear dan mudah diaudit.
*   Setiap halaman (`/engine`, `/backlog`, dll) adalah unit mandiri.
*   Proses berjalan linear: **Data Enrichment (KV) -> Profiling -> Scoring -> Optimization -> Render**.

## 2. Alasan Akademis
Pendekatan ini diambil untuk mempermudah penilaian:
1.  **Transparansi Alur**: Penilai dapat melihat dengan jelas bagaimana data mentah dari API Steam diubah menjadi rekomendasi personal dalam satu file `index.tsx`.
2.  **Isolasi Logika**: Perubahan pada parameter Simulated Annealing di satu halaman tidak akan merusak stabilitas halaman lainnya.
3.  **Audit Algoritma**: Memisahkan fungsi matematis (TypeScript murni) dari antarmuka (React/JSX) memungkinkan pengujian logika secara independen.

## 3. Pembedahan Struktur Folder (Unified Suite)
Berikut adalah peta jalan kode sumber setelah overhaul:

```text
src/
└── pages/
    ├── dashboard/       # Persona Dasar & Statistik Library
    ├── engine/          # [Pusat CI] Smart Recommendations (Fuzzy-Bayesian, SA)
    │   └── algorithm/   # Otak utama: Profiling, Preference Scoring, & Diversity SA
    ├── backlog/         # [Personalized] Priority Queue (Bayesian Ranking)
    ├── coop/            # [Multi-Agent] Group Convergence (Collective Bayesian)
    └── deals/           # [Deep Value] Deal Hunter (Weighted Bayesian + SA)
```

## 4. Keunggulan Integritas Data
Arsitektur ini mengutamakan **Integritas Data** di atas efisiensi pengetikan. Dengan memproses minimal 200-300 kandidat per permintaan dan melakukan enrichment genre secara real-time via Cloudflare KV, sistem menjamin bahwa hasil yang tampil di layar adalah hasil perhitungan matematis yang jujur terhadap library pengguna.

---
*Kesimpulan: Arsitektur ini adalah jembatan antara dunia riset algoritma dengan aplikasi web modern.*

# 05 - Panduan Arsitektur Prosedural Modular

Aplikasi ini menggunakan pendekatan **Colocated Logic** yang dirancang khusus untuk transparansi akademik dan modularitas pengembangan.

---

## 1. Konsep Dasar
Dalam arsitektur ini, setiap fitur cerdas diisolasi ke dalam folder halamannya masing-masing. Hal ini memastikan bahwa logika algoritma mudah diaudit dan tidak bercampur dengan fitur lainnya.

*   Setiap folder halaman (`/engine`, `/backlog`, dll) adalah unit mandiri yang berisi UI (`index.tsx`) dan Logika (`algorithm.ts`).
*   Proses berjalan linear: **Data Enrichment (KV) -> Profiling -> Scoring -> Optimization -> Render**.

## 2. Alasan Pemilihan Arsitektur
Pendekatan **Colocated Logic** (memasangkan Logic dengan UI di folder yang sama) diambil karena:
1.  **Kemandirian Fitur**: Perubahan pada parameter algoritma di satu halaman (misal: bobot harga di fitur Deals) tidak akan merusak stabilitas halaman lainnya.
2.  **Audit Algoritma**: Penilai dapat dengan mudah membandingkan perbedaan strategi rekomendasi antar halaman cukup dengan melihat file `algorithm.ts` di folder terkait.
3.  **Efisiensi Shared Logic**: Fungsi-fungsi matematika murni yang bersifat universal tetap disimpan di satu tempat (`src/lib/algorithm.ts`) agar tidak terjadi duplikasi kode yang tidak perlu.

## 3. Pembedahan Struktur Folder
Berikut adalah peta jalan kode sumber setelah overhaul:

```text
src/
├── lib/
│   └── algorithm.ts     # Otak Pusat: Primitif Fuzzy, Bayesian, & SA standar.
└── pages/
    ├── engine/          # [Discovery] Smart Recommendations
    │   ├── index.tsx    # View: Grid rekomendasi & filter
    │   └── algorithm.ts # Logic: Pipeline Fusi Fuzzy-Bayesian & SA
    ├── backlog/         # [Personalized] Priority Queue
    │   ├── index.tsx
    │   └── algorithm.ts # Logic: Bayesian Rating untuk koleksi pribadi
    ├── coop/            # [Multi-Agent] Group Convergence
    │   ├── index.tsx
    │   └── algorithm.ts # Logic: Collective Bayesian Group Analysis
    └── deals/           # [Deep Value] Deal Hunter
        ├── index.tsx
        └── algorithm.ts # Logic: Value Analysis (Weighted Bayesian + SA)
```

## 4. Keunggulan Integritas Data
Arsitektur ini mengutamakan **Integritas Data** di atas abstraksi yang berlebihan. Dengan memisahkan logika ke file `algorithm.ts` yang bersih dari elemen UI, sistem menjamin bahwa hasil yang tampil di layar adalah hasil perhitungan matematis yang jujur terhadap library pengguna.

---
*Kesimpulan: Arsitektur ini adalah jembatan antara dunia riset algoritma dengan aplikasi web modern yang terorganisir.*

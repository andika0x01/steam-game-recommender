# Steam Game Recommender (Deep Personalization Edition) 🎮

Sistem rekomendasi game Steam mutakhir yang mentenagai Tugas Besar mata kuliah *Computational Intelligence*. Aplikasi ini telah dirombak total menggunakan arsitektur **Colocated Logic** yang modular, menggabungkan **Fuzzy Logic**, **Bayesian Inference**, dan **Simulated Annealing (SA)**.

## 🚀 Ikhtisar Proyek

Steam Game Recommender adalah **Intelligence-Powered Discovery Hub** yang mempelajari "sidik jari" perilaku bermain Anda. Sistem ini menganalisis library Anda menggunakan pemodelan keterikatan fuzzy untuk menemukan game yang benar-benar personal.

### Fitur Utama & Alur Algoritma

Aplikasi ini menggunakan standar inteligensi tinggi yang konsisten di seluruh fiturnya:

- **Discovery Engine (`/engine`)**: Menemukan game baru menggunakan fusi **Fuzzy-Bayesian** pada pool kandidat, dioptimalkan oleh **Simulated Annealing** untuk akurasi dan keragaman maksimal.
- **Campaign Map (`/backlog`)**: Menyusun rute bermain terbaik dari backlog Anda dengan rating afinitas Bayesian.
- **Co-op Nexus (`/coop`)**: Analisis konvergensi multi-agen untuk menemukan titik temu minat grup menggunakan **Group Bayesian Inference**.
- **Deal Hunter (`/deals`)**: Berburu diskon cerdas dengan memadukan selera personal (Bayesian) dan efisiensi ekonomi.

## 🛠️ Arsitektur & Struktur Proyek

Proyek ini menggunakan pola **Colocated Logic**, di mana logika algoritma diletakkan sedekat mungkin dengan presentasi (UI) untuk meningkatkan keterbacaan dan pemeliharaan.

```text
src/
├── lib/
│   ├── algorithm.ts    # SHARED: Fungsi inti matematis (Fuzzy, Bayesian, SA)
│   ├── steam.ts       # Integrasi API Steam & KV Caching
│   └── auth.ts        # Logika Autentikasi Steam
└── pages/
    ├── engine/        # Modul Fitur
    │   ├── index.tsx      # PRESENTATION: UI Halaman
    │   └── algorithm.ts   # LOGIC: Implementasi algoritma spesifik halaman
    ├── backlog/
    │   ├── index.tsx
    │   └── algorithm.ts
    └── ...
```

### Keunggulan Struktur Ini:
1. **Modular & Reusable**: Fungsi umum berada di `src/lib/algorithm.ts`, sementara logika spesifik fitur diisolasi di `algorithm.ts` masing-masing folder page.
2. **Konsisten**: Setiap fitur mengikuti pola folder yang sama (`index.tsx` + `algorithm.ts`).
3. **Mudah Diaudit**: Pemisahan tegas antara UI dan logika domain algoritma di tingkat file.

## ⚙️ Persiapan & Instalasi

1. **Konfigurasi Variabel**: Edit `.dev.vars` dan masukkan `STEAM_API_KEY`.
2. **Setup KV**: Pastikan `wrangler.jsonc` memiliki binding `KV`.
3. **Migrasi Database**: Jalankan `npx wrangler d1 migrations apply steam-recommender --local`.
4. **Jalankan Server**: `npm run dev`.

## 🚢 Dokumentasi Teknis

Dokumentasi detail mengenai cara kerja sistem:

1. [Panduan Pengembangan](./docs/04-panduan-pengembangan.md) - Cara memperluas sistem.
2. [Arsitektur Prosedural Modular](./docs/05-arsitektur-prosedural.md) - Filosofi desain struktur kode.
3. [Dokumentasi API](./docs/06-dokumentasi-api.md) - Referensi endpoint.

---
*Dikembangkan dengan standar integritas data 100% menggunakan API Steam dunia nyata dan Real-time KV Enrichment.*

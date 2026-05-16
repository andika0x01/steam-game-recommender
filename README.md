# Steam Game Recommender (Deep Personalization Edition) 🎮

Sistem rekomendasi game Steam mutakhir yang mentenagai Tugas Besar mata kuliah *Computational Intelligence*. Aplikasi ini telah dirombak total untuk meninggalkan metode mainstream dan beralih ke pipeline **Deep Personalization** yang menggabungkan **Fuzzy Logic**, **Bayesian Inference**, dan **Simulated Annealing (SA)**.

## 🚀 Ikhtisar Proyek

Steam Game Recommender bukan sekadar aplikasi daftar game biasa. Ini adalah **Intelligence-Powered Discovery Hub** yang mempelajari "sidik jari" perilaku bermain Anda. Sistem ini menganalisis library Anda menggunakan pemodelan keterikatan fuzzy untuk menemukan game yang benar-benar personal, bukan sekadar apa yang sedang populer.

### Fitur Utama & Alur Algoritma (Unified Suite)

Seluruh fitur dalam aplikasi ini sekarang menggunakan satu standar inteligensi tinggi yang konsisten:

- **Discovery Engine (`/engine`)**: Menemukan game baru menggunakan fusi **Fuzzy-Bayesian** pada pool **200+ kandidat**, dioptimalkan oleh **Simulated Annealing** untuk akurasi dan keragaman maksimal.
- **Campaign Map (`/backlog`)**: Menyusun rute bermain terbaik dari backlog Anda. Sistem merating koleksi menggunakan skor personalisasi Bayesian dan menyusun rute waypoint teroptimasi via **Simulated Annealing**.
- **Co-op Nexus (`/coop`)**: Analisis konvergensi multi-agen. Menemukan titik temu minat grup menggunakan **Group Bayesian Inference** untuk merekomendasikan sesi bermain bersama yang paling memuaskan semua pihak.
- **Deal Hunter (`/deals`)**: Berburu diskon cerdas menggunakan **Deep Value Analysis**. Sistem memadukan selera library Anda (Bayesian) dengan efisiensi ekonomi, diseleksi melalui **Simulated Annealing**.

## 🛠️ Tech Stack

- **Framework**: [Hono](https://hono.dev/) (Web framework ultra-cepat untuk Edge Computing)
- **Caching**: Cloudflare KV (Penyimpanan metadata genre real-time untuk efisiensi API).
- **Frontend**: React (JSX) dengan Tailwind CSS & Glassmorphism Aesthetics.
- **Database**: Cloudflare D1 (SQLite di Edge).
- **Core Logic**: Unified Suite (Fuzzy, Bayesian, Simulated Annealing).

## 📁 Struktur Proyek (Arsitektur Prosedural Modular)

```text
src/
├── pages/              # Modul Mandiri Per Halaman
│   ├── engine/         # Discovery: Fuzzy-Bayesian Fusion, SA
│   ├── backlog/        # Campaign Map: Personalized Rating, SA Route
│   ├── coop/           # Nexus Map: Group Convergence (Bayesian + SA)
│   ├── deals/          # Deal Hunter: Value Analysis (Bayesian + SA)
│   └── ...             # Halaman Pendukung lainnya
├── lib/                # Integrasi API & KV Caching (Steam, SteamSpy, CheapShark)
└── index.tsx           # Orchestrator & Middleware
```

## ⚙️ Persiapan & Instalasi

1. **Konfigurasi Variabel**: Edit `.dev.vars` dan masukkan `STEAM_API_KEY` Anda.
2. **Setup KV**: Pastikan `wrangler.jsonc` memiliki binding `KV` yang valid.
3. **Migrasi Database**: Jalankan `npx wrangler d1 migrations apply steam-recommender --local`.
4. **Jalankan Server**: `npm run dev`.

## 🚢 Dokumentasi Alur Kronologis (A-to-Z)

Dokumentasi di bawah ini telah diperbarui untuk mencerminkan implementasi rumus matematika terbaru:

1. [Pembedahan Discovery Engine](./docs/01-halaman-discovery-engine.md) - Alur Fusi Fuzzy-Bayesian & SA.
2. [Pembedahan Campaign Map](./docs/02-halaman-campaign-backlog.md) - Alur Rating Afinitas & Evolusi Rute.
3. [Pembedahan Co-op Nexus](./docs/03-halaman-coop-nexus.md) - Alur Konvergensi Multi-Agen.
4. [Pembedahan Deal Hunter](./docs/04-halaman-deal-hunter.md) - Alur Optimasi Deep Value.
5. [Arsitektur Prosedural Modular](./docs/05-arsitektur-prosedural.md) - Standar Integritas Algoritma.

---
*Dikembangkan dengan standar integritas data 100% menggunakan API Steam dunia nyata dan Real-time KV Enrichment.*

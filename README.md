# Steam Game Recommender (Hybrid CI Edition) 🎮

Sistem rekomendasi game Steam canggih yang mentenagai Tugas Besar mata kuliah *Computational Intelligence*. Aplikasi ini menggabungkan berbagai algoritma CI seperti **Fuzzy Logic**, **Genetic Algorithm (GA)**, **Particle Swarm Optimization (PSO)**, **A***, **Ant Colony Optimization (ACO)**, **Simulated Annealing (SA)**, dan **Bayesian Inference** untuk memberikan rekomendasi yang presisi, beragam, dan teroptimasi.

## 🚀 Ikhtisar Proyek

Steam Game Recommender bukan sekadar aplikasi daftar game biasa. Ini adalah **Intelligence-Powered Discovery Hub** yang mempelajari perilaku bermain Anda. Sistem ini memahami spektrum preferensi genre Anda secara matematis untuk menemukan permata tersembunyi di pasar Steam atau menyusun rute bermain terbaik dari koleksi yang sudah Anda miliki.

### Fitur Utama & Alur Algoritma

- **Discovery Engine (`/engine`)**: Menemukan game baru (Discovery) menggunakan pipeline paralel Bayesian dan A*, disempurnakan dengan Simulated Annealing untuk keberagaman genre.
- **Campaign Map (`/backlog`)**: Mengelola tumpukan game (backlog) dengan cara merating seluruh koleksi menggunakan Fuzzy Logic dan menyusun rute Waypoint menggunakan Ant Colony Optimization (ACO).
- **Multiplayer Nexus Map (`/coop`)**: Mencari irisan aset bersama teman dan menggunakan algoritma A* untuk menciptakan peta strategi bermain grup yang mulus.
- **Deal Hunter (`/deals`)**: Berburu diskon cerdas menggunakan optimasi multi-kriteria berbasis Particle Swarm Optimization (PSO) untuk menyeimbangkan harga dan minat.

## 🛠️ Tech Stack

- **Framework**: [Hono](https://hono.dev/) (Web framework ultra-cepat untuk Edge Computing)
- **Frontend**: React (JSX) dengan Tailwind CSS & Glassmorphism Aesthetics.
- **Database**: Cloudflare D1 (SQLite di Edge).
- **Core Logic**: Suite Algoritma CI murni (TypeScript).

## 📁 Struktur Proyek (Arsitektur Prosedural)

```text
src/
├── pages/              # Modul Mandiri Per Halaman
│   ├── engine/         # Discovery: Bayesian, A*, SA, GA
│   ├── backlog/        # Campaign Map: ACO, Fuzzy Rating
│   ├── coop/           # Nexus Map: A* Search
│   ├── deals/          # Deal Hunter: PSO, Bayesian
│   └── ...             # Halaman Pendukung lainnya
├── lib/                # Integrasi API (Steam, SteamSpy, CheapShark)
└── index.tsx           # Orchestrator & Middleware
```

## ⚙️ Persiapan & Instalasi

1. **Konfigurasi Variabel**: Edit `.dev.vars` dan masukkan `STEAM_API_KEY` Anda.
2. **Migrasi Database**: Jalankan `npx wrangler d1 migrations apply steam-recommender --local`.
3. **Jalankan Server**: `npm run dev`.

## 🚢 Dokumentasi Alur Kronologis (A-to-Z)

Dokumentasi di bawah ini menjelaskan setiap fitur dari fase input data hingga visualisasi di layar, lengkap dengan pembedahan algoritma yang bekerja:

1. [Pembedahan Discovery Engine](./docs/01-halaman-discovery-engine.md) - Alur Pipeline Ensemble (Bayesian, A*, SA).
2. [Pembedahan Campaign Map](./docs/02-halaman-campaign-backlog.md) - Alur Rating Fuzzy dan Rute ACO.
3. [Pembedahan Co-op Nexus](./docs/03-halaman-coop-nexus.md) - Alur Sinkronisasi Agen dan Rute A*.
4. [Pembedahan Deal Hunter](./docs/04-halaman-deal-hunter.md) - Alur Optimasi PSO untuk nilai belanja.
5. [Arsitektur Prosedural Modular](./docs/05-arsitektur-prosedural.md) - Mengapa kode dipisah mandiri per halaman.

---
*Dikembangkan dengan standar integritas data 100% menggunakan API Steam dunia nyata.*

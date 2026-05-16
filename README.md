# Steam Game Recommender (Hybrid CI Edition) 🎮

Sistem rekomendasi game Steam canggih yang mentenagai Tugas Besar mata kuliah *Computational Intelligence*. Aplikasi ini menggabungkan berbagai algoritma CI seperti **Fuzzy Logic**, **Genetic Algorithm (GA)**, **Particle Swarm Optimization (PSO)**, **A***, **Ant Colony Optimization (ACO)**, **Simulated Annealing (SA)**, dan **Bayesian Inference** untuk memberikan rekomendasi yang presisi, beragam, dan teroptimasi.

## 🚀 Ikhtisar Proyek

Steam Game Recommender bukan sekadar aplikasi daftar game. Ini adalah **Discovery Engine** yang mempelajari perilaku bermain Anda menggunakan *Hybrid Parallel Ensemble Pipeline*. Sistem ini memahami spektrum preferensi genre Anda secara matematis untuk menemukan permata tersembunyi di luar pustaka Anda atau menyusun rute bermain terbaik dari koleksi yang sudah ada.

### Fitur Utama & Algoritma CI

- **CI Ensemble Discovery Engine (`/engine`)**: Pipeline paralel yang menggabungkan Bayesian Scoring dan A* Similarity Search, dengan seleksi akhir menggunakan Simulated Annealing untuk menjaga keberagaman genre.
- **Campaign Map (`/backlog`)**: Peta jalan bermain untuk menaklukkan koleksi game Anda.
  - **Fuzzy Logic**: Merating seluruh koleksi berdasarkan afinitas.
  - **ACO**: Menyusun rute (waypoints) bermain yang paling optimal berdasarkan skor rating.
- **Multiplayer Nexus Map (`/coop`)**: Mencari irisan preferensi antar teman dan menggunakan **A*** untuk membuat peta strategi bermain bersama.
- **Deal Hunter (`/deals`)**: Berburu diskon CheapShark menggunakan pembobotan **PSO** (Price vs Affinity) yang dinamis.
- **Dynamic Optimization**: Tombol *Toggle* (Initialize/Cancel) untuk memicu evolusi algoritma (GA/PSO) secara real-time di database D1.

## 🛠️ Tech Stack

- **Framework**: [Hono](https://hono.dev/) (Web framework ultra-cepat untuk Cloudflare Workers)
- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/) (Edge Computing)
- **Frontend**: React (JSX) dengan Tailwind CSS & Glassmorphism Aesthetics.
- **Database**: Cloudflare D1 (SQLite SQL di Edge).
- **Core Logic**: Suite Algoritma CI murni (TypeScript).

## 📁 Struktur Proyek

```text
src/
├── algorithm/          # Core Logic (Matematika & CI)
│   ├── fuzzyLogic.ts   # Pemodelan Linguistik (Engagement)
│   ├── ga.ts           # Genetic Algorithm (Tuning Parameter Fuzzy)
│   ├── pso.ts          # Particle Swarm Optimization (Weight Tuning)
│   ├── bayesian.ts     # Bayesian Inference (Probabilistic Scoring)
│   ├── classicalSearch.ts # A* Search (Graph Pathfinding)
│   ├── aco.ts          # Ant Colony Optimization (Trail Sequencing)
│   ├── sa.ts           # Simulated Annealing (Diversity Optimizer)
│   └── index.ts        # Entry point Ensemble Pipeline
├── docs/               # Dokumentasi Teknis Akademis
├── lib/                # Wrapper API & Auth
└── index.tsx           # Route, Controller & UI Rendering
```

## ⚙️ Persiapan & Instalasi

### Pengembangan Lokal

1. **Clone & Install**:
   ```bash
   npm install
   ```

2. **Konfigurasi Variabel**:
   Edit file `.dev.vars`:
   ```text
   STEAM_API_KEY=api_key_anda
   HOST_URL=http://localhost:5173
   ```

3. **Migrasi Database**:
   ```bash
   npx wrangler d1 migrations apply steam-recommender --local
   ```

4. **Jalankan Server**:
   ```bash
   npm run dev
   ```

## 🚢 Dokumentasi Mendalam (Berbasis Halaman)

Silakan telusuri folder `docs/` untuk penjelasan akademis yang sangat mendetail, menggunakan analogi sederhana agar mudah dipahami:

1. [Halaman Discovery Engine](./docs/01-halaman-discovery-engine.md) - Bedah algoritma Bayesian, A*, dan Simulated Annealing.
2. [Halaman Campaign Map (Backlog)](./docs/02-halaman-campaign-backlog.md) - Cara kerja Ant Colony Optimization dan Fuzzy Logic Rating.
3. [Halaman Co-op Nexus](./docs/03-halaman-coop-nexus.md) - Pemanfaatan algoritma A* untuk strategi bermain bersama.
4. [Halaman Deal Hunter](./docs/04-halaman-deal-hunter.md) - Optimasi nilai menggunakan Particle Swarm Optimization (PSO).
5. [Arsitektur Prosedural Modular](./docs/05-arsitektur-prosedural.md) - Penjelasan struktur kode program yang mandiri per halaman.

---
*Dikembangkan sebagai solusi cerdas bagi gamer yang ingin memaksimalkan investasi waktu dan biaya di platform Steam.*

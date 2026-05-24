# Laporan Akhir: Algoritma Steam Game Recommender

Laporan ini mendokumentasikan alur kerja program, perhitungan algoritma *Fuzzy Logic*, representasi matematis *Simulated Annealing*, dan implementasi kode pada Steam Game Recommender.

## 1. Flowchart Keseluruhan Sistem

Flowchart di bawah ini menjelaskan alur sistem, mulai dari memuat profil pengguna dari Steam hingga menghasilkan rekomendasi dan merancang keranjang belanja paling optimal dengan batasan anggaran (*budget*).

```mermaid
flowchart TD
    A[Mulai: Input Steam ID] --> B{Pengecekan Cache KV}
    B -- Ada --> C[Gunakan Profil dari Cache]
    B -- Tidak Ada --> D[Ambil Owned Games dari Steam API]
    D --> E[Filter & Sort Top 15 Games by Playtime]
    
    subgraph Profiling [Pembentukan Profil Pengguna]
        E --> F[Fuzzy Own Games Scorer]
        F --> |Fuzzifikasi Playtime, Activity, Recency| F1[Evaluasi Aturan Fuzzy & Defuzzifikasi]
        F1 --> G[Hitung Tag Weights & Publisher Scores]
    end
    
    C --> H
    G --> H[Pilih Top 5 Tags dari Profil Pengguna]
    
    subgraph Pencarian [Pencarian Kandidat Game]
        H --> I[Cari Game di Steam per Top Tag]
        I --> J[Filter Game yang Belum Dimiliki]
        J --> K[Ambil Detail App & Review Batch]
    end
    
    subgraph Penilaian [Sistem Rekomendasi Game Baru]
        K --> L[Hitung Tag Similarity]
        L --> M[Fuzzy Non-Own Games Scorer]
        M --> |Fuzzifikasi Review, Similarity, Volume, Publisher| M1[Evaluasi Aturan Fuzzy & Defuzzifikasi]
        M1 --> N[Skor Rekomendasi Akhir]
    end
    
    subgraph Optimisasi [Simulated Annealing Budget Optimizer]
        N --> O[Filter Game Diskon]
        O --> P[Hitung Density (Skor / Harga)]
        P --> Q[Inisialisasi Keranjang Sesuai Budget]
        Q --> R{Loop: Suhu T > 1?}
        R -- Ya --> S[Mutasi Keranjang: ADD/REMOVE/SWAP]
        S --> T[Hitung Delta Energy]
        T --> U{Energi Naik ATAU Metropolis diterima?}
        U -- Ya --> V[Terima Keranjang Baru]
        U -- Tidak --> W[Tolak Keranjang]
        V --> X[Suhu T = T * Cooling Rate]
        W --> X
        X --> R
        R -- Tidak --> Y[Keranjang Optimal]
    end

    Y --> Z[Selesai: Tampilkan Keranjang & Rekomendasi]
```

---

## 2. Detail Proses dan Algoritma (Fuzzy Logic)

Sistem membagi algoritma dasar menjadi dua tahap *Fuzzy Logic*: Evaluasi game yang dimiliki pengguna (untuk membentuk profil) dan evaluasi game kandidat baru.

### A. Pembentukan Profil Pengguna (Fuzzy Own Games Scorer)

Sistem menilai tingkat "kesukaan" terhadap 15 game teratas mereka berdasarkan metrik waktu bermain (*playtime*).

**1. Fuzzifikasi**
Sistem menggunakan **Trapezoidal Membership Function (TrapMF)** untuk memetakan input (*playtime*, aktivitas 2 minggu terakhir, dan kelamaan sejak terakhir bermain) ke dalam himpunan fuzzy (*tidak_dimainkan, dicoba, cukup, sering, sangat_banyak*).

Persamaan matematis untuk fungsi TrapMF:

```math
\mu(x; a,b,c,d) = \begin{cases} 
0 & \text{if } x \leq a \text{ or } x \geq d \\ 
\frac{x - a}{b - a} & \text{if } a < x < b \\ 
1 & \text{if } b \leq x \leq c \\ 
\frac{d - x}{d - c} & \text{if } c < x < d 
\end{cases}
```

*Snippet Code Implementation (`src/lib/fuzzy-own-games-scorer.ts`):*
```typescript
private trapMF(x: number, a: number, b: number, c: number, d: number): number {
  if (x <= a || x >= d) return 0;
  if (x >= b && x <= c) return 1;
  if (x > a && x < b) return (x - a) / (b - a);
  if (x > c && x < d) return (d - x) / (d - c);
  return 0;
}
```

**2. Defuzzifikasi**
Skor kesukaan game dihitung menggunakan **Weighted Average Defuzzification**. Nilai aktivasi (`\alpha_i`) dikalikan dengan bobot output dari aturan tersebut (`w_i`), dibagi total aktivasi.

```math
\text{Score} = \frac{\sum_{i=1}^{n} (\alpha_i \cdot w_i)}{\sum_{i=1}^{n} \alpha_i}
```

---

### B. Perhitungan Kemiripan Tag (Weighted Tag Similarity)

Kemiripan dihitung berdasarkan interseksi tag antara game kandidat dengan profil pengguna, dinormalisasi oleh bobot maksimal yang mungkin.

```math
\text{Similarity} = \frac{\sum_{t \in T_{c} \cap T_{u}} W_u(t)}{\sum_{i=1}^{|T_c \cap T_u|} W_{u, \text{sorted}}[i]}
```

---

### C. Penentuan Skor Rekomendasi Akhir (Fuzzy Non-Own Games Scorer)

Skor rekomendasi menilai: `review_positivity`, `tag_similarity`, `review_volume` (skala log 10), dan `publisher_score`. 

**1. Inferensi Aturan**
Sistem menggunakan konjungsi AND (`\min`) untuk menggabungkan anteseden.
Contoh (R1): *IF similarity is sangat_cocok AND review is sangat_bagus AND volume is banyak THEN rekomendasi is SANGAT_TINGGI.*

```math
\alpha_1 = \min\left( \mu_{\text{similarity}}(\text{sangat\_cocok}), \mu_{\text{review}}(\text{sangat\_bagus}), \mu_{\text{volume}}(\text{banyak}) \right)
```

**2. Defuzzifikasi**
Dilakukan menggunakan Weighted Average yang sama untuk memproyeksikan nilai akhir 0.0 hingga 1.0.

---

## 3. Optimisasi Keranjang Belanja (Simulated Annealing)

Fitur unggulan pada program ini adalah rekomendasi keranjang belanja otomatis berdasarkan *budget* (*Optimization App*). Karena menemukan kombinasi item yang memberikan total "nilai" (*value*) tertinggi di bawah batasan *budget* adalah variasi dari *Knapsack Problem* (NP-Hard), sistem menggunakan algoritma meta-heuristik **Simulated Annealing (SA)**.

### A. Metrik Fungsi Objektif (Energy)

Program berupaya "memaksimalkan Energi" dari keranjang. Energi dihitung dari penjumlahan *Density* (Skor Rekomendasi dibagi Harga Game) yang dikalikan dengan pemanfaatan kuadrat dari budget (untuk memaksa sistem memakai budget sedekat mungkin ke batasnya).

```math
E = \left( \sum_{i \in \text{basket}} \frac{\text{score}_i}{\text{price}_i} \right) \times \left( \frac{\sum \text{price}_i}{\text{Budget}} \right)^2
```

*Snippet Code Implementation (`src/pages/api/index.ts`):*
```typescript
const getEnergy = (items: any[]) => {
  const cost = getCost(items);
  if (cost > budgetIDR || cost === 0) return Number.NEGATIVE_INFINITY;
  
  // Total kepadatan nilai (Skor per Harga)
  const totalDensity = items.reduce((sum, item) => sum + item.density, 0);
  
  // Penalti Pemanfaatan Budget
  const budgetUtilization = cost / budgetIDR;
  return totalDensity * Math.pow(budgetUtilization, 2);
};
```

### B. Mutasi Ruang Pencarian (State Neighbors)

SA menelusuri status keranjang saat ini ke keranjang tetangga (*neighbor*) dengan melakukan probabilitas salah satu dari tiga aksi per langkah iterasi:
1. **ADD (40%)**: Menambahkan game acak yang masuk sisa *budget*.
2. **REMOVE (20%)**: Menghapus satu game acak dari keranjang.
3. **SWAP (40%)**: Menukar satu game di dalam keranjang dengan game lain dari kumpulan rekomendasi kandidat jika sisa budget mengizinkan.

### C. Kriteria Penerimaan Metropolis (Metropolis-Hastings Criterion)

Ketika keranjang hasil mutasi memiliki "Energi" yang **lebih tinggi** dari sebelumnya ($\Delta E > 0$), perubahan diterima otomatis. Namun, bila Energi menurun, perubahan **bisa tetap diterima** berdasarkan probabilitas suhu.

```math
P(\text{accept}) = \exp \left( \frac{\Delta E}{T} \right)
```

Semakin tinggi Suhu ($T$), semakin besar peluang menerima pilihan yang buruk untuk lolos dari *Local Optima*. Semakin rendah Suhu, penerimaan terhadap nilai buruk makin pelit.

*Snippet Code Implementation:*
```typescript
const dE = neighborEnergy - currentEnergy;
let accept: boolean;

if (neighborEnergy > currentEnergy) {
  accept = true; // IMPROVED
} else {
  // Metropolis Acceptance Criterion
  const prob = Math.exp(dE / temp);
  const metropolis = Math.random() < prob;
  accept = metropolis; 
}
```

### D. Penjadwalan Penurunan Suhu (Cooling Schedule)

Suhu diinisialisasi pada $T_0 = 3000.0$ dan terus dikalikan dengan rasio pendinginan (*Cooling Rate*) per iterasi:

```math
T_{n+1} = T_n \times 0.998
```

Loop berlanjut hingga $T$ mencapai $1.0$.

*Snippet Code Implementation:*
```typescript
let temp = 3000.0;
const coolingRate = 0.998;

while (temp > 1) {
  // ... (Evolusi tetangga dan pengecekan metropolis)
  temp *= coolingRate;
  iteration++;
}
```
Hasil akhirnya merupakan susunan keranjang (`bestBasket`) berisikan game-game dengan kepadatan rekomendasi tertinggi yang mengoptimalkan limit *budget* yang diberikan oleh pengguna.

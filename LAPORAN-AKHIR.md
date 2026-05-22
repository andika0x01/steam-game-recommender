# Laporan Akhir: Steam Game Recommender System

## 1. Pendahuluan
Steam Game Recommender adalah platform berbasis web yang menggunakan **Logika Fuzzy (Fuzzy Logic)** dan algoritma optimasi untuk memberikan rekomendasi game yang sangat personal. Sistem ini membedah library pengguna, menganalisis perilaku bermain, dan memprediksi tingkat ketertarikan terhadap game baru di Steam Store.

## 2. Arsitektur Algoritma Rekomendasi
Sistem ini mengadopsi arsitektur **Dual-Scorer Fuzzy Logic**, memisahkan evaluasi utilitas masa lalu (historis library) dengan pemodelan preferensi masa depan.

![Flowchart Arsitektur Sistem](flowchart.svg)

### 2.1. Orkestrasi Pipa Rekomendasi
Transformasi dari data statis menjadi rekomendasi bertingkat dilakukan melalui langkah-langkah berikut:

1. **Library Profiling & Scoring**:
   Sistem mengevaluasi seluruh game dalam *library* pengguna dengan `FuzzyOwnGamesScorer`. Setiap game dikonversi menjadi skor utilitas (0 hingga 1.0) berbasis interaksi nyata (playtime, recency, activity).
2. **Fingerprint & Weighted Tag Generation**:
   Sistem membentuk "sidik jari minat" (*interest fingerprint*) dengan mengakumulasi tag/genre dari game-game historis. Bobot setiap tag $w_{tag}$ dikomputasi berbasis akumulasi skor fuzzy game pemicunya. 
3. **Proportional Genre Fetching**:
   Pencarian ke Steam Search API dipartisi berdasarkan persentase bobot tag yang dominan dalam profil, memastikan kandidat yang diraih merepresentasikan distribusi selera aktual.
4. **Candidate Inference**:
   Riset tiap kandidat independen menggunakan `FuzzyNonOwnGamesScorer`, membandingkan skor kesamaan profil (*similarity*), penerimaan publik (*volume & positivity*), serta probabilitas loyalitas penerbit.
5. **Final Ranking & Optimization**:
   Menyajikan *Infinite Scrolling* berbasis densitas kelayakan (score/price) serta menyelesaikan masalah optimasi anggaran (*Knapsack Problem*) untuk mode Recommendation Deals.

---

### 2.2. Sistem Inferensi Logika Fuzzy
Variabel masukan yang bersifat tegas (*crisp*) dikabutkan menggunakan fungsi keanggotaan trapezoidal ($TrapMF$).

#### Persamaan Keanggotaan Trapezoidal:

```math
\mu_A(x; a, b, c, d) = \begin{cases} 
0, & x \le a \text{ atau } x \ge d \\ 
\frac{x-a}{b-a}, & a < x < b \\ 
1, & b \le x \le c \\ 
\frac{d-x}{d-c}, & c < x < d 
\end{cases}
```

#### Alasan Desain:
- **Toleransi Plateau**: Bagian puncak datar $(b \le x \le c)$ mentolerir rentang derau (noise) alami dari tabiat bermain tanpa menyebabkan distorsi skor yang tidak stabil.
- **Komputasi Orde-1**: Model polinomial konstan/linear ini sangat ringan dieksekusi secara masif di ranah *Edge Computing* (Cloudflare Workers).

---

### 2.3. Ekstraksi Fitur: Profiling Kepemilikan (Owned Games)
Faktor determinan untuk modul `FuzzyOwnGamesScorer`:

| Variabel | Unit Basis | Justifikasi Semantik |
| :--- | :--- | :--- |
| **Playtime Forever** | Relatif (Max) | Jam terbang kumulatif, diamortisasi dengan durasi game paling sering dimainkan untuk rentang normalisasi 0-1. |
| **Recency** | Hari $(t)$ | Tenggat waktu sejak paparan terakhir. Merepresentasikan relevansi ketertarikan aktif dan mengurangi "nostalgia bias". |
| **Recent Activity** | Menit (2 Minggu) | Intensitas ledakan pemain saat ini (*burst*). Memberikan insentif kuat pada minat game baru/hype. |

### 2.4. Ekstraksi Fitur: Skor Prediktif (Candidate Games)
Faktor determinan untuk modul `FuzzyNonOwnGamesScorer`:

| Variabel | Domain | Deskripsi Pemrosesan |
| :--- | :--- | :--- |
| **Review Positivity** | $[0, 1]$ | Reputasi kualitas (ulasan positif / ulasan total). Jika metadata gagal diraih dari Steam, diset netral ke `0.5`. |
| **Weighted Similarity** | Overlap | Kalkulasi kesamaan kandidat terhadap *Weighted Tag Fingerprint/Profile* dari pengguna. (Lihat Section 2.5). |
| **Review Volume** | $\log_{10}(x)$ | Skala logaritma guna meredam disparitas statistik antara game *indie* (sedikit review) dan *AAA* (ratusan ribu review). |
| **Publisher Score** | $[0, 1]$ | Probabilitas minat berlandaskan loyalitas terhadap suatu *brand*/entitas. Diambil dari modul kalkulasi Profile (Section 2.5). |

---

### 2.5. Metodologi Matematika Terapan

#### 2.5.1. Normalisasi Loyalitas Publisher
Skor loyalitas penerbit diekstraksi dari densitas utilitas $Score_i$ dikalikan durasi interaksi (*Playtime*) $P_i$. Untuk mencegah peredaman nilai pada pembandingan total library, normalisasi ditakar terisolasi terhadap agregasi *playtime* penerbit spesifik itu, baru kemudian di-skalakan batas $[0, 1]$:

```math
Score_{pub} = \frac{\sum_{i=1}^{n_{pub}} (Score_i \cdot P_i)}{\sum_{i=1}^{n_{pub}} P_i}
```

```math
NormalizedScore_{pub} = \min\left(1, \frac{Score_{pub}}{\max(Score_{\text{all\_pubs}})}\right)
```

#### 2.5.2. Weighted Tag Similarity
Alih-alih menggunakan *Jaccard Index* murni, algoritma mengekspansi **Weighted Overlap Coefficient**. Model ini mengkuantifikasi jumlah tag kandidat $T_C$ yang beririsan dengan agregasi tag historis $T_U$, dan dievaluasi membubuhkan prioritas/bobot densitas tag $W_U$:

```math
Similarity(T_C, T_U) = \frac{\sum_{t \in (T_C \cap T_U)} W_U(t)}{\sum_{i=1}^{|T_C|} W_U(\text{sorted\_top}_i)}
```

#### 2.5.3. Defuzzifikasi Rekomendasi (Final Score)
Sistem menggunakan *Mamdani-style Weighted Average* untuk konversi transisi yang gradual (smooth) pada peralihan konklusi:

```math
FinalScore = \frac{\sum_{j=1}^m \mu_{\text{activation}, j} \cdot w_j}{\sum_{j=1}^m \mu_{\text{activation}, j}}
```

**Karakteristik Penilaian Tambahan**:
1. **Strict Data**: Apabila kalkulasi kontradiksi/kosong (yaitu $\sum \mu = 0$), skor dieksekusi menjadi `0` sebagai mekanisme asuransi dari jebakan rata-rata `50%`.
2. **Korelasi Terstruktur (Cross-Validation)**: Aturan fuzzy meminimalkan skor apabila sebuah game bereputasi sangat tinggi, namun tidak mewakili sama sekali genre preferensi utama di profil.

---

## 3. Fitur Utama & Optimasi

### 3.1. Recommendation & Infinite Scrolling
Mesin pencarian yang mendukung eksplorasi tak terbatas:
- **Aggressive Offset**: Halaman berikutnya disuplai lompatan acuan statis (*start offset*) dari populasi yang luas untuk menghindari perulangan popularitas yang sama (no-collusion bias).
- **Client-side Auto-Fetch & Deduplikasi**: Apabila respons *Server-Side Rendering* terbatas oleh sistem batasan rate, komponen `InfiniteGrid` otomatis mendobrak muatan mandiri. Mekanisme deduplikasi memblokir penumpukan elemen antarmuka dari ID Game duplikat.

### 3.2. Recommendation Deals (Simulated Annealing)
Menyelesaikan problem *Knapsack Kombinasi Promosi* lewat optimasi Meta-Heuristik probabilistik **Simulated Annealing**:

Fungsi Energi ($E$) memprioritaskan densitas kelayakan ($\frac{Score}{Price}$) dengan normalisasi utilitas anggaran $(\frac{Cost}{Budget})^2$:
```math
E(items) = \begin{cases}
-\infty (\text{NEGATIVE\_INFINITY}), & \text{jika } Cost > Budget \\
\left(\sum \frac{Score}{Price}\right) \times \left(\frac{Cost}{Budget}\right)^2, & \text{lainnya}
\end{cases}
```

Penerimaan probabilitas *Neighbor State* yang bertransformasi semakin buruk difilter via fungsi kurva termodinamika ($T$ dengan $CoolingRate \approx 0.998$):
```math
P(\text{Accept}) = \exp \left( \frac{E_{\text{neighbor}} - E_{\text{current}}}{T} \right)
```
Proposisi penalti *Negative Infinity* menghilangkan celah cacat toleransi pada kondisi total kombinasi di atas bajet batas.

### 3.3. Penyelarasan Peta Index Asynchronous
Pada orkestrasi pemrosesan paralel lewat `Promise.all()`, array *candidate reviews* dipasangkan ke objek detail awal (pre-pairing) terlebih dahulu ketimbang setelah filter kondisi (*price_overview*). Pola ini berhasil menjamin resolusi tidak ada inkonsistensi pertukaran index ulasan ke entitas game akibat filter asimetris.

### 3.4. Stabilitas Produksi Edge / Caching & Rate-Limit Tollerance
Untuk menangani limitasi IP Datacenter, CPU, dan timeout pada Cloudflare Workers:
-   **Sequential Request Handling**: Modifikasi dari `Promise.all()` menjadi pola tunggu berurutan untuk pengambilan hasil pencarian API Store Steam nhằm mencegah limitasi pertahanan (Cloudflare 429 *Too Many Requests*) terhadap server.
-   **No-Collusion Popularity Bias**: Pencarian algoritma menggunakan offset yang lebih besar dan komprehensif, menghilangkan proses *slice* dini yang berisiko membuat kandidat jadi kosong apabila pengguna sudah memiliki semua rekomendasi top 10 (bias popularitas elit).
-   **Triage Invalidation Cache KV**: Memisahkan Cache KV dan memberikan pengecekan yang lebih ketat agar meretur nilai kosong (bila memang diblokir Steam API) tidak meracuni dan me-lock memori KV selama periode 7 Hari berturut-turut.
-   **Graceful Fallbacks**: Rute `/recommendation` maupun perhitungan review kini telah diinjeksikan mekanisme cadangan (skor `0.5` bila di-reject) ketimbang *panic shutdown*, mencegah kasus UI Blank State.

### 3.5. Analyzer (Library Deep-Dive)
Halaman sentral untuk meninjau secara gamblang preferensi pengguna hasil dari kalkulasi Fuzzy Scorer. Selain mendistribusikan skor kecocokan game di masa lalu, Analyzer juga memvisualisasikan:
-   **Top 12 Preferred Tags**: Diekstrak dari riwayat jam terbang menggunakan fungsi algoritma sentral `buildUserProfile`. Tag disajikan berdampingan dan memberikan insight mendalam tentang *genre* yang paling mendominasi.
-   **Top 8 Affinity Publishers**: Menyajikan relasi antara loyalitas (*playtime*) dan penilaian pengguna atas game yang dirilis tiap perusahaan, lengkap dengan grafik progres bar.

## 4. Struktur Database & Refactoring Redundansi
Seiring dengan evolusi proyek, sistem melalui *streamlining* fitur. Halaman yang dinilai duplikatif atau redundan (seperti `Engine`, `Co-op`, dan `Tierlist`) telah dihapus secara permanen dari *repository* agar fokus pengembangan tertuju pada optimasi kualitas `Analyzer` dan `Recommendation`.
Efisiensi arsitektur ini juga merambah hingga skema database SQLite (D1) melalui migrasi relasional: menghapus kolom `engine_params` tak terpakai dan merename `deals_params` menjadi `recommendation_params`.

## 5. Kesimpulan
Dengan menggabungkan Logika Fuzzy untuk penilaian subjektif dan algoritma heuristik untuk optimasi data, Steam Game Recommender mampu mentransformasi data mentah Steam menjadi pengalaman penemuan game yang benar-benar personal dan akurat.

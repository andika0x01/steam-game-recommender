# Laporan Akhir: Steam Game Recommender System

## 1. Pendahuluan
Steam Game Recommender adalah platform berbasis web yang menggunakan **Logika Fuzzy (Fuzzy Logic)** dan algoritma optimasi untuk memberikan rekomendasi game yang sangat personal. Sistem ini membedah library pengguna, menganalisis perilaku bermain, dan memprediksi tingkat ketertarikan terhadap game baru di Steam Store.

## 2. Arsitektur Sistem Rekomendasi
Sistem menggunakan pendekatan **Dual-Scorer Fuzzy Logic**:
1.  **FuzzyOwnGamesScorer**: Menilai game yang sudah dimiliki pengguna.
2.  **FuzzyNonOwnGamesScorer**: Memprediksi skor untuk game yang belum dimiliki.

### 2.1. Logika Fuzzy (Fuzzy Logic)
Sistem menggunakan fungsi keanggotaan trapezoidal ($TrapMF$) untuk mengubah variabel input (crisp) menjadi nilai fuzzy.

#### Fungsi Keanggotaan Trapezoidal:

```math
\mu_A(x; a, b, c, d) = \begin{cases} 0, & x \le a \text{ atau } x \ge d \\ \frac{x-a}{b-a}, & a < x < b \\ 1, & b \le x \le c \\ \frac{d-x}{d-c}, & c < x < d \end{cases}
```

### 2.1.1. Justifikasi Pemilihan Fungsi Trapezoidal ($TrapMF$)
Pemilihan bentuk trapezoid didasarkan pada:
1.  **Representasi Core/Plateau**: Memungkinkan rentang nilai memiliki derajat keanggotaan penuh ($\mu = 1.0$), lebih realistis untuk pemodelan perilaku manusia.
2.  **Stabilitas Sistem**: Mencegah hasil rekomendasi yang "jittery" akibat fluktuasi kecil pada data input.
3.  **Efisiensi Komputasi**: Hanya menggunakan operasi linear sederhana, ideal untuk *edge computing* (Cloudflare Workers).

---

### 2.1.2. Analisis Variabel Input Library (Owned Games)
Bagian ini menjelaskan bagaimana `FuzzyOwnGamesScorer` memproses data library pengguna.

#### A. Playtime Forever (Satuan: Menit)
Variabel ini mengukur total waktu yang dihabiskan pengguna pada sebuah game sejak dibeli. Input ini di-*normalize* terhadap game dengan durasi terlama di library.
-   **Kategori Linguistik**:
    -   `tidak_dimainkan`: Game yang memiliki durasi main mendekati 0 menit.
    -   `dicoba`: Game dengan durasi main sangat singkat (biasanya < 5% dari game terlama), menandakan game baru dicoba sebentar.
    -   `cukup`: Menunjukkan pengguna sudah melewati fase perkenalan dan mulai mendalami gameplay.
    -   `sering`: Game yang sudah dimainkan secara rutin dengan jam terbang signifikan.
    -   `sangat_banyak`: Game favorit utama yang mendominasi statistik library pengguna.

#### B. Recency (Satuan: Hari)
Variabel ini mengitung jumlah hari sejak game tersebut terakhir kali dijalankan.
-   **Kategori Linguistik**:
    -   `baru_main` (0 - 7 hari): Game yang sedang hangat-hangatnya dimainkan (High Relevance).
    -   `agak_lama` (10 - 30 hari): Game yang masih segar dalam ingatan namun frekuensi main mulai menurun.
    -   `lama` (30 - 90 hari): Game yang mulai ditinggalkan demi judul baru.
    -   `sangat_lama` (90 - 180 hari): Game yang sudah lama tidak disentuh.
    -   `ditinggal` (> 180 hari): Game yang kemungkinan besar sudah tidak sesuai dengan minat aktif pengguna saat ini.

#### C. Recent Activity (Satuan: Menit)
Mengukur jumlah menit bermain dalam 2 minggu terakhir. Digunakan untuk mendeteksi tren minat jangka pendek.
-   **Kategori Linguistik**:
    -   `tidak_aktif`: 0 menit bermain dalam 14 hari terakhir.
    -   `sesekali`: Dimainkan dalam durasi singkat di sela-sela waktu luang.
    -   `aktif`: Sedang sering dimainkan dalam 2 minggu terakhir.
    -   `sangat_aktif`: Menunjukkan game tersebut adalah fokus utama hiburan pengguna saat ini.

---

### 2.1.3. Analisis Variabel Input Store (Non-Owned Games)
Bagian ini menjelaskan variabel yang digunakan `FuzzyNonOwnGamesScorer` untuk memprediksi potensi kepuasan pada game baru.

#### A. Review Positivity (Satuan: Persentase / Rasio)
Rasio antara review positif terhadap total review di Steam.
-   **Kategori Linguistik**:
    -   `buruk`: Rasio di bawah 40%. Game dengan sentimen negatif kuat dari komunitas.
    -   `mixed`: Rasio antara 40% - 60%. Kualitas game diperdebatkan atau memiliki masalah teknis.
    -   `bagus`: Rasio 60% - 80%. Game yang diterima dengan baik secara umum.
    -   `sangat_bagus`: Rasio di atas 80%. Game berkualitas tinggi yang sangat direkomendasikan komunitas.

#### B. Tag Similarity (Satuan: Rasio / Jaccard Index)
Mengukur kemiripan genre/tag game kandidat dengan profil tag favorit pengguna yang dibangun dari library.
-   **Kategori Linguistik**:
    -   `tidak_cocok`: Genre game sangat jauh dari kebiasaan bermain user.
    -   `lumayan`: Memiliki satu atau dua elemen genre yang pernah dimainkan user.
    -   `cocok`: Sebagian besar genre dan fitur game sesuai dengan selera user.
    -   `sangat_cocok`: Game memiliki "DNA" yang identik dengan game-game favorit di library.

#### C. Review Volume (Satuan: Jumlah Review / Log10)
Jumlah total review yang diterima game. Skala logaritmik digunakan untuk menyeimbangkan game indie baru dengan game AAA populer.
-   **Kategori Linguistik**:
    -   `sedikit` (< 100 review): Data rating dianggap kurang stabil/valid secara statistik.
    -   `sedang` (100 - 3.000 review): Memiliki basis massa yang cukup untuk validasi kualitas.
    -   `banyak` (> 10.000 review): Game populer dengan data rating yang sangat kredibel.

#### D. Publisher Score (Satuan: Rasio Skor Berbobot)
Dihitung menggunakan rumus agregasi: $PS = \frac{\sum (Score \times Playtime)}{\sum Playtime_{all}}$.
-   **Kategori Linguistik**:
    -   `low`: Publisher yang produknya jarang dimainkan atau memiliki skor rendah di library user.
    -   `medium`: Publisher yang produknya beberapa kali dimainkan dengan hasil memuaskan.
    -   `high`: Brand loyalitas tinggi. User sering menghabiskan waktu lama di game-game keluaran publisher ini.

---

### 2.2. Defuzzifikasi & Linear Tie-Breaker
Sistem menggunakan metode rata-rata berbobot untuk mendapatkan nilai akhir (skor preferensi). Untuk menghindari penumpukan skor pada angka bulat (misalnya semua game masuk kategori 50%), sistem menggunakan teknik **Linear Tie-Breaker**.

#### Rumus Defuzzifikasi Berbobot:

```math
Score_{fuzzy} = \frac{\sum_{i=1}^n \mu_{activation, i} \cdot w_i}{\sum_{i=1}^n \mu_{activation, i}}
```

#### Rumus Linear Tie-Breaker (Skor Akhir):
Sistem mencampurkan 10% bobot dari nilai input mentah (*raw bias*) untuk memberikan variasi granularitas pada hasil akhir.

```math
Score_{final} = (Score_{fuzzy} \times 0.9) + (RawBias \times 0.1)
```

Dimana $RawBias$ adalah rata-rata dari input normalisasi (seperti *playtime* atau *tag similarity*). Hal ini memastikan bahwa dua game yang berada dalam kategori fuzzy yang sama tetap memiliki skor unik berdasarkan keunggulan nilai absolutnya.

---

## 3. Fitur Utama

### 3.1. Library Analysis (Backlog)
Menganalisis library pengguna untuk mengidentifikasi game mana yang paling "berharga" bagi mereka berdasarkan perilaku nyata. Skor ini digunakan untuk membangun profil selera dasar.

### 3.2. Discovery Engine
Mesin pencari game baru dengan **Infinite Scrolling**. Sistem mengambil ratusan kandidat game berdasarkan profil tag, lalu menyaringnya menggunakan `FuzzyNonOwnGamesScorer`.

### 3.3. Co-op Nexus
Menganalisis irisan (*intersection*) library antara grup. Rekomendasi dihitung dengan rata-rata skor fuzzy anggota grup.

### 3.4. Deal Hunter (Budget & Density Optimization)
Menggunakan **Simulated Annealing (SA)** untuk menemukan kombinasi game terbaik dengan memaksimalkan **Density**:

```math
Density = \frac{FuzzyScore}{\max(Price, 1)}
```

SA mencari solusi yang memaksimalkan utilitas budget $(\frac{TotalCost}{Budget})^2$.

### 3.5. Infinite Scrolling & Aggressive Pagination
Data dimuat secara asinkron melalui API internal. Untuk memastikan pengguna tidak melihat game yang sama berulang kali, sistem menggunakan strategi **Aggressive Offset**:
1.  **Paging Offset**: Menggunakan parameter `start` pada query Steam yang melompat lebih jauh di setiap halaman (misal: halaman 2 mengambil mulai dari urutan 50+).
2.  **Deduplikasi Client-side**: Memastikan ID game yang sudah ada di layar tidak akan ditambahkan lagi jika muncul di hasil pencarian berikutnya.

### 3.6. Tiered Caching Strategy (Cloudflare KV)
Untuk menjaga performa dan menghindari pembatasan rate-limit API Steam, sistem menerapkan strategi caching berlapis menggunakan Cloudflare KV:
1.  **Search Results Cache (1 Jam)**: Hasil pencarian di-cache selama 1 jam. TTL yang pendek memastikan daftar game di *Market Discovery* tetap segar dan mengikuti pembaruan katalog Steam.
2.  **Metadata & Review Cache (24 Jam)**: Detail game (gambar, harga, tag) dan rangkuman review di-cache selama 24 jam karena data ini jarang berubah secara drastis dalam waktu singkat.
3.  **Unique Cache Keys**: Setiap key cache dibentuk secara unik berdasarkan kombinasi parameter (seperti `appid`, `language`, `country code`, dan `start offset`), memastikan tidak ada tabrakan data antar halaman *infinite scroll*.

## 4. Kesimpulan
Sistem ini berhasil mengonversi data Steam yang sangat luas menjadi rekomendasi personal melalui pemodelan spektrum minat manusia menggunakan Logika Fuzzy. Penggunaan Linear Tie-Breaker, normalisasi relatif, dan optimasi heuristik memastikan hasil yang presisi, bervariasi, dan efisien.

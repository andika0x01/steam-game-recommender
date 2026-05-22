# Laporan Akhir: Steam Game Recommender System

## 1. Pendahuluan
Steam Game Recommender adalah platform berbasis web yang menggunakan **Logika Fuzzy (Fuzzy Logic)** dan algoritma optimasi untuk memberikan rekomendasi game yang sangat personal. Sistem ini membedah library pengguna, menganalisis perilaku bermain, dan memprediksi tingkat ketertarikan terhadap game baru di Steam Store.

## 2. Arsitektur Sistem Rekomendasi
Sistem menggunakan pendekatan **Dual-Scorer Fuzzy Logic**:
1.  **FuzzyOwnGamesScorer**: Menilai game yang sudah dimiliki pengguna.
2.  **FuzzyNonOwnGamesScorer**: Memprediksi skor untuk game yang belum dimiliki.

### 2.1. Logika Fuzzy (Fuzzy Logic)
Sistem menggunakan fungsi keanggotaan trapezoidal untuk mengubah variabel input (crisp) menjadi nilai fuzzy.

#### Fungsi Keanggotaan Trapezoidal:

```math
\mu_A(x; a, b, c, d) = \begin{cases} 0, & x \le a \text{ atau } x \ge d \\ \frac{x-a}{b-a}, & a < x < b \\ 1, & b \le x \le c \\ \frac{d-x}{d-c}, & c < x < d \end{cases}
```

### 2.1.1. Justifikasi Pemilihan Fungsi Trapezoidal ($TrapMF$)
Pemilihan bentuk trapezoid dibandingkan dengan segitiga atau Gaussian didasarkan pada beberapa alasan teknis yang krusial bagi sistem pakar:
1.  **Representasi Core/Plateau**: Fungsi trapezoidal memungkinkan adanya rentang nilai (interval) yang memiliki derajat keanggotaan penuh ($\mu = 1.0$). Hal ini jauh lebih realistis untuk memodelkan konsep manusia; contohnya, persentase review positif antara 85% hingga 95% dapat dianggap "Sangat Bagus" secara merata, bukan hanya pada satu titik spesifik saja.
2.  **Stabilitas Sistem**: Puncak yang datar (*plateau*) memberikan stabilitas pada hasil scoring. Fluktuasi kecil pada input (misalnya kenaikan playtime beberapa menit) di dalam rentang core tidak akan mengubah derajat aktivasi aturan secara drastis, sehingga mencegah hasil rekomendasi yang "jittery" atau berubah-ubah secara instan.
3.  **Generalisasi & Fleksibilitas**: Fungsi trapezoidal adalah generalisasi dari fungsi segitiga (di mana koordinat $b = c$). Ini memberikan kontrol lebih kepada pengembang untuk mengatur ambang batas kepastian pakar sebelum nilai keanggotaan mulai menurun.
4.  **Efisiensi Komputasi**: Dibandingkan dengan fungsi Gaussian atau Bell-shaped yang menggunakan eksponensial, $TrapMF$ hanya menggunakan operasi aritmatika linear sederhana. Hal ini sangat penting untuk menjaga *latensi* tetap rendah pada platform *edge computing* seperti Cloudflare Workers.

#### Variabel Input:
-   **Owned Games**: $Playtime$ (Playtime Forever), $Activity$ (2 Weeks Playtime), $Recency$ (Days since last played).
-   **Non-Owned Games**: $Positivity$ (Review Ratio), $Similarity$ (Tag Match), $Volume$ (Review Count), $PublisherMatch$ (Publisher Match).

### 2.1.2. Detail Fuzzifikasi Variabel Library (Owned Games)
Variabel ini digunakan oleh `FuzzyOwnGamesScorer` untuk memahami seberapa besar pengguna menyukai game yang sudah mereka miliki:

1.  **Playtime (Normalisasi 0-1)**:
    -   `tidak_dimainkan` (-0.1 - 0.05): Mendeteksi game yang hanya ada di library tanpa interaksi.
    -   `dicoba` (0.02 - 0.2): Game yang baru dimainkan beberapa jam (hanya untuk testing).
    -   `sering` (0.3 - 0.8): Game yang sudah menjadi bagian dari rutinitas pengguna.
    -   `sangat_banyak` (0.6 - 1.1): Game "main" atau favorit utama dengan jam terbang tinggi.
    *Alasan*: Menggunakan normalisasi terhadap playtime tertinggi di library untuk menangkap skala relatif antar game.

2.  **Recency (Hari sejak terakhir dimainkan)**:
    -   `baru_main` (-1 - 7 hari): Memberikan skor tinggi pada game yang sedang aktif dimainkan (momentum).
    -   `lama` (20 - 90 hari): Game yang mulai terlupakan namun masih memiliki potensi relevansi.
    -   `ditinggal` (> 150 hari): Game yang kemungkinan besar sudah tidak relevan dengan minat saat ini.
    *Alasan*: Minat manusia berubah seiring waktu; game yang baru dimainkan memiliki bobot "DNA minat" yang lebih segar.

3.  **Activity (Normalisasi Playtime 2 Minggu)**:
    -   `aktif` (0.2 - 0.7) & `sangat_aktif` (0.5 - 1.1).
    *Alasan*: Membedakan antara game yang punya total playtime besar di masa lalu vs game yang *sedang* gila-gilaan dimainkan saat ini.

### 2.1.3. Detail Fuzzifikasi Variabel Store (Non-Owned Games)
Variabel ini digunakan oleh `FuzzyNonOwnGamesScorer` untuk memprediksi ketertarikan terhadap game baru:

1.  **Review Positivity (0.0 - 1.0)**:
    -   `buruk` (< 0.4), `mixed` (0.4 - 0.6), `bagus` (0.6 - 0.8), `sangat_bagus` (> 0.75).
    *Alasan*: Mengikuti standar klasifikasi Steam. Game di bawah 60% positif dianggap berisiko tinggi bagi sistem rekomendasi.

2.  **Tag Similarity (Jaccard Index 0-1)**:
    -   `tidak_cocok` (< 0.2), `lumayan` (0.2 - 0.6), `sangat_cocok` (> 0.8).
    *Alasan*: Ambang batas 0.8 menandakan hampir seluruh genre dan fitur game identik dengan profil favorit pengguna.

3.  **Review Volume (Skala Logaritmik)**:
    -   `sedikit` ($10^0$ - $10^{1.5}$), `sedang` ($10^{1.5}$ - $10^{3.5}$), `banyak` (> $10^3$).
    *Alasan*: Menggunakan **Log10** karena volume review Steam sangat timpang (eksponensial). Game dengan 100.000 review jauh lebih kredibel secara statistik dibandingkan game dengan 10 review.

4.  **Publisher Score (Weighted Aggregation 0-1)**:
    -   `low` (0.0 - 0.4), `medium` (0.3 - 0.7), `high` (0.6 - 1.0).
    *Alasan*: Berdasarkan rumus sigma skor dikali durasi bermain. Jika pengguna menghabiskan ribuan jam di game rilisan Paradox, maka game baru dari Paradox secara otomatis dianggap lebih menarik oleh sistem pakar.

#### Defuzzifikasi (Weighted Average):
Sistem menggunakan metode rata-rata berbobot untuk mendapatkan nilai akhir (skor preferensi):

```math
Score = \frac{\sum_{i=1}^n \mu_{activation, i} \cdot w_i}{\sum_{i=1}^n \mu_{activation, i}}
```

Dimana $\mu_{activation}$ adalah derajat aktivasi aturan fuzzy dan $w$ adalah bobot konstanta untuk setiap kategori ($Sangat Rendah = 0.1$, $Rendah = 0.3$, $Sedang = 0.5$, $Tinggi = 0.7$, $Sangat Tinggi = 0.9$).

### 2.2. Jaccard Similarity
Digunakan untuk menghitung kemiripan antara dua set tag ($T_1$ dan $T_2$).

```math
J(T_1, T_2) = \frac{|T_1 \cap T_2|}{|T_1 \cup T_2|}
```

Nilai ini berkisar antara 0 (tidak mirip sama sekali) hingga 1 (identik).

### 2.3. Proportional Tag Fetching
Untuk menjaga variasi rekomendasi, sistem menghitung proporsi minat pengguna terhadap setiap tag:

```math
Proporsi_{tag} = \frac{\sum Score_{game} \text{ (yang memiliki tag)}}{\sum \text{Total Weight Profile}}
```

Kandidat game diambil dari Steam Store secara proporsional berdasarkan nilai ini.

## 3. Fitur Utama

### 3.1. Library Analysis (Backlog)
Menganalisis library pengguna untuk mengidentifikasi game mana yang paling "berharga" bagi mereka berdasarkan perilaku nyata. Skor ini digunakan untuk membangun profil selera dasar.

### 3.2. Discovery Engine
Mesin pencari game baru. Sistem ini mengambil puluhan hingga ratusan kandidat game berdasarkan profil tag pengguna, lalu menyaringnya menggunakan `FuzzyNonOwnGamesScorer` untuk mendapatkan 12 rekomendasi terbaik.

### 3.3. Co-op Nexus
Menganalisis irisan (*intersection*) library antara pengguna dan teman-temannya. Rekomendasi dihitung dengan rata-rata skor fuzzy anggota:

```math
Score_{group} = \frac{\sum_{j=1}^m FuzzyScore_j}{m}
```

Dimana $m$ adalah jumlah anggota dalam grup.

### 3.4. Deal Hunter (Budget & Density Optimization)
Menggunakan **Simulated Annealing (SA)** untuk menemukan kombinasi game diskon terbaik. Algoritma ini dimodifikasi untuk mempertimbangkan **Density**, yaitu efisiensi skor terhadap harga:

```math
Density = \frac{FuzzyScore}{Price}
```

Sistem bertujuan memaksimalkan total density dalam keranjang belanja tanpa melebihi budget pengguna. Selain itu, sistem mengintegrasikan kurs **USD/IDR secara real-time** menggunakan API Wise untuk memberikan konteks nilai tukar saat ini kepada pengguna.

#### Algoritma Simulated Annealing (Disempurnakan):
1.  Inisialisasi solusi acak ($S_{current}$) dalam batas budget.
2.  Lakukan iterasi dengan menurunkan temperatur ($T$):
    -   Pilih tetangga ($S_{next}$) dengan strategi: Tambah, Hapus, atau Ganti game.
    -   Hitung energi menggunakan fungsi utilitas:
      ```math
      Energy = (\sum Density) \times \left(\frac{TotalCost}{Budget}\right)^2
      ```
    -   Selisih energi: $\Delta E = Energy(S_{next}) - Energy(S_{current})$.
    -   Jika $\Delta E > 0$, terima $S_{next}$ (solusi lebih padat atau lebih menghabiskan budget).
    -   Jika $\Delta E < 0$, terima $S_{next}$ dengan probabilitas $P = e^{\frac{\Delta E}{T}}$.
3.  Ulangi hingga temperatur mencapai batas minimum.

### 3.5. Infinite Scrolling (Pemuatan Data Berkelanjutan)
Untuk meningkatkan pengalaman pengguna dalam mengeksplorasi ribuan game di Steam, sistem mengimplementasikan *Infinite Scrolling* menggunakan **Intersection Observer API**. Data dimuat secara asinkron melalui API internal (`/api/recommendations` dan `/api/deals`) saat pengguna mencapai dasar daftar game, memungkinkan eksplorasi tanpa batas tanpa membebani performa awal halaman.

## 4. Kesimpulan
Dengan menggabungkan Logika Fuzzy untuk penilaian subjektif dan algoritma heuristik (SA & Jaccard) untuk optimasi, Steam Game Recommender mampu memberikan hasil yang jauh lebih akurat dan personal dibandingkan dengan sistem pencarian berbasis popularitas standar.

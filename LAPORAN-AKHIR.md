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

### 2.1.2. Fuzzifikasi Library (Owned Games)
Variabel ini digunakan oleh `FuzzyOwnGamesScorer`. Semua data di-*normalize* terhadap nilai maksimum dalam library pengguna untuk menjaga skalabilitas.

#### A. Playtime Forever (Satuan: Rasio Normalisasi 0.0 - 1.0)
*Metode: $x = \frac{Playtime_{game}}{MaxPlaytime_{library}}$*

| Term | a | b | c | d | Interpretasi Pakar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tidak Dimainkan** | -0.1 | 0 | 0.02 | 0.05 | Game "backlog" yang belum disentuh. |
| **Dicoba** | 0.02 | 0.05 | 0.15 | 0.2 | Hanya dimainkan beberapa jam awal. |
| **Cukup** | 0.1 | 0.2 | 0.4 | 0.5 | Menunjukkan ketertarikan moderat. |
| **Sering** | 0.3 | 0.4 | 0.7 | 0.8 | Pengguna menghabiskan waktu signifikan. |
| **Sangat Banyak** | 0.6 | 0.8 | 1.0 | 1.1 | Game utama atau favorit sepanjang masa. |

#### B. Recency (Satuan: Hari Sejak Terakhir Dimainkan)
*Alasan: Momentum minat pengguna meluruh seiring waktu.*

| Term | a | b | c | d | Interpretasi Pakar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Baru Main** | -1 | 0 | 5 | 7 | Masih dalam fase "hype" atau aktif. |
| **Agak Lama** | 5 | 10 | 25 | 30 | Masih diingat dengan baik. |
| **Lama** | 20 | 30 | 80 | 90 | Minat mulai beralih ke judul lain. |
| **Sangat Lama** | 60 | 90 | 150 | 180 | Hampir tidak relevan bagi selera saat ini. |
| **Ditinggal** | 150 | 180 | $\infty$ | $\infty$ | Game masa lalu yang sudah ditinggalkan. |

#### C. Recent Activity (Satuan: Rasio Normalisasi Playtime 2 Minggu)
*Metode: $x = \frac{RecentPlaytime_{game}}{MaxRecentPlaytime_{library}}$*

| Term | a | b | c | d | Interpretasi Pakar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tidak Aktif** | -0.1 | 0 | 0 | 0.05 | Tidak ada interaksi dalam 2 minggu. |
| **Sesekali** | 0 | 0.05 | 0.2 | 0.3 | Dimainkan sesekali di waktu luang. |
| **Aktif** | 0.2 | 0.3 | 0.6 | 0.7 | Sedang sering dimainkan. |
| **Sangat Aktif** | 0.5 | 0.7 | 1.0 | 1.1 | Fokus utama pengguna saat ini. |

---

### 2.1.3. Fuzzifikasi Store (Non-Owned Games)
Variabel ini digunakan oleh `FuzzyNonOwnGamesScorer` untuk prediksi.

#### A. Review Positivity (Satuan: Rasio 0.0 - 1.0)
*Sumber: Data Steam Store AppReviews.*

| Term | a | b | c | d | Interpretasi Pakar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Buruk** | -0.1 | 0 | 0.4 | 0.5 | Rating "Mostly Negative" atau sejenisnya. |
| **Mixed** | 0.4 | 0.45 | 0.6 | 0.65 | Pendapat komunitas terbagi (berisiko). |
| **Bagus** | 0.6 | 0.65 | 0.75 | 0.8 | Game berkualitas standar industri. |
| **Sangat Bagus** | 0.75 | 0.85 | 1.0 | 1.1 | "Overwhelmingly Positive" (Wajib direkomendasikan). |

#### B. Tag Similarity (Satuan: Jaccard Index 0.0 - 1.0)
*Rumus: $J(T_{user}, T_{game})$*

| Term | a | b | c | d | Interpretasi Pakar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tidak Cocok** | -0.1 | 0 | 0.2 | 0.3 | Genre yang jarang disentuh user. |
| **Lumayan** | 0.2 | 0.3 | 0.5 | 0.6 | Ada kemiripan elemen minor. |
| **Cocok** | 0.5 | 0.6 | 0.8 | 0.9 | Genre utama yang disukai user. |
| **Sangat Cocok** | 0.8 | 0.9 | 1.0 | 1.1 | Identik dengan profil minat tertinggi user. |

#### C. Review Volume (Satuan: Log10 dari Total Review)
*Alasan: Volume review Steam bersifat eksponensial.*

| Term | a | b | c | d | Interpretasi Pakar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sedikit** | -1 | 0 | 1.5 | 2.0 | $10^0 - 10^{1.5}$ (~31 review). Kurang kredibel. |
| **Sedang** | 1.5 | 2.0 | 3.0 | 3.5 | $10^{1.5} - 10^3$ (~1000 review). Cukup kredibel. |
| **Banyak** | 3.0 | 4.0 | 10 | 11 | $> 1000$ review. Data sangat valid secara statistik. |

#### D. Publisher Score (Satuan: Rasio Agregasi 0.0 - 1.0)
*Rumus: $PS = \frac{\sum (Score_{game} \times Playtime_{game})}{\sum Playtime_{all\_games}}$*

| Term | a | b | c | d | Interpretasi Pakar |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Low** | -0.1 | 0 | 0.3 | 0.4 | Publisher asing atau pernah main tapi sebentar. |
| **Medium** | 0.3 | 0.4 | 0.6 | 0.7 | Publisher yang produknya cukup sering dimainkan. |
| **High** | 0.6 | 0.7 | 1.0 | 1.1 | Brand loyalitas tinggi (misal: Paradox, Rockstar). |

---

### 2.2. Defuzzifikasi (Weighted Average)
Sistem menggunakan metode rata-rata berbobot untuk mendapatkan nilai akhir (skor preferensi):

```math
Score = \frac{\sum_{i=1}^n \mu_{activation, i} \cdot w_i}{\sum_{i=1}^n \mu_{activation, i}}
```

Dimana $w$ adalah bobot konstanta:
-   **Sangat Rendah**: 0.1
-   **Rendah**: 0.3
-   **Sedang**: 0.5
-   **Tinggi**: 0.7
-   **Sangat Tinggi**: 0.9

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

## 4. Kesimpulan
Sistem ini berhasil mengonversi data Steam yang sangat luas menjadi rekomendasi personal melalui pemodelan spektrum minat manusia menggunakan Logika Fuzzy. Penggunaan skala logaritmik, normalisasi relatif, dan optimasi heuristik memastikan hasil yang presisi dan efisien.

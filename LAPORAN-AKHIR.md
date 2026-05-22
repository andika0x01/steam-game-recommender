# Laporan Akhir: Steam Game Recommender System

## 1. Pendahuluan
Steam Game Recommender adalah platform berbasis web yang menggunakan **Logika Fuzzy (Fuzzy Logic)** dan algoritma optimasi untuk memberikan rekomendasi game yang sangat personal. Sistem ini membedah library pengguna, menganalisis perilaku bermain, dan memprediksi tingkat ketertarikan terhadap game baru di Steam Store.

## 2. Arsitektur Sistem Rekomendasi
Sistem ini mengadopsi arsitektur **Dual-Scorer Fuzzy Logic** yang memisahkan penilaian pengalaman masa lalu dengan prediksi minat masa depan.

### 2.1. Orkestrasi Algoritma Rekomendasi
Proses rekomendasi dilakukan melalui tahapan sistematis berikut:

1.  **Library Profiling**:
    Sistem mengevaluasi seluruh game di library pengguna menggunakan `FuzzyOwnGamesScorer`. Setiap game diberikan skor kepuasan (0-1) berdasarkan data perilaku nyata (*real behavior*).
2.  **Fingerprint Generation**:
    Sistem membangun "sidik jari minat" dengan cara mengagregasi tag dan publisher dari game-game di library. Bobot setiap tag dihitung secara proporsional terhadap skor kepuasan game pemiliknya.
3.  **Proportional Tag Fetching**:
    Bukannya mencari game secara acak, sistem mengambil Top 10 tag favorit pengguna dan menghitung persentase minat untuk masing-masing. Jika profil Anda 40% adalah "RPG", sistem akan mengalokasikan 40% kuota pencarian kandidat ke genre tersebut.
4.  **Candidate Scoring**:
    Setiap kandidat game baru yang ditemukan dari Steam Store dinilai ulang secara independen menggunakan `FuzzyNonOwnGamesScorer` yang mempertimbangkan faktor kualitas publik (review) dan kecocokan profil (tag & publisher).
5.  **Final Ranking**:
    Semua kandidat diurutkan berdasarkan skor prediksi tertinggi untuk ditampilkan kepada pengguna.

---

### 2.2. Logika Fuzzy (Fuzzy Logic)
Sistem menggunakan fungsi keanggotaan trapezoidal ($TrapMF$) untuk mengubah variabel input (crisp) menjadi nilai fuzzy.

#### Fungsi Keanggotaan Trapezoidal:

```math
\mu_A(x; a, b, c, d) = \begin{cases} 0, & x \le a \text{ atau } x \ge d \\ \frac{x-a}{b-a}, & a < x < b \\ 1, & b \le x \le c \\ \frac{d-x}{d-c}, & c < x < d \end{cases}
```

#### Justifikasi Pemilihan TrapMF:
1.  **Representasi Plateau**: Memungkinkan rentang nilai memiliki derajat keanggotaan penuh ($\mu = 1.0$), memberikan stabilitas pada hasil scoring.
2.  **Efisiensi Komputasi**: Hanya menggunakan operasi linear sederhana, ideal untuk platform *edge* (Cloudflare Workers).

---

### 2.3. Analisis Variabel Input Library (Owned Games)
Variabel ini digunakan oleh `FuzzyOwnGamesScorer` (Skor Kepuasan).

| Variabel | Satuan | Deskripsi Pakar |
| :--- | :--- | :--- |
| **Playtime Forever** | Menit (Normalisasi) | Total jam terbang pengguna. Dibagi terhadap nilai tertinggi di library untuk mendapatkan skala relatif. |
| **Recency** | Hari | Jumlah hari sejak terakhir dimainkan. Mengukur apakah game tersebut masih relevan dengan minat aktif saat ini. |
| **Recent Activity** | Menit (Normalisasi) | Intensitas bermain dalam 2 minggu terakhir. Mendeteksi game yang sedang "hype" di mata user. |

### 2.4. Analisis Variabel Input Store (Non-Owned Games)
Variabel ini digunakan oleh `FuzzyNonOwnGamesScorer` (Skor Prediksi).

| Variabel | Satuan | Deskripsi Pakar |
| :--- | :--- | :--- |
| **Review Positivity** | Rasio (0-1) | Persentase review positif di Steam. Digunakan sebagai indikator kualitas objektif. |
| **Tag Similarity** | Jaccard Index (0-1) | Mengukur irisan tag kandidat terhadap profil minat user. Semakin mendekati 1, semakin cocok "DNA" game tersebut. |
| **Review Volume** | Log10 (Jumlah) | Kredibilitas data. Skala logaritmik digunakan untuk menyeimbangkan statistik antara game indie kecil dan judul AAA. |
| **Publisher Score** | Rasio (0-1) | Loyalitas brand. Dihitung dari sigma skor kepuasan dikali durasi bermain game rilisan publisher tersebut di masa lalu. |

---

### 2.5. Defuzzifikasi (Weighted Average)
Sistem menggunakan metode rata-rata berbobot untuk mendapatkan nilai akhir (skor preferensi):

```math
Score = \frac{\sum_{i=1}^n \mu_{activation, i} \cdot w_i}{\sum_{i=1}^n \mu_{activation, i}}
```

Dimana $w$ adalah konstanta tingkat kepuasan: **Sangat Rendah (0.1)** hingga **Sangat Tinggi (0.9)**.

---

## 3. Fitur Utama & Optimasi

### 3.1. Discovery Engine & Infinite Scrolling
Mesin pencari yang mendukung eksplorasi tanpa batas. Untuk menjamin kualitas dan variasi:
-   **Aggressive Offset**: Setiap halaman baru menggunakan parameter `start` yang melompat signifikan (50+ game) untuk menghindari pengulangan hasil populer yang sama.
-   **Deduplikasi Client-side**: Memastikan ID game yang sudah tampil tidak akan muncul kembali di layar.

### 3.2. Deal Hunter (Budget Optimization)
Menggunakan **Simulated Annealing (SA)** untuk memaksimalkan kepuasan dalam batas budget.
-   **Density Function**: $Density = \frac{Score}{\max(Price, 1)}$. Memprioritaskan game berkualitas tinggi dengan harga terendah.
-   **Utility Maximization**: SA secara agresif mencari kombinasi yang memaksimalkan utilitas budget $(\frac{TotalCost}{Budget})^2$ agar sisa saldo pengguna seminimal mungkin.

### 3.3. Strategi Caching (Cloudflare KV)
Untuk performa maksimal dan efisiensi API Steam:
-   **Search Cache (7 Hari)**: Menjaga stabilitas daftar rekomendasi mingguan.
-   **Details & Review Cache (Permanen)**: Informasi metadata game yang sudah pernah di-*fetch* akan disimpan selamanya untuk kecepatan akses instan.

## 4. Kesimpulan
Dengan menggabungkan Logika Fuzzy untuk penilaian subjektif dan algoritma heuristik untuk optimasi data, Steam Game Recommender mampu mentransformasi data mentah Steam menjadi pengalaman penemuan game yang benar-benar personal dan akurat.

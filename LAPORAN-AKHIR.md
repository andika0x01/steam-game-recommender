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
$$
\mu_A(x; a, b, c, d) = 
\begin{cases} 
0, & x \le a \text{ atau } x \ge d \\
\frac{x-a}{b-a}, & a < x < b \\
1, & b \le x \le c \\
\frac{d-x}{d-c}, & c < x < d 
\end{cases}
$$

#### Variabel Input:
-   **Owned Games**: $Playtime$ (Playtime Forever), $Activity$ (2 Weeks Playtime), $Recency$ (Days since last played).
-   **Non-Owned Games**: $Positivity$ (Review Ratio), $Similarity$ (Tag Match), $Volume$ (Review Count).

#### Defuzzifikasi (Weighted Average):
Sistem menggunakan metode rata-rata berbobot untuk mendapatkan nilai akhir (skor preferensi):
$$
Score = \frac{\sum_{i=1}^n \mu_{activation, i} \cdot w_i}{\sum_{i=1}^n \mu_{activation, i}}
$$
Dimana $\mu_{activation}$ adalah derajat aktivasi aturan fuzzy dan $w$ adalah bobot konstanta untuk setiap kategori ($Sangat Rendah = 0.1$, $Rendah = 0.3$, dsb).

### 2.2. Jaccard Similarity
Digunakan untuk menghitung kemiripan antara dua set tag ($T_1$ dan $T_2$).
$$
J(T_1, T_2) = \frac{|T_1 \cap T_2|}{|T_1 \cup T_2|}
$$
Nilai ini berkisar antara 0 (tidak mirip sama sekali) hingga 1 (identik).

### 2.3. Proportional Tag Fetching
Untuk menjaga variasi rekomendasi, sistem menghitung proporsi minat pengguna terhadap setiap tag:
$$
Proporsi_{tag} = \frac{\sum Score_{game} \text{ (yang memiliki tag)}}{\sum \text{Total Weight Profile}}
$$
Kandidat game diambil dari Steam Store secara proporsional berdasarkan nilai ini.

## 3. Fitur Utama

### 3.1. Library Analysis (Backlog)
Menganalisis library pengguna untuk mengidentifikasi game mana yang paling "berharga" bagi mereka berdasarkan perilaku nyata. Skor ini digunakan untuk membangun profil selera dasar.

### 3.2. Discovery Engine
Mesin pencari game baru. Sistem ini mengambil puluhan hingga ratusan kandidat game berdasarkan profil tag pengguna, lalu menyaringnya menggunakan `FuzzyNonOwnGamesScorer` untuk mendapatkan 12 rekomendasi terbaik.

### 3.3. Co-op Nexus
Menganalisis irisan (*intersection*) library antara pengguna dan teman-temannya. Rekomendasi dihitung dengan:
$$
Score_{group} = \frac{\sum_{j=1}^m FuzzyScore_j}{m}
$$
Dimana $m$ adalah jumlah anggota dalam grup. Menampilkan game multiplayer yang paling disukai secara kolektif.

### 3.4. Deal Hunter (Budget Optimization)
Menggunakan **Simulated Annealing (SA)** untuk menemukan kombinasi game diskon terbaik yang masuk dalam budget pengguna namun tetap memiliki skor preferensi tertinggi.

#### Algoritma Simulated Annealing:
1.  Inisialisasi solusi acak ($S_{current}$) dalam batas budget.
2.  Lakukan iterasi dengan menurunkan temperatur ($T$):
    -   Pilih tetangga ($S_{next}$).
    -   Hitung selisih energi (skor): $\Delta E = Energy(S_{next}) - Energy(S_{current})$.
    -   Jika $\Delta E > 0$, terima $S_{next}$.
    -   Jika $\Delta E < 0$, terima $S_{next}$ dengan probabilitas $P = e^{\frac{\Delta E}{T}}$.
3.  Ulangi hingga temperatur mencapai batas minimum.

## 4. Kesimpulan
Dengan menggabungkan Logika Fuzzy untuk penilaian subjektif dan algoritma heuristik (SA & Jaccard) untuk optimasi, Steam Game Recommender mampu memberikan hasil yang jauh lebih akurat dan personal dibandingkan dengan sistem pencarian berbasis popularitas standar.

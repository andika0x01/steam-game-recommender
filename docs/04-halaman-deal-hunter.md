# 04 - Alur Proses Halaman Deal Hunter

Halaman ini mendemonstrasikan optimasi multi-kriteria untuk memaksimalkan kepuasan belanja pengguna.

---

## 1. Fase Input
Mengambil data diskon real-time dari CheapShark API. Menyiapkan variabel: Persentase Diskon ($S$), Harga Sale ($P$), dan Skor Afinitas Bayesian ($A$).

## 2. Fase Optimasi: Particle Swarm Optimization (PSO)
PSO digunakan untuk mencari vektor bobot $[w_1, w_2, w_3]$ yang paling seimbang.

### Update Kecepatan Partikel
$$v_i(t+1) = w \cdot v_i(t) + c_1 r_1 (\text{pbest}_i - x_i(t)) + c_2 r_2 (\text{gbest} - x_i(t))$$
Dimana:
*   $v_i$: Kecepatan partikel $i$.
*   $x_i$: Posisi saat ini (nilai bobot).
*   $\text{pbest}$: Posisi terbaik pribadi.
*   $\text{gbest}$: Posisi terbaik global dalam koloni burung virtual.
*   $c_1, c_2$: Koefisien akselerasi.

### Update Posisi Partikel
$$x_i(t+1) = x_i(t) + v_i(t+1)$$

## 3. Fase Scoring (Value-for-Money)
Skor akhir setiap penawaran diskon dihitung menggunakan kombinasi linier teroptimasi:
$$\text{Total Score} = (A \cdot w_1) + (S \cdot w_2) + (\frac{1}{P} \cdot w_3)$$
Hasilnya kemudian dinormalisasi ke rentang $[0, 1]$ untuk keperluan visualisasi persentase kecocokan.

## 4. Fase Visualisasi
Menampilkan kartu diskon dengan indikator "Match Percentage" yang merupakan representasi visual dari hasil optimasi PSO.

---
*Hasil Akhir: Rekomendasi diskon yang memprioritaskan game dengan kombinasi harga terendah dan ketertarikan tertinggi.*

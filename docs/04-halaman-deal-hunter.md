# 04 - Alur Proses Halaman Deal Hunter (Deep Value Optimizer)

Halaman ini melakukan optimasi multi-kriteria untuk menemukan penawaran diskon yang paling bernilai bagi profil personal pengguna.

---

## 1. Fase Input & Enrichment
Sistem menarik data diskon dari CheapShark API dan memperkaya metadata setiap diskon dengan genre asli dari Steam via **KV Cache**.

## 2. Fase Scoring: Bayesian Value Metric
Skor dasar setiap deal ($M$) dihitung menggunakan kombinasi linier dari tiga faktor:
1.  **Bayesian Match ($B$)**: Probabilitas seleramu terhadap genre game tersebut (Bobot: 60%).
2.  **Savings Factor ($S$)**: Persentase diskon (Bobot: 30%).
3.  **Price Efficiency ($P$)**: Skor harga murah dibandingkan harga standar (Bobot: 10%).

$$Match = (B \cdot 0.6) + (S \cdot 0.3) + (P \cdot 0.1)$$

## 3. Fase Optimasi: Simulated Annealing (SA)
Setelah ratusan deal diskor, sistem tidak langsung menampilkan yang tertinggi. SA digunakan untuk memilih 24 penawaran terbaik yang memiliki variasi genre yang luas.

### Kriteria Boltzmann
SA memastikan bahwa daftar diskon yang ditampilkan tidak hanya berisi game murah, tetapi juga game yang memiliki kualitas genre yang seimbang dengan selera library user.

---
*Hasil Akhir: Rekomendasi belanja yang cerdas, personal, dan teroptimasi secara ekonomi.*

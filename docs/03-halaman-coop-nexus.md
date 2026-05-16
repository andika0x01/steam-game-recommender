# 03 - Alur Proses Halaman Co-op Nexus (Multi-Agent Convergence)

Halaman ini mengintegrasikan data dari banyak agen untuk mencari "Titik Temu" (Convergence) minat bermain di dalam grup.

---

## 1. Fase Sinkronisasi (Library Intersection)
Sistem melakukan operasi irisan himpunan pada ID game dari $N$ user untuk menemukan aset taktis yang dimiliki bersama:
$$S = Library_1 \cap Library_2 \cap \dots \cap Library_n$$

## 2. Fase Konvergensi: Group Bayesian Inference
Untuk setiap game di dalam set $S$, sistem menghitung "Group Affinity Score" ($G$). Skor ini adalah rata-rata probabilitas Bayesian dari setiap anggota grup:
$$G_{game} = \frac{\sum_{k=1}^{N} P(Like_k | Genres_{game})}{N}$$
Dimana $P(Like_k)$ dihitung menggunakan profil personal masing-masing user yang telah diperkaya (Enriched) via KV Cache.

## 3. Fase Optimasi: Simulated Annealing (SA)
Sistem menyeleksi 12 game terbaik dari daftar milik bersama yang paling memuaskan semua pihak secara kolektif.

### Kriteria Seleksi
SA mencari kombinasi game yang memiliki:
*   **Kolektifitas Tinggi**: Rata-rata skor Bayesian grup maksimal.
*   **Genre Balance**: Menghindari dominasi satu genre agar semua orang di grup (yang mungkin punya selera berbeda) tetap terwakili.

## 4. Fase Output
Menghasilkan visualisasi kartu game dengan indikator persentase "Group Match". Waypoint yang dihasilkan merupakan hasil evolusi algoritma SA untuk memastikan sesi bermain berikutnya adalah yang paling seru bagi semua orang.

---
*Hasil Akhir: Strategi bermain grup yang berbasis data riil dan kepuasan kolektif.*

# 03 - Alur Proses Halaman Co-op Nexus

Halaman ini mengintegrasikan data dari banyak agen untuk mencari irisan kepentingan dan rute bersama.

---

## 1. Fase Sinkronisasi (Intersection)
Sistem melakukan operasi irisan himpunan pada ID game dari $N$ user:
$$S = Library_1 \cap Library_2 \cap \dots \cap Library_n$$

## 2. Fase Pemodelan Graf
Membangun graf kedekatan genre untuk game di dalam set $S$. Jarak antar node $i$ dan $j$ dihitung menggunakan **Jaccard Distance** pada genre:
$$d(i, j) = 1 - \frac{|Genres_i \cap Genres_j|}{|Genres_i \cup Genres_j|}$$

## 3. Fase Pathfinding: A* Search
Algoritma A* mencari jalur terpendek dari game awal ke game akhir di daftar bersama untuk menjaga *flow* genre.

### Fungsi Heuristik
Heuristik $h(n)$ memberikan estimasi biaya terendah dari node $n$ ke target:
$$h(n) = \text{Minimisasi perbedaan genre terhadap target}$$

### Pencarian Node
Algoritma memelihara `Open Set` dan memilih node $n$ yang meminimalkan:
$$f(n) = g(n) + h(n)$$
*   $g(n)$: Biaya nyata yang sudah ditempuh dari awal.
*   $f(n)$: Perkiraan total biaya terendah untuk rute yang melewati node $n$.

## 4. Fase Output
Menghasilkan daftar linear game yang telah diurutkan berdasarkan skor $f(n)$ terkecil. Waypoints ini kemudian divisualisasikan dengan konektor dinamis di UI.

---
*Hasil Akhir: Strategi bermain grup yang meminimalkan hambatan transisi genre bagi seluruh anggota.*

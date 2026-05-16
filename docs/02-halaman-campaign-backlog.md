# 02 - Alur Proses Halaman Campaign Map (Backlog)

Halaman ini menggunakan perpaduan logika samar dan optimasi koloni untuk merancang rute bermain strategis.

---

## 1. Fase Rating: Fuzzy Logic
Setiap game diberi rating numerik menggunakan fungsi keanggotaan **Trapezoidal**:
$$\mu(x; a, b, c, d) = \max\left(0, \min\left(\frac{x-a}{b-a}, 1, \frac{d-x}{d-c}\right)\right)$$
Dimana:
*   $x$: Jam main game di library.
*   $[a, b, c, d]$: Titik batas yang telah dioptimasi oleh GA.
*   Skor Rating ($R$) adalah hasil defuzzifikasi rata-rata terbobot dari derajat keanggotaan.

## 2. Fase Pembuatan Graf
Sistem membangun graf lengkap $G(V, E)$ dimana:
*   $V$: Node yang merepresentasikan game backlog.
*   $E$: Edge yang menghubungkan antar game dengan bobot jarak $d_{ij} = |R_i - R_j| + \epsilon$.

## 3. Fase Optimasi: Ant Colony Optimization (ACO)
Untuk mencari rute terbaik, sistem mensimulasikan pergerakan semut:

### Aturan Transisi (Probabilitas)
Probabilitas semut memilih jalur dari game $i$ ke game $j$:
$$P_{ij} = \frac{(\tau_{ij}^\alpha) \cdot (\eta_{ij}^\beta)}{\sum (\tau_{ik}^\alpha) \cdot (\eta_{ik}^\beta)}$$
Dimana:
*   $\tau_{ij}$: Tingkat feromon pada jalur $ij$.
*   $\eta_{ij}$: Invisibility (seperjarak $1/d_{ij}$).
*   $\alpha, \beta$: Parameter bobot pengaruh feromon vs jarak.

### Update Feromon
Setelah semua semut selesai, feromon diperbarui:
$$\tau_{ij} = (1 - \rho)\tau_{ij} + \sum \Delta \tau_{ij}$$
*   $\rho$: Laju penguapan (evaporation rate).
*   $\Delta \tau_{ij}$: Tambahan feromon $1/L$ dimana $L$ adalah total skor rute tersebut.

---
*Hasil Akhir: Jalur bermain yang divisualisasikan sebagai Discovery Trail yang linear dan logis.*

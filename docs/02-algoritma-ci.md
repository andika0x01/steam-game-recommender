# 02 - Detail Algoritma Computational Intelligence (CI)

Proyek ini merupakan demonstrasi pemanfaatan suite lengkap algoritma CI. Berikut adalah detail fungsional dari tiap algoritma:

## 1. Fuzzy Logic (Membership Modeling)
*   **Peran**: Mengubah input kuantitatif (`playtime_forever`) menjadi variabel kualitatif (Engagement).
*   **Fungsi Membership**: Trapezoidal.
*   **Keunggulan**: Memungkinkan transisi halus antar kategori. Sebuah game tidak kaku dianggap "Suka" atau "Tidak", melainkan bisa memiliki derajat keanggotaan (misal: 0.7 Suka dan 0.2 Biasa Saja).

## 2. Genetic Algorithm / GA (Optimization)
*   **Peran**: Tuning parameter batas fungsi Fuzzy.
*   **Proses**: Evolusi populasi kromosom (parameter). Setiap individu diuji fitnesnya berdasarkan seberapa baik parameter tersebut dapat mendistribusikan engagement secara adil di seluruh library user.
*   **Output**: Batas titik (a, b, c, d) yang paling optimal untuk library unik milik user.

## 3. Particle Swarm Optimization / PSO (Global Optimization)
*   **Peran**: Mencari bobot ideal kriteria majemuk pada fitur Deal Hunter.
*   **Logika**: Sekumpulan partikel bergerak di ruang 3D (Bobot Afinitas, Bobot Diskon, Bobot Harga). Partikel saling berbagi informasi tentang posisi terbaik pribadi dan global untuk konvergensi ke bobot paling menguntungkan bagi user.

## 4. Bayesian Inference (Probabilistic Prediction)
*   **Peran**: Memberikan skor probabilitas ketertarikan.
*   **Rumus**: $P(Like | Genres) = \frac{P(Genres | Like) \times P(Like)}{P(Genres)}$.
*   **Logika**: Menghitung peluang user akan menyukai game baru berdasarkan seberapa dominan genre tersebut pada game-game yang sudah sering dimainkan (Liked Games).

## 5. Classical Search - A* (Graph Pathfinding)
*   **Peran**: Membuat rute multiplayer di fitur Co-op Nexus.
*   **Node & Edge**: Tiap game adalah node. Biaya edge ditentukan oleh (1 - Kesamaan Genre).
*   **Heuristic**: Jarak genre ke target akhir.
*   **Hasil**: Urutan bermain yang memiliki transisi genre paling halus (smooth transition).

## 6. Ant Colony Optimization / ACO (Sequencing)
*   **Peran**: Menyusun Campaign Map (backlog trail).
*   **Logika**: Mensimulasikan semut yang meninggalkan feromon pada jalur game. Jalur dengan akumulasi feromon tertinggi (kombinasi skor Fuzzy rating terbaik) akan dipilih sebagai rute utama.
*   **Keunggulan**: Sangat baik untuk masalah optimasi kombinatorial (urutan).

## 7. Simulated Annealing / SA (Portfolio Selection)
*   **Peran**: Memilih 12 kandidat final di Discovery Engine.
*   **Logika**: Menerima ratusan kandidat dan melakukan iterasi suhu (annealing). Algoritma ini sesekali menerima solusi yang lebih buruk di awal untuk menghindari terjebak di *local optima*, demi mencapai set game yang skornya tinggi namun genrenya sangat beragam.

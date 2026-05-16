# 03 - Halaman Co-op Nexus

Halaman **Co-op Nexus** (`/coop`) adalah fitur sosial cerdas untuk menemukan waktu bermain yang berkualitas bersama teman-teman Anda.

## Fungsi Utama (Perspektif Pengguna)
Anda bisa memilih beberapa teman sekaligus dari daftar "Arsip Agen". Sistem akan secara otomatis mencari game apa saja yang Anda dan teman-teman Anda miliki bersama (*Shared Assets*). Kemudian, sistem akan membuat rute bermain yang seru untuk sesi *gaming* grup Anda.

## Bagaimana Cara Kerjanya? (Algoritma CI)

### 1. Multi-Agent Intersection
Sistem melakukan irisan (intersection) data library antar teman secara real-time. Ini memastikan game yang disarankan benar-benar dimiliki oleh semua orang di grup tersebut.

### 2. A* Search Mapping
Saat Anda menekan tombol **Generate Nexus Map**, algoritma **A*** bekerja di balik layar.
*   **Logika**: A* mencari jalur bermain yang memiliki transisi genre paling mulus.
*   **Tujuan**: Menghindari perpindahan game yang terlalu drastis (misal dari game teka-teki santai langsung ke game perang kompetitif yang intens). A* menyusun rute agar suasana sesi bermain bersama tetap terjaga (*flow maintenance*).

### 3. Waypoint Sequencing
Hasil rute A* ditampilkan dengan nomor urut yang jelas. Ini berfungsi sebagai "Peta Strategi" bagi grup Anda untuk menghabiskan malam minggu atau sesi bermain bersama.

---
*Fitur ini dirancang untuk menjawab pertanyaan: "Kita semua punya game apa ya yang seru buat dimainkan bareng sekarang?"*

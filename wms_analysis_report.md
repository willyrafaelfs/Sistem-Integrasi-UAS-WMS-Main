# ANALISIS TEKNIS DAN ARSITEKTUR WMS-SAM
## Sistem Otomasi Pergudangan Berbasis Smart Warehouse & Automation (Uteco Contec)

Laporan ini menyajikan analisis mendalam terhadap spesifikasi sistem **WMS-SAM (Warehouse Management System - Software Automation Module)** yang dirancang oleh Uteco Contec. Analisis ini menggunakan sudut pandang *Enterprise Architecture*, *Smart Warehouse Concept*, *System Integration*, dan *Operational Efficiency*.

---

## 1. Arsitektur Integrasi Sistem (System Integration Flow)

Dalam ekosistem manufaktur dan logistik modern (Smart Factory / Industry 4.0), WMS-SAM bertindak sebagai **jembatan logikal** yang menghubungkan keputusan bisnis tingkat atas dengan aksi mekanis robotik di lantai gudang (*shopfloor*).

Berikut adalah diagram alur integrasi data dan instruksi fisik antara ERP, MES, WMS-SAM, WCS, dan perangkat otomatisasi (PLC, AGV, A-SRS):

```mermaid
graph TD
    subgraph Enterprise Level (Tingkat Bisnis)
        ERP[ERP System - e.g., SAP, Oracle]
        MES[MES System - Manufacturing Execution]
    end

    subgraph Decision & Logic Level (WMS-SAM)
        WMS[WMS-SAM Server]
        BorderDB[Border Database - ODBC]
    end

    subgraph Execution Level (Tingkat Kontrol)
        WCS[WCS - Warehouse Control System]
        PLC[SIEMENS PLC System]
        AGV_Ctrl[AGV/LGV Fleet Controller]
    end

    subgraph Physical Level (Tingkat Robotik)
        Crane[Aisle Cranes - Stacker Cranes]
        Conveyor[Conveyors & EMS Monorails]
        Robots[AGV / LGV Robots]
    end

    %% Data Flows
    ERP <-->|Sync Master Data, PO, SO via ODBC| BorderDB
    BorderDB <--> WMS
    MES -->|Kirim Hasil Produksi Finished Goods| WMS
    WMS <-->|Kirim Instruksi Misi Transport via TCP-IP| WCS
    WCS <-->|ProfiNET / Ethernet| PLC
    WCS <-->|Radio Link / Wi-Fi| AGV_Ctrl
    PLC <-->|Instruksi I-O Fisik| Crane
    PLC <-->|Frekuensi Motor / Sensor| Conveyor
    AGV_Ctrl <-->|Panduan Navigasi Laser/Fisik| Robots
```

### Penjelasan Alur Integrasi:
1.  **ERP ke WMS-SAM**: ERP mengirimkan data master produk, data supplier, serta pesanan komersial (Purchase Orders & Sales Orders) ke **Border Database** menggunakan koneksi **ODBC**. Penggunaan Border DB memastikan sistem WMS terisolasi dengan aman dari database utama ERP untuk menghindari interferensi performa.
2.  **MES ke WMS-SAM**: Ketika lini produksi menyelesaikan pembuatan produk (Finished Goods), MES mengirimkan sinyal ke WMS-SAM untuk mengalokasikan area penyimpanan inbound secara otomatis.
3.  **WMS-SAM ke WCS (Warehouse Control System)**: WMS-SAM menerjemahkan perintah bisnis menjadi instruksi misi fisik (misalnya: "Pindahkan Palet X dari Titik Unloading ke Rak A-12-03"). Misi ini dikirimkan ke WCS melalui jaringan TCP/IP.
4.  **WCS ke PLC & AGV Controller**: WCS menerjemahkan instruksi logis WMS menjadi sinyal kontrol mesin. WCS berkomunikasi dengan **SIEMENS PLC** via **ProfiNET** untuk menggerakkan konveyor dan Aisle Crane (Stacker Crane), serta mengirim perintah navigasi ke armada **AGV/LGV** via jaringan nirkabel.
5.  **Perangkat Fisik ke WMS-SAM**: Sensor pada konveyor dan Aisle Crane mendeteksi penyelesaian tugas, mengirimkan sinyal balik ke PLC -> WCS -> WMS-SAM untuk memperbarui stok secara real-time di database SQL Server.

---

## 2. Analisis Fitur Berdasarkan 10 Domain Utama

Berikut adalah pengelompokkan fungsionalitas WMS-SAM ke dalam 10 domain utama beserta analisis fungsi bisnis, manfaat operasional, dan perannya dalam mendukung otomatisasi gudang:

### 1. Inventory Management
*   **Fitur**: Manajemen FIFO (First-In, First-Out) berbasis tanggal produksi barang masuk/keluar, Stock Opname/Inventory Management real-time, kontrol klasifikasi ABC produk, pengelolaan pallet dengan metode *single-product* (mono-product) dan *multi-product* (campuran produk dalam satu unit pemuatan).
*   **Fungsi Bisnis**: Menjamin keakuratan pencatatan nilai persediaan (stock value), meminimalisir risiko kedaluwarsa barang, dan mengoptimalkan portofolio persediaan berdasarkan tingkat perputarannya.
*   **Manfaat Operasional**: Menjamin nilai stok selalu tepat (*stock values always correct*), memotong waktu yang terbuang untuk pencarian manual barang kedaluwarsa, dan meniadakan proses pembukuan fisik yang rentan salah ketik.
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Memberikan struktur data yang bersih bagi robot logistik. Data dimensi, berat, dan status rotasi barang (ABC) disimpan dalam database, yang nantinya digunakan sebagai acuan algoritma pemosisian barang otomatis oleh Aisle Crane.

### 2. Warehouse Location Management
*   **Fitur**: Pemetaan lokasi gudang secara dinamis (Warehouse Map), pengelolaan lokasi fisik berstruktur hierarki (Area, Rak, Baris, Kolom/Bin), penanganan rak manual, drive-in, ground blocks, dan macro locations. Penanganan kapasitas lokasi berdasarkan dimensi pallet (*Pallet heights / size classes*), berat, dan jenis barang.
*   **Fungsi Bisnis**: Memaksimalkan kapasitas penyimpanan gudang (utilisasi ruang vertikal dan horizontal) dan mencegah kerusakan fisik infrastruktur akibat beban berlebih (*weight capacity protection*).
*   **Manfaat Operasional**: Mengeliminasi kesalahan penempatan barang (*misplacement*), mengurangi jarak tempuh operator, dan mengidentifikasi ruang kosong secara instan tanpa perlu pengecekan visual ke lapangan.
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Sistem secara otomatis menentukan koordinat koordinasi penyimpanan (*bin slotting*) saat menerima barang. Informasi ini dikirim ke sistem robotik untuk menaruh palet pada tinggi rak yang tepat sesuai dimensi tinggi palet (*size class*).

### 3. Task Management
*   **Fitur**: Pembuatan instruksi tugas otomatis (*automatically generates missions*), optimasi rute pengambilan barang (*picking route optimization*), dan manajemen pengambilan barang otomatis (*automatic picking: Man-to-Man / Man-to-Goods*).
*   **Fungsi Bisnis**: Menjaga efisiensi pemanfaatan waktu kerja operator dan mesin, meminimalkan biaya operasional logistik, dan mengontrol siklus waktu penyelesaian pesanan pelanggan (order lead time).
*   **Manfaat Operasional**: Meminimalkan waktu penanganan barang (*handling times*), meminimalisir kertas kerja fisik (*paperless picking lists*), dan mencegah tabrakan/kemacetan operator di lorong gudang dengan algoritma rute dinamis yang mempertimbangkan kehadiran operator lain.
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Menjadi mesin penjadwal (*scheduler*) yang mengoordinasikan pergerakan mesin otomatis (Stacker Crane/AGV) dan operator manual agar bekerja secara sinkron tanpa jeda tunggu idle.

### 4. Inbound & Outbound Management
*   **Fitur**: Penerimaan barang (*Acceptance/Entry*), verifikasi kesesuaian data fisik dengan data ERP (mencocokkan Kode Barang, Berat, Dimensi, Supplier, SSCC, Tanggal Pengiriman), penolakan palet cacat data (*auto-discard pallet*), penentuan urutan pengeluaran barang (*picking sequence*) berdasarkan prioritas truk dan tujuan, pembuatan & pencetakan *Packing List*.
*   **Fungsi Bisnis**: Mencegah masuknya barang salah atau rusak ke dalam gudang (*inbound quality gate*) dan menjamin kelancaran pengiriman barang keluar sesuai jadwal logistik transportasi.
*   **Manfaat Operasional**: Mengeliminasi kesalahan penerimaan barang (zero-error inbound), mempercepat proses bongkar muat (*dock-to-stock*), dan memastikan barang yang dimuat ke truk tersusun rapi sesuai urutan drop-point (*outbound sequencing*).
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Sistem integrasi timbangan (weighing scale) otomatis dan gerbang scan barcode pada konveyor inbound mendeteksi kecocokan palet secara live. Jika lolos validasi, WMS memerintahkan konveyor melanjutkan palet ke area A-SRS; jika gagal, konveyor otomatis memutar palet ke jalur penolakan (*reject lane*).

### 5. Visualization & Monitoring
*   **Fitur**: Grafik peta gudang (*graphical map of the warehouse*) yang diperbarui secara real-time, visualisasi dan pelacakan seluruh aktivitas perpindahan barang dan mesin supervisor di layar monitor.
*   **Fungsi Bisnis**: Memberikan transparansi operasional (*end-to-end visibility*) bagi manajer gudang guna pengambilan keputusan taktis secara cepat.
*   **Manfaat Operasional**: Memudahkan pemantauan utilitas kapasitas gudang, mendeteksi area penumpukan barang secara cepat, serta memantau status operasional mesin otomatis (*fault detection*).
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Menyediakan antarmuka "Digital Twin" sederhana yang menggambarkan posisi fisik stacker crane, konveyor, dan posisi palet secara live di layar monitor supervisor.

### 6. API & System Integration
*   **Fitur**: Komunikasi HOST (ERP), database perantara ODBC (*Border Database*), komunikasi ProfiNET/Ethernet dengan PLC SIEMENS, serta kemampuan integrasi dengan mesin pembungkus/pengikat otomatis (*Palletising, Wrapping, Strapping*).
*   **Fungsi Bisnis**: Mencegah terjadinya silo data antara departemen keuangan (ERP), departemen produksi (MES), dan operasional gudang (WMS).
*   **Manfaat Operasional**: Mengeliminasi input data manual berulang (*double-entry*), mengurangi jeda pembaruan data stok, serta mempermudah pemecahan masalah jarak jauh oleh tim teknis Uteco Contec melalui VPN.
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Bertindak sebagai interpreter protokol industri yang menerjemahkan instruksi database tingkat tinggi (SQL) menjadi instruksi register biner rendah yang dapat dibaca oleh kontroler PLC mesin konveyor.

### 7. Automation & Robotics
*   **Fitur**: Integrasi dengan Aisle Cranes (Stacker Cranes), Palletising Systems, konveyor palet, EMS (Electrified Monorail Systems), AGV (Automated Guided Vehicles), dan LGV (Laser Guided Vehicles).
*   **Fungsi Bisnis**: Mengurangi ketergantungan pada tenaga kerja fisik, memungkinkan operasi gudang 24/7 tanpa henti, dan menurunkan tingkat kecelakaan kerja di area High-Risk.
*   **Manfaat Operasional**: Kecepatan pemindahan barang yang konstan, akurasi penempatan barang hingga tingkat milimeter, serta pemanfaatan gudang dengan atap sangat tinggi (High-Bay Warehouse) secara aman.
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Merupakan jantung penggerak mekanis otomatis. WMS-SAM mengatur koordinasi lalu lintas (traffic management) bagi AGV/LGV dan memberikan koordinat jemput-antar bagi robot Stacker Crane.

### 8. User & Permission Management
*   **Fitur**: Arsip data profil pengguna gudang (*users of use*), manajemen peran (*role management*), pembatasan akses fungsi sistem, pencatatan histori operator untuk setiap mutasi barang.
*   **Fungsi Bisnis**: Menjaga keamanan data internal gudang, meminimalkan risiko sabotase atau kelalaian kerja, serta memenuhi standar audit akuntansi (*segregation of duties*).
*   **Manfaat Operasional**: Pelacakan penanggung jawab (*traceability*) mutasi barang secara jelas jika terjadi penyimpangan stok, serta pembatasan akses menu konfigurasi hanya untuk level supervisor ke atas.
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Menghubungkan hak akses pengguna dengan terminal genggam (RF) untuk memastikan hanya operator berlisensi yang dapat memberikan perintah manual override pada Aisle Crane atau AGV dalam keadaan darurat.

### 9. Reporting & Statistical Analysis
*   **Fitur**: Sistem analisis statistik gudang (*warehouse statistics*), sistem pemantauan efektivitas operasional, histori lengkap seluruh pergerakan barang baik manual maupun otomatis.
*   **Fungsi Bisnis**: Menyediakan data metrik kinerja gudang (KPI) sebagai bahan analisis efisiensi biaya dan perencanaan ekspansi gudang di masa depan.
*   **Manfaat Operasional**: Membantu manajemen mengukur kinerja kecepatan kerja operator gudang, mengukur utilisasi mesin otomatis, serta melacak tren pergerakan barang musiman.
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Data statistik historis perputaran barang diolah untuk memproyeksikan kebutuhan alokasi ruang secara prediktif (*predictive slotting*) sebelum musim puncak (peak season) tiba.

### 10. Material & Container Management
*   **Fitur**: Logika pengelolaan unit pemuatan (Loading Units / Pallets / Bins), manajemen pallet satu produk (*mono-product*) dan multi-produk (*multi-product*), penanganan dimensi tinggi palet (*size classes*), dan fitur pemadatan gudang otomatis (*pallet compacting/reorganization*).
*   **Fungsi Bisnis**: Menjamin efisiensi pemanfaatan kontainer pembawa barang dan menekan biaya overhead pengadaan pallet logistik.
*   **Manfaat Operasional**: Meminimalisir ruang kosong di atas pallet, mempermudah identifikasi isi pallet multi-produk melalui scan barcode tunggal, serta merapikan posisi penempatan pallet kosong secara otomatis.
*   **Peran dalam Otomatisasi (Smart Warehouse)**: Mengendalikan fitur *night compaction* (pemadatan gudang otomatis di malam hari). Algoritma WMS-SAM akan secara mandiri menggerakkan Stacker Crane saat jam istirahat untuk memindahkan palet setengah isi ke area yang lebih kompak atau menyatukan isi palet yang serupa.

---

## 3. Matriks Ringkasan Analisis Domain

| No | Domain Utama | Fungsi Bisnis Utama | Fokus Otomatisasi (Smart Warehouse) | Indikator Efisiensi (KPI) |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Inventory Management** | Keakuratan nilai stok & pencegahan kedaluwarsa barang | Reallokasi kurva ABC otomatis di malam hari (*night compaction*) | Stock Accuracy (%), Shrinkage Rate (%) |
| 2 | **Warehouse Location** | Optimasi ruang simpan gudang & keselamatan berat beban | Pengaturan *bin slotting* otomatis berbasis klasifikasi tinggi palet | Space Utilization (%), Search Time (detik) |
| 3 | **Task Management** | Efisiensi jam kerja staf & produktivitas mesin | Pengurangan waktu tunggu mesin (*idle*) & optimasi rute picking | Order Cycle Time (menit), Pick Rate (lines/hour) |
| 4 | **Inbound & Outbound** | Kontrol kualitas gerbang awal & ketepatan muatan truk | Auto-discard palet gagal validasi di konveyor | Dock-to-Stock Time (jam), Dispatch Accuracy (%) |
| 5 | **Visualization & Monitoring** | Transparansi pergerakan operasional logistik | Pemantauan 2D/3D status Stacker Crane secara live | Machine Downtime (menit), Alert Response Time (detik) |
| 6 | **API & System Integration** | Eliminasi silo data bisnis & sinkronisasi ERP-Shopfloor | Konversi perintah SQL/ODBC menjadi instruksi biner PLC | Data Sync Latency (milidetik) |
| 7 | **Automation & Robotics** | Operasional 24/7 & penghematan tenaga kerja fisik | Integrasi nirkabel armada AGV/LGV & Aisle Stacker Crane | OEE Peralatan Otomatis (%), Safety Incidents (kasus) |
| 8 | **User & Permission** | Keamanan data, pencegahan sabotase, audit log | Pembatasan kontrol fisik mesin berbasis profil login operator | Audit Compliance (Pass/Fail) |
| 9 | **Reporting & Statistics** | Dasar keputusan ekspansi & evaluasi kinerja staf | Penyediaan data log pergerakan untuk analisis prediktif | Operator Performance (misi/jam) |
| 10 | **Material & Container** | Optimasi muatan pallet & manajemen pallet kosong | Otomasi konsolidasi sisa ruang pallet kosong | Pallet Fill-rate (%), Container Utilization (%) |

---

## 4. Analisis Kelebihan Sistem WMS-SAM
1.  **Kemampuan Kontrol Otomasi Asli (Native WCS Integration)**: Berbeda dengan WMS dasar yang memerlukan middleware pihak ketiga untuk berkomunikasi dengan mesin, WMS-SAM memiliki kemampuan bawaan untuk berkomunikasi langsung dengan PLC Siemens (via ProfiNET/Ethernet) dan sistem robotika gudang (AGV, LGV, Stacker Crane).
2.  **Skalabilitas Parametrik**: Desain modular sistem memungkinkan penambahan fitur baru (seperti modul AGV baru atau integrasi pembungkus palet otomatis) di kemudian hari tanpa perlu merombak basis kode inti sistem yang sudah berjalan.
3.  **Optimalisasi Off-Hours (Night Compaction)**: Fitur otomatis seperti penataan ulang kurva ABC, penyusunan berdasarkan tinggi palet, dan penyatuan lorong rigid FIFO yang dilakukan di malam hari saat sistem tidak digunakan memastikan produktivitas gudang berada pada titik tertinggi keesokan harinya.
4.  **Border Database System**: Pemanfaatan Border DB ODBC meminimalkan risiko beban kerja database berlebih pada ERP utama dan meminimalkan risiko berhentinya operasional gudang apabila koneksi internet ke ERP pusat terputus (off-line buffer).

---

## 5. Analisis Kekurangan & Fitur yang Belum Terlihat
1.  **Teknologi Perangkat Mobile Usang (Legacy RF Terminals)**: Pada diagram jaringan, perangkat RF Terminal digambarkan masih menggunakan sistem operasi **Windows CE**. Sistem operasi ini telah dihentikan dukungannya (*End-of-Life*) oleh Microsoft. Hal ini membatasi modernisasi UI dan rentan terhadap celah keamanan baru.
2.  **Ketiadaan Analitik Berbasis AI / Machine Learning**: Meskipun sistem memiliki optimasi rute picking dan penataan ABC, sistem belum memanfaatkan kecerdasan buatan modern untuk analisis pemeliharaan prediktif (*Predictive Maintenance*) pada mesin otomatis (seperti mendeteksi getaran tidak normal pada Aisle Crane sebelum mengalami kerusakan) atau penataan slotting dinamis berbasis cuaca/musim (*Dynamic Slotting*).
3.  **Keterbatasan Visualisasi Visual 3D**: Visualisasi yang ditawarkan masih berupa peta grafis 2D. WMS otomasi masa kini umumnya membutuhkan visualisasi 3D real-time yang terintegrasi (Digital Twin berbasis WebGL/IoT) untuk mempermudah monitoring jarak jauh secara presisi.
4.  **Deployment Cloud / SaaS**: Arsitektur jaringan WMS-SAM tampaknya dirancang untuk deployment lokal secara penuh (*on-premises*). Ini membutuhkan investasi perangkat keras server lokal yang mahal dan mempersulit manajemen multi-gudang secara terpusat dibanding sistem berbasis cloud modern.

---

## 6. Kesimpulan Tingkat Kematangan Sistem (System Maturity Level)

Berdasarkan analisis fitur, integrasi kontrol otomatis, dan arsitektur data, tingkat kematangan WMS-SAM diklasifikasikan sebagai:

> [!IMPORTANT]
> **Tingkat Kematangan: Advanced WMS menuju Enterprise Smart Warehouse Platform**
> 
> WMS-SAM melampaui kategori *Basic WMS* karena kemampuannya yang mumpuni dalam mengendalikan perangkat keras otomatis pergudangan (PLC, Stacker Crane, AGV, EMS) secara native. Sistem ini memiliki algoritma optimasi internal (seperti *night compaction*). 
> 
> Namun, untuk dinobatkan sepenuhnya sebagai *Enterprise Smart Warehouse Platform* modern di era industri 4.0 saat ini, sistem ini memerlukan modernisasi teknologi pada aspek:
> *   Migrasi terminal genggam dari Windows CE ke Android (memanfaatkan teknologi modern seperti Flutter).
> *   Integrasi pemantauan berbasis IoT 3D (Digital Twin).
> *   Implementasi modul analitik prediktif berbasis kecerdasan buatan (AI/ML).

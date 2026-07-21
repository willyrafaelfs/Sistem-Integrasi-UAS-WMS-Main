# PANDUAN IMPLEMENTASI & GO-LIVE (AERO WMS)
*Dokumen Resmi Skema Pemasangan Sistem di Gudang Fisik (Shopfloor)*

---

## 1. Konsep Dasar Implementasi
Aero WMS dirancang dengan pendekatan **Decoupled Architecture** (Pemisahan Backend & Frontend) serta **Hardware Agnostic** (Tidak terikat perangkat keras khusus). Hal ini memungkinkan pabrik atau gudang kecil hingga besar untuk mengimplementasikan sistem ini dengan modal perangkat keras yang sangat minimal.

Sistem tidak mewajibkan penggunaan PDA Windows CE yang mahal (Zebra/Motorola), melainkan dapat berjalan mulus di *Smartphone* Android standar.

---

## 2. Kebutuhan Perangkat Keras (Hardware Requirements)

### A. Server Lokal (Untuk Ruang Admin/IT)
*   **PC/Laptop Standar**: Minimal Core i3 / AMD Ryzen 3, RAM 8GB.
*   **OS**: Windows 10/11, Linux (Ubuntu), atau macOS.
*   **Jaringan**: Router WiFi lokal (Intranet) agar perangkat HP di gudang bisa terhubung ke PC Server. Tidak wajib terhubung ke Internet jika hanya untuk operasional internal.

### B. Perangkat Operator (Lantai Gudang / Shopfloor)
*   **Smartphone Android**: Versi Android 9 ke atas (RAM 2GB sudah cukup).
*   **Kamera**: Resolusi standar (berfungsi sebagai pemindai barcode otomatis via PWA).
*   **Konektivitas**: Terhubung ke jaringan WiFi lokal yang memancarkan sinyal dari Router PC Server.

---

## 3. Langkah-Langkah Pemasangan (Setup Server)

Karena ini menggunakan Laravel & React, pemasangan di server lokal (*On-Premise*) sangat praktis:

### Langkah 3.1: Setup Backend (Brain & API)
1.  Siapkan aplikasi *web server* seperti **XAMPP**, **Laragon**, atau cukup gunakan PHP bawaan jika sudah terinstal.
2.  Buka terminal pada PC Server dan arahkan ke folder `backend`:
    ```bash
    cd d:\wms\backend
    ```
3.  Jalankan *database migration* (jika menggunakan database baru / MySQL / PostgreSQL):
    ```bash
    php artisan migrate:fresh --seed
    ```
4.  Jalankan server API lokal agar bisa diakses oleh perangkat lain di jaringan WiFi:
    ```bash
    # Ganti 0.0.0.0 agar API bisa ditembak oleh IP dari HP Operator
    php artisan serve --host=0.0.0.0 --port=8000
    ```
    *(Catat IP dari PC Server ini, misalnya `192.168.1.15`)*

### Langkah 3.2: Setup Frontend (Visual & Scanner)
1.  Buka terminal baru, arahkan ke folder `frontend`:
    ```bash
    cd d:\wms\frontend
    ```
2.  Buka file `vite.config.js` atau konfigurasi API, arahkan target proxy/URL API ke IP PC Server (contoh: `http://192.168.1.15:8000`).
3.  Jalankan server Frontend agar bisa diakses secara global di jaringan:
    ```bash
    npm run dev -- --host
    ```

---

## 4. Cara Setup di HP Operator (PWA Scanner)

Ini adalah fitur terbaik dari Aero WMS. Anda tidak perlu mem-build `.apk` atau mengunggah aplikasi ke Google PlayStore.

1.  Minta operator menyambungkan HP-nya ke jaringan WiFi gudang.
2.  Buka aplikasi **Google Chrome** di HP.
3.  Ketikkan alamat IP dari PC Server disusul dengan *port* frontend (Contoh: `http://192.168.1.15:5173/scanner`).
4.  Layar HP akan menampilkan UI Gelap (*Dark Mode*) khas perangkat industrial.
5.  Tekan menu titik tiga di pojok kanan atas Chrome, lalu pilih **"Add to Home Screen"** (Tambahkan ke Layar Utama).
6.  Selesai! Aplikasi Aero WMS Scanner kini muncul sebagai ikon di menu HP operator layaknya aplikasi biasa, lengkap dengan kemampuan *Full Screen* dan *Haptic Feedback* (getaran saat scan).

---

## 5. Flow Operasional Harian (SOP)

1.  **Kepala Gudang / Admin**: 
    Membuka `http://localhost:5173/` di PC Server. Dari sini admin dapat memantau **Digital Twin Map** (Melihat rak mana yang merah/penuh dan hijau/kosong) serta memantau pergerakan Inbound/Outbound.
2.  **Operator Forklift (Barang Masuk)**:
    Membuka aplikasi di HP, masuk ke menu Inbound. Melakukan *scan* barcode Lokasi Rak, dilanjut *scan* barcode palet. HP akan bergetar sukses dan barang langsung masuk ke sistem.
3.  **Operator Picking (Barang Keluar)**:
    Melihat instruksi pengeluaran (FIFO Pick List) yang disarankan oleh sistem berdasarkan rute terpendek, lalu mengambil barang sesuai urutan.
4.  **Sistem AI (Tengah Malam)**:
    Jika dipasang via *Cron Job* Server, setiap jam 12 malam fitur *Night Compaction* akan berjalan secara *invisible*, mengatur ulang posisi barang agar keesokan paginya ruang gudang kembali optimal secara pencatatan.

# AeroWMS — Warehouse Management System

Aplikasi **Warehouse Management System (WMS)** untuk mengelola gudang secara end-to-end: master data, inventori, inbound/putaway, outbound/picking, supply chain, fulfillment, hingga approval & audit log. Dilengkapi **login Google OAuth**, autentikasi berbasis token (Laravel Sanctum), dan **RBAC** (SuperAdmin / Manager / Operator).

> Tugas Individu UAS — Mata Kuliah Sistem Integrasi / Komputasi Awan.

---

## 🧱 Arsitektur & Teknologi

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Laravel 10 (PHP 8.1+), Laravel Sanctum, Laravel Socialite |
| **Frontend** | React 19 + Vite, React Router 7, lucide-react |
| **Database** | SQLite (default, zero-config) — mudah diganti MySQL |
| **Auth** | Google OAuth 2.0 (Socialite) + username/password, token Sanctum |

```
wms-main/
├── backend/     # REST API Laravel (port 8001)
│   ├── app/Http/Controllers/   # Auth, Warehouse, Inventory, SupplyChain, dll
│   ├── app/Models/             # Model Eloquent (UUID primary key)
│   ├── routes/api.php          # Definisi endpoint API
│   └── database/               # Migrations, seeders, database.sqlite
└── frontend/    # SPA React (port 5173)
    └── src/
        ├── pages/     # Dashboard, Inventory, Login, AuthCallback, dll
        ├── services/  # api.js (client REST)
        └── components/# Layout, Sidebar, Header
```

---

## ✨ Fitur Utama

- 🔐 **Autentikasi** — Login Google OAuth **dan** username/password, dengan RBAC 3 peran.
- 📦 **Master Data** — Gudang, lokasi (barcode bin), produk (import/export).
- 📥 **Inbound / Putaway** — Validasi lokasi via barcode & penempatan stok.
- 📤 **Outbound / Picking** — Generate picklist & eksekusi picking.
- 🔄 **Supply Chain** — Supplier & Purchase Order beserta status.
- 🚚 **Fulfillment** — Customer, Sales Order, Shipment/Delivery Order.
- 🗺️ **Digital Twin** — Peta gudang & night compaction.
- ✅ **Approvals & Audit** — Persetujuan transaksi, activity log, notifikasi.
- 📱 **Mobile Scanner** — Halaman khusus untuk operator (PWA-style).

---

## 🚀 Cara Menjalankan (Lokal)

### Prasyarat
- PHP **8.1+** & [Composer](https://getcomposer.org/)
- Node.js **18+** & npm

### 1. Backend (port 8001)

```bash
cd backend

# Install dependency
composer install

# Siapkan environment
cp .env.example .env
php artisan key:generate

# Siapkan database SQLite + data awal
# (Windows PowerShell: New-Item -ItemType File database/database.sqlite)
touch database/database.sqlite
php artisan migrate --seed

# Jalankan server di port 8001
php artisan serve --port=8001
```

### 2. Frontend (port 5173)

```bash
cd frontend
npm install
cp .env.example .env      # berisi VITE_API_BASE_URL=http://localhost:8001/api
npm run dev
```

Buka **http://localhost:5173**.

---

## 🔑 Konfigurasi Google OAuth

1. Buka [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Buat **OAuth Client ID** tipe *Web application*.
3. Tambahkan:
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:8001/api/auth/google/callback`
4. Salin **Client ID** & **Client Secret** ke `backend/.env`:

   ```env
   GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxx
   GOOGLE_REDIRECT_URI=http://localhost:8001/api/auth/google/callback
   ```

5. Jalankan `php artisan config:clear`, lalu klik **"Sign in with Google"** di halaman login.

### Alur OAuth
```
Frontend  →  GET /api/auth/google/redirect  →  Google Consent
   ↑                                                 │
   │                                                 ▼
/auth/callback?token=...  ←  GET /api/auth/google/callback (buat/link user + terbitkan token Sanctum)
```
User baru dari Google otomatis dibuat dengan peran **operator**; akun password lama akan ter-*link* ke Google-nya jika email cocok.

---

## 👤 Akun Demo (hasil seeder)

| Username | Password | Peran |
|----------|----------|-------|
| `superadmin` | `password` | SuperAdmin |
| `manager` | `password` | Manager |
| `operator` | `password` | Operator |

---

## 📡 Ringkasan Endpoint API

Base URL: `http://localhost:8001/api`

| Method | Endpoint | Keterangan |
|--------|----------|------------|
| `POST` | `/auth/login` | Login username/password |
| `GET`  | `/auth/google/redirect` | Mulai OAuth Google |
| `GET`  | `/auth/google/callback` | Callback OAuth Google |
| `POST` | `/auth/logout` | Logout (hapus token) |
| `GET`  | `/user` | Data user terautentikasi |
| `GET`  | `/warehouses`, `/products`, `/stocks` | Master data & inventori |
| `POST` | `/mobile/putaway/submit` | Putaway (inbound) |
| `POST` | `/outbound/execute-picking` | Picking (outbound) |
| `GET`  | `/purchase-orders`, `/sales-orders`, `/shipments` | Supply chain & fulfillment |
| `GET`  | `/approvals/pending`, `/activity-logs` | Approval & audit |

Semua route (kecuali login & OAuth) dilindungi middleware `auth:sanctum` + `role`.

---

## 🗒️ Catatan

- Database default **SQLite** (`backend/database/database.sqlite`). Untuk MySQL, ubah `DB_*` di `.env`.
- File `.env` dan `database.sqlite` **tidak** di-commit (lihat `.gitignore`) — gunakan `.env.example` sebagai acuan.
- Backend berjalan di port **8001**, frontend di **5173**.

-- ==============================================================================
-- WMS (Warehouse Management System) - PostgreSQL Core Schema
-- ==============================================================================

-- 1. Manajemen Akses & Pengguna
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'supervisor', 'operator')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Manajemen Gudang (Multi-Warehouse)
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL, -- Contoh: WH-JKT-01
    name VARCHAR(100) NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Manajemen Lokasi / Rak (Hierarchy)
CREATE TABLE locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
    barcode VARCHAR(50) UNIQUE NOT NULL, -- Kode barcode rak yang akan discan oleh kamera HP
    zone VARCHAR(20),  -- Contoh: Area A, Area B
    aisle VARCHAR(20), -- Lorong (Rak 12)
    tier VARCHAR(20),  -- Tingkat (Tingkat 3)
    bin VARCHAR(20),   -- Kotak/Bin (Bin A)
    max_weight_kg DECIMAL(10,2), -- Kapasitas maksimal berat di rak ini
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Katalog Master Barang (Products/SKU)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(50) UNIQUE, -- Barcode EAN/UPC/QR produk
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    uom VARCHAR(20) NOT NULL, -- Unit of Measure (pcs, box, pack, kg)
    weight_kg DECIMAL(10,2),
    safety_stock INTEGER DEFAULT 0, -- Peringatan stok minimum
    attributes JSONB, -- Fleksibilitas untuk warna, ukuran, dsb.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Posisi Stok Aktual (Real-time Inventory)
CREATE TABLE inventory_stocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    batch_number VARCHAR(50),
    expiry_date DATE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Memastikan tidak ada duplikasi data barang di lokasi dan batch yang sama
    UNIQUE(product_id, location_id, batch_number) 
);

-- 6. Riwayat Pergerakan Barang (Audit Trail / Ledger)
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(50) UNIQUE NOT NULL, -- TRX-IN-001
    type VARCHAR(20) NOT NULL CHECK (type IN ('INBOUND', 'OUTBOUND', 'TRANSFER', 'ADJUSTMENT', 'STOCK_TAKE')),
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    source_location_id UUID REFERENCES locations(id), -- Nullable jika barang baru masuk gudang
    destination_location_id UUID REFERENCES locations(id), -- Nullable jika barang keluar gudang
    quantity INTEGER NOT NULL,
    reference_document VARCHAR(100), -- Nomor PO / SO referensi
    operator_id UUID REFERENCES users(id), -- Siapa yang men-scan/memproses
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- INDEXES UNTUK OPTIMASI SCANNING (Pencarian Cepat)
-- ==============================================================================
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_locations_barcode ON locations(barcode);
CREATE INDEX idx_inventory_stocks_lookup ON inventory_stocks(product_id, location_id);

<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Warehouse;
use App\Models\Location;
use App\Models\Product;
use App\Models\InventoryStock;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Default Users for RBAC
        User::create([
            'id' => Str::uuid(),
            'username' => 'superadmin',
            'full_name' => 'System Administrator',
            'email' => 'admin@wms.local',
            'password' => Hash::make('password'),
            'role' => 'superadmin',
            'is_active' => true,
        ]);

        User::create([
            'id' => Str::uuid(),
            'username' => 'manager',
            'full_name' => 'Warehouse Manager',
            'email' => 'manager@wms.local',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'is_active' => true,
        ]);

        User::create([
            'id' => Str::uuid(),
            'username' => 'operator',
            'full_name' => 'Warehouse Operator',
            'email' => 'operator@wms.local',
            'password' => Hash::make('password'),
            'role' => 'operator',
            'is_active' => true,
        ]);

        // 2. Create Warehouse
        $warehouse = Warehouse::create([
            'id' => Str::uuid(),
            'code' => 'WH-JKT-01',
            'name' => 'Main Warehouse Jakarta',
            'address' => 'Jl. Logistik No. 1, Jakarta Pusat',
            'is_active' => true,
        ]);

        // 3. Create Locations
        $loc1 = Location::create([
            'id' => Str::uuid(),
            'warehouse_id' => $warehouse->id,
            'barcode' => 'LOC-A1-T1-B1',
            'zone' => 'Area A',
            'aisle' => 'A1',
            'tier' => 'T1',
            'bin' => 'B1',
            'max_weight_kg' => 500.00,
            'is_active' => true,
        ]);

        $loc2 = Location::create([
            'id' => Str::uuid(),
            'warehouse_id' => $warehouse->id,
            'barcode' => 'LOC-B2-T3-B2',
            'zone' => 'Area B',
            'aisle' => 'B2',
            'tier' => 'T3',
            'bin' => 'B2',
            'max_weight_kg' => 1000.00,
            'is_active' => true,
        ]);

        // 4. Create Products
        $prod1 = Product::create([
            'id' => Str::uuid(),
            'sku' => 'PRD-ELC-001',
            'barcode' => '899123456001',
            'name' => 'Logitech G Pro Wireless Mouse',
            'category' => 'Electronics',
            'uom' => 'pcs',
            'safety_stock' => 10,
        ]);

        $prod2 = Product::create([
            'id' => Str::uuid(),
            'sku' => 'PRD-APL-002',
            'barcode' => '899123456002',
            'name' => 'Mechanical Keyboard Keychron K2',
            'category' => 'Electronics',
            'uom' => 'pcs',
            'safety_stock' => 5,
        ]);

        // 5. Create Stock
        InventoryStock::create([
            'id' => Str::uuid(),
            'product_id' => $prod1->id,
            'location_id' => $loc1->id,
            'quantity' => 50,
        ]);

        InventoryStock::create([
            'id' => Str::uuid(),
            'product_id' => $prod2->id,
            'location_id' => $loc2->id,
            'quantity' => 20,
        ]);
    }
}

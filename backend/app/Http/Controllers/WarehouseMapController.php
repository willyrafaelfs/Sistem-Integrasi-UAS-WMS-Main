<?php

namespace App\Http\Controllers;

use App\Models\InventoryStock;
use App\Models\Location;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class WarehouseMapController extends Controller
{
    /**
     * Get warehouse map data for Digital Twin visualization.
     * Returns all locations with their stock status, zone, tier, and fill level.
     */
    public function getMapData()
    {
        $warehouses = Warehouse::all();
        $result = [];

        foreach ($warehouses as $warehouse) {
            $locations = Location::where('warehouse_id', $warehouse->id)
                ->where('is_active', true)
                ->with(['stocks.product'])
                ->get();

            $locationData = $locations->map(function ($loc) {
                $totalQty = $loc->stocks->sum('quantity');
                $products = $loc->stocks->where('quantity', '>', 0)->map(function ($s) {
                    return [
                        'sku' => $s->product->sku ?? 'N/A',
                        'name' => $s->product->name ?? 'Unknown',
                        'qty' => $s->quantity,
                        'uom' => $s->product->uom ?? 'pcs',
                    ];
                })->values();

                // Determine fill status
                $status = 'empty';
                if ($totalQty > 0 && $totalQty < 50) $status = 'partial';
                if ($totalQty >= 50) $status = 'full';

                return [
                    'id' => $loc->id,
                    'barcode' => $loc->barcode,
                    'name' => $loc->name,
                    'zone' => $loc->zone,
                    'tier' => $loc->tier,
                    'aisle' => $loc->aisle,
                    'bay' => $loc->bay,
                    'total_qty' => $totalQty,
                    'status' => $status,
                    'products' => $products,
                ];
            });

            $result[] = [
                'warehouse' => [
                    'id' => $warehouse->id,
                    'name' => $warehouse->name,
                    'code' => $warehouse->code,
                ],
                'locations' => $locationData,
                'summary' => [
                    'total' => $locationData->count(),
                    'empty' => $locationData->where('status', 'empty')->count(),
                    'partial' => $locationData->where('status', 'partial')->count(),
                    'full' => $locationData->where('status', 'full')->count(),
                ],
            ];
        }

        return response()->json($result);
    }

    /**
     * Trigger Night Compaction manually for demo/testing purposes.
     */
    public function triggerNightCompaction()
    {
        $command = new \App\Console\Commands\NightCompaction();
        $logs = $command->handle();

        return response()->json([
            'success' => true,
            'message' => 'Night Compaction selesai dijalankan.',
            'logs' => $logs,
        ]);
    }
}

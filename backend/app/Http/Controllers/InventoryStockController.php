<?php

namespace App\Http\Controllers;

use App\Models\InventoryStock;
use App\Models\Location;
use Illuminate\Http\Request;

class InventoryStockController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryStock::with(['product', 'location']);
        
        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }
        
        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        return response()->json($query->get());
    }

    public function show(InventoryStock $inventoryStock)
    {
        return response()->json($inventoryStock->load(['product', 'location']));
    }

    public function getByLocationBarcode($barcode)
    {
        $location = Location::where('barcode', $barcode)->firstOrFail();
        $stocks = InventoryStock::with('product')->where('location_id', $location->id)->get();
        
        return response()->json([
            'location' => $location,
            'stocks' => $stocks
        ]);
    }
}

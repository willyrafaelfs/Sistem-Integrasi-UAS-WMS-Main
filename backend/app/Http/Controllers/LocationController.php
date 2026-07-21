<?php

namespace App\Http\Controllers;

use App\Models\Location;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index(Request $request)
    {
        $query = Location::query();
        if ($request->has('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,id',
            'barcode' => 'required|string|unique:locations,barcode|max:50',
            'zone' => 'nullable|string|max:20',
            'aisle' => 'nullable|string|max:20',
            'tier' => 'nullable|string|max:20',
            'bin' => 'nullable|string|max:20',
            'max_weight_kg' => 'nullable|numeric',
        ]);

        $location = Location::create($validated);
        return response()->json($location, 201);
    }

    public function show(Location $location)
    {
        return response()->json($location->load('warehouse'));
    }

    public function update(Request $request, Location $location)
    {
        $validated = $request->validate([
            'warehouse_id' => 'exists:warehouses,id',
            'barcode' => 'string|max:50|unique:locations,barcode,' . $location->id,
            'zone' => 'nullable|string|max:20',
            'aisle' => 'nullable|string|max:20',
            'tier' => 'nullable|string|max:20',
            'bin' => 'nullable|string|max:20',
            'max_weight_kg' => 'nullable|numeric',
            'is_active' => 'boolean',
        ]);

        $location->update($validated);
        return response()->json($location);
    }

    public function destroy(Location $location)
    {
        $location->delete();
        return response()->json(null, 204);
    }

    // For Mobile App
    public function validateBarcode(Request $request)
    {
        $request->validate(['barcode' => 'required|string']);
        
        $location = Location::where('barcode', $request->barcode)
            ->where('is_active', true)
            ->first();

        if (!$location) {
            return response()->json(['valid' => false, 'message' => 'Lokasi tidak ditemukan atau tidak aktif'], 404);
        }

        return response()->json([
            'valid' => true,
            'location' => [
                'id' => $location->id,
                'name' => trim("{$location->zone} {$location->aisle} {$location->tier} {$location->bin}")
            ]
        ]);
    }
}

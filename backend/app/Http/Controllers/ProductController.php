<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::query();

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        // Filter by category (acting as ABC Class for now)
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Pagination
        $perPage = $request->input('per_page', 10);
        $products = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'sku' => 'required|string|unique:products,sku|max:50',
            'barcode' => 'nullable|string|unique:products,barcode|max:50',
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:50',
            'uom' => 'required|string|max:20',
            'weight_kg' => 'nullable|numeric',
            'safety_stock' => 'integer|min:0',
            'attributes' => 'nullable|array',
        ]);

        $product = Product::create($validated);
        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return response()->json($product);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'sku' => 'string|max:50|unique:products,sku,' . $product->id,
            'barcode' => 'nullable|string|max:50|unique:products,barcode,' . $product->id,
            'name' => 'string|max:200',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:50',
            'uom' => 'string|max:20',
            'weight_kg' => 'nullable|numeric',
            'safety_stock' => 'integer|min:0',
            'attributes' => 'nullable|array',
        ]);

        $product->update($validated);
        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(null, 204);
    }

    // EXPORT FEATURE
    public function export()
    {
        $products = Product::all();
        $csvData = "SKU,Nama Produk,Kategori (Class),UOM,Safety Stock\n";
        
        foreach ($products as $p) {
            $csvData .= "{$p->sku},\"{$p->name}\",{$p->category},{$p->uom},{$p->safety_stock}\n";
        }

        return Response::make($csvData, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="master_products.csv"',
        ]);
    }

    // IMPORT FEATURE (MOCK / BASIC)
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $file = $request->file('file');
        $content = file_get_contents($file->getRealPath());
        $lines = explode("\n", $content);
        $imported = 0;

        foreach ($lines as $index => $line) {
            if ($index === 0 || empty(trim($line))) continue; // Skip header or empty
            
            $data = str_getcsv($line);
            if (count($data) >= 5) {
                Product::updateOrCreate(
                    ['sku' => $data[0]],
                    [
                        'name' => $data[1],
                        'category' => $data[2],
                        'uom' => $data[3],
                        'safety_stock' => (int)$data[4],
                    ]
                );
                $imported++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "{$imported} produk berhasil di-import."
        ]);
    }
}


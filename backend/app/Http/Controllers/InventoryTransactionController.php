<?php

namespace App\Http\Controllers;

use App\Models\InventoryTransaction;
use App\Models\InventoryStock;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class InventoryTransactionController extends Controller
{
    public function putaway(Request $request)
    {
        $request->validate([
            'location_id' => 'required|exists:locations,id',
            'scanned_items' => 'required|array',
            'scanned_items.*.barcode' => 'required|string',
            'scanned_items.*.quantity' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            $transactionCode = 'TRX-IN-' . strtoupper(Str::random(8));
            $operatorId = $request->user()->id ?? null;

            foreach ($request->scanned_items as $item) {
                $product = Product::where('barcode', $item['barcode'])->first();
                if (!$product) {
                    throw new \Exception("Produk dengan barcode {$item['barcode']} tidak ditemukan.");
                }

                // Duplicate Transaction Prevention (Time-based for scanners)
                $duplicate = \App\Models\InventoryTransaction::where('type', 'INBOUND')
                    ->where('product_id', $product->id)
                    ->where('destination_location_id', $request->location_id)
                    ->where('quantity', $item['quantity'])
                    ->where('operator_id', $operatorId)
                    ->where('created_at', '>=', now()->subMinutes(1))
                    ->exists();
                
                if ($duplicate) {
                    throw new \Exception("Duplicate Scan Prevention: Anda baru saja men-scan {$product->sku} ({$item['quantity']} pcs) ke lokasi ini dalam 1 menit terakhir.");
                }

                // Create Transaction Log
                \App\Models\InventoryTransaction::create([
                    'transaction_code' => $transactionCode,
                    'type' => 'INBOUND',
                    'product_id' => $product->id,
                    'destination_location_id' => $request->location_id,
                    'quantity' => $item['quantity'],
                    'operator_id' => $operatorId,
                    'status' => 'PENDING'
                ]);

                // Create Notification for Approval
                \App\Models\Notification::create([
                    'title' => 'Receiving Approval Required',
                    'message' => "Inbound dari Auto-Gate (TRX: {$transactionCode}) butuh persetujuan masuk stok.",
                    'type' => 'APPROVAL_REQUIRED'
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Barang masuk ke Staging Area. Menunggu Approval Supervisor.',
                'transaction_code' => $transactionCode
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Generate a FIFO-optimized pick list for a given product & quantity.
     * Returns stock entries sorted by oldest first (FIFO) and location zone/tier for route optimization.
     */
    public function generatePickList(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($request->product_id);
        $requestedQty = $request->quantity;

        // FIFO: Get stocks ordered by creation date (oldest first), then by zone/tier for route optimization
        $stocks = InventoryStock::where('product_id', $product->id)
            ->where('quantity', '>', 0)
            ->with('location')
            ->orderBy('created_at', 'asc') // FIFO: oldest stock first
            ->get()
            ->sortBy(function ($stock) {
                // Route optimization: sort by zone then tier for shortest walking path
                return ($stock->location->zone ?? 'ZZZ') . '-' . str_pad(($stock->location->tier ?? 0), 3, '0', STR_PAD_LEFT);
            });

        $totalAvailable = $stocks->sum('quantity');
        if ($totalAvailable < $requestedQty) {
            return response()->json([
                'success' => false,
                'message' => "Stok tidak cukup. Diminta: {$requestedQty}, Tersedia: {$totalAvailable} {$product->uom}.",
                'available' => $totalAvailable,
            ], 400);
        }

        // Build pick list
        $pickList = [];
        $remaining = $requestedQty;

        foreach ($stocks as $stock) {
            if ($remaining <= 0) break;

            $pickQty = min($stock->quantity, $remaining);
            $pickList[] = [
                'stock_id' => $stock->id,
                'location_id' => $stock->location_id,
                'location_barcode' => $stock->location->barcode ?? 'N/A',
                'location_name' => $stock->location->name ?? 'N/A',
                'zone' => $stock->location->zone ?? 'N/A',
                'tier' => $stock->location->tier ?? '-',
                'available_qty' => $stock->quantity,
                'pick_qty' => $pickQty,
                'fifo_date' => $stock->created_at->toDateTimeString(),
            ];
            $remaining -= $pickQty;
        }

        return response()->json([
            'success' => true,
            'product' => [
                'id' => $product->id,
                'sku' => $product->sku,
                'name' => $product->name,
                'uom' => $product->uom,
            ],
            'requested_qty' => $requestedQty,
            'pick_list' => $pickList,
        ]);
    }

    /**
     * Execute the picking operation (Outbound).
     * Deducts stock atomically using FIFO and logs the transaction.
     */
    public function picking(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'pick_items' => 'required|array',
            'pick_items.*.stock_id' => 'required|exists:inventory_stocks,id',
            'pick_items.*.pick_qty' => 'required|integer|min:1',
            'reference_document' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $transactionCode = 'TRX-OUT-' . strtoupper(Str::random(8));
            $operatorId = $request->user()->id ?? null;
            $totalPicked = 0;

            foreach ($request->pick_items as $item) {
                // Duplicate Transaction Prevention
                $duplicate = \App\Models\InventoryTransaction::where('type', 'OUTBOUND')
                    ->where('product_id', $request->product_id)
                    ->where('quantity', $item['pick_qty'])
                    ->where('reference_document', $request->reference_document)
                    ->where('operator_id', $operatorId)
                    ->where('created_at', '>=', now()->subMinutes(1))
                    ->exists();

                if ($duplicate) {
                    throw new \Exception("Duplicate Picking Prevention: Anda baru saja memproses Outbound untuk produk ini dalam 1 menit terakhir.");
                }

                $stock = InventoryStock::with('location')->findOrFail($item['stock_id']);

                if ($stock->quantity < $item['pick_qty']) {
                    throw new \Exception(
                        "Stok di lokasi {$stock->location->barcode} tidak mencukupi. " .
                        "Diminta: {$item['pick_qty']}, Tersedia: {$stock->quantity}."
                    );
                }

                // Create Transaction Log
                \App\Models\InventoryTransaction::create([
                    'transaction_code' => $transactionCode,
                    'type' => 'OUTBOUND',
                    'product_id' => $request->product_id,
                    'source_location_id' => $stock->location_id,
                    'quantity' => $item['pick_qty'],
                    'reference_document' => $request->reference_document ?? null,
                    'operator_id' => $operatorId,
                    'status' => 'PENDING'
                ]);

                // Minta persetujuan pengeluaran
                \App\Models\Notification::create([
                    'title' => 'Outbound Approval Required',
                    'message' => "Picking selesai (TRX: {$transactionCode}). Menunggu otorisasi pengeluaran barang.",
                    'type' => 'APPROVAL_REQUIRED'
                ]);

                $totalPicked += $item['pick_qty'];
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Picking selesai. Barang di staging area menunggu Approval Pengeluaran.",
                'transaction_code' => $transactionCode,
                'total_picked' => $totalPicked,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    /**
     * Get transaction history (both inbound & outbound).
     */
    public function history(Request $request)
    {
        $transactions = InventoryTransaction::with(['product', 'sourceLocation', 'destinationLocation'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($transactions);
    }
}

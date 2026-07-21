<?php

namespace App\Http\Controllers;

use App\Models\InventoryTransaction;
use App\Models\InventoryStock;
use App\Models\ActivityLog;
use App\Models\Notification;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OperationalController extends Controller
{
    // ==========================================
    // NOTIFICATIONS & ALERTS
    // ==========================================
    public function getNotifications(Request $request)
    {
        $userId = $request->user()->id ?? null;
        $notifs = Notification::whereNull('user_id')
            ->orWhere('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();
        return response()->json($notifs);
    }

    public function markNotificationRead($id)
    {
        Notification::where('id', $id)->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }

    // ==========================================
    // ACTIVITY LOGS (AUDIT TRAIL)
    // ==========================================
    public function getActivityLogs(Request $request)
    {
        $logs = ActivityLog::with('user')->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($logs);
    }

    // ==========================================
    // APPROVAL WORKFLOW
    // ==========================================
    public function getPendingApprovals(Request $request)
    {
        $transactions = InventoryTransaction::with(['product', 'sourceLocation', 'destinationLocation'])
            ->where('status', 'PENDING')
            ->orderBy('created_at', 'asc')
            ->paginate($request->input('per_page', 50));
        return response()->json($transactions);
    }

    public function approveTransaction(Request $request, $id)
    {
        $request->validate(['status' => 'required|in:APPROVED,REJECTED', 'notes' => 'nullable|string']);
        
        try {
            DB::beginTransaction();
            $trx = InventoryTransaction::lockForUpdate()->findOrFail($id);
            if ($trx->status !== 'PENDING') throw new \Exception("Transaksi sudah diproses sebelumnya.");

            $trx->status = $request->status;
            $trx->approved_by = $request->user()->id ?? null;
            $trx->approved_at = now();
            $trx->approval_notes = $request->notes;
            $trx->save();

            // Eksekusi perpindahan fisik stok JIKA DI-APPROVE
            if ($request->status === 'APPROVED') {
                if ($trx->type === 'INBOUND' || $trx->type === 'RETURN' || $trx->type === 'ADJUSTMENT_UP') {
                    $stock = InventoryStock::where('product_id', $trx->product_id)
                        ->where('location_id', $trx->destination_location_id)
                        ->lockForUpdate()
                        ->first();
                        
                    if (!$stock) {
                        $stock = InventoryStock::create([
                            'product_id' => $trx->product_id, 
                            'location_id' => $trx->destination_location_id,
                            'quantity' => 0
                        ]);
                    }
                    $stock->quantity += $trx->quantity;
                    $stock->save();
                } 
                elseif ($trx->type === 'OUTBOUND' || $trx->type === 'ADJUSTMENT_DOWN') {
                    $stock = InventoryStock::where('product_id', $trx->product_id)
                        ->where('location_id', $trx->source_location_id)
                        ->lockForUpdate()
                        ->first();
                        
                    if (!$stock || $stock->quantity < $trx->quantity) throw new \Exception("Stok fisik tidak mencukupi untuk di-approve.");
                    $stock->quantity -= $trx->quantity;
                    $stock->save();
                }
                elseif ($trx->type === 'TRANSFER') {
                    // Kurangi dari source
                    $sourceStock = InventoryStock::where('product_id', $trx->product_id)
                        ->where('location_id', $trx->source_location_id)
                        ->lockForUpdate()
                        ->first();
                        
                    if (!$sourceStock || $sourceStock->quantity < $trx->quantity) throw new \Exception("Stok sumber tidak mencukupi.");
                    $sourceStock->quantity -= $trx->quantity;
                    $sourceStock->save();

                    // Tambah ke destination
                    $destStock = InventoryStock::where('product_id', $trx->product_id)
                        ->where('location_id', $trx->destination_location_id)
                        ->lockForUpdate()
                        ->first();
                        
                    if (!$destStock) {
                        $destStock = InventoryStock::create([
                            'product_id' => $trx->product_id, 
                            'location_id' => $trx->destination_location_id,
                            'quantity' => 0
                        ]);
                    }
                    $destStock->quantity += $trx->quantity;
                    $destStock->save();
                }

                // Check Safety Stock Alert (Peringatan Dini)
                $product = Product::find($trx->product_id);
                $totalStock = InventoryStock::where('product_id', $product->id)->sum('quantity');
                if ($totalStock < $product->safety_stock) {
                    Notification::create([
                        'title' => '🚨 Safety Stock Warning!',
                        'message' => "Stok {$product->name} (SKU: {$product->sku}) menyentuh batas kritis ({$totalStock} {$product->uom}). Minimal: {$product->safety_stock}.",
                        'type' => 'WARNING'
                    ]);
                }
            }

            // Create Audit Log
            ActivityLog::create([
                'user_id' => $request->user()->id ?? null,
                'action' => 'APPROVAL',
                'model_type' => 'InventoryTransaction',
                'model_id' => $trx->id,
                'description' => "Manager melakukan {$request->status} pada TRX {$trx->transaction_code}",
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => "Transaksi berhasil {$request->status}"]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    // ==========================================
    // MANUAL TRANSACTIONS (ADJUST, TRANSFER, RETURN)
    // ==========================================
    public function submitManualTransaction(Request $request)
    {
        $request->validate([
            'type' => 'required|in:ADJUSTMENT_UP,ADJUSTMENT_DOWN,TRANSFER,RETURN',
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'source_location_id' => 'nullable|exists:locations,id',
            'destination_location_id' => 'nullable|exists:locations,id',
            'notes' => 'required|string'
        ]);

        try {
            DB::beginTransaction();

            $code = 'TRX-' . substr($request->type, 0, 3) . '-' . strtoupper(\Str::random(6));
            
            $trx = InventoryTransaction::create([
                'transaction_code' => $code,
                'type' => $request->type,
                'product_id' => $request->product_id,
                'source_location_id' => $request->source_location_id,
                'destination_location_id' => $request->destination_location_id,
                'quantity' => $request->quantity,
                'notes' => $request->notes,
                'operator_id' => $request->user()->id ?? null,
                'status' => 'PENDING', // WAJIB APPROVAL
            ]);

            Notification::create([
                'title' => 'Menunggu Approval',
                'message' => "Transaksi {$request->type} ($code) membutuhkan approval manajer.",
                'type' => 'APPROVAL_REQUIRED'
            ]);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Transaksi diajukan, menunggu Approval.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}

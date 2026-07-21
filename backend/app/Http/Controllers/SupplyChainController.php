<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SupplyChainController extends Controller
{
    // ========================
    // SUPPLIER CRUD
    // ========================
    public function supplierIndex(Request $request)
    {
        $query = Supplier::query();
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%$s%")->orWhere('code', 'like', "%$s%");
            });
        }
        return response()->json($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 10)));
    }

    public function supplierStore(Request $request)
    {
        $v = $request->validate([
            'code' => 'required|string|unique:suppliers,code|max:50',
            'name' => 'required|string|max:200',
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
        ]);
        return response()->json(Supplier::create($v), 201);
    }

    public function supplierUpdate(Request $request, Supplier $supplier)
    {
        $v = $request->validate([
            'name' => 'string|max:200',
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
        ]);
        $supplier->update($v);
        return response()->json($supplier);
    }

    public function supplierDestroy(Supplier $supplier)
    {
        $supplier->delete();
        return response()->json(null, 204);
    }

    // ========================
    // PURCHASE ORDER CRUD
    // ========================
    public function poIndex(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'items.product']);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('po_number', 'like', "%$s%");
            });
        }
        return response()->json($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 10)));
    }

    public function poStore(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_arrival' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.ordered_qty' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $po = PurchaseOrder::create([
            'po_number' => 'PO-' . strtoupper(Str::random(8)),
            'supplier_id' => $request->supplier_id,
            'order_date' => $request->order_date,
            'expected_arrival' => $request->expected_arrival,
            'status' => 'CONFIRMED',
            'notes' => $request->notes,
        ]);

        foreach ($request->items as $item) {
            PurchaseOrderItem::create([
                'po_id' => $po->id,
                'product_id' => $item['product_id'],
                'ordered_qty' => $item['ordered_qty'],
            ]);
        }

        return response()->json($po->load(['supplier', 'items.product']), 201);
    }

    public function poShow(PurchaseOrder $po)
    {
        return response()->json($po->load(['supplier', 'items.product']));
    }

    public function poUpdateStatus(Request $request, PurchaseOrder $po)
    {
        $request->validate(['status' => 'required|in:DRAFT,CONFIRMED,RECEIVING,COMPLETED,CANCELLED']);
        $po->update(['status' => $request->status]);
        return response()->json($po);
    }
}

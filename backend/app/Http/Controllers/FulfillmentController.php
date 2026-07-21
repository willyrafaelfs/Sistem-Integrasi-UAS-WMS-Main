<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\Shipment;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class FulfillmentController extends Controller
{
    // ========================
    // CUSTOMER CRUD
    // ========================
    public function customerIndex(Request $request)
    {
        $query = Customer::query();
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%$s%")->orWhere('code', 'like', "%$s%");
            });
        }
        return response()->json($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 10)));
    }

    public function customerStore(Request $request)
    {
        $v = $request->validate([
            'code' => 'required|string|unique:customers,code|max:50',
            'name' => 'required|string|max:200',
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
        ]);
        return response()->json(Customer::create($v), 201);
    }

    public function customerUpdate(Request $request, Customer $customer)
    {
        $v = $request->validate([
            'name' => 'string|max:200',
            'contact_person' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:30',
            'email' => 'nullable|email|max:100',
            'address' => 'nullable|string',
        ]);
        $customer->update($v);
        return response()->json($customer);
    }

    public function customerDestroy(Customer $customer)
    {
        $customer->delete();
        return response()->json(null, 204);
    }

    // ========================
    // SALES ORDER (SO)
    // ========================
    public function soIndex(Request $request)
    {
        $query = SalesOrder::with(['customer', 'items.product']);
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('so_number', 'like', "%$s%");
            });
        }
        return response()->json($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 10)));
    }

    public function soStore(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'order_date' => 'required|date',
            'ship_by_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.ordered_qty' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $so = SalesOrder::create([
            'so_number' => 'SO-' . strtoupper(Str::random(8)),
            'customer_id' => $request->customer_id,
            'order_date' => $request->order_date,
            'ship_by_date' => $request->ship_by_date,
            'status' => 'CONFIRMED',
            'notes' => $request->notes,
        ]);

        foreach ($request->items as $item) {
            SalesOrderItem::create([
                'so_id' => $so->id,
                'product_id' => $item['product_id'],
                'ordered_qty' => $item['ordered_qty'],
            ]);
        }

        return response()->json($so->load(['customer', 'items.product']), 201);
    }

    public function soShow(SalesOrder $so)
    {
        return response()->json($so->load(['customer', 'items.product', 'shipments']));
    }

    public function soUpdateStatus(Request $request, SalesOrder $so)
    {
        $request->validate(['status' => 'required|in:DRAFT,CONFIRMED,PICKING,PACKING,SHIPPED,COMPLETED,CANCELLED']);
        $so->update(['status' => $request->status]);
        return response()->json($so);
    }

    // ========================
    // SHIPMENT / DELIVERY ORDER
    // ========================
    public function shipmentIndex(Request $request)
    {
        $query = Shipment::with(['salesOrder', 'customer']);
        if ($request->filled('status')) $query->where('status', $request->status);
        return response()->json($query->orderBy('created_at', 'desc')->paginate($request->input('per_page', 10)));
    }

    public function shipmentStore(Request $request)
    {
        $request->validate([
            'so_id' => 'required|exists:sales_orders,id',
            'carrier' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $so = SalesOrder::with('customer')->findOrFail($request->so_id);

        // Duplicate Shipment Prevention
        $existingShipment = Shipment::where('so_id', $so->id)->exists();
        if ($existingShipment) {
            return response()->json([
                'success' => false, 
                'message' => "Duplicate Shipment Prevention: Sales Order ini sudah memiliki Surat Jalan / Delivery Order."
            ], 422);
        }

        $shipment = Shipment::create([
            'do_number' => 'DO-' . strtoupper(Str::random(8)),
            'so_id' => $so->id,
            'customer_id' => $so->customer_id,
            'status' => 'PACKING',
            'carrier' => $request->carrier,
            'notes' => $request->notes,
        ]);

        // Update SO status
        $so->update(['status' => 'PACKING']);

        return response()->json($shipment->load(['salesOrder', 'customer']), 201);
    }

    public function shipmentUpdateStatus(Request $request, Shipment $shipment)
    {
        $request->validate(['status' => 'required|in:PACKING,READY,DISPATCHED,DELIVERED']);

        $shipment->update([
            'status' => $request->status,
            'dispatched_at' => $request->status === 'DISPATCHED' ? now() : $shipment->dispatched_at,
            'delivered_at' => $request->status === 'DELIVERED' ? now() : $shipment->delivered_at,
        ]);

        // If delivered, mark SO as completed
        if ($request->status === 'DELIVERED') {
            $shipment->salesOrder->update(['status' => 'COMPLETED']);
        }
        if ($request->status === 'DISPATCHED') {
            $shipment->salesOrder->update(['status' => 'SHIPPED']);
        }

        return response()->json($shipment->load(['salesOrder', 'customer']));
    }
}

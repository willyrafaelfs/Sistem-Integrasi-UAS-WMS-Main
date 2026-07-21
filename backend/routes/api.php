<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\WarehouseController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\InventoryStockController;
use App\Http\Controllers\InventoryTransactionController;
use App\Http\Controllers\WarehouseMapController;
use App\Http\Controllers\SupplyChainController;
use App\Http\Controllers\FulfillmentController;
use App\Http\Controllers\OperationalController;

// Public Auth Routes
Route::post('/auth/login', [AuthController::class, 'login']);

// Google OAuth (Laravel Socialite)
Route::get('/auth/google/redirect', [AuthController::class, 'googleRedirect']);
Route::get('/auth/google/callback', [AuthController::class, 'googleCallback']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    // =====================================
    // ROLE: SUPERADMIN & MANAGER
    // =====================================
    Route::middleware('role:superadmin,manager')->group(function () {
        // Master Data
        Route::apiResource('warehouses', WarehouseController::class);
        Route::apiResource('locations', LocationController::class);
        Route::post('products/import', [ProductController::class, 'import']);
        Route::get('products/export', [ProductController::class, 'export']);
        Route::apiResource('products', ProductController::class);

        // Supply Chain & Fulfillment
        Route::get('/suppliers', [SupplyChainController::class, 'supplierIndex']);
        Route::post('/suppliers', [SupplyChainController::class, 'supplierStore']);
        Route::put('/suppliers/{supplier}', [SupplyChainController::class, 'supplierUpdate']);
        Route::delete('/suppliers/{supplier}', [SupplyChainController::class, 'supplierDestroy']);

        Route::get('/purchase-orders', [SupplyChainController::class, 'poIndex']);
        Route::post('/purchase-orders', [SupplyChainController::class, 'poStore']);
        Route::get('/purchase-orders/{po}', [SupplyChainController::class, 'poShow']);
        Route::put('/purchase-orders/{po}/status', [SupplyChainController::class, 'poUpdateStatus']);

        Route::get('/customers', [FulfillmentController::class, 'customerIndex']);
        Route::post('/customers', [FulfillmentController::class, 'customerStore']);
        Route::put('/customers/{customer}', [FulfillmentController::class, 'customerUpdate']);
        Route::delete('/customers/{customer}', [FulfillmentController::class, 'customerDestroy']);

        Route::get('/sales-orders', [FulfillmentController::class, 'soIndex']);
        Route::post('/sales-orders', [FulfillmentController::class, 'soStore']);
        Route::get('/sales-orders/{so}', [FulfillmentController::class, 'soShow']);
        Route::put('/sales-orders/{so}/status', [FulfillmentController::class, 'soUpdateStatus']);
        
        Route::get('/shipments', [FulfillmentController::class, 'shipmentIndex']);
        Route::post('/shipments', [FulfillmentController::class, 'shipmentStore']);
        Route::put('/shipments/{shipment}/status', [FulfillmentController::class, 'shipmentUpdateStatus']);

        // Approvals & Audit Logs
        Route::get('/approvals/pending', [OperationalController::class, 'getPendingApprovals']);
        Route::post('/approvals/{id}/process', [OperationalController::class, 'approveTransaction']);
        Route::get('/activity-logs', [OperationalController::class, 'getActivityLogs']);
    });

    // =====================================
    // ALL ROLES (Admin, Manager, Operator)
    // =====================================
    Route::get('/stocks', [InventoryStockController::class, 'index']);
    Route::get('/stocks/{stock}', [InventoryStockController::class, 'show']);
    Route::get('/stocks/location/{barcode}', [InventoryStockController::class, 'getByLocationBarcode']);
    
    Route::get('/transactions/history', [InventoryTransactionController::class, 'history']);
    Route::get('/warehouse-map', [WarehouseMapController::class, 'getMapData']);
    Route::post('/night-compaction/trigger', [WarehouseMapController::class, 'triggerNightCompaction']);

    // Operator Operations
    Route::post('/mobile/putaway/validate-location', [LocationController::class, 'validateBarcode']);
    Route::post('/mobile/putaway/submit', [InventoryTransactionController::class, 'putaway']);
    Route::post('/outbound/generate-picklist', [InventoryTransactionController::class, 'generatePickList']);
    Route::post('/outbound/execute-picking', [InventoryTransactionController::class, 'picking']);
    Route::post('/transactions/manual', [OperationalController::class, 'submitManualTransaction']);

    // Notifications
    Route::get('/notifications', [OperationalController::class, 'getNotifications']);
    Route::put('/notifications/{id}/read', [OperationalController::class, 'markNotificationRead']);
});

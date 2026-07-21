<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Suppliers
        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 200);
            $table->string('contact_person', 100)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Customers
        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 200);
            $table->string('contact_person', 100)->nullable();
            $table->string('phone', 30)->nullable();
            $table->string('email', 100)->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Purchase Orders
        Schema::create('purchase_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('po_number', 50)->unique();
            $table->foreignUuid('supplier_id')->constrained('suppliers');
            $table->date('order_date');
            $table->date('expected_arrival')->nullable();
            $table->enum('status', ['DRAFT', 'CONFIRMED', 'RECEIVING', 'COMPLETED', 'CANCELLED'])->default('DRAFT');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('po_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->integer('ordered_qty');
            $table->integer('received_qty')->default(0);
            $table->timestamps();
        });

        // Sales Orders (for Outbound/Shipping flow)
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('so_number', 50)->unique();
            $table->foreignUuid('customer_id')->constrained('customers');
            $table->date('order_date');
            $table->date('ship_by_date')->nullable();
            $table->enum('status', ['DRAFT', 'CONFIRMED', 'PICKING', 'PACKING', 'SHIPPED', 'COMPLETED', 'CANCELLED'])->default('DRAFT');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('sales_order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('so_id')->constrained('sales_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products');
            $table->integer('ordered_qty');
            $table->integer('picked_qty')->default(0);
            $table->integer('packed_qty')->default(0);
            $table->integer('shipped_qty')->default(0);
            $table->timestamps();
        });

        // Shipments / Delivery Orders
        Schema::create('shipments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('do_number', 50)->unique(); // Delivery Order number
            $table->foreignUuid('so_id')->constrained('sales_orders');
            $table->foreignUuid('customer_id')->constrained('customers');
            $table->enum('status', ['PACKING', 'READY', 'DISPATCHED', 'DELIVERED'])->default('PACKING');
            $table->string('carrier', 100)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->timestamp('dispatched_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('sales_order_items');
        Schema::dropIfExists('sales_orders');
        Schema::dropIfExists('purchase_order_items');
        Schema::dropIfExists('purchase_orders');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('suppliers');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * PERFORMANCE PATCH: Database Indexes
     * 
     * Menambahkan indeks pada kolom yang sering di-query/sort
     * untuk mencegah Full Table Scan pada volume data besar (>100K rows).
     */
    public function up(): void
    {
        // Index pada inventory_transactions
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->index('status', 'idx_trx_status');
            $table->index('type', 'idx_trx_type');
            $table->index('created_at', 'idx_trx_created_at');
            $table->index(['type', 'product_id', 'created_at'], 'idx_trx_duplicate_check');
            $table->index(['product_id', 'status'], 'idx_trx_product_status');
        });

        // Index pada activity_logs
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->index('created_at', 'idx_log_created_at');
            $table->index('action', 'idx_log_action');
            $table->index(['user_id', 'created_at'], 'idx_log_user_time');
        });

        // Index pada notifications
        Schema::table('notifications', function (Blueprint $table) {
            $table->index('is_read', 'idx_notif_read');
            $table->index(['user_id', 'is_read'], 'idx_notif_user_read');
            $table->index('created_at', 'idx_notif_created_at');
        });

        // Index pada inventory_stocks
        Schema::table('inventory_stocks', function (Blueprint $table) {
            $table->index(['product_id', 'location_id'], 'idx_stock_product_location');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropIndex('idx_trx_status');
            $table->dropIndex('idx_trx_type');
            $table->dropIndex('idx_trx_created_at');
            $table->dropIndex('idx_trx_duplicate_check');
            $table->dropIndex('idx_trx_product_status');
        });

        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropIndex('idx_log_created_at');
            $table->dropIndex('idx_log_action');
            $table->dropIndex('idx_log_user_time');
        });

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropIndex('idx_notif_read');
            $table->dropIndex('idx_notif_user_read');
            $table->dropIndex('idx_notif_created_at');
        });

        Schema::table('inventory_stocks', function (Blueprint $table) {
            $table->dropIndex('idx_stock_product_location');
        });
    }
};

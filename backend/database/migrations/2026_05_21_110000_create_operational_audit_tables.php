<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Audit Trail / Activity Log
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 50); // CREATE, UPDATE, DELETE, LOGIN, LOGOUT
            $table->string('model_type', 100)->nullable(); // e.g. Product, Location
            $table->uuid('model_id')->nullable();
            $table->text('description');
            $table->jsonb('old_data')->nullable();
            $table->jsonb('new_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        // 2. In-App Notifications
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete(); // null = broadcast to all admins
            $table->string('title');
            $table->text('message');
            $table->string('type', 50); // ALERT, WARNING, APPROVAL_REQUIRED, INFO
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });

        // 3. Update Inventory Transactions for Approval Workflow
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('APPROVED')->after('type');
            $table->foreignUuid('approved_by')->nullable()->constrained('users')->after('operator_id');
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->text('approval_notes')->nullable()->after('approved_at');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropColumn(['status', 'approved_by', 'approved_at', 'approval_notes']);
        });
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('activity_logs');
    }
};

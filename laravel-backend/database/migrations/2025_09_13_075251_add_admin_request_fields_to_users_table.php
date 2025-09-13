<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('admin_request_pending')->default(false)->after('approved_by_owner_id');
            $table->text('admin_request_reason')->nullable()->after('admin_request_pending');
            $table->timestamp('admin_request_at')->nullable()->after('admin_request_reason');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['admin_request_pending', 'admin_request_reason', 'admin_request_at']);
        });
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // SQLite compatible: Add new columns first
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_admin_approved')->default(false)->after('is_verified');
            $table->timestamp('admin_approved_at')->nullable()->after('is_admin_approved');
            $table->unsignedBigInteger('approved_by_owner_id')->nullable()->after('admin_approved_at');
            
            // Foreign key to track which owner approved this admin
            $table->foreign('approved_by_owner_id')->references('id')->on('users')->onDelete('set null');
        });
        
        // Update existing roles: buyer -> user, seller -> user (all become regular users by default)
        DB::table('users')->where('role', 'buyer')->update(['role' => 'user']);
        DB::table('users')->where('role', 'seller')->update(['role' => 'user']);
        
        // For SQLite, we'll handle role validation in the application layer
        // rather than database constraints since SQLite doesn't support ENUM modifications
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['approved_by_owner_id']);
            $table->dropColumn(['is_admin_approved', 'admin_approved_at', 'approved_by_owner_id']);
        });
        
        // Update roles back to original values for compatibility
        DB::table('users')->where('role', 'user')->update(['role' => 'buyer']);
    }
};
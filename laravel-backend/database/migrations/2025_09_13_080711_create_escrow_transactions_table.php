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
        Schema::create('escrow_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buyer_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->decimal('amount', 15, 2); // Transaction amount
            $table->enum('status', ['pending', 'active', 'completed', 'disputed', 'cancelled'])->default('pending');
            $table->enum('ai_status', ['processing', 'approved', 'flagged', 'manual_review'])->default('processing');
            $table->integer('risk_score')->default(0); // 0-100 risk score
            $table->json('ai_decision')->nullable(); // AI analysis result
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('admin_note')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('completed_at')->nullable();
            $table->text('completion_note')->nullable();
            $table->timestamps();

            // Indexes for better performance
            $table->index(['buyer_id', 'status']);
            $table->index(['seller_id', 'status']);
            $table->index(['status', 'ai_status']);
            $table->index(['created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('escrow_transactions');
    }
};
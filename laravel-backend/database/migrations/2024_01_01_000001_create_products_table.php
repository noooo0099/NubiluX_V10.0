<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->enum('category', ['mobile_legends', 'pubg', 'free_fire', 'valorant', 'genshin', 'minecraft', 'other']);
            $table->decimal('price', 10, 2);
            $table->string('thumbnail')->nullable();
            $table->json('images')->nullable();
            $table->json('game_data')->nullable();
            $table->enum('status', ['active', 'sold', 'pending', 'inactive'])->default('active');
            $table->boolean('is_premium')->default(false);
            $table->decimal('rating', 3, 2)->default(0.00);
            $table->integer('review_count')->default(0);
            $table->integer('views')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
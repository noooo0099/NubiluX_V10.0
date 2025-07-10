<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Product;
use App\Models\StatusUpdate;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create test users
        $gamer = User::create([
            'username' => 'gamer123',
            'name' => 'Pro Gamer',
            'email' => 'gamer@example.com',
            'password' => bcrypt('password123'),
            'display_name' => 'Pro Gamer',
            'role' => 'seller',
            'wallet_balance' => 50000,
            'is_verified' => true,
        ]);

        $buyer = User::create([
            'username' => 'buyer001',
            'name' => 'Gaming Enthusiast',
            'email' => 'buyer@example.com',
            'password' => bcrypt('password123'),
            'display_name' => 'Gaming Enthusiast',
            'role' => 'buyer',
            'wallet_balance' => 25000,
        ]);

        // Create sample products
        Product::create([
            'seller_id' => $gamer->id,
            'title' => 'ML Mythic Account - 50 Skins',
            'description' => 'Akun Mobile Legends rank Mythic dengan 50+ skin hero premium. Semua hero sudah unlock.',
            'category' => 'MOBA',
            'price' => 150000,
            'thumbnail' => 'https://via.placeholder.com/300x200',
            'images' => ['https://via.placeholder.com/600x400'],
            'game_data' => [
                'rank' => 'Mythic',
                'level' => 45,
                'heroes' => 50,
                'skins' => 53
            ],
            'is_premium' => true,
            'rating' => 4.8
        ]);

        Product::create([
            'seller_id' => $gamer->id,
            'title' => 'PUBG Mobile Conqueror Account',
            'description' => 'Akun PUBG Mobile rank Conqueror season ini. Banyak outfit rare dan weapon skin.',
            'category' => 'Battle Royale',
            'price' => 200000,
            'thumbnail' => 'https://via.placeholder.com/300x200',
            'game_data' => [
                'rank' => 'Conqueror',
                'tier_points' => 4500,
                'outfits' => 25,
                'weapon_skins' => 15
            ],
            'rating' => 4.9
        ]);

        // Create sample status update
        StatusUpdate::create([
            'user_id' => $gamer->id,
            'content' => 'Baru saja mendapat savage di ranked match! 🔥',
            'expires_at' => now()->addHours(24),
        ]);
    }
}

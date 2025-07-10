<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Product;
use App\Models\StatusUpdate;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create users
        $users = [
            [
                'username' => 'admin',
                'email' => 'admin@nubiluxchange.com',
                'password' => Hash::make('admin123'),
                'display_name' => 'Admin NXE',
                'bio' => 'Administrator NubiluXchange',
                'role' => 'seller',
                'is_verified' => true,
                'wallet_balance' => 0.00,
            ],
            [
                'username' => 'gamer_pro',
                'email' => 'gamer@example.com',
                'password' => Hash::make('password123'),
                'display_name' => 'Pro Gamer',
                'bio' => 'Jual akun game terpercaya dengan rating tinggi',
                'role' => 'seller',
                'is_verified' => true,
                'wallet_balance' => 2500000.00,
            ],
            [
                'username' => 'ml_legend',
                'email' => 'mllegend@example.com',
                'password' => Hash::make('password123'),
                'display_name' => 'ML Legend',
                'bio' => 'Spesialis akun Mobile Legends rank Mythical Glory',
                'role' => 'seller',
                'is_verified' => false,
                'wallet_balance' => 1800000.00,
            ],
            [
                'username' => 'buyer123',
                'email' => 'buyer@example.com',
                'password' => Hash::make('password123'),
                'display_name' => 'Gaming Enthusiast',
                'bio' => 'Suka koleksi akun game berkualitas',
                'role' => 'buyer',
                'is_verified' => false,
                'wallet_balance' => 500000.00,
            ]
        ];

        foreach ($users as $userData) {
            User::create($userData);
        }

        // Create products
        $products = [
            [
                'seller_id' => 2,
                'title' => 'Mobile Legends Mythical Glory - 850 Diamonds',
                'description' => 'Akun Mobile Legends dengan rank Mythical Glory 600+ poin. Sudah memiliki 850 diamonds dan 15+ skin epic. Hero lengkap dengan build emblem sempurna.',
                'category' => 'mobile_legends',
                'price' => 750000.00,
                'thumbnail' => 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
                'images' => [
                    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400',
                    'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400'
                ],
                'game_data' => [
                    'rank' => 'Mythical Glory',
                    'points' => 650,
                    'diamonds' => 850,
                    'skins' => 15,
                    'heroes' => 'All Heroes Unlocked'
                ],
                'status' => 'active',
                'is_premium' => true,
                'rating' => 4.8,
                'review_count' => 24,
                'views' => 156,
            ],
            [
                'seller_id' => 3,
                'title' => 'PUBG Mobile Conqueror Season 30',
                'description' => 'Akun PUBG Mobile rank Conqueror dengan KD ratio 4.2. Banyak skin rare dan senjata upgrade max level.',
                'category' => 'pubg',
                'price' => 950000.00,
                'thumbnail' => 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400',
                'images' => [
                    'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400'
                ],
                'game_data' => [
                    'rank' => 'Conqueror',
                    'kd_ratio' => 4.2,
                    'tier_points' => 4850,
                    'skins' => 'Mythic + Legendary skins',
                    'level' => 85
                ],
                'status' => 'active',
                'is_premium' => true,
                'rating' => 4.9,
                'review_count' => 18,
                'views' => 203,
            ],
            [
                'seller_id' => 2,
                'title' => 'Free Fire Grandmaster + Diamond 12000',
                'description' => 'Akun Free Fire rank Grandmaster dengan 12000 diamond. Koleksi bundle lengkap dan pet legendary.',
                'category' => 'free_fire',
                'price' => 650000.00,
                'thumbnail' => 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400',
                'images' => [
                    'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400'
                ],
                'game_data' => [
                    'rank' => 'Grandmaster',
                    'diamonds' => 12000,
                    'level' => 76,
                    'pets' => 'All Legendary Pets',
                    'bundles' => 25
                ],
                'status' => 'active',
                'is_premium' => false,
                'rating' => 4.6,
                'review_count' => 31,
                'views' => 89,
            ]
        ];

        foreach ($products as $productData) {
            Product::create($productData);
        }

        // Create status updates
        $statusUpdates = [
            [
                'user_id' => 2,
                'content' => 'Just got Mythical Glory! Selling this beast account 🔥',
                'expires_at' => Carbon::now()->addHours(24),
                'is_active' => true,
            ],
            [
                'user_id' => 3,
                'content' => 'New PUBG Conqueror account available! Limited time offer',
                'expires_at' => Carbon::now()->addHours(20),
                'is_active' => true,
            ],
            [
                'user_id' => 1,
                'content' => 'Welcome to NubiluXchange! Marketplace gaming terpercaya 🎮',
                'expires_at' => Carbon::now()->addHours(48),
                'is_active' => true,
            ]
        ];

        foreach ($statusUpdates as $statusData) {
            StatusUpdate::create($statusData);
        }
    }
}
#!/bin/bash

echo "🎮 NubiluXchange Laravel Setup Script"
echo "====================================="

# Check if composer is installed
if ! command -v composer &> /dev/null; then
    echo "❌ Composer tidak ditemukan. Install Composer terlebih dahulu."
    echo "   Download: https://getcomposer.org/download/"
    exit 1
fi

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo "❌ PHP tidak ditemukan. Install PHP 8.2+ atau XAMPP."
    exit 1
fi

echo "📦 Installing Laravel dependencies..."
composer install

echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "⚠️  .env already exists, skipping..."
fi

echo "🔑 Generating application key..."
php artisan key:generate

echo "📋 Laravel setup completed!"
echo ""
echo "Next steps:"
echo "1. Buka XAMPP dan jalankan Apache + MySQL"
echo "2. Buka phpMyAdmin (http://localhost/phpmyadmin)"
echo "3. Buat database 'nubiluxchange'"
echo "4. Edit .env file dengan kredensial database"
echo "5. Jalankan: php artisan migrate --seed"
echo "6. Jalankan: php artisan serve --port=8000"
echo ""
echo "🚀 Happy coding with Laravel + XAMPP!"
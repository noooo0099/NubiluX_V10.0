#!/bin/bash

echo "🎮 Starting NubiluXchange Laravel Backend..."

# Navigate to Laravel directory
cd laravel-backend

# Check if database exists, if not create and migrate
if [ ! -f database/database.sqlite ]; then
    echo "📦 Setting up database..."
    touch database/database.sqlite
    php artisan migrate --force
    php artisan db:seed
fi

# Start Laravel development server
echo "🚀 Starting Laravel server on port 8000..."
php artisan serve --host=0.0.0.0 --port=8000
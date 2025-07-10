# 🎮 Panduan Setup NubiluXchange dengan Laravel + XAMPP

## 📋 Overview

NubiluXchange telah berhasil dimigrasikan dari Node.js ke Laravel/PHP untuk kemudahan development menggunakan XAMPP dan phpMyAdmin. Panduan ini akan membantu Anda setup lengkap dalam lingkungan yang familiar.

## 🛠️ Requirements

- **XAMPP** (PHP 8.2+, MySQL, Apache)
- **Composer** (PHP package manager)
- **Node.js** (untuk frontend React)

## 📦 Step 1: Install XAMPP

1. Download XAMPP dari: https://www.apachefriends.org/
2. Install dengan semua komponen (Apache, MySQL, PHP, phpMyAdmin)
3. Jalankan XAMPP Control Panel
4. Start **Apache** dan **MySQL**

## 🗄️ Step 2: Setup Database

1. Buka phpMyAdmin: http://localhost/phpmyadmin
2. Klik "New" untuk create database baru
3. Nama database: `nubiluxchange`
4. Collation: `utf8mb4_unicode_ci`
5. Klik "Create"

## 🎯 Step 3: Setup Laravel Backend

```bash
# Masuk ke folder Laravel
cd laravel-backend

# Install dependencies PHP
composer install

# Setup environment
cp .env.example .env
php artisan key:generate

# Edit file .env dengan kredensial database
# DB_DATABASE=nubiluxchange
# DB_USERNAME=root
# DB_PASSWORD=
```

## ⚙️ Step 4: Configure Environment (.env)

Edit file `laravel-backend/.env`:

```env
APP_NAME=NubiluXchange
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nubiluxchange
DB_USERNAME=root
DB_PASSWORD=

# Untuk AI features (opsional)
OPENAI_API_KEY=your_openai_key_here
```

## 🏗️ Step 5: Run Database Migration

```bash
cd laravel-backend

# Jalankan migration untuk create tables
php artisan migrate

# Jalankan seeder untuk data contoh
php artisan db:seed
```

## 🚀 Step 6: Start Servers

### Laravel Backend:
```bash
cd laravel-backend
php artisan serve --port=8000
```
Backend akan berjalan di: http://localhost:8000

### React Frontend:
```bash
# Terminal baru
npm install
npm run dev
```
Frontend akan berjalan di: http://localhost:5173

## 🎮 Step 7: Test Setup

1. Buka http://localhost:5173 (React frontend)
2. Coba register akun baru atau login dengan:
   - Email: `gamer@example.com`
   - Password: `password123`

## 📊 phpMyAdmin Management

Gunakan phpMyAdmin untuk:
- View data tables: http://localhost/phpmyadmin
- Monitor users, products, chats, transactions
- Execute SQL queries manual
- Backup/restore database

## 🔧 Development Workflow

### Laravel Artisan Commands:
```bash
php artisan route:list          # List semua API routes
php artisan migrate:fresh --seed # Reset database + data contoh
php artisan tinker              # Interactive PHP console
php artisan make:controller Name # Buat controller baru
php artisan make:model Name     # Buat model baru
```

### Frontend Development:
```bash
npm run dev     # Start React development server
npm run build   # Build untuk production
```

## 🛠️ Troubleshooting

### Database Connection Error:
- Pastikan MySQL berjalan di XAMPP
- Check credentials di file .env
- Pastikan database `nubiluxchange` sudah dibuat

### Port Conflicts:
- Laravel: Ubah port dengan `php artisan serve --port=8001`
- React: Ubah port di vite.config.ts

### Permission Issues:
```bash
chmod -R 775 storage/
chmod -R 775 bootstrap/cache/
```

## 📱 Features Ready

✅ **User Authentication** (Register/Login)
✅ **Product Marketplace** (Gaming accounts)
✅ **WhatsApp-style Chat** (Real-time messaging)
✅ **Wallet System** (Deposit/Withdraw IDR)
✅ **Status Updates** (24-hour stories)
✅ **API Endpoints** (RESTful Laravel API)

## 🎯 Next Development Steps

1. **Real-time Notifications** dengan Pusher
2. **Image Upload** dengan Laravel Storage
3. **Payment Gateway** integration (Midtrans/Xendit)
4. **AI Chat Admin** dengan OpenAI
5. **Push Notifications** untuk mobile

## 🤝 Support

Jika ada kendala:
1. Check XAMPP services sudah running
2. Pastikan database connection di .env benar
3. Clear Laravel cache: `php artisan cache:clear`
4. Restart development servers

Happy coding dengan Laravel + XAMPP! 🚀
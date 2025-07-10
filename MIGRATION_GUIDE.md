# Panduan Migrasi NubiluXchange ke Laravel/PHP

## Ringkasan Migrasi

Proyek NubiluXchange telah berhasil dimigrasikan dari Node.js/Express ke Laravel/PHP untuk memudahkan pengembangan dengan XAMPP dan phpMyAdmin.

## Struktur Baru Laravel

### Backend (Laravel)
```
laravel-backend/
├── app/
│   ├── Http/Controllers/          # API Controllers
│   │   ├── AuthController.php     # Login/Register
│   │   ├── ProductController.php  # Produk gaming
│   │   ├── ChatController.php     # Chat WhatsApp-style
│   │   ├── UserController.php     # Profil user
│   │   ├── WalletController.php   # Sistem wallet
│   │   └── StatusController.php   # Status updates
│   └── Models/                    # Eloquent Models
│       ├── User.php              # Model pengguna
│       ├── Product.php           # Model produk gaming
│       ├── Chat.php              # Model chat
│       ├── Message.php           # Model pesan
│       ├── Transaction.php       # Model transaksi
│       └── StatusUpdate.php      # Model status
├── database/
│   ├── migrations/               # Database schema
│   └── seeders/                  # Data contoh
├── routes/
│   ├── api.php                   # API routes
│   └── web.php                   # Web routes
└── config/                       # Konfigurasi Laravel
```

### Frontend (Tetap React)
Frontend tetap menggunakan React dengan sedikit penyesuaian untuk berkomunikasi dengan Laravel API.

## Setup Dengan XAMPP

### 1. Install XAMPP
- Download XAMPP dari https://www.apachefriends.org/
- Install dan jalankan Apache + MySQL

### 2. Setup Database
1. Buka phpMyAdmin (http://localhost/phpmyadmin)
2. Buat database baru bernama `nubiluxchange`
3. Import atau jalankan migration Laravel

### 3. Setup Laravel Backend
```bash
cd laravel-backend
composer install
cp .env.example .env
php artisan key:generate
```

### 4. Konfigurasi Database (.env)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nubiluxchange
DB_USERNAME=root
DB_PASSWORD=
```

### 5. Jalankan Migration & Seeder
```bash
php artisan migrate
php artisan db:seed
```

### 6. Jalankan Server Laravel
```bash
php artisan serve --port=8000
```

## Fitur Yang Sudah Dimigrasikan

### ✅ Sistem Autentikasi
- Register/Login dengan Laravel Sanctum
- Session management
- User roles (buyer/seller)

### ✅ Manajemen Produk
- CRUD produk gaming
- Kategori game (Mobile Legends, PUBG, Free Fire, dll)
- Upload gambar dan metadata game
- Status produk (active, sold, pending)

### ✅ Sistem Chat WhatsApp-Style
- Real-time messaging
- Chat antara buyer dan seller
- History pesan
- Unread count

### ✅ Sistem Wallet
- Deposit/Withdraw dalam IDR
- Transaction history
- Saldo real-time

### ✅ Status Updates (WhatsApp-style)
- Status 24 jam dengan foto
- Auto-expire status

### ✅ API Endpoints
Semua endpoint API telah dimigrasikan dengan struktur yang sama:

```
POST /api/register          # Daftar akun
POST /api/login             # Masuk akun
GET  /api/products          # List produk
GET  /api/products/featured # Produk unggulan
POST /api/products          # Upload produk baru
GET  /api/chats             # List chat
POST /api/chats/{id}/messages # Kirim pesan
GET  /api/wallet/balance    # Cek saldo
POST /api/wallet/deposit    # Top up saldo
```

## Keuntungan Migrasi ke Laravel

### 🎯 Familiar dengan PHP
- Syntax PHP yang sudah Anda kuasai
- Dokumentasi Laravel yang lengkap dalam bahasa Indonesia
- Komunitas PHP Indonesia yang besar

### 🛠️ XAMPP Integration
- Setup mudah dengan XAMPP
- phpMyAdmin untuk manajemen database visual
- Local development yang familiar

### 📊 Database Management
- Eloquent ORM yang powerful
- Migration system yang terstruktur
- Relationship yang mudah diatur

### 🚀 Laravel Features
- Built-in authentication (Sanctum)
- Validation yang robust
- Caching dan optimization
- Queue system untuk background jobs

## Migration Checklist

- [x] Database schema (Users, Products, Chats, Messages, Transactions)
- [x] Authentication system (Register/Login)
- [x] Product management (CRUD operations)
- [x] Chat system (WhatsApp-style)
- [x] Wallet system (Deposit/Withdraw)
- [x] Status updates (24-hour stories)
- [x] API endpoints compatibility
- [x] Sample data seeder
- [ ] Frontend API integration (dalam progress)
- [ ] Image upload handling
- [ ] Real-time notifications (Pusher)
- [ ] Payment gateway integration

## Langkah Selanjutnya

1. **Setup XAMPP dan database MySQL**
2. **Test API endpoints dengan Postman**
3. **Sesuaikan frontend React untuk menggunakan Laravel API**
4. **Implementasi fitur upload gambar**
5. **Setup real-time notifications dengan Pusher**
6. **Integrasi payment gateway lokal (Midtrans/Xendit)**

## Dukungan Development

Dengan struktur Laravel ini, Anda dapat:
- Menggunakan `php artisan` commands untuk development
- Debug dengan Telescope
- Testing dengan PHPUnit
- Deployment dengan Forge atau server shared hosting

Semua fitur inti NubiluXchange telah berhasil dimigrasikan dengan arsitektur yang lebih familiar untuk development PHP/Laravel!
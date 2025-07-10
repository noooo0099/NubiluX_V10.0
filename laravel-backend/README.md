# NubiluXchange Laravel Backend

Backend Laravel untuk marketplace gaming NubiluXchange yang kompatibel dengan XAMPP dan phpMyAdmin.

## Quick Start dengan XAMPP

### 1. Persiapan Environment
```bash
# Download dan install XAMPP
# Jalankan Apache dan MySQL dari XAMPP Control Panel
```

### 2. Setup Database
1. Buka phpMyAdmin: http://localhost/phpmyadmin
2. Buat database baru: `nubiluxchange`
3. Setel collation: `utf8mb4_unicode_ci`

### 3. Install Dependencies
```bash
cd laravel-backend
composer install
```

### 4. Environment Configuration
```bash
cp .env.example .env
php artisan key:generate
```

Edit file `.env`:
```env
APP_NAME=NubiluXchange
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

### 5. Database Migration & Seeding
```bash
php artisan migrate
php artisan db:seed
```

### 6. Jalankan Server
```bash
php artisan serve --port=8000
```

API akan tersedia di: http://localhost:8000/api

## Struktur Database

### Users
- User authentication dan profil
- Role: buyer/seller
- Wallet balance dalam IDR

### Products
- Listing produk gaming
- Kategori: Mobile Legends, PUBG, Free Fire, Valorant, Genshin, Minecraft
- Game metadata (rank, level, items, dll)

### Chats & Messages
- Sistem chat WhatsApp-style
- Real-time messaging antara buyer-seller
- Message types: text, image, system, ai_admin

### Transactions
- Riwayat transaksi wallet
- Deposit, withdrawal, purchase, sale
- Integrasi payment gateway

### Status Updates
- Status 24 jam seperti WhatsApp/Instagram
- Auto-expire setelah 24 jam

## API Endpoints

### Authentication
```
POST /api/register    # Daftar akun baru
POST /api/login       # Masuk ke akun
POST /api/logout      # Keluar dari akun
GET  /api/user        # Info user saat ini
```

### Products
```
GET    /api/products           # List semua produk
GET    /api/products/featured  # Produk unggulan
GET    /api/products/{id}      # Detail produk
POST   /api/products           # Upload produk baru
PUT    /api/products/{id}      # Update produk
DELETE /api/products/{id}      # Hapus produk
```

### Chat System
```
GET  /api/chats              # List chat user
GET  /api/chats/{id}         # Detail chat
POST /api/chats              # Buat chat baru
GET  /api/chats/{id}/messages # History pesan
POST /api/chats/{id}/messages # Kirim pesan
```

### Wallet
```
GET  /api/wallet/balance      # Cek saldo
POST /api/wallet/deposit      # Top up saldo
POST /api/wallet/withdraw     # Tarik dana
GET  /api/wallet/transactions # History transaksi
```

### Status Updates
```
GET  /api/status    # List status aktif
POST /api/status    # Upload status baru
```

## Sample Data

Setelah menjalankan seeder, tersedia data contoh:
- 4 user dengan berbagai role
- 3 produk gaming (ML, PUBG, Free Fire)
- Status updates contoh

### Test Accounts
```
Admin: admin@nubiluxchange.com / admin123
Seller: gamer@example.com / password123
Buyer: buyer@example.com / password123
```

## Development Tools

### Artisan Commands
```bash
php artisan migrate:fresh --seed  # Reset database
php artisan route:list            # List semua routes
php artisan make:controller Name  # Buat controller baru
php artisan make:model Name       # Buat model baru
```

### Database Management
- Gunakan phpMyAdmin untuk GUI database
- Laravel migrations untuk schema changes
- Eloquent ORM untuk query database

## Testing API

Gunakan Postman atau curl untuk test endpoints:

```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"gamer@example.com","password":"password123"}'

# Get products (dengan token)
curl -X GET http://localhost:8000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Deployment

### Shared Hosting
1. Upload files ke public_html
2. Setup database di cPanel
3. Update .env dengan kredensial hosting
4. Jalankan migration melalui SSH/terminal

### VPS/Dedicated Server
1. Install PHP 8.1+, MySQL, Apache/Nginx
2. Setup virtual host
3. Install Composer dependencies
4. Setup SSL certificate
5. Configure cron jobs untuk queue

## Troubleshooting

### Database Connection Error
- Pastikan MySQL berjalan di XAMPP
- Cek kredensial database di .env
- Pastikan database `nubiluxchange` sudah dibuat

### Composer Issues
```bash
composer clear-cache
composer install --no-cache
```

### Permission Issues
```bash
chmod -R 775 storage/
chmod -R 775 bootstrap/cache/
```

## Next Steps

1. Setup frontend React untuk konsumsi API Laravel
2. Implementasi upload gambar dengan Laravel Storage
3. Setup real-time notifications dengan Pusher
4. Integrasi payment gateway (Midtrans/Xendit)
5. Setup email notifications dengan Mailtrap/SendGrid

Laravel backend sudah siap digunakan dengan XAMPP dan phpMyAdmin!
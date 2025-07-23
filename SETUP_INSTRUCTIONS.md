# Setup NubiluXchange di Laptop

## Prerequisites
- Node.js 18+ (untuk frontend React)
- PHP 8.2+ (untuk Laravel backend)
- Composer (package manager PHP)
- MySQL/XAMPP (untuk database production)

## Setup Laravel Backend

1. Masuk ke folder Laravel:
```bash
cd laravel-backend
```

2. Install dependencies PHP:
```bash
composer install
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Generate application key:
```bash
php artisan key:generate
```

5. Setup database di .env:
```env
DB_CONNECTION=sqlite
DB_DATABASE=/path/to/your/database/database.sqlite
# Atau untuk MySQL:
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=nubiluxchange
# DB_USERNAME=root
# DB_PASSWORD=
```

6. Buat database file (untuk SQLite):
```bash
touch database/database.sqlite
```

7. Jalankan migrations dan seeder:
```bash
php artisan migrate
php artisan db:seed
```

8. Start Laravel server:
```bash
php artisan serve --port=8000
```

## Setup React Frontend

1. Install dependencies Node.js:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

## Test Credentials
- Email: gamer@example.com
- Password: password123

## File Structure Penting
```
/
├── laravel-backend/          # Laravel PHP backend
│   ├── app/Models/          # Database models
│   ├── app/Http/Controllers/# API controllers
│   ├── database/migrations/ # Database structure
│   └── routes/api.php       # API routes
├── client/src/              # React frontend
│   ├── pages/              # React pages
│   ├── components/         # UI components
│   └── lib/                # Utilities
├── start-laravel.sh        # Laravel startup script
└── start-react.sh          # React startup script
```

## Development Workflow
1. Jalankan Laravel: `./start-laravel.sh`
2. Jalankan React: `./start-react.sh` (terminal baru)
3. Akses aplikasi di: http://localhost:5173
4. Test API di: http://localhost:8000/api/products

## XAMPP Setup (Production)
1. Install XAMPP
2. Start Apache & MySQL services
3. Buka phpMyAdmin: http://localhost/phpmyadmin
4. Buat database 'nubiluxchange'
5. Update .env untuk MySQL connection
6. Jalankan `php artisan migrate` lagi
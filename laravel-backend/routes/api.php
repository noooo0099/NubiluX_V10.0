<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    AuthController,
    UserController,
    ProductController,
    ChatController,
    WalletController,
    StatusController,
    NotificationController,
    PosterController
};

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // User routes
    Route::prefix('users')->group(function () {
        Route::get('/profile/{id}', [UserController::class, 'profile']);
        Route::post('/profile/update', [UserController::class, 'updateProfile']);
        Route::post('/switch-role', [UserController::class, 'switchRole']);
    });
    
    // Product routes
    Route::prefix('products')->group(function () {
        Route::get('/', [ProductController::class, 'index']);
        Route::get('/featured', [ProductController::class, 'featured']);
        Route::get('/{id}', [ProductController::class, 'show']);
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
    });
    
    // Chat routes
    Route::prefix('chats')->group(function () {
        Route::get('/', [ChatController::class, 'index']);
        Route::get('/{id}', [ChatController::class, 'show']);
        Route::post('/', [ChatController::class, 'store']);
        Route::get('/{id}/messages', [ChatController::class, 'messages']);
        Route::post('/{id}/messages', [ChatController::class, 'sendMessage']);
    });
    
    // Wallet routes
    Route::prefix('wallet')->group(function () {
        Route::get('/balance', [WalletController::class, 'balance']);
        Route::post('/deposit', [WalletController::class, 'deposit']);
        Route::post('/withdraw', [WalletController::class, 'withdraw']);
        Route::get('/transactions', [WalletController::class, 'transactions']);
    });
    
    // Status routes
    Route::prefix('status')->group(function () {
        Route::get('/', [StatusController::class, 'index']);
        Route::post('/', [StatusController::class, 'store']);
    });
    
    // Notification routes
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::post('/{id}/read', [NotificationController::class, 'markAsRead']);
    });
    
    // Poster generation routes
    Route::prefix('posters')->group(function () {
        Route::post('/generate', [PosterController::class, 'generate']);
        Route::get('/{id}', [PosterController::class, 'show']);
    });
});
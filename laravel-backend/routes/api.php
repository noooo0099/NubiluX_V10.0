<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    AuthController,
    UserController,
    ProductController,
    ChatController,
    WalletController,
    AdminManagementController,
    EscrowController,
};

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Owner setup route (protected by setup key and throttling)
Route::post('/setup/owner', [AdminManagementController::class, 'createOwner'])->middleware('throttle:3,1');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // User routes
    Route::prefix('users')->group(function () {
        Route::get('/profile/{id}', [UserController::class, 'profile']);
        Route::post('/profile/update', [UserController::class, 'updateProfile']);
        Route::post('/request-admin', [AdminManagementController::class, 'requestAdminAccess']);
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
    
    // Admin management routes (Owner and approved Admins)
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/users', [AdminManagementController::class, 'getAllUsers']);
        Route::get('/stats', [AdminManagementController::class, 'getAdminStats']);
    });

    // Owner-only admin management routes
    Route::middleware('owner')->prefix('admin')->group(function () {
        Route::get('/requests', [AdminManagementController::class, 'getPendingRequests']);
        Route::post('/approve', [AdminManagementController::class, 'approveAdminRequest']);
        Route::post('/deny', [AdminManagementController::class, 'denyAdminRequest']);
        Route::post('/promote', [AdminManagementController::class, 'promoteToAdmin']);
        Route::post('/revoke', [AdminManagementController::class, 'revokeAdmin']);
    });

    // Escrow system routes (Owner and Admin access)
    Route::middleware('admin')->prefix('escrow')->group(function () {
        Route::get('/stats', [EscrowController::class, 'getStats']);
        Route::get('/transactions', [EscrowController::class, 'getTransactions']);
        Route::post('/process', [EscrowController::class, 'processTransaction']);
        Route::post('/reanalyze', [EscrowController::class, 'reAnalyze']);
    });

    // Escrow transaction routes (all authenticated users)
    Route::prefix('escrow')->group(function () {
        Route::post('/create', [EscrowController::class, 'createTransaction']);
        Route::post('/complete', [EscrowController::class, 'completeTransaction']);
    });
    
    // Admin panel routes (owner + approved admins)
    Route::middleware('admin')->prefix('panel')->group(function () {
        // Admin panel routes will be added here
        Route::get('/dashboard', function () {
            return response()->json(['message' => 'Admin panel access granted']);
        });
    });
});
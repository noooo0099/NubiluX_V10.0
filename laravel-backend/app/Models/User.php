<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'username',
        'email',
        'password',
        'display_name',
        'bio',
        'profile_picture',
        'banner_image',
        'is_verified',
        'wallet_balance',
    ];

    /**
     * Fields that are sensitive for authorization and should never be mass-assigned.
     * These can only be updated through explicit owner-controlled methods.
     */
    protected $guarded_authorization_fields = [
        'role',
        'is_admin_approved',
        'admin_approved_at',
        'approved_by_owner_id',
        'admin_request_pending',
        'admin_request_reason',
        'admin_request_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
            'wallet_balance' => 'decimal:2',
            'is_admin_approved' => 'boolean',
            'admin_approved_at' => 'datetime',
            'admin_request_pending' => 'boolean',
            'admin_request_at' => 'datetime',
        ];
    }

    /**
     * Get the products for the user (as seller).
     */
    public function products()
    {
        return $this->hasMany(Product::class, 'seller_id');
    }

    /**
     * Get the chats where user is buyer.
     */
    public function buyerChats()
    {
        return $this->hasMany(Chat::class, 'buyer_id');
    }

    /**
     * Get the chats where user is seller.
     */
    public function sellerChats()
    {
        return $this->hasMany(Chat::class, 'seller_id');
    }

    /**
     * Get all chats for the user.
     */
    public function chats()
    {
        return $this->buyerChats()->union($this->sellerChats());
    }

    /**
     * Get the messages sent by the user.
     */
    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Get the transactions for the user.
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the status updates for the user.
     */
    public function statusUpdates()
    {
        return $this->hasMany(StatusUpdate::class);
    }

    /**
     * Check if user is owner
     */
    public function isOwner(): bool
    {
        return $this->role === 'owner';
    }

    /**
     * Check if user is admin (and approved)
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin' && $this->is_admin_approved;
    }

    /**
     * Check if user has admin access (owner or approved admin)
     */
    public function hasAdminAccess(): bool
    {
        return $this->isOwner() || $this->isAdmin();
    }

    /**
     * Get the owner who approved this admin
     */
    public function approvedByOwner()
    {
        return $this->belongsTo(User::class, 'approved_by_owner_id');
    }

    /**
     * Get admins approved by this owner
     */
    public function approvedAdmins()
    {
        return $this->hasMany(User::class, 'approved_by_owner_id');
    }
}

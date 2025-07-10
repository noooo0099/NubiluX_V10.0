<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'seller_id',
        'title',
        'description',
        'category',
        'price',
        'thumbnail',
        'images',
        'game_data',
        'status',
        'is_premium',
        'rating',
        'review_count',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'images' => 'array',
        'game_data' => 'array',
        'is_premium' => 'boolean',
        'rating' => 'decimal:2',
    ];

    /**
     * Get the seller for this product.
     */
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    /**
     * Get the chats for this product.
     */
    public function chats()
    {
        return $this->hasMany(Chat::class);
    }

    /**
     * Get the transactions for this product.
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}

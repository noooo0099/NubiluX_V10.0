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
        'views',
        'created_at'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'images' => 'array',
        'game_data' => 'array',
        'rating' => 'decimal:2',
        'review_count' => 'integer',
        'views' => 'integer',
        'is_premium' => 'boolean',
    ];

    // Relationships
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function chats()
    {
        return $this->hasMany(Chat::class, 'product_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'product_id');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePremium($query)
    {
        return $query->where('is_premium', true);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopeBySeller($query, $sellerId)
    {
        return $query->where('seller_id', $sellerId);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_premium', true)
                    ->where('status', 'active')
                    ->orderBy('rating', 'desc')
                    ->orderBy('views', 'desc');
    }
}
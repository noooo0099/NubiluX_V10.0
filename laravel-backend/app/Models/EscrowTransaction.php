<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EscrowTransaction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'buyer_id',
        'seller_id',
        'product_id',
        'amount',
        'status',
        'ai_status',
        'risk_score',
        'ai_decision',
        'approved_by',
        'approved_at',
        'admin_note',
        'completed_by',
        'completed_at',
        'completion_note',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'risk_score' => 'integer',
            'ai_decision' => 'array',
            'approved_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    /**
     * Get the buyer of the transaction.
     */
    public function buyer()
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Get the seller of the transaction.
     */
    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    /**
     * Get the product being transacted.
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the admin who approved the transaction.
     */
    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Get the user who completed the transaction.
     */
    public function completedBy()
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /**
     * Scope for pending transactions.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for active transactions.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for completed transactions.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for high-risk transactions.
     */
    public function scopeHighRisk($query)
    {
        return $query->where('risk_score', '>=', 70);
    }

    /**
     * Scope for flagged transactions.
     */
    public function scopeFlagged($query)
    {
        return $query->where('ai_status', 'flagged');
    }

    /**
     * Scope for manual review.
     */
    public function scopeManualReview($query)
    {
        return $query->where('ai_status', 'manual_review');
    }

    /**
     * Check if transaction is high risk.
     */
    public function isHighRisk(): bool
    {
        return $this->risk_score >= 70;
    }

    /**
     * Check if transaction needs manual review.
     */
    public function needsManualReview(): bool
    {
        return $this->ai_status === 'manual_review' || $this->risk_score >= 40;
    }

    /**
     * Get formatted amount.
     */
    public function getFormattedAmountAttribute(): string
    {
        return 'Rp ' . number_format($this->amount, 0, ',', '.');
    }

    /**
     * Get processing time in minutes.
     */
    public function getProcessingTimeAttribute(): ?int
    {
        if (!$this->completed_at) {
            return null;
        }
        
        return $this->created_at->diffInMinutes($this->completed_at);
    }
}
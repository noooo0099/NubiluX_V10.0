<?php

namespace App\Http\Controllers;

use App\Models\EscrowTransaction;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class EscrowController extends Controller
{
    /**
     * Get escrow statistics
     */
    public function getStats(Request $request)
    {
        $stats = [
            'totalTransactions' => EscrowTransaction::count(),
            'activeEscrows' => EscrowTransaction::where('status', 'active')->count(),
            'completedToday' => EscrowTransaction::where('status', 'completed')
                ->whereDate('updated_at', today())
                ->count(),
            'disputedCases' => EscrowTransaction::where('status', 'disputed')->count(),
            'aiProcessedCount' => EscrowTransaction::whereNotNull('ai_decision')->count(),
            'totalVolume' => EscrowTransaction::where('status', 'completed')->sum('amount'),
            'averageProcessingTime' => $this->getAverageProcessingTime(),
            'fraudPrevented' => EscrowTransaction::where('ai_status', 'flagged')->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Get all escrow transactions
     */
    public function getTransactions(Request $request)
    {
        $transactions = EscrowTransaction::with(['buyer:id,username,display_name,profile_picture,is_verified', 
                                               'seller:id,username,display_name,profile_picture,is_verified',
                                               'product:id,title,category,thumbnail'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($transaction) {
                return [
                    'id' => $transaction->id,
                    'buyerId' => $transaction->buyer_id,
                    'sellerId' => $transaction->seller_id,
                    'productId' => $transaction->product_id,
                    'amount' => $transaction->amount,
                    'status' => $transaction->status,
                    'aiStatus' => $transaction->ai_status,
                    'riskScore' => $transaction->risk_score,
                    'createdAt' => $transaction->created_at->toISOString(),
                    'updatedAt' => $transaction->updated_at->toISOString(),
                    'buyer' => $transaction->buyer,
                    'seller' => $transaction->seller,
                    'product' => $transaction->product,
                    'aiDecision' => $transaction->ai_decision,
                ];
            });

        return response()->json($transactions);
    }

    /**
     * Create new escrow transaction
     */
    public function createTransaction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'seller_id' => 'required|exists:users,id',
            'amount' => 'required|numeric|min:1000', // Minimum 1000 IDR
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $buyer = $request->user();
        $product = Product::findOrFail($request->product_id);
        $seller = User::findOrFail($request->seller_id);

        // Check if buyer has sufficient balance
        if ($buyer->wallet_balance < $request->amount) {
            return response()->json([
                'error' => 'Insufficient balance',
                'message' => 'Your wallet balance is insufficient for this transaction.'
            ], 400);
        }

        // Prevent self-transactions
        if ($buyer->id === $seller->id) {
            return response()->json([
                'error' => 'Invalid transaction',
                'message' => 'You cannot buy from yourself.'
            ], 400);
        }

        DB::beginTransaction();
        
        try {
            // Create escrow transaction
            $escrowTransaction = EscrowTransaction::create([
                'buyer_id' => $buyer->id,
                'seller_id' => $seller->id,
                'product_id' => $product->id,
                'amount' => $request->amount,
                'status' => 'pending',
                'ai_status' => 'processing',
                'risk_score' => 0,
            ]);

            // Deduct amount from buyer's wallet (hold in escrow)
            $buyer->wallet_balance -= $request->amount;
            $buyer->save();

            // Run AI analysis
            $aiAnalysis = $this->runAIAnalysis($escrowTransaction);
            
            $escrowTransaction->update([
                'risk_score' => $aiAnalysis['riskScore'],
                'ai_status' => $aiAnalysis['aiStatus'],
                'ai_decision' => json_encode($aiAnalysis['decision']),
            ]);

            // Auto-approve low-risk transactions
            if ($aiAnalysis['riskScore'] < 30 && $aiAnalysis['aiStatus'] === 'approved') {
                $escrowTransaction->update(['status' => 'active']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Escrow transaction created successfully',
                'transaction' => $escrowTransaction->load(['buyer:id,username', 'seller:id,username', 'product:id,title'])
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'Transaction creation failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process escrow transaction (approve/reject/manual_review)
     */
    public function processTransaction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|exists:escrow_transactions,id',
            'action' => 'required|in:approve,reject,manual_review',
            'note' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $transaction = EscrowTransaction::findOrFail($request->transaction_id);
        $admin = $request->user();

        DB::beginTransaction();

        try {
            switch ($request->action) {
                case 'approve':
                    $transaction->update([
                        'status' => 'active',
                        'ai_status' => 'approved',
                        'approved_by' => $admin->id,
                        'approved_at' => now(),
                        'admin_note' => $request->note
                    ]);
                    break;

                case 'reject':
                    // Return money to buyer
                    $buyer = User::find($transaction->buyer_id);
                    $buyer->wallet_balance += $transaction->amount;
                    $buyer->save();

                    $transaction->update([
                        'status' => 'cancelled',
                        'ai_status' => 'flagged',
                        'approved_by' => $admin->id,
                        'approved_at' => now(),
                        'admin_note' => $request->note
                    ]);
                    break;

                case 'manual_review':
                    $transaction->update([
                        'ai_status' => 'manual_review',
                        'approved_by' => $admin->id,
                        'admin_note' => $request->note
                    ]);
                    break;
            }

            DB::commit();

            return response()->json([
                'message' => "Transaction {$request->action}d successfully",
                'transaction' => $transaction->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'Transaction processing failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Complete escrow transaction (release funds to seller)
     */
    public function completeTransaction(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|exists:escrow_transactions,id',
            'completion_note' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $transaction = EscrowTransaction::findOrFail($request->transaction_id);
        $user = $request->user();

        // Only buyer or admin can complete transaction
        if ($user->id !== $transaction->buyer_id && $user->role !== 'admin' && $user->role !== 'owner') {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Only the buyer or admin can complete this transaction.'
            ], 403);
        }

        if ($transaction->status !== 'active') {
            return response()->json([
                'error' => 'Invalid status',
                'message' => 'Transaction must be active to complete.'
            ], 400);
        }

        DB::beginTransaction();

        try {
            // Transfer funds to seller
            $seller = User::find($transaction->seller_id);
            $seller->wallet_balance += $transaction->amount;
            $seller->save();

            $transaction->update([
                'status' => 'completed',
                'completed_at' => now(),
                'completed_by' => $user->id,
                'completion_note' => $request->completion_note
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Transaction completed successfully',
                'transaction' => $transaction->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollback();
            return response()->json([
                'error' => 'Transaction completion failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Re-analyze transaction with AI
     */
    public function reAnalyze(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaction_id' => 'required|exists:escrow_transactions,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $transaction = EscrowTransaction::findOrFail($request->transaction_id);
        
        // Run AI analysis again
        $aiAnalysis = $this->runAIAnalysis($transaction);
        
        $transaction->update([
            'risk_score' => $aiAnalysis['riskScore'],
            'ai_status' => $aiAnalysis['aiStatus'],
            'ai_decision' => json_encode($aiAnalysis['decision']),
        ]);

        return response()->json([
            'message' => 'AI re-analysis completed successfully',
            'transaction' => $transaction->fresh()
        ]);
    }

    /**
     * AI Analysis System - This is where the magic happens!
     */
    private function runAIAnalysis($transaction)
    {
        $buyer = User::find($transaction->buyer_id);
        $seller = User::find($transaction->seller_id);
        $product = Product::find($transaction->product_id);

        $riskFactors = [];
        $riskScore = 0;

        // Factor 1: User verification status
        if (!$buyer->is_verified) {
            $riskScore += 20;
            $riskFactors[] = "Buyer is not verified";
        }
        if (!$seller->is_verified) {
            $riskScore += 15;
            $riskFactors[] = "Seller is not verified";
        }

        // Factor 2: Account age
        $buyerAge = $buyer->created_at->diffInDays(now());
        $sellerAge = $seller->created_at->diffInDays(now());
        
        if ($buyerAge < 7) {
            $riskScore += 25;
            $riskFactors[] = "Buyer account is very new (less than 7 days)";
        } elseif ($buyerAge < 30) {
            $riskScore += 10;
            $riskFactors[] = "Buyer account is relatively new (less than 30 days)";
        }

        if ($sellerAge < 7) {
            $riskScore += 20;
            $riskFactors[] = "Seller account is very new (less than 7 days)";
        }

        // Factor 3: Transaction amount vs wallet balance
        $balanceRatio = $transaction->amount / max($buyer->wallet_balance + $transaction->amount, 1);
        if ($balanceRatio > 0.8) {
            $riskScore += 15;
            $riskFactors[] = "Transaction amount is very high relative to buyer's wallet balance";
        }

        // Factor 4: High-value transaction
        if ($transaction->amount > 1000000) { // > 1M IDR
            $riskScore += 10;
            $riskFactors[] = "High-value transaction (>1M IDR)";
        }

        // Factor 5: Previous transaction history
        $buyerPreviousTransactions = EscrowTransaction::where('buyer_id', $buyer->id)
            ->where('status', 'completed')
            ->count();
        
        $sellerPreviousTransactions = EscrowTransaction::where('seller_id', $seller->id)
            ->where('status', 'completed')
            ->count();

        if ($buyerPreviousTransactions === 0) {
            $riskScore += 15;
            $riskFactors[] = "Buyer has no previous completed transactions";
        }

        if ($sellerPreviousTransactions === 0) {
            $riskScore += 10;
            $riskFactors[] = "Seller has no previous completed transactions";
        }

        // Factor 6: Disputed transactions history
        $buyerDisputes = EscrowTransaction::where('buyer_id', $buyer->id)
            ->where('status', 'disputed')
            ->count();
        
        $sellerDisputes = EscrowTransaction::where('seller_id', $seller->id)
            ->where('status', 'disputed')
            ->count();

        if ($buyerDisputes > 0) {
            $riskScore += ($buyerDisputes * 20);
            $riskFactors[] = "Buyer has {$buyerDisputes} disputed transaction(s)";
        }

        if ($sellerDisputes > 0) {
            $riskScore += ($sellerDisputes * 15);
            $riskFactors[] = "Seller has {$sellerDisputes} disputed transaction(s)";
        }

        // Cap risk score at 100
        $riskScore = min($riskScore, 100);

        // Determine AI decision
        $aiStatus = 'approved';
        $recommendation = 'approve';
        $confidence = 85;

        if ($riskScore >= 70) {
            $aiStatus = 'flagged';
            $recommendation = 'reject';
            $confidence = 90;
        } elseif ($riskScore >= 40) {
            $aiStatus = 'manual_review';
            $recommendation = 'manual_review';
            $confidence = 75;
        }

        // Add positive factors that might lower risk
        $positiveFactors = [];
        if ($buyer->is_verified && $seller->is_verified) {
            $positiveFactors[] = "Both parties are verified users";
            $confidence += 5;
        }

        if ($buyerPreviousTransactions >= 5 && $sellerPreviousTransactions >= 5) {
            $positiveFactors[] = "Both parties have good transaction history";
            $confidence += 10;
        }

        if ($buyerDisputes === 0 && $sellerDisputes === 0) {
            $positiveFactors[] = "No dispute history for both parties";
            $confidence += 5;
        }

        $decision = [
            'recommendation' => $recommendation,
            'confidence' => min($confidence, 100),
            'reasons' => array_merge($riskFactors, $positiveFactors),
            'timestamp' => now()->toISOString(),
            'analysisVersion' => '1.0',
            'factors' => [
                'userVerification' => !$buyer->is_verified || !$seller->is_verified,
                'accountAge' => $buyerAge < 30 || $sellerAge < 30,
                'transactionHistory' => $buyerPreviousTransactions === 0 || $sellerPreviousTransactions === 0,
                'disputeHistory' => $buyerDisputes > 0 || $sellerDisputes > 0,
                'highValue' => $transaction->amount > 1000000,
                'balanceRatio' => $balanceRatio > 0.8
            ]
        ];

        return [
            'riskScore' => $riskScore,
            'aiStatus' => $aiStatus,
            'decision' => $decision
        ];
    }

    /**
     * Calculate average processing time in minutes
     */
    private function getAverageProcessingTime()
    {
        $completedTransactions = EscrowTransaction::where('status', 'completed')
            ->whereNotNull('completed_at')
            ->get();

        if ($completedTransactions->isEmpty()) {
            return 0;
        }

        $totalMinutes = $completedTransactions->sum(function ($transaction) {
            return $transaction->created_at->diffInMinutes($transaction->completed_at);
        });

        return round($totalMinutes / $completedTransactions->count());
    }
}
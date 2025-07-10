<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WalletController extends Controller
{
    public function balance()
    {
        $user = auth()->user();
        return response()->json([
            'balance' => $user->wallet_balance,
            'currency' => 'IDR'
        ]);
    }

    public function deposit(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:10000', // Minimum 10k IDR
            'payment_method' => 'required|string',
        ]);

        $user = auth()->user();

        DB::transaction(function () use ($request, $user) {
            // Create transaction record
            Transaction::create([
                'user_id' => $user->id,
                'amount' => $request->amount,
                'type' => 'deposit',
                'status' => 'completed', // In real app, this would be 'pending' until payment confirmed
                'payment_method' => $request->payment_method,
                'payment_details' => $request->payment_details ?? null,
            ]);

            // Update wallet balance
            $user->increment('wallet_balance', $request->amount);
        });

        return response()->json([
            'message' => 'Deposit berhasil!',
            'new_balance' => $user->fresh()->wallet_balance
        ]);
    }

    public function withdraw(Request $request)
    {
        $request->validate([
            'amount' => 'required|numeric|min:50000', // Minimum 50k IDR
            'bank_account' => 'required|string',
        ]);

        $user = auth()->user();

        if ($user->wallet_balance < $request->amount) {
            return response()->json([
                'error' => 'Saldo tidak mencukupi'
            ], 400);
        }

        DB::transaction(function () use ($request, $user) {
            // Create transaction record
            Transaction::create([
                'user_id' => $user->id,
                'amount' => $request->amount,
                'type' => 'withdrawal',
                'status' => 'pending', // Manual processing required
                'payment_method' => 'bank_transfer',
                'payment_details' => ['bank_account' => $request->bank_account],
            ]);

            // Deduct from wallet balance
            $user->decrement('wallet_balance', $request->amount);
        });

        return response()->json([
            'message' => 'Permintaan penarikan berhasil! Dana akan diproses dalam 1-3 hari kerja.',
            'new_balance' => $user->fresh()->wallet_balance
        ]);
    }

    public function transactions()
    {
        $transactions = Transaction::where('user_id', auth()->id())
                                 ->orderBy('created_at', 'desc')
                                 ->paginate(20);

        return response()->json($transactions);
    }
}
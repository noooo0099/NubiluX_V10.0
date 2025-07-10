<?php

namespace App\Http\Controllers;

use App\Models\Chat;
use App\Models\Message;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function index()
    {
        $userId = auth()->id();
        
        $chats = Chat::with(['product', 'buyer', 'seller', 'messages' => function($query) {
                        $query->latest()->limit(1);
                    }])
                    ->where('buyer_id', $userId)
                    ->orWhere('seller_id', $userId)
                    ->orderBy('updated_at', 'desc')
                    ->get();

        return response()->json($chats);
    }

    public function show($id)
    {
        $userId = auth()->id();
        
        $chat = Chat::with(['product', 'buyer', 'seller'])
                   ->where(function($query) use ($userId) {
                       $query->where('buyer_id', $userId)
                             ->orWhere('seller_id', $userId);
                   })
                   ->findOrFail($id);

        return response()->json($chat);
    }

    public function messages($id)
    {
        $userId = auth()->id();
        
        $chat = Chat::where(function($query) use ($userId) {
                        $query->where('buyer_id', $userId)
                              ->orWhere('seller_id', $userId);
                    })
                    ->findOrFail($id);

        $messages = Message::with('sender')
                           ->where('chat_id', $id)
                           ->orderBy('created_at', 'asc')
                           ->get();

        // Mark messages as read (reset unread count)
        $chat->update(['unread_count' => 0]);

        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'seller_id' => 'required|exists:users,id',
        ]);

        $userId = auth()->id();

        // Check if chat already exists
        $chat = Chat::where('product_id', $request->product_id)
                   ->where('buyer_id', $userId)
                   ->where('seller_id', $request->seller_id)
                   ->first();

        if (!$chat) {
            $chat = Chat::create([
                'product_id' => $request->product_id,
                'buyer_id' => $userId,
                'seller_id' => $request->seller_id,
                'status' => 'active',
            ]);
        }

        return response()->json($chat->load(['product', 'buyer', 'seller']));
    }

    public function sendMessage(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string',
            'message_type' => 'sometimes|in:text,image,system,ai_admin',
        ]);

        $userId = auth()->id();
        
        $chat = Chat::where(function($query) use ($userId) {
                        $query->where('buyer_id', $userId)
                              ->orWhere('seller_id', $userId);
                    })
                    ->findOrFail($id);

        $message = Message::create([
            'chat_id' => $id,
            'sender_id' => $userId,
            'content' => $request->content,
            'message_type' => $request->message_type ?? 'text',
            'metadata' => $request->metadata ?? null,
        ]);

        // Update chat with last message info
        $chat->update([
            'last_message' => $request->content,
            'unread_count' => $chat->unread_count + 1,
            'updated_at' => now(),
        ]);

        return response()->json($message->load('sender'));
    }
}
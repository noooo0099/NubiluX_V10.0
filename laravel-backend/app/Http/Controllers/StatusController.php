<?php

namespace App\Http\Controllers;

use App\Models\StatusUpdate;
use Illuminate\Http\Request;
use Carbon\Carbon;

class StatusController extends Controller
{
    public function index()
    {
        $statuses = StatusUpdate::with('user')
                               ->active()
                               ->orderBy('created_at', 'desc')
                               ->get();

        return response()->json($statuses);
    }

    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string|max:500',
            'image' => 'nullable|url',
        ]);

        $status = StatusUpdate::create([
            'user_id' => auth()->id(),
            'content' => $request->content,
            'image' => $request->image,
            'expires_at' => Carbon::now()->addHours(24), // Status expires in 24 hours
            'is_active' => true,
        ]);

        return response()->json($status->load('user'), 201);
    }
}
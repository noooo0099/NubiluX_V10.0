<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function profile($id)
    {
        $user = User::select(['id', 'username', 'email', 'display_name', 'bio', 'profile_picture', 'banner_image', 'role', 'is_verified', 'wallet_balance', 'created_at'])
                   ->findOrFail($id);

        return response()->json($user);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'display_name' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:500',
            'username' => 'sometimes|string|unique:users,username,' . $user->id,
            'profile_picture' => 'nullable|url',
            'banner_image' => 'nullable|url',
        ]);

        $user->update($request->only([
            'display_name', 'bio', 'username', 'profile_picture', 'banner_image'
        ]));

        return response()->json([
            'user' => $user,
            'message' => 'Profil berhasil diperbarui!'
        ]);
    }

    public function switchRole(Request $request)
    {
        $request->validate([
            'role' => 'required|in:buyer,seller',
        ]);

        $user = auth()->user();
        $user->update(['role' => $request->role]);

        return response()->json([
            'user' => $user,
            'message' => "Peran berhasil diubah menjadi {$request->role}!"
        ]);
    }
}
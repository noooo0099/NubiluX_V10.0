<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     * 
     * Only allows users with 'admin' or 'owner' role and admin approval
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'You must be logged in to access admin panel'
            ], 401);
        }
        
        // Owner always has access
        if ($user->role === 'owner') {
            return $next($request);
        }
        
        // Admin must be approved by owner
        if ($user->role === 'admin' && $user->is_admin_approved) {
            return $next($request);
        }
        
        return response()->json([
            'error' => 'Forbidden',
            'message' => 'You do not have admin access. Only approved admins and owners can access this area.'
        ], 403);
    }
}
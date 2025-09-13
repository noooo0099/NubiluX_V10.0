<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OwnerMiddleware
{
    /**
     * Handle an incoming request.
     * 
     * Only allows users with 'owner' role - highest privilege
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'You must be logged in'
            ], 401);
        }
        
        if ($user->role !== 'owner') {
            return response()->json([
                'error' => 'Forbidden',
                'message' => 'Only the owner can access this area. This action requires the highest level of authorization.'
            ], 403);
        }
        
        return $next($request);
    }
}
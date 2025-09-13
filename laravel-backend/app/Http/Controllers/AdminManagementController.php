<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class AdminManagementController extends Controller
{
    /**
     * Get all users for admin management (Owner only)
     */
    public function getAllUsers(Request $request)
    {
        $users = User::select(['id', 'username', 'email', 'display_name', 'role', 'is_admin_approved', 'admin_approved_at', 'approved_by_owner_id', 'created_at'])
            ->with('approvedByOwner:id,username')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'message' => 'Users retrieved successfully',
            'users' => $users
        ]);
    }

    /**
     * Promote user to admin (Owner only)
     */
    public function promoteToAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::findOrFail($request->user_id);
        $owner = $request->user();

        // Prevent promoting another owner
        if ($user->role === 'owner') {
            return response()->json([
                'error' => 'Cannot promote owner',
                'message' => 'Owner accounts cannot be changed by other owners.'
            ], 403);
        }

        // Prevent self-promotion
        if ($user->id === $owner->id) {
            return response()->json([
                'error' => 'Self-promotion forbidden',
                'message' => 'You cannot promote yourself.'
            ], 403);
        }

        // Explicit assignment for sensitive authorization fields (no mass assignment)
        $user->role = 'admin';
        $user->is_admin_approved = true;
        $user->admin_approved_at = now();
        $user->approved_by_owner_id = $owner->id;
        // Clear admin request flags when promoted
        $user->admin_request_pending = false;
        $user->admin_request_reason = null;
        $user->admin_request_at = null;
        $user->save();

        return response()->json([
            'message' => 'User promoted to admin successfully',
            'user' => $user->load('approvedByOwner:id,username'),
            'reason' => $request->reason
        ]);
    }

    /**
     * Revoke admin access (Owner only)
     */
    public function revokeAdmin(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::findOrFail($request->user_id);
        $owner = $request->user();

        // Prevent revoking owner status
        if ($user->role === 'owner') {
            return response()->json([
                'error' => 'Cannot revoke owner',
                'message' => 'Owner accounts cannot be modified.'
            ], 403);
        }

        // Prevent self-revocation
        if ($user->id === $owner->id) {
            return response()->json([
                'error' => 'Self-revocation forbidden',
                'message' => 'You cannot revoke your own access.'
            ], 403);
        }

        // Explicit assignment for sensitive authorization fields (no mass assignment)
        $user->role = 'user';
        $user->is_admin_approved = false;
        $user->admin_approved_at = null;
        $user->approved_by_owner_id = null;
        // Clear any pending admin requests when revoked
        $user->admin_request_pending = false;
        $user->admin_request_reason = null;
        $user->admin_request_at = null;
        $user->save();

        return response()->json([
            'message' => 'Admin access revoked successfully',
            'user' => $user,
            'reason' => $request->reason
        ]);
    }

    /**
     * Get pending admin requests (Owner only)
     */
    public function getPendingRequests(Request $request)
    {
        $pendingRequests = User::where('admin_request_pending', true)
            ->select(['id', 'username', 'email', 'display_name', 'admin_request_reason', 'admin_request_at'])
            ->orderBy('admin_request_at', 'asc')
            ->get();

        return response()->json([
            'message' => 'Pending admin requests retrieved successfully',
            'requests' => $pendingRequests
        ]);
    }

    /**
     * Approve admin request (Owner only)
     */
    public function approveAdminRequest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'response_note' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::findOrFail($request->user_id);
        $owner = $request->user();

        // Check if user has pending request
        if (!$user->admin_request_pending) {
            return response()->json([
                'error' => 'No pending request',
                'message' => 'This user does not have a pending admin request.'
            ], 409);
        }

        // Approve and promote to admin (explicit assignment for security)
        $user->role = 'admin';
        $user->is_admin_approved = true;
        $user->admin_approved_at = now();
        $user->approved_by_owner_id = $owner->id;
        // Clear request flags
        $user->admin_request_pending = false;
        $user->admin_request_reason = null;
        $user->admin_request_at = null;
        $user->save();

        return response()->json([
            'message' => 'Admin request approved successfully',
            'user' => $user->load('approvedByOwner:id,username'),
            'response_note' => $request->response_note
        ]);
    }

    /**
     * Deny admin request (Owner only)
     */
    public function denyAdminRequest(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'response_note' => 'nullable|string|max:500'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::findOrFail($request->user_id);

        // Check if user has pending request
        if (!$user->admin_request_pending) {
            return response()->json([
                'error' => 'No pending request',
                'message' => 'This user does not have a pending admin request.'
            ], 409);
        }

        // Clear request flags without promoting (explicit assignment for security)
        $user->admin_request_pending = false;
        $user->admin_request_reason = null;
        $user->admin_request_at = null;
        $user->save();

        return response()->json([
            'message' => 'Admin request denied successfully',
            'user' => $user,
            'response_note' => $request->response_note
        ]);
    }

    /**
     * Request admin access (Regular users only)
     */
    public function requestAdminAccess(Request $request)
    {
        $user = $request->user();
        
        // Only regular users can request admin access
        if ($user->role !== 'user') {
            return response()->json([
                'error' => 'Invalid request',
                'message' => 'Only regular users can request admin access.'
            ], 403);
        }

        // Check if user already has a pending request
        if ($user->admin_request_pending) {
            return response()->json([
                'error' => 'Request already pending',
                'message' => 'You already have a pending admin access request.'
            ], 409);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Mark user as having pending admin request (explicit assignment for security)
        $user->admin_request_pending = true;
        $user->admin_request_reason = $request->reason;
        $user->admin_request_at = now();
        $user->save();

        return response()->json([
            'message' => 'Admin access request submitted successfully',
            'user' => $user
        ]);
    }

    /**
     * Get admin statistics (Owner only)
     */
    public function getAdminStats(Request $request)
    {
        $stats = [
            'total_users' => User::count(),
            'total_admins' => User::where('role', 'admin')->where('is_admin_approved', true)->count(),
            'pending_admin_requests' => User::where('admin_request_pending', true)->count(),
            'total_owners' => User::where('role', 'owner')->count(),
            'recent_admin_approvals' => User::where('role', 'admin')
                ->where('is_admin_approved', true)
                ->where('admin_approved_at', '>=', now()->subDays(30))
                ->count()
        ];

        return response()->json([
            'message' => 'Admin statistics retrieved successfully',
            'stats' => $stats
        ]);
    }

    /**
     * Create owner account (Secure endpoint with strict validation)
     */
    public function createOwner(Request $request)
    {
        // Check if owner already exists
        if (User::where('role', 'owner')->exists()) {
            return response()->json([
                'error' => 'Owner already exists',
                'message' => 'Only one owner account is allowed. Contact system administrator.'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'username' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'display_name' => 'nullable|string|max:255',
            'setup_key' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Secure setup key check - NO DEFAULT FALLBACK
        $requiredSetupKey = env('OWNER_SETUP_KEY');
        if (!$requiredSetupKey) {
            return response()->json([
                'error' => 'Setup not configured',
                'message' => 'OWNER_SETUP_KEY environment variable must be set by system administrator.'
            ], 500);
        }

        if ($request->setup_key !== $requiredSetupKey) {
            return response()->json([
                'error' => 'Invalid setup key',
                'message' => 'You are not authorized to create owner accounts.'
            ], 403);
        }

        $user = User::create([
            'username' => $request->username,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'display_name' => $request->display_name ?? $request->username,
        ]);
        
        // Explicitly set owner role and approval (no mass assignment of sensitive fields)
        $user->role = 'owner';
        $user->is_admin_approved = true;
        $user->admin_approved_at = now();
        $user->save();

        $token = $user->createToken('owner_auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Owner account created successfully',
            'user' => $user,
            'token' => $token
        ], 201);
    }
}
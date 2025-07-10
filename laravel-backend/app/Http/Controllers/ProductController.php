<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    /**
     * Get all products with filtering
     */
    public function index(Request $request)
    {
        $query = Product::with('seller')->where('status', 'active');

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('seller_id')) {
            $query->where('seller_id', $request->seller_id);
        }

        $products = $query->orderBy('created_at', 'desc')
                         ->paginate($request->get('limit', 20));

        return response()->json($products);
    }

    /**
     * Get featured products
     */
    public function featured(Request $request)
    {
        $products = Product::with('seller')
                          ->where('status', 'active')
                          ->where('is_premium', true)
                          ->orderBy('rating', 'desc')
                          ->limit($request->get('limit', 10))
                          ->get();

        return response()->json($products);
    }

    /**
     * Get single product
     */
    public function show($id)
    {
        $product = Product::with('seller')->findOrFail($id);
        
        return response()->json($product);
    }

    /**
     * Create new product
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string',
            'price' => 'required|numeric|min:0',
            'thumbnail' => 'nullable|string',
            'images' => 'nullable|array',
            'game_data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $product = Product::create([
            'seller_id' => $request->user()->id,
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'price' => $request->price,
            'thumbnail' => $request->thumbnail,
            'images' => $request->images,
            'game_data' => $request->game_data,
        ]);

        return response()->json([
            'message' => 'Product created successfully',
            'product' => $product->load('seller')
        ], 201);
    }

    /**
     * Update product
     */
    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Check if user owns this product
        if ($product->seller_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'string|max:255',
            'description' => 'string',
            'category' => 'string',
            'price' => 'numeric|min:0',
            'thumbnail' => 'nullable|string',
            'images' => 'nullable|array',
            'game_data' => 'nullable|array',
            'status' => 'in:active,sold,draft',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $product->update($request->only([
            'title', 'description', 'category', 'price', 
            'thumbnail', 'images', 'game_data', 'status'
        ]));

        return response()->json([
            'message' => 'Product updated successfully',
            'product' => $product->load('seller')
        ]);
    }

    /**
     * Delete product
     */
    public function destroy(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        // Check if user owns this product
        if ($product->seller_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 403);
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully'
        ]);
    }
}

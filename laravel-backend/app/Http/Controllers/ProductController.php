<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('seller')
                        ->active()
                        ->orderBy('created_at', 'desc');

        if ($request->has('category') && $request->category) {
            $query->byCategory($request->category);
        }

        if ($request->has('seller_id') && $request->seller_id) {
            $query->bySeller($request->seller_id);
        }

        $limit = $request->get('limit', 20);
        $offset = $request->get('offset', 0);

        $products = $query->skip($offset)->take($limit)->get();

        return response()->json($products);
    }

    public function featured()
    {
        $products = Product::with('seller')
                          ->featured()
                          ->take(10)
                          ->get();

        return response()->json($products);
    }

    public function show($id)
    {
        $product = Product::with(['seller' => function($query) {
            $query->select('id', 'username', 'display_name', 'profile_picture', 'is_verified');
        }])->findOrFail($id);

        // Increment views
        $product->increment('views');

        return response()->json($product);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|in:mobile_legends,pubg,free_fire,valorant,genshin,minecraft,other',
            'price' => 'required|numeric|min:0',
            'images' => 'nullable|array',
            'game_data' => 'nullable|array',
        ]);

        $product = Product::create([
            'seller_id' => auth()->id(),
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'price' => $request->price,
            'images' => $request->images ?? [],
            'game_data' => $request->game_data ?? [],
            'thumbnail' => $request->images[0] ?? null,
        ]);

        return response()->json($product->load('seller'), 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::where('seller_id', auth()->id())->findOrFail($id);

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category' => 'sometimes|in:mobile_legends,pubg,free_fire,valorant,genshin,minecraft,other',
            'price' => 'sometimes|numeric|min:0',
            'images' => 'sometimes|array',
            'game_data' => 'sometimes|array',
            'status' => 'sometimes|in:active,sold,pending,inactive',
        ]);

        $product->update($request->all());

        return response()->json($product->load('seller'));
    }

    public function destroy($id)
    {
        $product = Product::where('seller_id', auth()->id())->findOrFail($id);
        $product->delete();

        return response()->json(['message' => 'Produk berhasil dihapus']);
    }
}
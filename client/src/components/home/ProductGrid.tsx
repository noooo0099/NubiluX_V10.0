import { Star, Repeat2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState } from "react";
import type { Product } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProductGridProps {
  category?: string;
}

export default function ProductGrid({ category }: ProductGridProps) {
  const [, setLocation] = useLocation();
  const [repostingProducts, setRepostingProducts] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: category !== "all" ? category : undefined }],
  });

  // Mutation for handling repost
  const repostMutation = useMutation({
    mutationFn: async ({ productId }: { productId: number }) => {
      return apiRequest('/api/reposts', {
        method: 'POST',
        body: JSON.stringify({ productId })
      });
    },
    onSuccess: (data, variables) => {
      const action = data.isReposted ? 'direpost' : 'dibatalkan repostnya';
      toast({
        title: data.isReposted ? "Berhasil repost!" : "Repost dibatalkan",
        description: `Produk telah ${action}`,
      });
      // Invalidate any repost-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/reposts'] });
    },
    onError: (error) => {
      toast({
        title: "Gagal repost",
        description: "Terjadi kesalahan saat mencoba repost produk",
        variant: "destructive",
      });
    }
  });

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseInt(price));
  };

  const handleProductClick = (productId: number) => {
    setLocation(`/product/${productId}`);
  };

  const handleRepost = async (e: React.MouseEvent, productId: number) => {
    e.stopPropagation(); // Prevent navigation to product page
    
    if (repostMutation.isPending) return;
    
    repostMutation.mutate({ productId });
  };

  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-semibold text-white mb-4">New Posting</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <div 
            key={product.id}
            className="nxe-product-card"
            onClick={() => handleProductClick(product.id)}
          >
            <div className="aspect-square overflow-hidden">
              <img 
                src={product.thumbnail || '/api/placeholder/300/300'}
                alt={product.title}
                className="w-full h-full object-cover" 
              />
            </div>
            
            <div className="p-3">
              <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                {product.title}
              </h3>
              <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                {product.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-nxe-accent font-bold text-sm">
                  {formatPrice(product.price)}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-400">{product.rating}</span>
                  </div>
                  <button
                    onClick={(e) => handleRepost(e, product.id)}
                    disabled={repostMutation.isPending}
                    className={`p-1.5 rounded-full transition-colors ${
                      repostMutation.isPending 
                        ? 'text-gray-500 cursor-not-allowed' 
                        : 'text-gray-400 hover:text-nxe-primary hover:bg-nxe-primary/10'
                    }`}
                    data-testid={`button-repost-${product.id}`}
                    title="Repost produk ini"
                  >
                    <Repeat2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

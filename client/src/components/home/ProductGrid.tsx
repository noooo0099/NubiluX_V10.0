import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { Product } from "@shared/schema";

interface ProductGridProps {
  category?: string;
}

export default function ProductGrid({ category }: ProductGridProps) {
  const [, setLocation] = useLocation();
  
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: category !== "all" ? category : undefined }],
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

  return (
    <section className="px-4 py-4">
      <h2 className="text-lg font-semibold text-white mb-4">Latest Products</h2>
      
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
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-400">{product.rating}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

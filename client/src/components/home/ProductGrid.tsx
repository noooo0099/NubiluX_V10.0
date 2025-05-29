import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface ProductGridProps {
  category?: string;
}

export default function ProductGrid({ category }: ProductGridProps) {
  const [, setLocation] = useLocation();
  
  const { data: products = [] } = useQuery({
    queryKey: ["/api/products", { category: category !== "all" ? category : undefined }],
  });

  // Sample products for demo
  const sampleProducts = [
    {
      id: 1,
      title: "Free Fire Diamond Account",
      description: "5000+ diamonds, rare bundles, elite pass maxed",
      price: "450000",
      thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      rating: "4.8"
    },
    {
      id: 2,
      title: "Valorant Immortal Account",
      description: "Immortal rank, Phantom/Vandal skins, battlepass",
      price: "3200000",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      rating: "4.9"
    },
    {
      id: 3,
      title: "Rank Boost Service",
      description: "Professional rank boosting, safe & fast",
      price: "200000",
      thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      rating: "4.6"
    },
    {
      id: 4,
      title: "Genshin Impact AR 55",
      description: "Multiple 5-star characters, weapons, primogems",
      price: "1500000",
      thumbnail: "https://images.unsplash.com/photo-1556438064-2d7646166914?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300",
      rating: "4.7"
    }
  ];

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
        {sampleProducts.map((product) => (
          <div 
            key={product.id}
            className="nxe-product-card"
            onClick={() => handleProductClick(product.id)}
          >
            <div className="aspect-square overflow-hidden">
              <img 
                src={product.thumbnail}
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

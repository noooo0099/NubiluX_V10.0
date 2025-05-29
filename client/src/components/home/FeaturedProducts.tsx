import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FeaturedProducts() {
  const [, setLocation] = useLocation();
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ["/api/products/featured"],
  });

  // Sample featured products for demo
  const sampleProducts = [
    {
      id: 1,
      title: "Mobile Legends Epic Account - 54 Skins",
      description: "Mythic rank, all heroes unlocked, premium skins collection",
      price: "2500000",
      thumbnail: "https://images.unsplash.com/photo-1556438064-2d7646166914?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      rating: "4.9",
      isPremium: true
    },
    {
      id: 2,
      title: "PUBG Mobile Conqueror Account",
      description: "Season 20 Conqueror, rare outfits, maxed weapons",
      price: "1800000",
      thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
      rating: "4.7",
      isPremium: false
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
    <section className="px-4 py-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Featured Products</h2>
        <button className="text-nxe-primary text-sm font-medium hover:text-nxe-accent transition-colors">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {sampleProducts.map((product) => (
          <Card 
            key={product.id}
            className={`nxe-featured-card ${product.isPremium ? 'animate-pulse-glow' : ''}`}
            onClick={() => handleProductClick(product.id)}
          >
            <CardContent className="p-0">
              <div className="flex space-x-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={product.thumbnail}
                    alt={product.title}
                    className="w-full h-full object-cover" 
                  />
                </div>
                
                <div className="flex-1 min-w-0 py-2">
                  <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                    {product.title}
                  </h3>
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-nxe-accent font-bold text-sm">
                        {formatPrice(product.price)}
                      </span>
                      {product.isPremium && (
                        <Badge className="bg-nxe-primary px-2 py-1 text-xs text-white">
                          Premium
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-400">{product.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

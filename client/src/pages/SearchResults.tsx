import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Filter,
  SortAsc,
  Star,
  Eye,
  Clock,
  Users,
  ArrowLeft,
  Gamepad2
} from "lucide-react";
import { useLocation } from "wouter";

interface Product {
  id: number;
  title: string;
  description: string;
  price: string;
  thumbnail: string;
  rating: number;
  reviewCount: number;
  category: string;
  isPremium: boolean;
  seller: {
    username: string;
    isVerified: boolean;
  };
  gameData: {
    rank?: string;
    level?: number;
    skins?: number;
  };
  createdAt: string;
}

interface SearchFilters {
  category: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  isPremium: string;
}

export default function SearchResults() {
  const [, params] = useRoute("/search");
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({
    category: "all",
    minPrice: "",
    maxPrice: "",
    sortBy: "relevance",
    isPremium: "all"
  });

  // Get search query from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q') || '';
    setSearchQuery(q);
  }, []);

  // Fetch search results
  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: [
      `/api/search?q=${encodeURIComponent(searchQuery)}&category=${filters.category}&minPrice=${filters.minPrice}&maxPrice=${filters.maxPrice}&sortBy=${filters.sortBy}&isPremium=${filters.isPremium}`
    ],
    enabled: !!searchQuery.trim()
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseInt(price));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari lalu`;
  };

  const results = searchResults as Product[];

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Header */}
      <div className="p-4 border-b border-nxe-border">
        <div className="flex items-center space-x-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-nxe-primary hover:bg-nxe-primary/10"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Kembali
          </Button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari akun game, rank, skin, atau kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-nxe-surface border-nxe-border text-white placeholder-gray-400"
            data-testid="input-search"
          />
          <Button 
            type="submit" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-nxe-primary hover:bg-nxe-primary/80"
            size="sm"
          >
            Cari
          </Button>
        </form>

        {searchQuery && (
          <p className="text-nxe-text">
            Menampilkan hasil untuk: <span className="text-white font-medium">"{searchQuery}"</span>
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-nxe-border">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm text-nxe-text mb-1 block">Kategori</label>
            <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
              <SelectTrigger className="bg-nxe-surface border-nxe-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-nxe-surface border-nxe-border">
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="mobile_legends">Mobile Legends</SelectItem>
                <SelectItem value="pubg_mobile">PUBG Mobile</SelectItem>
                <SelectItem value="free_fire">Free Fire</SelectItem>
                <SelectItem value="valorant">Valorant</SelectItem>
                <SelectItem value="genshin_impact">Genshin Impact</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm text-nxe-text mb-1 block">Harga Min</label>
            <Input
              type="number"
              placeholder="0"
              value={filters.minPrice}
              onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
              className="bg-nxe-surface border-nxe-border text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-nxe-text mb-1 block">Harga Max</label>
            <Input
              type="number"
              placeholder="1000000"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              className="bg-nxe-surface border-nxe-border text-white"
            />
          </div>
          
          <div>
            <label className="text-sm text-nxe-text mb-1 block">Urut berdasarkan</label>
            <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
              <SelectTrigger className="bg-nxe-surface border-nxe-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-nxe-surface border-nxe-border">
                <SelectItem value="relevance">Relevansi</SelectItem>
                <SelectItem value="price_low">Harga Terendah</SelectItem>
                <SelectItem value="price_high">Harga Tertinggi</SelectItem>
                <SelectItem value="rating">Rating Tertinggi</SelectItem>
                <SelectItem value="newest">Terbaru</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm text-nxe-text mb-1 block">Tipe Akun</label>
            <Select value={filters.isPremium} onValueChange={(value) => setFilters({...filters, isPremium: value})}>
              <SelectTrigger className="bg-nxe-surface border-nxe-border text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-nxe-surface border-nxe-border">
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {!searchQuery.trim() ? (
          <div className="text-center py-12">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Mulai pencarian Anda
            </h3>
            <p className="text-nxe-text">
              Masukkan kata kunci untuk mencari akun gaming yang Anda inginkan
            </p>
          </div>
        ) : isLoading ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-nxe-border rounded animate-pulse w-32" />
              <div className="h-6 bg-nxe-border rounded animate-pulse w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-nxe-surface border-nxe-border">
                  <CardContent className="p-4">
                    <div className="w-full h-48 bg-nxe-border rounded animate-pulse mb-4" />
                    <div className="h-4 bg-nxe-border rounded animate-pulse mb-2" />
                    <div className="h-4 bg-nxe-border rounded animate-pulse w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Results Summary */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-white">
                Ditemukan <span className="font-semibold text-nxe-primary">{results.length}</span> hasil
              </p>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-nxe-primary" />
                <span className="text-sm text-nxe-text">
                  {results.filter(p => p.seller.isVerified).length} dari penjual terverifikasi
                </span>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-12">
                <Gamepad2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Tidak ada hasil ditemukan
                </h3>
                <p className="text-nxe-text mb-4">
                  Coba ubah kata kunci atau filter pencarian Anda
                </p>
                <div className="flex justify-center space-x-2">
                  <Button 
                    onClick={() => setFilters({
                      category: "all",
                      minPrice: "",
                      maxPrice: "",
                      sortBy: "relevance",
                      isPremium: "all"
                    })}
                    variant="outline"
                    className="border-nxe-primary text-nxe-primary hover:bg-nxe-primary hover:text-white"
                  >
                    Reset Filter
                  </Button>
                  <Button 
                    onClick={() => setLocation("/categories")}
                    className="bg-nxe-primary hover:bg-nxe-primary/80 text-white"
                  >
                    Jelajahi Kategori
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map((product: Product) => (
                  <Card
                    key={product.id}
                    className="bg-nxe-surface border-nxe-border hover:border-nxe-primary/50 transition-all duration-200 cursor-pointer group"
                    onClick={() => setLocation(`/product/${product.id}`)}
                    data-testid={`card-product-${product.id}`}
                  >
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="relative">
                        <img
                          src={product.thumbnail || `/api/placeholder/300/200?text=${product.category}`}
                          alt={product.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        {product.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-yellow-600 text-white">
                            Premium
                          </Badge>
                        )}
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-black/70 text-white text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(product.createdAt)}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-nxe-primary transition-colors">
                          {product.title}
                        </h3>
                        
                        {/* Game Data */}
                        {product.gameData && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {product.gameData.rank && (
                              <Badge variant="outline" className="text-xs">
                                {product.gameData.rank}
                              </Badge>
                            )}
                            {product.gameData.level && (
                              <Badge variant="outline" className="text-xs">
                                Level {product.gameData.level}
                              </Badge>
                            )}
                            {product.gameData.skins && (
                              <Badge variant="outline" className="text-xs">
                                {product.gameData.skins} Skin
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Price & Rating */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-bold text-nxe-primary">
                            {formatPrice(product.price)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-white">
                              {product.rating} ({product.reviewCount})
                            </span>
                          </div>
                        </div>

                        {/* Seller Info */}
                        <div className="flex items-center justify-between text-sm text-nxe-text">
                          <div className="flex items-center space-x-1">
                            <span>@{product.seller.username}</span>
                            {product.seller.isVerified && (
                              <Badge className="bg-blue-600 text-white text-xs px-1 py-0">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{Math.floor(Math.random() * 200) + 50}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
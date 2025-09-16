import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Search,
  Filter,
  SortAsc,
  Star,
  Eye,
  Clock,
  Users,
  ArrowLeft,
  Gamepad2,
  ChevronDown,
  X
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
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
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-nxe-dark/95 backdrop-blur-sm border-b border-nxe-border">
        {/* Top Navigation */}
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-nxe-primary hover:bg-nxe-primary/10 p-2"
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-lg font-semibold text-white">Pencarian</h1>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="text-nxe-text hover:text-nxe-primary hover:bg-nxe-primary/10 p-2"
            data-testid="button-filters"
          >
            <Filter className="h-5 w-5" />
          </Button>
        </div>

        {/* Enhanced Search Bar */}
        <div className="px-4 pb-4">
          <form onSubmit={handleSearch} className="relative">
            <div className={`relative flex items-center transition-all duration-300 ${
              searchFocused ? 'ring-2 ring-nxe-primary/30' : ''
            }`}>
              <Search className="absolute left-4 h-5 w-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Cari akun game, rank, skin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="w-full h-12 pl-12 pr-20 bg-gray-700/90 border-0 rounded-full text-white placeholder-gray-400 focus:outline-none focus:bg-gray-600/90 focus:ring-0 transition-all duration-300"
                data-testid="input-search"
              />
              {searchQuery && (
                <Button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-14 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-500/20 rounded-full transition-all duration-200"
                  variant="ghost"
                  size="sm"
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </Button>
              )}
              <Button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-nxe-primary hover:bg-nxe-primary/80 rounded-full h-8 w-8 p-0 transition-all duration-200"
                data-testid="button-search"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
          
          {searchQuery && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-nxe-text">
                Hasil untuk: <span className="text-white font-medium">"{searchQuery}"</span>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Filters for Mobile */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="border-b border-nxe-border">
          <div className="p-4 space-y-4">
            {/* Primary Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-nxe-text mb-2 block font-medium">Kategori</label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger className="bg-nxe-surface border-nxe-border text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-nxe-surface border-nxe-border">
                    <SelectItem value="all">Semua Kategori</SelectItem>
                    <SelectItem value="mobile_legends">Mobile Legends</SelectItem>
                    <SelectItem value="pubg_mobile">PUBG Mobile</SelectItem>
                    <SelectItem value="free_fire">Free Fire</SelectItem>
                    <SelectItem value="valorant">Valorant</SelectItem>
                    <SelectItem value="genshin_impact">Genshin Impact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm text-nxe-text mb-2 block font-medium">Urut berdasarkan</label>
                <Select value={filters.sortBy} onValueChange={(value) => setFilters({...filters, sortBy: value})}>
                  <SelectTrigger className="bg-nxe-surface border-nxe-border text-white h-11">
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
            </div>

            {/* Price Range and Premium Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-nxe-text mb-2 block font-medium">Harga Minimum</label>
                <Input
                  type="number"
                  placeholder="Rp 0"
                  value={filters.minPrice}
                  onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                  className="bg-nxe-surface border-nxe-border text-white h-11"
                  data-testid="input-min-price"
                />
              </div>
              
              <div>
                <label className="text-sm text-nxe-text mb-2 block font-medium">Harga Maksimum</label>
                <Input
                  type="number"
                  placeholder="Rp 1.000.000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                  className="bg-nxe-surface border-nxe-border text-white h-11"
                  data-testid="input-max-price"
                />
              </div>
              
              <div>
                <label className="text-sm text-nxe-text mb-2 block font-medium">Tipe Akun</label>
                <Select value={filters.isPremium} onValueChange={(value) => setFilters({...filters, isPremium: value})}>
                  <SelectTrigger className="bg-nxe-surface border-nxe-border text-white h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-nxe-surface border-nxe-border">
                    <SelectItem value="all">Semua Tipe</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button 
                onClick={() => setFilters({
                  category: "all",
                  minPrice: "",
                  maxPrice: "",
                  sortBy: "relevance",
                  isPremium: "all"
                })}
                variant="outline"
                size="sm"
                className="border-nxe-border text-nxe-text hover:bg-nxe-surface"
                data-testid="button-reset-filters"
              >
                Reset Filter
              </Button>
              
              <Button 
                onClick={() => setIsFiltersOpen(false)}
                size="sm"
                className="bg-nxe-primary hover:bg-nxe-primary/80 text-white"
                data-testid="button-apply-filters"
              >
                Terapkan Filter
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results */}
      <div className="px-3 sm:px-4 pb-6">
        {!searchQuery.trim() ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-sm mx-auto">
              <Search className="h-20 w-20 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-white mb-3">
                Mulai pencarian Anda
              </h3>
              <p className="text-nxe-text text-sm leading-relaxed">
                Masukkan kata kunci untuk mencari akun gaming yang Anda inginkan
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div>
            <div className="flex items-center justify-between mb-6 px-1">
              <div className="h-5 bg-nxe-border rounded animate-pulse w-28" />
              <div className="h-5 bg-nxe-border rounded animate-pulse w-20" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-nxe-surface border-nxe-border overflow-hidden">
                  <CardContent className="p-0">
                    <div className="w-full h-40 sm:h-48 bg-nxe-border animate-pulse" />
                    <div className="p-3 sm:p-4 space-y-3">
                      <div className="h-4 bg-nxe-border rounded animate-pulse" />
                      <div className="h-4 bg-nxe-border rounded animate-pulse w-3/4" />
                      <div className="flex justify-between items-center">
                        <div className="h-5 bg-nxe-border rounded animate-pulse w-20" />
                        <div className="h-4 bg-nxe-border rounded animate-pulse w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Results Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 px-1 gap-3">
              <p className="text-white font-medium">
                Ditemukan <span className="font-bold text-nxe-primary">{results.length}</span> hasil
              </p>
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-nxe-primary" />
                <span className="text-sm text-nxe-text">
                  {results.filter(p => p.seller.isVerified).length} penjual terverifikasi
                </span>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="max-w-sm mx-auto">
                  <Gamepad2 className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-3">
                    Tidak ada hasil ditemukan
                  </h3>
                  <p className="text-nxe-text mb-6 text-sm leading-relaxed">
                    Coba ubah kata kunci atau filter pencarian Anda untuk menemukan akun gaming yang diinginkan
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <Button 
                      onClick={() => setFilters({
                        category: "all",
                        minPrice: "",
                        maxPrice: "",
                        sortBy: "relevance",
                        isPremium: "all"
                      })}
                      variant="outline"
                      className="border-nxe-primary text-nxe-primary hover:bg-nxe-primary hover:text-white w-full sm:w-auto"
                      data-testid="button-reset-filters-empty"
                    >
                      Reset Filter
                    </Button>
                    <Button 
                      onClick={() => setLocation("/categories")}
                      className="bg-nxe-primary hover:bg-nxe-primary/80 text-white w-full sm:w-auto"
                      data-testid="button-explore-categories"
                    >
                      Jelajahi Kategori
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {results.map((product: Product) => (
                  <Card
                    key={product.id}
                    className="bg-nxe-surface border-nxe-border hover:border-nxe-primary/50 transition-all duration-200 cursor-pointer group overflow-hidden"
                    onClick={() => setLocation(`/product/${product.id}`)}
                    data-testid={`card-product-${product.id}`}
                  >
                    <CardContent className="p-0">
                      {/* Product Image */}
                      <div className="relative">
                        <img
                          src={product.thumbnail || `/api/placeholder/300/200?text=${product.category}`}
                          alt={product.title}
                          className="w-full h-40 sm:h-48 object-cover"
                        />
                        {product.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-yellow-600 text-white text-xs">
                            Premium
                          </Badge>
                        )}
                        <div className="absolute bottom-2 left-2">
                          <Badge className="bg-black/70 text-white text-xs px-2 py-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTimeAgo(product.createdAt)}
                          </Badge>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 sm:p-4">
                        <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-nxe-primary transition-colors text-sm sm:text-base">
                          {product.title}
                        </h3>
                        
                        {/* Game Data */}
                        {product.gameData && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {product.gameData.rank && (
                              <Badge variant="outline" className="text-xs border-nxe-border text-nxe-text">
                                {product.gameData.rank}
                              </Badge>
                            )}
                            {product.gameData.level && (
                              <Badge variant="outline" className="text-xs border-nxe-border text-nxe-text">
                                Level {product.gameData.level}
                              </Badge>
                            )}
                            {product.gameData.skins && (
                              <Badge variant="outline" className="text-xs border-nxe-border text-nxe-text">
                                {product.gameData.skins} Skin
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Price & Rating */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg sm:text-xl font-bold text-nxe-primary">
                            {formatPrice(product.price)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-white">
                              {product.rating}
                            </span>
                            <span className="text-xs text-nxe-text">
                              ({product.reviewCount})
                            </span>
                          </div>
                        </div>

                        {/* Seller Info */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-1 min-w-0 flex-1">
                            <span className="text-nxe-text truncate">@{product.seller.username}</span>
                            {product.seller.isVerified && (
                              <Badge className="bg-blue-600 text-white text-xs px-1.5 py-0.5 ml-1 shrink-0">
                                ✓
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 text-nxe-text shrink-0 ml-2">
                            <Eye className="h-3 w-3" />
                            <span className="text-xs">{Math.floor(Math.random() * 200) + 50}</span>
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
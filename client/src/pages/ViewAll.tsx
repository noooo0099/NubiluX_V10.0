import { useState, useMemo } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Star, 
  Filter,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  ArrowLeft,
  Gamepad2,
  TrendingUp,
  Clock,
  DollarSign
} from "lucide-react";

// Product interface for type safety
interface Product {
  id: number;
  title: string;
  description: string;
  price: string;
  category: string;
  thumbnail: string;
  rating: string;
  isPremium: boolean;
  seller: string;
  createdAt: string;
}

// Game categories untuk filter
const gameCategories = [
  { id: "all", name: "Semua Game", color: "bg-gray-600" },
  { id: "mobile_legends", name: "Mobile Legends", color: "bg-blue-600" },
  { id: "pubg_mobile", name: "PUBG Mobile", color: "bg-orange-600" },
  { id: "free_fire", name: "Free Fire", color: "bg-red-600" },
  { id: "valorant", name: "Valorant", color: "bg-purple-600" },
  { id: "genshin_impact", name: "Genshin Impact", color: "bg-cyan-600" },
  { id: "call_of_duty", name: "Call of Duty Mobile", color: "bg-yellow-600" }
];

// Sorting options
const sortOptions = [
  { value: "newest", label: "Terbaru", icon: Clock },
  { value: "price_low", label: "Harga Terendah", icon: SortAsc },
  { value: "price_high", label: "Harga Tertinggi", icon: SortDesc },
  { value: "rating", label: "Rating Tertinggi", icon: Star },
  { value: "popular", label: "Terpopuler", icon: TrendingUp }
];

export default function ViewAll() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/view-all/:type?");
  
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Get type from URL params (products, categories, featured)
  const pageType = params?.type ?? "products";

  // Demo products data - replace with real API integration
  // Note: This component currently uses sample data for demonstration
  // In production, integrate with backend API for real product data
  const sampleProducts: Product[] = [
    {
      id: 1,
      title: "Mobile Legends Epic Account - 54 Skins",
      description: "Mythic rank, all heroes unlocked, premium skins collection including limited editions",
      price: "2500000",
      category: "mobile_legends",
      thumbnail: "https://images.unsplash.com/photo-1556438064-2d7646166914?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      rating: "4.9",
      isPremium: true,
      seller: "GameMaster",
      createdAt: "2024-01-15"
    },
    {
      id: 2,
      title: "PUBG Mobile Conqueror Account",
      description: "Season 20 Conqueror, rare outfits, maxed weapons, mythic items",
      price: "1800000",
      category: "pubg_mobile",
      thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      rating: "4.7",
      isPremium: false,
      seller: "ProGamer",
      createdAt: "2024-01-14"
    },
    {
      id: 3,
      title: "Free Fire Diamond Account 50K+",
      description: "50,000+ diamonds, elite pass maxed, rare bundles, pet evolution complete",
      price: "450000",
      category: "free_fire",
      thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      rating: "4.8",
      isPremium: true,
      seller: "FFKing",
      createdAt: "2024-01-13"
    },
    {
      id: 4,
      title: "Valorant Immortal Account Premium",
      description: "Immortal rank, Phantom/Vandal skins, battlepass completed, rare knife collection",
      price: "3200000",
      category: "valorant",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      rating: "4.9",
      isPremium: true,
      seller: "ValoMaster",
      createdAt: "2024-01-12"
    },
    {
      id: 5,
      title: "Genshin Impact AR 58 Whale Account",
      description: "Multiple 5-star characters C6, R5 weapons, abundant primogems, all regions 100%",
      price: "4500000",
      category: "genshin_impact",
      thumbnail: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      rating: "4.9",
      isPremium: true,
      seller: "GenshinWhale",
      createdAt: "2024-01-11"
    },
    {
      id: 6,
      title: "Call of Duty Mobile Legendary",
      description: "Mythic weapons collection, legendary skins, maxed battle pass, rare camos",
      price: "1200000",
      category: "call_of_duty",
      thumbnail: "https://images.unsplash.com/photo-1556438064-2d7646166914?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      rating: "4.6",
      isPremium: false,
      seller: "CODLegend",
      createdAt: "2024-01-10"
    }
  ];

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = sampleProducts;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.seller.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          return parseInt(a.price) - parseInt(b.price);
        case "price_high":
          return parseInt(b.price) - parseInt(a.price);
        case "rating":
          return parseFloat(b.rating) - parseFloat(a.rating);
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "popular":
          return parseFloat(b.rating) - parseFloat(a.rating); // For demo, use rating as popularity
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedCategory, sortBy]);

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

  const getPageTitle = () => {
    switch (pageType) {
      case "featured":
        return "Produk Unggulan";
      case "categories":
        return "Semua Kategori";
      default:
        return "Semua Produk";
    }
  };

  const getPageDescription = () => {
    switch (pageType) {
      case "featured":
        return "Koleksi akun gaming terbaik dan paling populer";
      case "categories":
        return "Jelajahi semua kategori game yang tersedia";
      default:
        return "Temukan akun gaming impian Anda dengan harga terbaik";
    }
  };

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Header */}
      <div className="sticky top-14 z-30 bg-nxe-dark/95 backdrop-blur-md border-b border-nxe-surface">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
              className="text-white hover:bg-nxe-surface"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {getPageTitle()}
              </h1>
              <p className="text-sm text-nxe-text">
                {getPageDescription()}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Cari produk, penjual, atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-nxe-surface border-nxe-border text-white placeholder-gray-400"
              data-testid="input-search-products"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-nxe-border text-white hover:bg-nxe-surface"
                data-testid="button-toggle-filters"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-nxe-surface border-nxe-border text-white" data-testid="select-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-nxe-surface border-nxe-border">
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value} className="text-white hover:bg-nxe-primary/20">
                      <div className="flex items-center space-x-2">
                        <option.icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="p-2"
                data-testid="button-grid-view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="p-2"
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Category Filter Chips */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {gameCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "secondary"}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedCategory === category.id
                      ? "bg-nxe-primary text-white"
                      : "bg-nxe-surface text-nxe-text hover:bg-nxe-primary/20"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                  data-testid={`filter-category-${category.id}`}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between text-sm text-nxe-text">
            <span data-testid="text-results-count">
              {filteredProducts.length} produk ditemukan
            </span>
            {selectedCategory !== "all" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory("all")}
                className="text-nxe-primary hover:bg-nxe-primary/10"
                data-testid="button-clear-category"
              >
                Reset Filter
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="p-4">
        {filteredProducts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Gamepad2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Produk tidak ditemukan
            </h3>
            <p className="text-nxe-text mb-4">
              Coba ubah kata kunci pencarian atau filter Anda
            </p>
            <Button 
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              variant="outline"
              className="border-nxe-primary text-nxe-primary hover:bg-nxe-primary hover:text-white"
              data-testid="button-reset-search"
            >
              Reset Pencarian
            </Button>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-4" : "space-y-4"}>
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`bg-nxe-surface border-nxe-border hover:border-nxe-primary/50 transition-all duration-200 cursor-pointer group ${
                  product.isPremium ? "ring-1 ring-nxe-primary/30" : ""
                }`}
                onClick={() => handleProductClick(product.id)}
                data-testid={`card-product-${product.id}`}
              >
                <CardContent className="p-0">
                  {viewMode === "grid" ? (
                    /* Grid View */
                    <div>
                      <div className="aspect-square overflow-hidden rounded-t-lg relative">
                        <img 
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        />
                        {product.isPremium && (
                          <Badge className="absolute top-2 right-2 bg-nxe-primary text-white text-xs">
                            Premium
                          </Badge>
                        )}
                      </div>
                      
                      <div className="p-3">
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2 group-hover:text-nxe-primary transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-nxe-primary font-bold text-sm">
                            {formatPrice(product.price)}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-400">{product.rating}</span>
                          </div>
                        </div>
                        
                        <div className="text-xs text-nxe-text">
                          oleh {product.seller}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* List View */
                    <div className="flex space-x-4 p-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <img 
                          src={product.thumbnail}
                          alt={product.title}
                          className="w-full h-full object-cover" 
                        />
                        {product.isPremium && (
                          <Badge className="absolute -top-1 -right-1 bg-nxe-primary text-white text-xs px-1">
                            P
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-1 group-hover:text-nxe-primary transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-nxe-primary font-bold text-sm block">
                              {formatPrice(product.price)}
                            </span>
                            <div className="text-xs text-nxe-text">
                              oleh {product.seller}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-400">{product.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
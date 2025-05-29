import { useState } from "react";
import { useParams } from "wouter";
import { ArrowLeft, Star, Heart, Share, MessageCircle, Shield, Eye, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface ProductDetail {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  category: string;
  price: string;
  thumbnail?: string;
  images: string[];
  gameData: Record<string, any>;
  status: string;
  isPremium: boolean;
  rating: string;
  reviewCount: number;
  createdAt: string;
  seller?: {
    id: number;
    username: string;
    displayName?: string;
    profilePicture?: string;
    isVerified: boolean;
    rating?: string;
  };
}

export default function ProductDetail() {
  const { id: productId } = useParams();
  const [, setLocation] = useLocation();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch product details
  const { data: product, isLoading } = useQuery<ProductDetail>({
    queryKey: [`/api/products/${productId}`],
  });

  // Create chat mutation
  const createChatMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("Product not found");
      return apiRequest('POST', '/api/chats', {
        productId: product.id,
        sellerId: product.sellerId
      });
    },
    onSuccess: (response) => {
      toast({
        title: "Chat created",
        description: "You can now message the seller",
      });
      setLocation(`/chat/${response.id}`);
    },
    onError: () => {
      toast({
        title: "Failed to create chat",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  });

  const handleBuyNow = () => {
    if (!product) return;
    createChatMutation.mutate();
  };

  const handleContactSeller = () => {
    if (!product) return;
    createChatMutation.mutate();
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from wishlist" : "Added to wishlist",
      description: isLiked ? "Product removed from your wishlist" : "Product added to your wishlist",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard",
      });
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseInt(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryDisplay = (category: string) => {
    const categories: Record<string, string> = {
      mobile_legends: "Mobile Legends",
      pubg_mobile: "PUBG Mobile",
      free_fire: "Free Fire",
      valorant: "Valorant",
      genshin_impact: "Genshin Impact",
    };
    return categories[category] || category;
  };

  if (isLoading || !product) {
    return (
      <div className="min-h-screen bg-nxe-dark flex items-center justify-center">
        <div className="text-white">Loading product...</div>
      </div>
    );
  }

  const allImages = product.images.length > 0 ? product.images : [
    product.thumbnail || `https://images.unsplash.com/photo-${1400 + product.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600`
  ];

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-nxe-dark/95 backdrop-blur-md border-b border-nxe-surface">
        <div className="flex items-center justify-between px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLike}
              className="p-2"
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="p-2"
            >
              <Share className="h-5 w-5 text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div className="relative">
        <div className="aspect-square overflow-hidden">
          <img
            src={allImages[selectedImageIndex]}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {product.isPremium && (
          <Badge className="absolute top-4 left-4 bg-nxe-primary">
            Premium
          </Badge>
        )}

        {allImages.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-6">
        {/* Title and Price */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <h1 className="text-2xl font-bold text-white flex-1 mr-4">
              {product.title}
            </h1>
            <div className="text-right">
              <p className="text-3xl font-bold text-nxe-accent">
                {formatCurrency(product.price)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge variant="outline" className="border-nxe-primary text-nxe-primary">
              {getCategoryDisplay(product.category)}
            </Badge>
            
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-white font-medium">{product.rating}</span>
              <span className="text-gray-400">({product.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <Card className="bg-nxe-card border-nxe-surface">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage 
                  src={product.seller?.profilePicture || `https://images.unsplash.com/photo-${1500 + product.sellerId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100`}
                  alt={product.seller?.username}
                />
                <AvatarFallback>
                  {product.seller?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-white font-medium">
                    {product.seller?.displayName || product.seller?.username || 'Seller'}
                  </p>
                  {product.seller?.isVerified && (
                    <Shield className="h-4 w-4 text-nxe-accent" />
                  )}
                </div>
                {product.seller?.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-400">{product.seller.rating} seller rating</span>
                  </div>
                )}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation(`/profile/${product.sellerId}`)}
                className="border-nxe-surface"
              >
                View Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">Description</h2>
          <p className="text-gray-300 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Game Details */}
        {Object.keys(product.gameData).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-white mb-3">Game Details</h2>
            <Card className="bg-nxe-card border-nxe-surface">
              <CardContent className="p-4 space-y-3">
                {Object.entries(product.gameData).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-white">{String(value)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Product Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-nxe-card border-nxe-surface">
            <CardContent className="p-3 text-center">
              <Eye className="h-5 w-5 mx-auto text-gray-400 mb-1" />
              <p className="text-sm text-gray-400">Views</p>
              <p className="text-lg font-bold text-white">1,234</p>
            </CardContent>
          </Card>
          
          <Card className="bg-nxe-card border-nxe-surface">
            <CardContent className="p-3 text-center">
              <Calendar className="h-5 w-5 mx-auto text-gray-400 mb-1" />
              <p className="text-sm text-gray-400">Listed</p>
              <p className="text-sm font-medium text-white">
                {formatDate(product.createdAt)}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-nxe-dark/95 backdrop-blur-md border-t border-nxe-surface p-4">
        <div className="flex space-x-3">
          <Button
            onClick={handleContactSeller}
            variant="outline"
            className="flex-1 border-nxe-surface"
            disabled={createChatMutation.isPending}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Contact Seller
          </Button>
          
          <Button
            onClick={handleBuyNow}
            className="flex-1 bg-nxe-primary hover:bg-nxe-primary/80"
            disabled={createChatMutation.isPending}
          >
            Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}

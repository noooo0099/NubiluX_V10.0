import { useState, useRef } from "react";
import { useParams } from "wouter";
import { Edit3, Settings, Star, ShoppingBag, MessageCircle, Shield, Camera, Heart, UserPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  displayName?: string;
  bio?: string;
  profilePicture?: string;
  bannerImage?: string;
  role: 'buyer' | 'seller';
  isVerified: boolean;
  walletBalance: string;
  createdAt: string;
}

interface Product {
  id: number;
  title: string;
  price: string;
  thumbnail?: string;
  status: string;
  rating: string;
  createdAt: string;
}

export default function Profile() {
  const { id: profileId } = useParams();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const currentUserId = user?.id || 0;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine effective profile ID
  const effectiveProfileId = profileId || String(currentUserId);
  const isOwnProfile = parseInt(effectiveProfileId) === currentUserId;
  
  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/profile/${effectiveProfileId}`],
    enabled: Boolean(effectiveProfileId),
  });

  // Fetch user's products with pagination
  const { data: products = [], isLoading: isProductsLoading } = useQuery<Product[]>({
    queryKey: [`/api/products`, { sellerId: Number(effectiveProfileId), limit: 12, offset: 0 }],
    enabled: Boolean(effectiveProfileId),
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      return apiRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/profile/${effectiveProfileId}`] });
      setIsEditing(false);
      setBannerPreview(null); // Clear banner preview after successful save
      toast({
        title: "Profile updated successfully",
        description: "Your changes have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to update profile",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  });

  const handleBannerClick = () => {
    bannerInputRef.current?.click();
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 300KB for better performance)
      if (file.size > 300 * 1024) {
        toast({
          title: "File too large",
          description: "Banner image must be less than 300KB for optimal performance",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Compress and resize image before storage
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Set max dimensions (1200px width for banners)
        const maxWidth = 1200;
        const maxHeight = 400;
        
        let { width, height } = img;
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedImage = canvas.toDataURL('image/jpeg', 0.7); // 70% quality
        setBannerPreview(compressedImage);
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  const handleSaveProfile = (formData: FormData) => {
    const updates = {
      displayName: formData.get('displayName') as string,
      bio: formData.get('bio') as string,
      ...(bannerPreview && { bannerImage: bannerPreview }),
    };
    updateProfileMutation.mutate(updates);
  };

  const handleStartChat = () => {
    // Create a new chat with this user
    setLocation("/chat");
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
      month: 'long'
    });
  };

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-nxe-dark flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="mobile-viewport-fix keyboard-smooth bg-nxe-dark pb-24">
      {/* Profile Header */}
      <div className="relative">
        {/* Banner - Enhanced with dynamic patterns */}
        <div 
          className="h-40 md:h-56 relative overflow-hidden"
          style={{
            backgroundImage: (bannerPreview || profile.bannerImage) ? `url(${bannerPreview || profile.bannerImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Dynamic background patterns when no banner image */}
          {!(bannerPreview || profile.bannerImage) && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-green-800" />
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
                <div className="absolute top-12 right-8 w-16 h-16 bg-nxe-primary/20 rounded-full blur-lg animate-bounce" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-8 left-12 w-12 h-12 bg-nxe-accent/20 rounded-full blur-md animate-ping" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/3 w-32 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-45" />
                <div className="absolute top-1/3 right-1/4 w-24 h-1 bg-gradient-to-r from-transparent via-nxe-primary/30 to-transparent -rotate-45" />
              </div>
            </>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-nxe-dark/80 via-transparent to-black/20" />
          {isOwnProfile && !(bannerPreview || profile.bannerImage) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBannerClick}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white rounded-full h-8 w-8 p-0 shadow-lg border border-white/20"
                data-testid="button-edit-banner"
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="hidden"
                data-testid="input-banner-upload"
              />
            </>
          )}
        </div>

        {/* Profile Info - Mobile optimized with extended background */}
        <div className="relative px-4 md:px-6 pb-6 md:pb-8 bg-gradient-to-b from-nxe-dark/80 via-nxe-dark to-nxe-dark">
          <div className="flex flex-col items-center -mt-16 md:-mt-20">
            <div className="relative flex-shrink-0 mb-4">
              <Avatar className="w-28 h-28 md:w-36 md:h-36 border-4 md:border-6 border-nxe-dark shadow-2xl">
                <AvatarImage 
                  src={profile.profilePicture || `https://images.unsplash.com/photo-${1500 + profile.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`} 
                  alt={profile.username}
                />
                <AvatarFallback className="text-2xl md:text-3xl">
                  {profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute -bottom-1 -right-1 bg-nxe-primary hover:bg-nxe-primary/90 rounded-full p-2 h-8 w-8 shadow-lg border-2 border-nxe-dark"
                  data-testid="button-edit-avatar"
                >
                  <Camera className="h-4 w-4 text-white" />
                </Button>
              )}
            </div>

            {/* Centered Profile Information */}
            <div className="text-center w-full max-w-md">
              {/* Name and Verification */}
              <div className="flex items-center justify-center space-x-2 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                  {profile.displayName || profile.username}
                </h1>
                {profile.isVerified && (
                  <div className="relative">
                    <Shield className="h-6 w-6 md:h-7 md:w-7 text-blue-400 flex-shrink-0 drop-shadow-lg" />
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-sm animate-pulse" />
                  </div>
                )}
              </div>
              
              {/* Username */}
              <p className="text-gray-200 mb-4 text-sm md:text-base drop-shadow-sm">@{profile.username}</p>
              
              {/* Role Badge and Join Date */}
              <div className="flex items-center justify-center space-x-3 mb-4 flex-wrap gap-2">
                <Badge 
                  variant={profile.role === 'seller' ? 'default' : 'secondary'}
                  className={`${profile.role === 'seller' ? 'bg-gradient-to-r from-nxe-primary to-green-600 border-0 shadow-lg' : 'bg-gradient-to-r from-gray-600 to-gray-700 border-0'} text-xs font-medium px-3 py-1`}
                >
                  {profile.role === 'seller' ? (
                    <><Sparkles className="h-3 w-3 mr-1" /> Seller</>
                  ) : (
                    <><UserPlus className="h-3 w-3 mr-1" /> Buyer</>
                  )}
                </Badge>
                <span className="text-gray-300 text-xs md:text-sm bg-black/30 px-3 py-1 rounded-full">
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-200 text-sm md:text-base mb-4 leading-relaxed drop-shadow-sm max-w-sm mx-auto">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

            {/* Action buttons - centered */}
            <div className="mt-6 w-full max-w-sm mx-auto px-2">
            {isOwnProfile ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="w-full bg-gradient-to-r from-nxe-primary to-green-600 hover:from-nxe-primary/90 hover:to-green-600/90 text-white font-semibold py-3 rounded-2xl shadow-lg border-0 transition-all duration-300 hover:scale-105 active:scale-95"
                data-testid="button-edit-profile"
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  onClick={handleStartChat}
                  className="flex-1 bg-gradient-to-r from-nxe-primary to-blue-600 hover:from-nxe-primary/90 hover:to-blue-600/90 text-white font-semibold py-3 rounded-2xl shadow-lg border-0 transition-all duration-300 hover:scale-105 active:scale-95"
                  data-testid="button-message-user"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
                <Button 
                  className="px-6 py-3 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white font-medium rounded-2xl border border-white/20 shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
                  data-testid="button-follow-user"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Follow
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content - Mobile optimized */}
      <div className="px-3 md:px-4 pb-20">
        {isOwnProfile && (
          <Card className="bg-gradient-to-r from-nxe-primary/20 via-green-600/20 to-blue-600/20 border border-white/10 backdrop-blur-sm shadow-xl mb-6 overflow-hidden">
            <CardContent className="p-4 relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <p className="text-gray-200 font-medium text-sm mb-1">Wallet Balance</p>
                  <p className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                    {formatCurrency(profile.walletBalance)}
                  </p>
                </div>
                <Button
                  onClick={() => setLocation('/wallet')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white border border-white/20 rounded-xl font-medium transition-all duration-300 hover:scale-105"
                  data-testid="button-manage-wallet"
                >
                  Manage Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 backdrop-blur-sm h-10 rounded-2xl border border-white/10 shadow-lg">
            <TabsTrigger 
              value="products" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-nxe-primary data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-300 hover:text-white text-sm font-medium h-8 rounded-xl transition-all duration-300 data-[state=active]:scale-105"
              data-testid="tab-products"
            >
              <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-nxe-primary data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-300 hover:text-white text-sm font-medium h-8 rounded-xl transition-all duration-300 data-[state=active]:scale-105"
              data-testid="tab-reviews"
            >
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Reviews
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-nxe-primary data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-300 hover:text-white text-sm font-medium h-8 rounded-xl transition-all duration-300 data-[state=active]:scale-105"
              data-testid="tab-activity"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-3 md:space-y-4 mt-4 md:mt-6">
            {isProductsLoading ? (
              // Enhanced loading skeleton
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <Card key={index} className="bg-gradient-to-br from-nxe-card to-nxe-surface/50 border border-white/10 overflow-hidden">
                    <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-600 to-gray-700 animate-pulse relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-pulse" style={{ animationDuration: '1.5s', animationIterationCount: 'infinite' }} />
                    </div>
                    <CardContent className="p-4">
                      <div className="h-4 bg-gradient-to-r from-gray-600 to-gray-700 rounded animate-pulse mb-3" />
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded animate-pulse w-20" />
                        <div className="h-3 bg-gradient-to-r from-gray-600 to-gray-700 rounded animate-pulse w-10" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative mx-auto w-20 h-20 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-nxe-primary/20 to-green-600/20 rounded-full animate-pulse" />
                  <ShoppingBag className="h-20 w-20 mx-auto text-nxe-primary/60 relative z-10" />
                  <div className="absolute inset-0 bg-nxe-primary/10 rounded-full blur-xl" />
                </div>
                <p className="text-gray-300 text-lg font-medium mb-2">No products listed yet</p>
                <p className="text-gray-500 text-sm mb-6">{isOwnProfile ? 'Start selling by listing your first product' : 'This seller hasn\'t listed any products yet'}</p>
                {isOwnProfile && (
                  <Button
                    onClick={() => setLocation('/upload')}
                    className="bg-gradient-to-r from-nxe-primary to-green-600 hover:from-nxe-primary/90 hover:to-green-600/90 text-white font-semibold py-3 px-8 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105"
                    data-testid="button-list-first-product"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    List Your First Product
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-gradient-to-br from-nxe-card to-nxe-surface/50 border border-white/10 cursor-pointer hover:scale-105 transition-all duration-300 active:scale-95 shadow-xl backdrop-blur-sm overflow-hidden group"
                    onClick={() => setLocation(`/product/${product.id}`)}
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className="aspect-square overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <img
                        src={product.thumbnail || `https://images.unsplash.com/photo-${1400 + product.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300`}
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 z-20">
                        <Badge className="bg-gradient-to-r from-nxe-primary/90 to-green-600/90 text-white text-xs font-medium backdrop-blur-sm">
                          {product.status === 'available' ? 'Available' : 'Sold'}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-white font-medium text-sm mb-2 line-clamp-2 leading-tight group-hover:text-nxe-primary transition-colors">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-nxe-accent font-bold text-sm">
                          {formatCurrency(product.price)}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3.5 w-3.5 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-300">{product.rating}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4 mt-6">
            <div className="text-center py-12">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-600/20 rounded-full animate-pulse" />
                <Star className="h-16 w-16 mx-auto text-yellow-400/60 relative z-10" />
                <div className="absolute inset-0 bg-yellow-400/10 rounded-full blur-xl" />
              </div>
              <p className="text-gray-300 text-base font-medium mb-2">No reviews yet</p>
              <p className="text-gray-500 text-sm">Reviews from buyers will appear here</p>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-6">
            <div className="text-center py-12">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-600/20 rounded-full animate-pulse" />
                <Settings className="h-16 w-16 mx-auto text-purple-400/60 relative z-10 animate-spin" style={{ animationDuration: '8s' }} />
                <div className="absolute inset-0 bg-purple-400/10 rounded-full blur-xl" />
              </div>
              <p className="text-gray-300 text-base font-medium mb-2">No recent activity</p>
              <p className="text-gray-500 text-sm">User activities will be displayed here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal - Mobile optimized with slide animation */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full md:max-w-md mx-0 md:mx-4 bg-nxe-card border-nxe-surface rounded-t-xl md:rounded-xl rounded-b-none md:rounded-b-xl bottom-nav-safe animate-in slide-in-from-bottom md:slide-in-from-bottom-0 duration-300 md:zoom-in-95">
            <CardHeader className="pb-3 md:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg md:text-xl">Edit Profile</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-11 w-11 p-0 text-gray-400 hover:text-white md:hidden"
                  data-testid="button-close-modal"
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfile(new FormData(e.currentTarget));
                }}
                className="space-y-4 md:space-y-6"
              >
                <div className="space-y-2 mobile-input-fix">
                  <Label htmlFor="displayName" className="text-white text-sm md:text-base">Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    defaultValue={profile.displayName || profile.username}
                    className="bg-nxe-surface border-nxe-surface text-white h-11 text-sm md:text-base"
                    data-testid="input-display-name"
                  />
                </div>

                <div className="space-y-2 mobile-input-fix">
                  <Label htmlFor="bio" className="text-white text-sm md:text-base">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile.bio || ""}
                    placeholder="Tell others about yourself..."
                    className="bg-nxe-surface border-nxe-surface text-white min-h-[80px] md:min-h-[100px] text-sm md:text-base resize-none"
                    data-testid="textarea-bio"
                  />
                </div>

                {/* Banner Preview Section */}
                {bannerPreview && (
                  <div className="space-y-2">
                    <Label className="text-white text-sm md:text-base">Banner Preview</Label>
                    <div className="relative h-20 md:h-24 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={bannerPreview}
                        alt="Banner preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setBannerPreview(null)}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white h-11 w-11 p-0"
                        data-testid="button-remove-banner"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3 pt-4 md:pt-6 bottom-nav-safe">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 border-nxe-surface h-11 text-sm md:text-base"
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-nxe-primary hover:bg-nxe-primary/80 h-11 text-sm md:text-base"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

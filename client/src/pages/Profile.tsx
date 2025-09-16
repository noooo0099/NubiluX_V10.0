import { useState, useRef } from "react";
import { useParams } from "wouter";
import { Edit3, Settings, Star, ShoppingBag, MessageCircle, Shield, Camera } from "lucide-react";
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
    enabled: !!(effectiveProfileId && currentUserId > 0),
  });

  // Fetch user's products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [`/api/products`, { sellerId: effectiveProfileId }],
    enabled: !!(effectiveProfileId && currentUserId > 0),
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
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Banner image must be less than 5MB",
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

      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBannerPreview(result);
      };
      reader.readAsDataURL(file);
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
        {/* Banner - Optimized for mobile */}
        <div 
          className="h-32 md:h-48 bg-gradient-to-r from-nxe-primary to-nxe-accent relative overflow-hidden"
          style={{
            backgroundImage: (bannerPreview || profile.bannerImage) ? `url(${bannerPreview || profile.bannerImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          {isOwnProfile && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBannerClick}
                className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/50 hover:bg-black/70 text-white h-8 w-8 p-1"
                data-testid="button-edit-banner"
              >
                <Camera className="h-4 w-4" />
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

        {/* Profile Info - Mobile optimized */}
        <div className="relative px-3 md:px-4 pb-4 md:pb-6">
          <div className="flex items-end space-x-3 md:space-x-4 -mt-10 md:-mt-16">
            <div className="relative flex-shrink-0">
              <Avatar className="w-20 h-20 md:w-32 md:h-32 border-3 md:border-4 border-nxe-dark">
                <AvatarImage 
                  src={profile.profilePicture || `https://images.unsplash.com/photo-${1500 + profile.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`} 
                  alt={profile.username}
                />
                <AvatarFallback className="text-lg md:text-2xl">
                  {profile.username ? profile.username.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-0 right-0 bg-nxe-primary hover:bg-nxe-primary/80 rounded-full p-1.5 md:p-2 h-7 w-7 md:h-auto md:w-auto"
                  data-testid="button-edit-avatar"
                >
                  <Camera className="h-3 w-3 md:h-4 md:w-4 text-white" />
                </Button>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-2 md:pb-4">
              <div className="flex items-center space-x-2 mb-1 md:mb-2">
                <h1 className="text-lg md:text-2xl font-bold text-white truncate">
                  {profile.displayName || profile.username}
                </h1>
                {profile.isVerified && (
                  <Shield className="h-4 w-4 md:h-5 md:w-5 text-nxe-accent flex-shrink-0" />
                )}
              </div>
              
              <p className="text-gray-400 mb-2 text-sm md:text-base">@{profile.username}</p>
              
              <div className="flex items-center space-x-2 md:space-x-4 mb-3 flex-wrap gap-1">
                <Badge 
                  variant={profile.role === 'seller' ? 'default' : 'secondary'}
                  className={`${profile.role === 'seller' ? 'bg-nxe-primary' : ''} text-xs`}
                >
                  {profile.role === 'seller' ? 'Seller' : 'Buyer'}
                </Badge>
                <span className="text-gray-400 text-xs md:text-sm">
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>

              {profile.bio && (
                <p className="text-gray-300 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 md:line-clamp-none">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons moved below for mobile */}
          <div className="mt-3 md:mt-0 md:ml-24 flex items-center space-x-2 md:space-x-3">
            {isOwnProfile ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-nxe-primary hover:bg-nxe-primary/80 text-sm md:text-base px-3 md:px-4 h-8 md:h-auto"
                data-testid="button-edit-profile"
              >
                <Edit3 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleStartChat}
                  className="bg-nxe-accent hover:bg-nxe-accent/80 text-sm md:text-base px-3 md:px-4 h-8 md:h-auto flex-1 md:flex-none"
                  data-testid="button-message-user"
                >
                  <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Message
                </Button>
                <Button 
                  variant="outline" 
                  className="border-nxe-surface text-sm md:text-base px-3 md:px-4 h-8 md:h-auto"
                  data-testid="button-follow-user"
                >
                  <Star className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  Follow
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content - Mobile optimized */}
      <div className="px-3 md:px-4 pb-20">
        {isOwnProfile && (
          <Card className="bg-nxe-card border-nxe-surface mb-4 md:mb-6">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium text-sm md:text-base">Wallet Balance</p>
                  <p className="text-xl md:text-2xl font-bold text-nxe-accent">
                    {formatCurrency(profile.walletBalance)}
                  </p>
                </div>
                <Button
                  onClick={() => setLocation('/wallet')}
                  variant="outline"
                  className="border-nxe-surface text-sm md:text-base px-3 md:px-4 h-8 md:h-auto"
                  data-testid="button-manage-wallet"
                >
                  Manage Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-nxe-surface h-10 md:h-11">
            <TabsTrigger 
              value="products" 
              className="data-[state=active]:bg-nxe-primary text-xs md:text-sm"
              data-testid="tab-products"
            >
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="reviews" 
              className="data-[state=active]:bg-nxe-primary text-xs md:text-sm"
              data-testid="tab-reviews"
            >
              Reviews
            </TabsTrigger>
            <TabsTrigger 
              value="activity" 
              className="data-[state=active]:bg-nxe-primary text-xs md:text-sm"
              data-testid="tab-activity"
            >
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-3 md:space-y-4 mt-4 md:mt-6">
            {products.length === 0 ? (
              <div className="text-center py-8 md:py-12">
                <ShoppingBag className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-500 mb-3 md:mb-4" />
                <p className="text-gray-400 text-sm md:text-base">No products listed yet</p>
                {isOwnProfile && (
                  <Button
                    onClick={() => setLocation('/upload')}
                    className="mt-3 md:mt-4 bg-nxe-primary hover:bg-nxe-primary/80 h-9 md:h-auto text-sm md:text-base px-4 md:px-6"
                    data-testid="button-list-first-product"
                  >
                    List Your First Product
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-nxe-card border-nxe-surface cursor-pointer hover:scale-105 transition-transform active:scale-95"
                    onClick={() => setLocation(`/product/${product.id}`)}
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.thumbnail || `https://images.unsplash.com/photo-${1400 + product.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300`}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-2 md:p-3">
                      <h3 className="text-white font-medium text-xs md:text-sm mb-1 line-clamp-2 md:line-clamp-1 leading-tight">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-nxe-accent font-bold text-xs md:text-sm truncate">
                          {formatCurrency(product.price)}
                        </span>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-xs text-gray-400">{product.rating}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-3 md:space-y-4 mt-4 md:mt-6">
            <div className="text-center py-8 md:py-12">
              <Star className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-500 mb-3 md:mb-4" />
              <p className="text-gray-400 text-sm md:text-base">No reviews yet</p>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-3 md:space-y-4 mt-4 md:mt-6">
            <div className="text-center py-8 md:py-12">
              <div className="h-12 w-12 md:h-16 md:w-16 mx-auto text-gray-500 mb-3 md:mb-4 rounded-full bg-gray-500/20 flex items-center justify-center">
                <Settings className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <p className="text-gray-400 text-sm md:text-base">No recent activity</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal - Mobile optimized */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full md:max-w-md mx-0 md:mx-4 bg-nxe-card border-nxe-surface rounded-t-xl md:rounded-xl rounded-b-none md:rounded-b-xl bottom-nav-safe">
            <CardHeader className="pb-3 md:pb-6">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg md:text-xl">Edit Profile</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white md:hidden"
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
                    className="bg-nxe-surface border-nxe-surface text-white h-10 md:h-11 text-sm md:text-base"
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
                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white h-7 w-7 p-0"
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
                    className="flex-1 border-nxe-surface h-10 md:h-11 text-sm md:text-base"
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-nxe-primary hover:bg-nxe-primary/80 h-10 md:h-11 text-sm md:text-base"
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

import { useState } from "react";
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
  const [currentUserId] = useState(1); // This would come from auth context
  const isOwnProfile = parseInt(profileId!) === currentUserId;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: [`/api/users/profile/${profileId}`],
  });

  // Fetch user's products
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: [`/api/products`, { sellerId: profileId }],
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      return apiRequest('PUT', '/api/users/profile', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/profile/${profileId}`] });
      setIsEditing(false);
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

  const handleSaveProfile = (formData: FormData) => {
    const updates = {
      displayName: formData.get('displayName') as string,
      bio: formData.get('bio') as string,
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
    <div className="min-h-screen bg-nxe-dark">
      {/* Profile Header */}
      <div className="relative">
        {/* Banner */}
        <div 
          className="h-48 bg-gradient-to-r from-nxe-primary to-nxe-accent relative overflow-hidden"
          style={{
            backgroundImage: profile.bannerImage ? `url(${profile.bannerImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
            >
              <Camera className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Profile Info */}
        <div className="relative px-4 pb-6">
          <div className="flex items-end space-x-4 -mt-16">
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-nxe-dark">
                <AvatarImage 
                  src={profile.profilePicture || `https://images.unsplash.com/photo-${1500 + profile.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200`} 
                  alt={profile.username}
                />
                <AvatarFallback className="text-2xl">
                  {profile.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute bottom-0 right-0 bg-nxe-primary hover:bg-nxe-primary/80 rounded-full p-2"
                >
                  <Camera className="h-4 w-4 text-white" />
                </Button>
              )}
            </div>

            <div className="flex-1 min-w-0 pb-4">
              <div className="flex items-center space-x-2 mb-2">
                <h1 className="text-2xl font-bold text-white">
                  {profile.displayName || profile.username}
                </h1>
                {profile.isVerified && (
                  <Shield className="h-5 w-5 text-nxe-accent" />
                )}
              </div>
              
              <p className="text-gray-400 mb-2">@{profile.username}</p>
              
              <div className="flex items-center space-x-4 mb-3">
                <Badge 
                  variant={profile.role === 'seller' ? 'default' : 'secondary'}
                  className={profile.role === 'seller' ? 'bg-nxe-primary' : ''}
                >
                  {profile.role === 'seller' ? 'Seller' : 'Buyer'}
                </Badge>
                <span className="text-gray-400 text-sm">
                  Joined {formatDate(profile.createdAt)}
                </span>
              </div>

              {profile.bio && (
                <p className="text-gray-300 text-sm mb-4 max-w-md">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center space-x-3">
                {isOwnProfile ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-nxe-primary hover:bg-nxe-primary/80"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={handleStartChat}
                      className="bg-nxe-accent hover:bg-nxe-accent/80"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="outline" className="border-nxe-surface">
                      <Star className="h-4 w-4 mr-2" />
                      Follow
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 pb-20">
        {isOwnProfile && (
          <Card className="bg-nxe-card border-nxe-surface mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Wallet Balance</p>
                  <p className="text-2xl font-bold text-nxe-accent">
                    {formatCurrency(profile.walletBalance)}
                  </p>
                </div>
                <Button
                  onClick={() => setLocation('/wallet')}
                  variant="outline"
                  className="border-nxe-surface"
                >
                  Manage Wallet
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-nxe-surface">
            <TabsTrigger value="products" className="data-[state=active]:bg-nxe-primary">
              Products
            </TabsTrigger>
            <TabsTrigger value="reviews" className="data-[state=active]:bg-nxe-primary">
              Reviews
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-nxe-primary">
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4 mt-6">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 mx-auto text-gray-500 mb-4" />
                <p className="text-gray-400">No products listed yet</p>
                {isOwnProfile && (
                  <Button
                    onClick={() => setLocation('/upload')}
                    className="mt-4 bg-nxe-primary hover:bg-nxe-primary/80"
                  >
                    List Your First Product
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {products.map((product) => (
                  <Card
                    key={product.id}
                    className="bg-nxe-card border-nxe-surface cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setLocation(`/product/${product.id}`)}
                  >
                    <div className="aspect-square overflow-hidden rounded-t-lg">
                      <img
                        src={product.thumbnail || `https://images.unsplash.com/photo-${1400 + product.id}?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300`}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-3">
                      <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-nxe-accent font-bold text-sm">
                          {formatCurrency(product.price)}
                        </span>
                        <div className="flex items-center space-x-1">
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

          <TabsContent value="reviews" className="space-y-4 mt-6">
            <div className="text-center py-12">
              <Star className="h-16 w-16 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-400">No reviews yet</p>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-6">
            <div className="text-center py-12">
              <div className="h-16 w-16 mx-auto text-gray-500 mb-4 rounded-full bg-gray-500/20 flex items-center justify-center">
                <Settings className="h-8 w-8" />
              </div>
              <p className="text-gray-400">No recent activity</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md mx-4 bg-nxe-card border-nxe-surface">
            <CardHeader>
              <CardTitle className="text-white">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSaveProfile(new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="displayName" className="text-white">Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    defaultValue={profile.displayName || profile.username}
                    className="bg-nxe-surface border-nxe-surface text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile.bio || ""}
                    placeholder="Tell others about yourself..."
                    className="bg-nxe-surface border-nxe-surface text-white min-h-[80px]"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 border-nxe-surface"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 bg-nxe-primary hover:bg-nxe-primary/80"
                  >
                    Save Changes
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

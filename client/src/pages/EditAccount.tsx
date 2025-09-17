import { useState, useRef } from "react";
import { ChevronRight, Camera, Save, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userUpdateSchema, type UserUpdate } from "@shared/schema";

export default function EditAccount() {
  const [, setLocation] = useLocation();
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Form setup with validation
  const form = useForm<UserUpdate>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      displayName: user?.displayName || '',
      bio: user?.bio || '',
      currentPassword: '',
      newPassword: '',
    }
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UserUpdate) => {
      const payload = { ...updates };
      
      // Add profile picture if changed
      if (profilePreview) {
        payload.profilePicture = profilePreview;
      }
      
      // Remove empty password fields to avoid sending empty strings
      if (!payload.currentPassword) delete payload.currentPassword;
      if (!payload.newPassword) delete payload.newPassword;
      
      return apiRequest('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    },
    onSuccess: (updatedUser) => {
      // Update AuthContext with fresh user data
      updateUser(updatedUser);
      
      // Invalidate user profile queries
      queryClient.invalidateQueries({ queryKey: [`/api/users/profile/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: "Akun berhasil diperbarui",
        description: "Perubahan telah disimpan dengan aman.",
      });
      
      // Reset password fields
      form.setValue('currentPassword', '');
      form.setValue('newPassword', '');
    },
    onError: (error: any) => {
      console.error('Profile update error:', error);
      toast({
        title: "Gagal memperbarui akun",
        description: error.message || "Terjadi kesalahan, silakan coba lagi.",
        variant: "destructive"
      });
    }
  });

  const handleProfileImageClick = () => {
    profileInputRef.current?.click();
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 300 * 1024) {
        toast({
          title: "File terlalu besar",
          description: "Gambar profil harus kurang dari 300KB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format file tidak valid",
          description: "Silakan pilih file gambar",
          variant: "destructive",
        });
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const maxSize = 200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedImage = canvas.toDataURL('image/jpeg', 0.8);
        setProfilePreview(compressedImage);
      };
      
      img.src = URL.createObjectURL(file);
    }
  };

  const onSubmit = (data: UserUpdate) => {
    updateProfileMutation.mutate(data);
  };

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/settings");
    }
  };

  const currentBioLength = form.watch('bio')?.length || 0;

  return (
    <div className="mobile-viewport-fix keyboard-smooth bg-nxe-dark px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={handleBackClick}
          className="text-nxe-text hover:text-nxe-primary transition-colors duration-200"
          data-testid="button-back"
        >
          <ChevronRight className="h-6 w-6 rotate-180" />
        </button>
        <h1 className="text-xl font-semibold text-white">Edit Akun</h1>
        <div className="w-6 h-6" /> {/* Spacer */}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Picture Section */}
          <Card className="bg-nxe-card border-nxe-surface/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg">Foto Profil</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-nxe-surface">
                  <AvatarImage 
                    src={profilePreview || user?.profilePicture} 
                    alt="Profile"
                  />
                  <AvatarFallback className="text-2xl">
                    {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleProfileImageClick}
                  className="absolute -bottom-2 -right-2 bg-nxe-primary hover:bg-nxe-primary/90 rounded-full p-2 h-8 w-8 shadow-lg"
                  data-testid="button-edit-profile-picture"
                >
                  <Camera className="h-4 w-4 text-white" />
                </Button>
              </div>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
                data-testid="input-profile-upload"
              />
              <p className="text-gray-400 text-sm text-center">
                Klik tombol kamera untuk mengubah foto profil
              </p>
            </CardContent>
          </Card>

          {/* Personal Information */}
          <Card className="bg-nxe-card border-nxe-surface/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg">Informasi Pribadi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200 text-sm font-medium">
                      Nama Tampilan
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="mt-2 bg-nxe-surface border-nxe-border text-white"
                        placeholder="Masukkan nama tampilan"
                        data-testid="input-display-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label htmlFor="username" className="text-gray-200 text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  value={user?.username || ''}
                  disabled
                  className="mt-2 bg-nxe-surface/50 border-nxe-border text-gray-400"
                  data-testid="input-username"
                />
                <p className="text-xs text-gray-500 mt-1">Username tidak dapat diubah</p>
              </div>

              <div>
                <Label htmlFor="email" className="text-gray-200 text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="mt-2 bg-nxe-surface/50 border-nxe-border text-gray-400"
                  data-testid="input-email"
                />
                <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200 text-sm font-medium">
                      Bio
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="mt-2 bg-nxe-surface border-nxe-border text-white resize-none"
                        placeholder="Ceritakan sedikit tentang diri Anda..."
                        rows={3}
                        maxLength={150}
                        data-testid="textarea-bio"
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      {currentBioLength}/150 karakter
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Password Section */}
          <Card className="bg-nxe-card border-nxe-surface/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg">Ubah Password</CardTitle>
              <p className="text-gray-400 text-sm">
                Kosongkan jika tidak ingin mengubah password
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200 text-sm font-medium">
                      Password Saat Ini
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          className="mt-2 bg-nxe-surface border-nxe-border text-white pr-10"
                          placeholder="Masukkan password saat ini"
                          data-testid="input-current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-5 text-gray-400 hover:text-white transition-colors"
                          data-testid="button-toggle-password"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-200 text-sm font-medium">
                      Password Baru
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        className="mt-2 bg-nxe-surface border-nxe-border text-white"
                        placeholder="Masukkan password baru"
                        data-testid="input-new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-nxe-primary hover:bg-nxe-primary/90 text-white font-medium px-8 py-2"
              data-testid="button-save-changes"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
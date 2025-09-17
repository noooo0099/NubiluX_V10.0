import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/ui/loading";
import { 
  Plus,
  Image as ImageIcon,
  Video,
  Eye,
  Clock,
  User,
  Heart,
  MessageCircle,
  Share,
  Camera,
  X,
  Search
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StatusUpdate {
  id: number;
  userId: number;
  content: string;
  media: string | null;
  mediaType: 'image' | 'video' | null;
  isPublic: boolean;
  viewCount: number;
  expiresAt: string;
  createdAt: string;
  user: {
    username: string;
    displayName?: string;
    profilePicture?: string;
    isVerified: boolean;
  };
}

export default function StatusUpdates() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch active status updates
  const { data: statusUpdates = [], isLoading } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 30000 // Refresh setiap 30 detik
  });

  // Create status mutation
  const createStatusMutation = useMutation({
    mutationFn: async (data: { content: string; media?: string; mediaType?: string }) => {
      return apiRequest('/api/status', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/status'] });
      setShowCreateForm(false);
      setContent("");
      setSelectedFile(null);
      setPreviewUrl(null);
      toast({
        title: "Status berhasil dibuat!",
        description: "Status Anda akan hilang dalam 24 jam."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Gagal membuat status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCameraCapture = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowCamera(false);
    // Automatically show the create form when camera capture is done
    setShowCreateForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    // For now, we'll just send the content
    // File upload would need additional implementation
    createStatusMutation.mutate({
      content: content.trim(),
      mediaType: selectedFile?.type.startsWith('image/') ? 'image' : selectedFile?.type.startsWith('video/') ? 'video' : undefined
    });
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffInHours = Math.floor((expires.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours <= 0) return 'Kedaluwarsa';
    if (diffInHours < 24) return `${diffInHours} jam tersisa`;
    return `${Math.floor(diffInHours / 24)} hari tersisa`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}j`;
    return `${Math.floor(diffInHours / 24)}h`;
  };

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Header - Mobile style */}
      <div className="px-4 py-3 border-b border-nxe-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Pembaruan</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-nxe-surface/50 rounded-full p-2"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-nxe-surface/50 rounded-full p-2"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Status Section - Horizontal Scrollable */}
      <div className="px-0 py-4 border-b border-nxe-border/30">
        <h2 className="text-lg font-semibold text-white mb-4 px-4">Status</h2>
        <div className="flex space-x-4 overflow-x-auto pb-2 px-4 scrollbar-hide">
          {/* Add Status Button */}
          <div className="flex flex-col items-center min-w-max" data-testid="add-status-container">
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-16 h-16 rounded-full bg-nxe-dark border-2 border-nxe-primary/60 flex items-center justify-center hover:border-nxe-primary transition-all duration-300 relative overflow-hidden"
              data-testid="button-add-status"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-nxe-primary/20 to-transparent"></div>
              <Plus className="h-7 w-7 text-nxe-primary relative z-10" />
            </button>
            <p className="text-xs text-white mt-2 text-center max-w-16 truncate font-medium">Tambah Status</p>
          </div>
          
          {/* Status Updates */}
          {(statusUpdates as StatusUpdate[]).map((status) => (
            <div key={status.id} className="flex flex-col items-center min-w-max" data-testid={`status-item-${status.id}`}>
              <div className="relative">
                <button className="w-16 h-16 rounded-full overflow-hidden border-3 border-gradient-to-r from-nxe-primary to-nxe-accent p-0.5 hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full overflow-hidden bg-nxe-dark">
                    {status.media ? (
                      status.mediaType === 'image' ? (
                        <img
                          src={status.media}
                          alt={`Status by ${status.user.displayName || status.user.username}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video
                          src={status.media}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )
                    ) : status.user.profilePicture ? (
                      <img
                        src={status.user.profilePicture}
                        alt={`${status.user.displayName || status.user.username}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-nxe-primary/30 to-nxe-accent/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-nxe-primary/20 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {(status.user.displayName || status.user.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
                {/* Green status indicator */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-nxe-dark flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <p className="text-xs text-white mt-2 text-center max-w-16 truncate font-medium">
                {status.user.displayName || status.user.username}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Create Status Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-nxe-border bg-nxe-surface/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Buat Status Baru</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <Textarea
              placeholder="Apa yang terjadi di game Anda hari ini?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-nxe-surface border-nxe-border text-white placeholder-gray-400 resize-none"
              rows={3}
              data-testid="textarea-status-content"
            />

            {/* Preview media jika ada */}
            {previewUrl && (
              <div className="relative">
                {selectedFile?.type.startsWith('image/') ? (
                  <img src={previewUrl} alt="Preview" className="w-full max-h-64 object-cover rounded-lg" />
                ) : (
                  <video src={previewUrl} controls className="w-full max-h-64 rounded-lg" />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    data-testid="input-status-media"
                  />
                  <Button type="button" variant="ghost" size="sm" className="text-nxe-primary">
                    <Camera className="h-4 w-4 mr-2" />
                    Media
                  </Button>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={!content.trim() && !selectedFile || createStatusMutation.isPending}
                  className="bg-nxe-primary hover:bg-nxe-primary/80 text-white"
                  data-testid="button-publish-status"
                >
                  {createStatusMutation.isPending ? 'Posting...' : 'Posting'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* News of the Day Section */}
      <div className="px-4 py-6 border-b border-nxe-border/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Berita Gaming Hari Ini</h2>
          <Button variant="ghost" size="sm" className="text-nxe-primary hover:text-nxe-primary/80">
            Lihat Semua
          </Button>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-4">
          {/* Featured News */}
          <Card className="bg-gradient-to-r from-nxe-surface to-nxe-card border-nxe-border overflow-hidden">
            <CardContent className="p-0">
              <div className="flex">
                <div className="w-24 h-24 flex-shrink-0">
                  <img 
                    src="https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200" 
                    alt="Gaming news"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 p-4">
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                    Update Terbaru Mobile Legends: Hero Baru dan Event Spesial
                  </h3>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">
                    Moonton merilis hero assassin terbaru dengan skill ultimate yang game-changing...
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-nxe-primary">Gaming Indonesia</span>
                    <span className="text-xs text-gray-500">2 jam lalu</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* News Grid */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-nxe-surface border-nxe-border/30">
              <CardContent className="p-3">
                <div className="aspect-video mb-2 rounded overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                    alt="PUBG update"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">
                  PUBG Season Baru: Map Sanhok Remastered
                </h4>
                <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                  Peningkatan grafis dan gameplay yang menakjubkan
                </p>
                <span className="text-xs text-gray-500">4 jam lalu</span>
              </CardContent>
            </Card>
            
            <Card className="bg-nxe-surface border-nxe-border/30">
              <CardContent className="p-3">
                <div className="aspect-video mb-2 rounded overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=200" 
                    alt="Valorant tournament"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h4 className="text-sm font-medium text-white mb-1 line-clamp-2">
                  Turnamen Valorant Regional Championship
                </h4>
                <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                  8 tim terbaik Indonesia berkompetisi
                </p>
                <span className="text-xs text-gray-500">1 hari lalu</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Trending Gaming Topics */}
      <div className="px-4 py-4 border-b border-nxe-border/30">
        <h3 className="text-sm font-semibold text-white mb-3">Topik Trending</h3>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-nxe-surface border border-nxe-border text-gray-300 hover:bg-nxe-primary hover:text-white cursor-pointer">
            #MobileLegendsUpdate
          </Badge>
          <Badge className="bg-nxe-surface border border-nxe-border text-gray-300 hover:bg-nxe-primary hover:text-white cursor-pointer">
            #PUBGSeason
          </Badge>
          <Badge className="bg-nxe-surface border border-nxe-border text-gray-300 hover:bg-nxe-primary hover:text-white cursor-pointer">
            #ValorantTournament
          </Badge>
          <Badge className="bg-nxe-surface border border-nxe-border text-gray-300 hover:bg-nxe-primary hover:text-white cursor-pointer">
            #GamingSetup
          </Badge>
          <Badge className="bg-nxe-surface border border-nxe-border text-gray-300 hover:bg-nxe-primary hover:text-white cursor-pointer">
            #ESports
          </Badge>
        </div>
      </div>

      {/* Status Updates Feed */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Feed Status Update</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-32" data-testid="status-updates-loading">
            <Loading variant="pulse" />
          </div>
        ) : (statusUpdates as StatusUpdate[]).length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Belum ada status update
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Jadilah yang pertama membagikan momen gaming Anda!
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-nxe-primary hover:bg-nxe-primary/80 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Status Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {(statusUpdates as StatusUpdate[]).map((status: StatusUpdate) => (
              <Card
                key={status.id}
                className="bg-nxe-surface border-nxe-border hover:border-nxe-primary/30 transition-colors"
                data-testid={`status-${status.id}`}
              >
                <CardContent className="p-4">
                  {/* User Info */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-nxe-primary/20 flex items-center justify-center">
                        {status.user.profilePicture ? (
                          <img
                            src={status.user.profilePicture}
                            alt={status.user.username}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-5 w-5 text-nxe-primary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-white">
                            {status.user.displayName || status.user.username}
                          </span>
                          {status.user.isVerified && (
                            <Badge className="bg-blue-600 text-white text-xs px-1 py-0">
                              ✓
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-nxe-text">
                          <span>@{status.user.username}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(status.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTimeRemaining(status.expiresAt)}
                    </Badge>
                  </div>

                  {/* Content */}
                  <div className="mb-3">
                    <p className="text-white whitespace-pre-wrap">{status.content}</p>
                    
                    {/* Media */}
                    {status.media && (
                      <div className="mt-3">
                        {status.mediaType === 'image' ? (
                          <img
                            src={status.media}
                            alt="Status media"
                            className="w-full max-h-96 object-cover rounded-lg"
                          />
                        ) : status.mediaType === 'video' ? (
                          <video
                            src={status.media}
                            controls
                            className="w-full max-h-96 rounded-lg"
                          />
                        ) : null}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-nxe-border">
                    <div className="flex items-center space-x-4">
                      <Button variant="ghost" size="sm" className="text-nxe-text hover:text-red-500">
                        <Heart className="h-4 w-4 mr-1" />
                        <span className="text-sm">{Math.floor(Math.random() * 20) + 1}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-nxe-text hover:text-blue-500">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">{Math.floor(Math.random() * 5)}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="text-nxe-text hover:text-nxe-primary">
                        <Share className="h-4 w-4 mr-1" />
                        <span className="text-sm">Bagikan</span>
                      </Button>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-nxe-text">
                      <Eye className="h-3 w-3" />
                      <span>{status.viewCount} views</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
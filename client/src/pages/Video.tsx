import { Play, Heart, MessageCircle, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Video() {
  const sampleVideos = [
    {
      id: 1,
      title: "Epic Mobile Legends Gameplay - Mythic Rank Push",
      username: "ProGamer123",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      likes: 1250,
      comments: 89,
      views: "12.5K"
    },
    {
      id: 2,
      title: "PUBG Mobile Squad Wipe - Conqueror Gameplay",
      username: "BattleRoyalePro",
      thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      likes: 890,
      comments: 67,
      views: "8.9K"
    },
    {
      id: 3,
      title: "Free Fire Ranked Match - Booyah Highlights",
      username: "FireMaster",
      thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      likes: 2100,
      comments: 156,
      views: "25.8K"
    }
  ];

  const handleVideoPlay = (videoId: number) => {
    console.log("Playing video:", videoId);
    // Implement video playback
  };

  const handleLike = (videoId: number) => {
    console.log("Liked video:", videoId);
    // Implement like functionality
  };

  const handleComment = (videoId: number) => {
    console.log("Comment on video:", videoId);
    // Implement comment functionality
  };

  const handleShare = (videoId: number) => {
    console.log("Share video:", videoId);
    // Implement share functionality
  };

  return (
    <div className="min-h-screen bg-nxe-dark">
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Gaming Videos</h1>
        
        <div className="space-y-6">
          {sampleVideos.map((video) => (
            <Card key={video.id} className="bg-nxe-card border-nxe-surface overflow-hidden">
              <div className="relative">
                <img 
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-64 object-cover"
                />
                <Button
                  onClick={() => handleVideoPlay(video.id)}
                  className="absolute inset-0 w-full h-full bg-black/40 hover:bg-black/30 transition-colors flex items-center justify-center group"
                  variant="ghost"
                >
                  <div className="w-16 h-16 rounded-full bg-nxe-primary/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="h-8 w-8 text-white ml-1" />
                  </div>
                </Button>
                <div className="absolute top-4 right-4 bg-black/60 px-2 py-1 rounded text-white text-xs">
                  {video.views} views
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">@{video.username}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <Button
                      onClick={() => handleLike(video.id)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-gray-400 hover:text-red-400"
                    >
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{video.likes}</span>
                    </Button>
                    
                    <Button
                      onClick={() => handleComment(video.id)}
                      variant="ghost"
                      size="sm"
                      className="flex items-center space-x-2 text-gray-400 hover:text-nxe-accent"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-sm">{video.comments}</span>
                    </Button>
                  </div>
                  
                  <Button
                    onClick={() => handleShare(video.id)}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-nxe-primary"
                  >
                    <Share className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

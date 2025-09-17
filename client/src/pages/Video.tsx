import { Play, Heart, MessageCircle, Share, MoreHorizontal, Volume2, VolumeX, X } from "lucide-react";
import { useState } from "react";

interface VideoData {
  id: number;
  title: string;
  username: string;
  thumbnail: string;
  likes: number;
  comments: number;
  views: string;
  videoUrl?: string;
}

export default function Video() {
  const [activeVideo, setActiveVideo] = useState<VideoData | null>(null);
  const [showOverlay, setShowOverlay] = useState<{ type: 'comments' | 'share' | null; videoId?: number }>({ type: null });
  const [isMuted, setIsMuted] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<number>>(new Set());

  const sampleVideos: VideoData[] = [
    {
      id: 1,
      title: "Epic Mobile Legends Gameplay - Mythic Rank Push",
      username: "ProGamer123",
      thumbnail: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      likes: 1250,
      comments: 89,
      views: "12.5K",
      videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    },
    {
      id: 2,
      title: "PUBG Mobile Squad Wipe - Conqueror Gameplay",
      username: "BattleRoyalePro",
      thumbnail: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      likes: 890,
      comments: 67,
      views: "8.9K",
      videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    },
    {
      id: 3,
      title: "Free Fire Ranked Match - Booyah Highlights",
      username: "FireMaster",
      thumbnail: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
      likes: 2100,
      comments: 156,
      views: "25.8K",
      videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
    }
  ];

  const handleVideoPlay = (video: VideoData) => {
    setActiveVideo(video);
  };

  const closeVideoPlayer = () => {
    setActiveVideo(null);
    setShowOverlay({ type: null });
  };

  const handleLike = (videoId: number) => {
    const newLikedVideos = new Set(likedVideos);
    if (newLikedVideos.has(videoId)) {
      newLikedVideos.delete(videoId);
    } else {
      newLikedVideos.add(videoId);
    }
    setLikedVideos(newLikedVideos);
  };

  const handleComment = (videoId: number) => {
    setShowOverlay({ type: 'comments', videoId });
  };

  const handleShare = (videoId: number) => {
    setShowOverlay({ type: 'share', videoId });
  };

  const closeOverlay = () => {
    setShowOverlay({ type: null });
  };

  const sampleComments = [
    { id: 1, user: "GamerX", comment: "Amazing gameplay! 🔥", time: "2h ago" },
    { id: 2, user: "ProPlayer", comment: "How did you get that skin?", time: "1h ago" },
    { id: 3, user: "Newbie123", comment: "Teach me your tactics please!", time: "30m ago" }
  ];

  return (
    <>
      {/* Video Feed */}
      <div className="min-h-screen bg-nxe-dark">
        <div className="space-y-0">
          {sampleVideos.map((video) => (
            <div key={video.id} className="relative h-screen snap-start">
              {/* Video Container */}
              <div 
                className="relative w-full h-full bg-black cursor-pointer"
                onClick={() => handleVideoPlay(video)}
              >
                <img 
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="h-10 w-10 text-white ml-1" />
                  </div>
                </div>

                {/* Side Actions */}
                <div className="absolute right-4 bottom-24 flex flex-col space-y-6">
                  {/* Like */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike(video.id);
                      }}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Heart className={`h-6 w-6 ${likedVideos.has(video.id) ? 'text-red-500 fill-current' : 'text-white'}`} />
                    </button>
                    <span className="text-white text-xs mt-1">{video.likes + (likedVideos.has(video.id) ? 1 : 0)}</span>
                  </div>

                  {/* Comment */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComment(video.id);
                      }}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <MessageCircle className="h-6 w-6 text-white" />
                    </button>
                    <span className="text-white text-xs mt-1">{video.comments}</span>
                  </div>

                  {/* Share */}
                  <div className="flex flex-col items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(video.id);
                      }}
                      className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                    >
                      <Share className="h-6 w-6 text-white" />
                    </button>
                  </div>

                  {/* More */}
                  <div className="flex flex-col items-center">
                    <button className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <MoreHorizontal className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </div>

                {/* Bottom Info */}
                <div className="absolute bottom-4 left-4 right-20">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-nxe-card">
                      <img 
                        src={`https://images.unsplash.com/photo-${150000000 + video.id}?w=40&h=40&fit=crop&crop=face`}
                        alt={video.username}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <span className="text-white font-medium">@{video.username}</span>
                  </div>
                  <h3 className="text-white text-sm leading-relaxed mb-2">
                    {video.title}
                  </h3>
                  <div className="text-white/70 text-xs">
                    {video.views} views
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Screen Video Player */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black">
          <div className="relative w-full h-full">
            {/* Video */}
            {activeVideo.videoUrl ? (
              <video 
                controls 
                autoPlay 
                muted={isMuted}
                className="w-full h-full object-cover"
                src={activeVideo.videoUrl}
              >
                <source src={activeVideo.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-white text-center">
                  <div className="text-6xl mb-4">🎥</div>
                  <div className="text-xl">Video not available</div>
                  <div className="text-white/70 mt-2">This video cannot be played</div>
                </div>
              </div>
            )}

            {/* Top Controls */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img 
                      src={`https://images.unsplash.com/photo-${150000000 + activeVideo.id}?w=40&h=40&fit=crop&crop=face`}
                      alt={activeVideo.username}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <span className="text-white font-medium">@{activeVideo.username}</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:text-nxe-primary transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                  <button 
                    onClick={closeVideoPlayer}
                    className="text-white hover:text-nxe-primary transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Side Actions in Video Player */}
            <div className="absolute right-4 bottom-20 flex flex-col space-y-6">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleLike(activeVideo.id)}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Heart className={`h-6 w-6 ${likedVideos.has(activeVideo.id) ? 'text-red-500 fill-current' : 'text-white'}`} />
                </button>
                <span className="text-white text-xs mt-1">{activeVideo.likes + (likedVideos.has(activeVideo.id) ? 1 : 0)}</span>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleComment(activeVideo.id)}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <MessageCircle className="h-6 w-6 text-white" />
                </button>
                <span className="text-white text-xs mt-1">{activeVideo.comments}</span>
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleShare(activeVideo.id)}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center"
                >
                  <Share className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Overlay */}
      {showOverlay.type === 'comments' && (
        <div className="fixed inset-0 z-60 bg-black/50">
          <div className="absolute bottom-0 left-0 right-0 bg-nxe-surface rounded-t-3xl max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-nxe-border">
              <div className="flex items-center justify-between">
                <h3 className="text-nxe-text font-semibold">Komentar</h3>
                <button onClick={closeOverlay} className="text-nxe-text-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {sampleComments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <div className="w-8 h-8 rounded-full bg-nxe-card overflow-hidden">
                    <img 
                      src={`https://images.unsplash.com/photo-${150000000 + comment.id}?w=32&h=32&fit=crop&crop=face`}
                      alt={comment.user}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-nxe-text font-medium text-sm">{comment.user}</span>
                      <span className="text-nxe-text-secondary text-xs">{comment.time}</span>
                    </div>
                    <p className="text-nxe-text text-sm mt-1">{comment.comment}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-nxe-border">
              <div className="flex space-x-3">
                <div className="w-8 h-8 rounded-full bg-nxe-card"></div>
                <input 
                  type="text" 
                  placeholder="Tambahkan komentar..."
                  className="flex-1 bg-nxe-card text-nxe-text placeholder-nxe-text-secondary px-4 py-2 rounded-full text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Overlay */}
      {showOverlay.type === 'share' && (
        <div className="fixed inset-0 z-60 bg-black/50">
          <div className="absolute bottom-0 left-0 right-0 bg-nxe-surface rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-nxe-text font-semibold">Bagikan Video</h3>
              <button onClick={closeOverlay} className="text-nxe-text-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[
                { name: "WhatsApp", icon: "💬", color: "bg-green-500" },
                { name: "Instagram", icon: "📷", color: "bg-pink-500" },
                { name: "Twitter", icon: "🐦", color: "bg-blue-500" },
                { name: "Telegram", icon: "✈️", color: "bg-blue-400" },
                { name: "Facebook", icon: "👤", color: "bg-blue-600" },
                { name: "TikTok", icon: "🎵", color: "bg-black" },
                { name: "Copy Link", icon: "🔗", color: "bg-gray-500" },
                { name: "More", icon: "⋯", color: "bg-gray-600" }
              ].map((option) => (
                <button
                  key={option.name}
                  className="flex flex-col items-center space-y-2 p-3 rounded-lg hover:bg-nxe-card transition-colors"
                  onClick={() => {
                    if (option.name === "Copy Link") {
                      navigator.clipboard.writeText(window.location.href);
                      alert("Link disalin!");
                    }
                    closeOverlay();
                  }}
                >
                  <div className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center text-white text-lg`}>
                    {option.icon}
                  </div>
                  <span className="text-nxe-text text-xs">{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

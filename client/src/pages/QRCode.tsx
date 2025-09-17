import { useState, useEffect, useRef } from "react";
import { ChevronLeft, MoreVertical, RefreshCw, Camera, X } from "lucide-react";
import { CustomShareIcon } from "@/components/icons/CustomShareIcon";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QRCode from "qrcode";
import jsQR from "jsqr";

export default function QRCodePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCodeDataURL, setQrCodeDataURL] = useState("");
  const [activeTab, setActiveTab] = useState<"my-code" | "scan-code">("my-code");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  const generateQRCode = async (regenerate = false) => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "User data tidak tersedia",
          variant: "destructive",
        });
        return;
      }

      if (regenerate) {
        setIsRegenerating(true);
      }

      // Create profile URL with timestamp for regeneration
      const timestamp = regenerate ? Date.now() : "";
      const profileUrl = `${window.location.origin}/profile/${user.id}${timestamp ? `?t=${timestamp}` : ""}`;
      
      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(profileUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#134D37', // nxe-primary color
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataURL(qrDataURL);

      if (regenerate) {
        toast({
          title: "Berhasil",
          description: "QR code berhasil diperbarui",
        });
        setIsRegenerating(false);
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "Error",
        description: "Gagal membuat QR code",
        variant: "destructive",
      });
      setIsRegenerating(false);
    }
  };

  const handleShare = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${user?.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: 'Profil Saya - NubiluXchange',
          text: 'Lihat profil saya di NubiluXchange',
          url: profileUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard?.writeText(profileUrl);
        toast({
          title: "Berhasil",
          description: "Link profil berhasil disalin",
        });
      }
    } catch (error) {
      console.error('Failed to share:', error);
      if (error instanceof Error && error.name !== 'AbortError') {
        toast({
          title: "Error",
          description: "Gagal membagikan link",
          variant: "destructive",
        });
      }
    }
  };

  const handleRegenerateQR = () => {
    generateQRCode(true);
  };

  // QR Code scanning functions
  const startScanning = async () => {
    // Check camera capability
    if (!navigator.mediaDevices?.getUserMedia) {
      toast({
        title: "Error",
        description: "Kamera tidak didukung di perangkat ini.",
        variant: "destructive",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsScanning(true);
        scanFrame();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error",
        description: "Tidak bisa mengakses kamera. Pastikan izin kamera telah diberikan.",
        variant: "destructive",
      });
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setScanResult(null);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
  };

  const scanFrame = () => {
    if (videoRef.current && canvasRef.current && isScanning) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setScanResult(code.data);
          toast({
            title: "QR Code Terdeteksi",
            description: "QR Code berhasil dipindai!",
          });
          
          // Handle the scanned QR code safely
          try {
            if (code.data.includes('/profile/')) {
              const profileUrl = new URL(code.data, window.location.origin);
              if (profileUrl.pathname.startsWith('/profile/')) {
                setLocation(profileUrl.pathname);
              }
            }
          } catch (error) {
            // Ignore invalid URLs or non-URL payloads
            console.log('Invalid QR code URL:', code.data);
          }
          
          setTimeout(() => {
            stopScanning();
          }, 2000);
          return;
        }
      }
      
      animationFrameId.current = requestAnimationFrame(scanFrame);
    }
  };

  const handleTabChange = (tab: "my-code" | "scan-code") => {
    if (activeTab === "scan-code" && isScanning) {
      stopScanning();
    }
    setActiveTab(tab);
  };

  // Generate QR code on component mount
  useEffect(() => {
    generateQRCode();
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-nxe-dark border-b border-nxe-surface">
        <div className="h-12 px-4 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => {
              // Use browser history to go back, fallback to home if no history
              if (window.history.length > 1) {
                window.history.back();
              } else {
                setLocation("/");
              }
            }}
            className="text-nxe-text hover:text-nxe-primary transition-colors duration-200"
            data-testid="button-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Title */}
          <h1 className="text-base font-medium text-white">Kode QR</h1>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleShare}
              className="text-nxe-text hover:text-nxe-primary transition-colors duration-200"
              data-testid="button-share"
            >
              <CustomShareIcon className="" size={16} />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="text-nxe-text hover:text-nxe-primary transition-colors duration-200"
                  data-testid="button-menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-nxe-surface border border-gray-600">
                <DropdownMenuItem 
                  onClick={handleRegenerateQR}
                  disabled={isRegenerating}
                  className="cursor-pointer hover:bg-gray-700 transition-colors duration-150"
                >
                  <div className="flex items-center space-x-2 text-white">
                    <RefreshCw className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>Atur ulang barkod</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4">
          <div className="flex">
            <button
              onClick={() => handleTabChange("my-code")}
              className={`flex-1 py-2 text-center border-b-2 transition-colors duration-200 text-sm ${
                activeTab === "my-code"
                  ? "border-nxe-primary text-nxe-primary"
                  : "border-transparent text-nxe-text-secondary hover:text-nxe-text"
              }`}
              data-testid="tab-my-code"
            >
              Kode saya
            </button>
            <button
              onClick={() => handleTabChange("scan-code")}
              className={`flex-1 py-2 text-center border-b-2 transition-colors duration-200 text-sm ${
                activeTab === "scan-code"
                  ? "border-nxe-primary text-nxe-primary"
                  : "border-transparent text-nxe-text-secondary hover:text-nxe-text"
              }`}
              data-testid="tab-scan-code"
            >
              Pindai kode
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {activeTab === "my-code" ? (
          <div className="max-w-sm mx-auto">
            {/* Profile Section */}
            <div className="text-center mb-4">
              {/* Avatar */}
              <div className="mb-2">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full object-cover mx-auto border-2 border-nxe-primary"
                    data-testid="img-profile-avatar"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-nxe-surface flex items-center justify-center mx-auto border-2 border-nxe-primary">
                    <span className="text-nxe-primary font-bold text-sm">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  </div>
                )}
              </div>

              {/* User Info */}
              <h2 className="text-lg font-medium text-white mb-1" data-testid="text-username">
                {user?.displayName || user?.username || "Pengguna"}
              </h2>
              <p className="text-nxe-text-secondary text-xs" data-testid="text-contact">
                Kontak NubiluXchange
              </p>
            </div>

            {/* QR Code Container dengan desain grid putih dan blur hijau */}
            <div className="relative mb-4 rounded-2xl overflow-hidden">
              {/* Background dengan grid pattern - adjusted padding for better QR fit */}
              <div className="bg-white p-4 relative">
                {/* Grid pattern overlay */}
                <div 
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `
                      radial-gradient(circle at 1px 1px, rgba(19,77,55,0.15) 1px, transparent 0),
                      linear-gradient(0deg, transparent 24%, rgba(19,77,55,0.05) 25%, rgba(19,77,55,0.05) 26%, transparent 27%, transparent 74%, rgba(19,77,55,0.05) 75%, rgba(19,77,55,0.05) 76%, transparent 77%, transparent),
                      linear-gradient(90deg, transparent 24%, rgba(19,77,55,0.05) 25%, rgba(19,77,55,0.05) 26%, transparent 27%, transparent 74%, rgba(19,77,55,0.05) 75%, rgba(19,77,55,0.05) 76%, transparent 77%, transparent)
                    `,
                    backgroundSize: '30px 30px'
                  }}
                />
                
                {/* Decorative blur elements */}
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-nxe-primary/20 rounded-full blur-xl" />
                <div className="absolute -top-2 -right-6 w-8 h-8 bg-green-400/30 rounded-full blur-lg" />
                <div className="absolute -bottom-3 -left-2 w-6 h-6 bg-emerald-500/25 rounded-full blur-md" />
                <div className="absolute -bottom-4 -right-4 w-10 h-10 bg-nxe-primary/15 rounded-full blur-xl" />
                
                {/* QR Code */}
                {qrCodeDataURL ? (
                  <div className="relative flex items-center justify-center">
                    <div className="relative">
                      {/* Subtle shadow behind QR */}
                      <div className="absolute inset-0 bg-nxe-primary/5 rounded-lg blur-sm transform translate-x-1 translate-y-1" />
                      <img 
                        src={qrCodeDataURL} 
                        alt="QR Code Profil" 
                        className="relative w-full max-w-[200px] h-auto rounded-lg"
                        data-testid="img-qr-code"
                      />
                    </div>
                    
                    {/* Corner decorations */}
                    <div className="absolute top-2 left-2 w-6 h-6 border-l-[3px] border-t-[3px] border-nxe-primary/40 rounded-tl-lg" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-r-[3px] border-t-[3px] border-nxe-primary/40 rounded-tr-lg" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-l-[3px] border-b-[3px] border-nxe-primary/40 rounded-bl-lg" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-r-[3px] border-b-[3px] border-nxe-primary/40 rounded-br-lg" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="relative">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-nxe-primary"></div>
                      <div className="absolute inset-0 animate-ping rounded-full h-8 w-8 border border-nxe-primary/20"></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-nxe-primary/20 via-green-400/20 to-emerald-500/20 blur-sm -z-10 animate-pulse" />
            </div>

            {/* Description */}
            <div className="text-center text-nxe-text-secondary text-xs leading-relaxed">
              <p>
                Kode QR bersifat privat. Jika Anda membagikannya kepada orang lain, ia bisa 
                memindainya dengan kamera NubiluXchange dan menambahkan Anda sebagai kontak.
              </p>
            </div>
          </div>
        ) : (
          // Scan Code Tab - Camera Interface
          <div className="max-w-sm mx-auto">
            {!isScanning ? (
              <div className="text-center py-8">
                <div className="bg-nxe-surface/50 rounded-2xl p-8 backdrop-blur-sm border border-nxe-primary/20">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-nxe-primary/20 to-green-400/20 flex items-center justify-center mx-auto mb-4">
                      <Camera className="h-8 w-8 text-nxe-primary" />
                    </div>
                    {/* Animated rings */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full border-2 border-nxe-primary/30 animate-ping" />
                  </div>
                  <h3 className="text-white font-semibold mb-2 text-lg">Pindai Kode QR</h3>
                  <p className="text-nxe-text-secondary text-sm mb-6 leading-relaxed">
                    Arahkan kamera ke kode QR untuk memindai profil pengguna
                  </p>
                  <Button 
                    onClick={startScanning}
                    className="w-full bg-nxe-primary hover:bg-nxe-primary/90 text-white py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                    data-testid="button-start-scan"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Mulai Pindai
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Camera View */}
                <div className="relative rounded-2xl overflow-hidden bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-square object-cover"
                    data-testid="video-camera"
                  />
                  
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 border-2 border-transparent">
                    {/* Corner brackets */}
                    <div className="absolute top-4 left-4 w-8 h-8 border-l-[3px] border-t-[3px] border-nxe-primary rounded-tl-lg"></div>
                    <div className="absolute top-4 right-4 w-8 h-8 border-r-[3px] border-t-[3px] border-nxe-primary rounded-tr-lg"></div>
                    <div className="absolute bottom-4 left-4 w-8 h-8 border-l-[3px] border-b-[3px] border-nxe-primary rounded-bl-lg"></div>
                    <div className="absolute bottom-4 right-4 w-8 h-8 border-r-[3px] border-b-[3px] border-nxe-primary rounded-br-lg"></div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-nxe-primary to-transparent animate-pulse"></div>
                    
                    {/* Center focus area */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-nxe-primary/50 rounded-2xl">
                      {/* Moving circular scan indicator */}
                      <div className="absolute inset-0 animate-spin duration-2000">
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-nxe-primary rounded-full shadow-lg">
                          <div className="absolute inset-0 bg-nxe-primary rounded-full animate-ping opacity-75"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Success overlay when QR detected */}
                  {scanResult && (
                    <div className="absolute inset-0 bg-nxe-primary/20 flex items-center justify-center backdrop-blur-sm">
                      <div className="bg-nxe-surface/90 rounded-xl p-4 text-center backdrop-blur-md border border-nxe-primary/30">
                        <div className="w-12 h-12 rounded-full bg-nxe-primary/20 flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">✓</span>
                        </div>
                        <h4 className="text-white font-medium mb-1">QR Code Terdeteksi!</h4>
                        <p className="text-xs text-nxe-text-secondary">Memproses...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Controls */}
                <div className="flex justify-center mt-4 space-x-4">
                  <Button 
                    onClick={stopScanning}
                    variant="outline"
                    className="px-6 py-2 bg-nxe-surface border-nxe-border text-white hover:bg-nxe-surface/80"
                    data-testid="button-stop-scan"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Batal
                  </Button>
                </div>
                
                {/* Instructions */}
                <div className="text-center text-nxe-text-secondary text-xs mt-4 leading-relaxed">
                  <p>Pastikan kode QR berada dalam bingkai dan area terang</p>
                </div>
              </div>
            )}
            
            {/* Hidden canvas for processing */}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </div>
    </div>
  );
}
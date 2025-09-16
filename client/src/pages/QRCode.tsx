import { useState, useEffect } from "react";
import { ChevronLeft, MoreVertical, RefreshCw } from "lucide-react";
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

export default function QRCodePage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [qrCodeDataURL, setQrCodeDataURL] = useState("");
  const [activeTab, setActiveTab] = useState<"my-code" | "scan-code">("my-code");
  const [isRegenerating, setIsRegenerating] = useState(false);

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

  // Generate QR code on component mount
  useEffect(() => {
    generateQRCode();
  }, [user]);

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-nxe-dark border-b border-nxe-surface">
        <div className="h-12 px-4 flex items-center justify-between">
          {/* Back Button */}
          <button
            onClick={() => setLocation("/settings")}
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
              onClick={() => setActiveTab("my-code")}
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
              onClick={() => setActiveTab("scan-code")}
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

            {/* QR Code Container */}
            <div className="bg-white rounded-xl p-4 mb-4 shadow-lg">
              {qrCodeDataURL ? (
                <div className="flex items-center justify-center">
                  <img 
                    src={qrCodeDataURL} 
                    alt="QR Code Profil" 
                    className="w-full max-w-[200px] h-auto"
                    data-testid="img-qr-code"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[200px]">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-nxe-primary"></div>
                </div>
              )}
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
          // Scan Code Tab - Placeholder
          <div className="text-center py-8">
            <div className="bg-nxe-surface rounded-xl p-6 max-w-sm mx-auto">
              <div className="text-nxe-text-secondary mb-3">
                <div className="w-12 h-12 rounded-full bg-nxe-dark flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">📷</span>
                </div>
              </div>
              <h3 className="text-white font-medium mb-2 text-base">Pindai Kode QR</h3>
              <p className="text-nxe-text-secondary text-xs">
                Fitur pemindaian kode QR sedang dalam pengembangan dan akan tersedia segera.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
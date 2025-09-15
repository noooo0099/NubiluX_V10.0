import { 
  User, Shield, Bell, LogOut, ChevronRight,
  Lock, UserPlus, Users, MessageCircle, Palette, 
  QrCode, CheckCircle, Database, Globe, HelpCircle,
  CreditCard, Wallet, MessageSquare, Search, X
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import QRCode from "qrcode";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeDataURL, setQrCodeDataURL] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleLogout = () => {
    if (confirm("Yakin ingin keluar dari akun?")) {
      logout();
      setLocation("/");
    }
  };

  // Focus input when search expands (matching navbar behavior)
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const handleComingSoon = (featureName: string) => {
    toast({
      title: "Coming Soon",
      description: `${featureName} sedang dalam pengembangan dan akan tersedia segera.`,
    });
  };

  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchQuery("");
    }
  };

  const handleBackClick = () => {
    if (showSearch) {
      setShowSearch(false);
      setSearchQuery("");
    } else {
      setLocation("/");
    }
  };

  const generateQRCode = async () => {
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "User data tidak tersedia",
          variant: "destructive",
        });
        return;
      }

      // Create profile URL - using user ID to create unique profile link
      const profileUrl = `${window.location.origin}/profile/${user.id}`;
      
      // Generate QR code as data URL
      const qrDataURL = await QRCode.toDataURL(profileUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#134D37', // nxe-primary color
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataURL(qrDataURL);
      setShowQRModal(true);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      toast({
        title: "Error",
        description: "Gagal membuat QR code",
        variant: "destructive",
      });
    }
  };

  const settingItems = [
    {
      icon: <Lock className="h-6 w-6" />,
      label: "Akun",
      description: "Notifikasi keamanan, ganti nomor",
      action: () => setLocation("/profile"),
    },
    {
      icon: <Shield className="h-6 w-6" />,
      label: "Privasi",
      description: "Blokir kontak, pesan sementara",
      action: () => handleComingSoon("Privasi"),
    },
    {
      icon: <UserPlus className="h-6 w-6" />,
      label: "User Role",
      description: "Kelola peran sebagai pembeli atau penjual",
      action: () => handleComingSoon("User Role"),
    },
    {
      icon: <Database className="h-6 w-6" />,
      label: "Data & Storage",
      description: "Kelola penyimpanan",
      action: () => handleComingSoon("Data & Storage"),
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      label: "Chat",
      description: "Tema, wallpaper, riwayat chat",
      action: () => handleComingSoon("Chat"),
    },
    {
      icon: <Palette className="h-6 w-6" />,
      label: "Theme Settings",
      description: "Kustomisasi tampilan aplikasi",
      action: () => handleComingSoon("Theme Settings"),
    },
    {
      icon: <Bell className="h-6 w-6" />,
      label: "Notifikasi",
      description: "Pesan, grup & nada dering panggilan",
      action: () => handleComingSoon("Notifikasi"),
    },
    {
      icon: <Globe className="h-6 w-6" />,
      label: "Ubah Bahasa",
      description: "Ubah bahasa aplikasi",
      action: () => handleComingSoon("Ubah Bahasa"),
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      label: "Kelola Pembayaran",
      description: "Kelola metode pembayaran user",
      action: () => handleComingSoon("Kelola Pembayaran"),
    },
    {
      icon: <Wallet className="h-6 w-6" />,
      label: "Setting Akun E-Wallet",
      description: "Pengaturan akun e-wallet",
      action: () => handleComingSoon("Setting Akun E-Wallet"),
    },
    {
      icon: <HelpCircle className="h-6 w-6" />,
      label: "Help & Support",
      description: "Dapatkan bantuan dan hubungi support",
      action: () => handleComingSoon("Help & Support"),
    },
    {
      icon: <MessageSquare className="h-6 w-6" />,
      label: "Feedback",
      description: "Berikan masukan untuk aplikasi",
      action: () => handleComingSoon("Feedback"),
    },
  ];

  // Filter settings based on search query
  const filteredSettings = settingItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mobile-viewport-fix keyboard-smooth bg-nxe-dark px-4 py-6 pb-24">
      {/* Header - Smooth search animation similar to navbar */}
      <div className="relative mb-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBackClick}
            className="text-nxe-text hover:text-nxe-primary transition-colors duration-200 shrink-0"
            data-testid="button-back"
          >
            <ChevronRight className="h-6 w-6 rotate-180" />
          </button>
          
          {/* Title with smooth transition */}
          <h1 className={`text-xl font-medium text-white text-center transition-all duration-300 ease-out ${
            showSearch ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}>Pengaturan</h1>
          
          {/* Search Section with smooth animation */}
          <div className="flex items-center transition-all duration-300 ease-out">
            {/* Search Input Container with width/opacity animation */}
            <div 
              className={`overflow-hidden transition-all duration-300 ease-out ${
                showSearch ? 'w-48 opacity-100 mr-3' : 'w-0 opacity-0 mr-0'
              }`}
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari pengaturan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700/80 text-white placeholder-gray-400 px-4 py-2 rounded-full border-0 focus:outline-none focus:bg-gray-600/90 focus:ring-2 focus:ring-nxe-primary/30 transition-all duration-200"
                data-testid="input-search"
                autoFocus={showSearch}
              />
            </div>
            
            {/* Search Toggle Button */}
            <button 
              onClick={handleSearchToggle}
              className="text-nxe-text hover:text-nxe-primary transition-colors duration-200 shrink-0" 
              data-testid="button-search"
            >
              {showSearch ? (
                <X className="h-6 w-6" />
              ) : (
                <Search className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="bg-nxe-card rounded-xl p-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            {user?.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover"
                data-testid="img-profile-avatar"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-nxe-surface flex items-center justify-center">
                <User className="h-8 w-8 text-nxe-text-secondary" />
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-lg font-medium text-nxe-text" data-testid="text-username">
              {user?.displayName || user?.username || "Pengguna"}
            </h2>
            <p className="text-nxe-text-secondary text-sm" data-testid="text-contact">
              {user?.email || "Belum ada kontak"}
            </p>
            <p className="text-nxe-text-secondary text-sm" data-testid="text-status">
              {user?.role === 'admin' ? 'Administrator' : user?.role === 'owner' ? 'Pemilik' : 'Pengguna'}
            </p>
          </div>
          
          {/* QR Code and Check Icons */}
          <div className="flex space-x-4">
            <button 
              onClick={generateQRCode}
              className="text-nxe-primary hover:text-nxe-primary/80 transition-colors duration-200" 
              data-testid="button-qr"
            >
              <QrCode className="h-6 w-6" />
            </button>
            <button className="text-nxe-primary hover:text-nxe-primary/80 transition-colors duration-200" data-testid="button-check">
              <CheckCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Items */}
      <div className="bg-nxe-card rounded-xl overflow-hidden">
        {filteredSettings.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full p-4 flex items-center space-x-4 hover:bg-nxe-surface transition-colors border-b border-nxe-border last:border-b-0"
            data-testid={`button-setting-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="text-nxe-primary">
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-nxe-text font-medium">{item.label}</h3>
              <p className="text-nxe-text-secondary text-sm">{item.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="sm:max-w-md bg-nxe-card border border-nxe-border">
          <DialogHeader>
            <DialogTitle className="text-center text-white">QR Code Profil Saya</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center space-y-4 p-6">
            {qrCodeDataURL && (
              <div className="bg-white p-4 rounded-lg">
                <img 
                  src={qrCodeDataURL} 
                  alt="QR Code Profil" 
                  className="w-64 h-64"
                  data-testid="img-qr-code"
                />
              </div>
            )}
            
            <div className="text-center">
              <h3 className="text-white font-medium mb-2">
                {user?.displayName || user?.username || "Pengguna"}
              </h3>
              <p className="text-nxe-text-secondary text-sm mb-4">
                Scan QR code ini untuk melihat profil saya
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={() => {
                  if (navigator.share && qrCodeDataURL) {
                    navigator.share({
                      title: 'Profil Saya',
                      text: 'Lihat profil saya di NubiluXchange',
                      url: `${window.location.origin}/profile/${user?.id}`
                    }).catch(console.error);
                  } else {
                    // Fallback: copy to clipboard
                    navigator.clipboard?.writeText(`${window.location.origin}/profile/${user?.id}`)
                      .then(() => {
                        toast({
                          title: "Berhasil",
                          description: "Link profil berhasil disalin",
                        });
                      })
                      .catch(() => {
                        toast({
                          title: "Error",
                          description: "Gagal menyalin link",
                          variant: "destructive",
                        });
                      });
                  }
                }}
                variant="outline"
                className="border-nxe-primary text-nxe-primary hover:bg-nxe-primary hover:text-white"
                data-testid="button-share-profile"
              >
                Bagikan
              </Button>
              
              <Button
                onClick={() => setShowQRModal(false)}
                className="bg-nxe-primary hover:bg-nxe-primary/80 text-white"
                data-testid="button-close-qr"
              >
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

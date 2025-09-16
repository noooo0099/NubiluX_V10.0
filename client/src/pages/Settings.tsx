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

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      if (showSearch && 
          searchContainerRef.current && 
          !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearch(false);
        setSearchQuery("");
      }
    };

    if (showSearch) {
      document.addEventListener('pointerdown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
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
      {/* Header - Mobile-optimized search layout */}
      <div ref={searchContainerRef} className="relative mb-6">
        {!showSearch ? (
          // Normal header layout
          <div className="flex items-center justify-between">
            <button 
              onClick={handleBackClick}
              className="text-nxe-text hover:text-nxe-primary transition-colors duration-200 shrink-0"
              data-testid="button-back"
            >
              <ChevronRight className="h-6 w-6 rotate-180" />
            </button>
            
            <h1 className="text-xl font-medium text-white text-center flex-1">Pengaturan</h1>
            
            <button 
              onClick={handleSearchToggle}
              className="text-nxe-text hover:text-nxe-primary transition-colors duration-200 shrink-0" 
              data-testid="button-search"
            >
              <Search className="h-6 w-6" />
            </button>
          </div>
        ) : (
          // Search mode - full width centered
          <div className="flex items-center space-x-3 animate-in slide-in-from-top-2 duration-300">
            <button 
              onClick={handleBackClick}
              className="text-nxe-text hover:text-nxe-primary transition-colors duration-200 shrink-0"
              data-testid="button-back"
            >
              <ChevronRight className="h-6 w-6 rotate-180" />
            </button>
            
            <div className="flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Cari pengaturan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-gray-700/80 text-white placeholder-gray-400 px-4 rounded-full border-0 focus:outline-none focus:bg-gray-600/90 focus:ring-2 focus:ring-nxe-primary/30 transition-all duration-200"
                data-testid="input-search"
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            
            <button 
              onClick={handleSearchToggle}
              className="text-nxe-text hover:text-nxe-primary transition-colors duration-200 shrink-0" 
              data-testid="button-search"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="bg-nxe-card rounded-xl mb-6 overflow-hidden">
        <button
          onClick={() => setLocation("/profile")}
          className="w-full p-4 text-left hover:bg-nxe-surface transition-colors duration-200"
          data-testid="button-profile-container"
        >
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
                onClick={(e) => {
                  e.stopPropagation();
                  setLocation("/qrcode");
                }}
                className="text-nxe-primary hover:text-nxe-primary/80 transition-colors duration-200"
                data-testid="button-qr"
              >
                <QrCode className="h-6 w-6" />
              </button>
              <div className="text-nxe-primary" data-testid="icon-check">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
          </div>
        </button>
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

    </div>
  );
}

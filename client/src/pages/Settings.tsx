import { 
  User, Shield, Bell, LogOut, ChevronRight,
  Lock, UserCheck, Users, MessageCircle, Palette, 
  QrCode, CheckCircle, Database, Globe, HelpCircle,
  CreditCard, Wallet, MessageSquare
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    if (confirm("Yakin ingin keluar dari akun?")) {
      logout();
      setLocation("/");
    }
  };

  const handleComingSoon = (featureName: string) => {
    toast({
      title: "Coming Soon",
      description: `${featureName} sedang dalam pengembangan dan akan tersedia segera.`,
    });
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
      icon: <UserCheck className="h-6 w-6" />,
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

  return (
    <div className="mobile-viewport-fix keyboard-smooth bg-nxe-dark px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => setLocation("/")}
          className="text-nxe-text hover:text-nxe-primary"
          data-testid="button-back"
        >
          <ChevronRight className="h-6 w-6 rotate-180" />
        </button>
        <h1 className="text-xl font-medium text-white">Pengaturan</h1>
        <button className="text-nxe-text hover:text-nxe-primary" data-testid="button-search">
          <QrCode className="h-6 w-6" />
        </button>
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
              {user?.displayName || user?.username || "zen"}
            </h2>
            <p className="text-nxe-text-secondary text-sm" data-testid="text-phone">
              +62 831-1135-0849
            </p>
            <p className="text-nxe-text-secondary text-sm" data-testid="text-status">
              Sedang rapat
            </p>
          </div>
          
          {/* QR Code and Check Icons */}
          <div className="flex space-x-4">
            <button className="text-nxe-primary hover:text-nxe-primary/80" data-testid="button-qr">
              <QrCode className="h-6 w-6" />
            </button>
            <button className="text-nxe-primary hover:text-nxe-primary/80" data-testid="button-check">
              <CheckCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Items */}
      <div className="bg-nxe-card rounded-xl overflow-hidden">
        {settingItems.map((item, index) => (
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

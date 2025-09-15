import { 
  User, Shield, Bell, LogOut, ChevronRight,
  Lock, Camera, Users, MessageCircle, Radio, 
  QrCode, CheckCircle
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
      icon: <User className="h-6 w-6" />,
      label: "Akun",
      description: "Notifikasi keamanan, ganti nomor",
      action: () => setLocation("/profile"),
    },
    {
      icon: <Lock className="h-6 w-6" />,
      label: "Privasi",
      description: "Blokir kontak, pesan sementara",
      action: () => handleComingSoon("Privasi"),
    },
    {
      icon: <Camera className="h-6 w-6" />,
      label: "Avatar",
      description: "Buat, edit, foto profil",
      action: () => handleComingSoon("Avatar"),
    },
    {
      icon: <Users className="h-6 w-6" />,
      label: "Daftar",
      description: "Kelola orang dan grup",
      action: () => handleComingSoon("Daftar"),
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      label: "Chat",
      description: "Tema, wallpaper, riwayat chat",
      action: () => handleComingSoon("Chat"),
    },
    {
      icon: <Radio className="h-6 w-6" />,
      label: "Siaran",
      description: "Kelola daftar dan kirim siaran",
      action: () => handleComingSoon("Siaran"),
    },
    {
      icon: <Bell className="h-6 w-6" />,
      label: "Notifikasi",
      description: "Pesan, grup & nada dering panggilan",
      action: () => handleComingSoon("Notifikasi"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <button 
          onClick={() => setLocation("/")}
          className="text-white hover:text-gray-300"
          data-testid="button-back"
        >
          <ChevronRight className="h-6 w-6 rotate-180" />
        </button>
        <h1 className="text-xl font-medium">Pengaturan</h1>
        <button className="text-white hover:text-gray-300" data-testid="button-search">
          <QrCode className="h-6 w-6" />
        </button>
      </div>

      {/* Profile Section */}
      <div className="p-4 border-b border-gray-800">
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
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-lg font-medium text-white" data-testid="text-username">
              {user?.displayName || user?.username || "zen"}
            </h2>
            <p className="text-gray-400 text-sm" data-testid="text-phone">
              +62 831-1135-0849
            </p>
            <p className="text-gray-400 text-sm" data-testid="text-status">
              Sedang rapat
            </p>
          </div>
          
          {/* QR Code and Check Icons */}
          <div className="flex space-x-4">
            <button className="text-green-500 hover:text-green-400" data-testid="button-qr">
              <QrCode className="h-6 w-6" />
            </button>
            <button className="text-green-500 hover:text-green-400" data-testid="button-check">
              <CheckCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Settings Items */}
      <div className="px-4">
        {settingItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full p-4 flex items-center space-x-4 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
            data-testid={`button-setting-${item.label.toLowerCase()}`}
          >
            <div className="text-gray-400">
              {item.icon}
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white font-medium">{item.label}</h3>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

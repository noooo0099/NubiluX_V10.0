import { 
  User, Shield, Bell, Moon, Sun, LogOut, 
  CreditCard, HelpCircle, Star, ChevronRight,
  UserCheck, Palette, Database, MessageSquare, Globe
} from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [, setLocation] = useLocation();
  const { logout } = useAuth();
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

  const settingSections = [
    {
      title: "Akun",
      items: [
        {
          icon: <User className="h-5 w-5" />,
          label: "Edit Profile",
          description: "Update informasi profil Anda",
          action: () => setLocation("/profile"),
        },
        {
          icon: <UserCheck className="h-5 w-5" />,
          label: "User Role",
          description: "Kelola peran sebagai pembeli atau penjual",
          action: () => handleComingSoon("User Role Management"),
        },
        {
          icon: <Shield className="h-5 w-5" />,
          label: "Privacy Settings",
          description: "Kelola pengaturan privasi",
          action: () => handleComingSoon("Privacy Settings"),
        },
      ]
    },
    {
      title: "Notifikasi",
      items: [
        {
          icon: <Bell className="h-5 w-5" />,
          label: "Notification Preferences",
          description: "Atur preferensi notifikasi",
          action: () => handleComingSoon("Notification Preferences"),
        },
      ]
    },
    {
      title: "Pembayaran",
      items: [
        {
          icon: <CreditCard className="h-5 w-5" />,
          label: "Payment Methods", 
          description: "Kelola metode pembayaran",
          action: () => handleComingSoon("Payment Methods"),
        },
      ]
    },
    {
      title: "App Settings",
      items: [
        {
          icon: <Palette className="h-5 w-5" />,
          label: "Theme Settings",
          description: "Kustomisasi tampilan aplikasi",
          action: () => handleComingSoon("Theme Settings"),
        },
        {
          icon: <Globe className="h-5 w-5" />,
          label: "Language",
          description: "Ubah bahasa aplikasi",
          action: () => handleComingSoon("Language Settings"),
        },
        {
          icon: <Database className="h-5 w-5" />,
          label: "Data & Storage",
          description: "Kelola data dan penyimpanan",
          action: () => handleComingSoon("Data & Storage"),
        },
      ]
    },
    {
      title: "Support",
      items: [
        {
          icon: <HelpCircle className="h-5 w-5" />,
          label: "Help & Support",
          description: "Dapatkan bantuan dan hubungi support",
          action: () => handleComingSoon("Help & Support"),
        },
        {
          icon: <MessageSquare className="h-5 w-5" />,
          label: "Feedback",
          description: "Berikan masukan untuk aplikasi",
          action: () => handleComingSoon("Feedback"),
        },
      ]
    }
  ];

  return (
    <div className="mobile-viewport-fix keyboard-smooth bg-nxe-dark px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <div key={section.title} className="mb-6">
          <h2 className="text-lg font-semibold text-nxe-text mb-3 px-2">{section.title}</h2>
          <div className="bg-nxe-card rounded-xl overflow-hidden">
            {section.items.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full p-4 flex items-center justify-between hover:bg-nxe-surface transition-colors border-b border-nxe-border last:border-b-0"
                data-testid={`button-setting-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-nxe-primary">{item.icon}</div>
                  <div className="text-left">
                    <h3 className="text-nxe-text font-medium">{item.label}</h3>
                    <p className="text-nxe-text-secondary text-sm">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-nxe-text-secondary" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <div className="bg-red-900/20 border border-red-700/30 rounded-xl overflow-hidden">
        <button
          onClick={handleLogout}
          className="w-full p-4 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-900/30 transition-colors"
          data-testid="button-logout"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span className="font-medium">Keluar dari Akun</span>
        </button>
      </div>
    </div>
  );
}

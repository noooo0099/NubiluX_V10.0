import { useState } from "react";
import { ChevronRight, Shield, Eye, Lock, Users, MessageCircle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Privacy() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: true,
    showOnlineStatus: true,
    allowMessageFromStrangers: false,
    showPurchaseHistory: false,
    allowProductIndexing: true,
    shareActivityStatus: true,
    allowDataAnalytics: true,
    enableReadReceipts: true,
  });

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/settings");
    }
  };

  const handleToggleSetting = (key: keyof typeof privacySettings) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSettings = () => {
    // Here you would save to API
    toast({
      title: "Pengaturan privasi tersimpan",
      description: "Pengaturan privasi Anda telah diperbarui.",
    });
  };

  const privacyOptions = [
    {
      key: 'profileVisibility' as const,
      icon: <Eye className="h-5 w-5" />,
      title: 'Profil Publik',
      description: 'Izinkan orang lain melihat profil Anda',
      category: 'profile'
    },
    {
      key: 'showOnlineStatus' as const,
      icon: <Users className="h-5 w-5" />,
      title: 'Status Online',
      description: 'Tampilkan status online kepada pengguna lain',
      category: 'profile'
    },
    {
      key: 'allowMessageFromStrangers' as const,
      icon: <MessageCircle className="h-5 w-5" />,
      title: 'Pesan dari Orang Asing',
      description: 'Izinkan pesan dari pengguna yang tidak Anda kenal',
      category: 'communication'
    },
    {
      key: 'enableReadReceipts' as const,
      icon: <MessageCircle className="h-5 w-5" />,
      title: 'Konfirmasi Baca',
      description: 'Kirim konfirmasi saat Anda membaca pesan',
      category: 'communication'
    },
    {
      key: 'showPurchaseHistory' as const,
      icon: <Search className="h-5 w-5" />,
      title: 'Riwayat Pembelian',
      description: 'Tampilkan riwayat pembelian di profil publik',
      category: 'activity'
    },
    {
      key: 'allowProductIndexing' as const,
      icon: <Search className="h-5 w-5" />,
      title: 'Indeks Produk',
      description: 'Izinkan produk Anda muncul di hasil pencarian',
      category: 'activity'
    },
    {
      key: 'shareActivityStatus' as const,
      icon: <Users className="h-5 w-5" />,
      title: 'Bagikan Aktivitas',
      description: 'Bagikan status aktivitas seperti login terakhir',
      category: 'activity'
    },
    {
      key: 'allowDataAnalytics' as const,
      icon: <Shield className="h-5 w-5" />,
      title: 'Analitik Data',
      description: 'Izinkan penggunaan data untuk analisis dan peningkatan layanan',
      category: 'data'
    },
  ];

  const groupedOptions = {
    profile: privacyOptions.filter(opt => opt.category === 'profile'),
    communication: privacyOptions.filter(opt => opt.category === 'communication'),
    activity: privacyOptions.filter(opt => opt.category === 'activity'),
    data: privacyOptions.filter(opt => opt.category === 'data'),
  };

  const categories = [
    { key: 'profile', title: 'Profil & Identitas', icon: <Users className="h-5 w-5" /> },
    { key: 'communication', title: 'Komunikasi', icon: <MessageCircle className="h-5 w-5" /> },
    { key: 'activity', title: 'Aktivitas & Konten', icon: <Search className="h-5 w-5" /> },
    { key: 'data', title: 'Data & Privasi', icon: <Shield className="h-5 w-5" /> },
  ];

  return (
    <div className="mobile-viewport-fix keyboard-smooth bg-nxe-dark px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={handleBackClick}
          className="text-nxe-text hover:text-nxe-primary transition-colors duration-200"
          data-testid="button-back"
        >
          <ChevronRight className="h-6 w-6 rotate-180" />
        </button>
        <h1 className="text-xl font-semibold text-white">Privasi</h1>
        <div className="w-6 h-6" /> {/* Spacer */}
      </div>

      <div className="space-y-6">
        {/* Header Info */}
        <Card className="bg-nxe-card border-nxe-surface/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2 bg-nxe-primary/20 rounded-full">
                <Shield className="h-6 w-6 text-nxe-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Kontrol Privasi Anda</h2>
                <p className="text-sm text-gray-400">Kelola siapa yang dapat melihat informasi dan aktivitas Anda</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings by Category */}
        {categories.map(category => (
          <Card key={category.key} className="bg-nxe-card border-nxe-surface/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-lg flex items-center space-x-2">
                <div className="text-nxe-primary">{category.icon}</div>
                <span>{category.title}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedOptions[category.key as keyof typeof groupedOptions].map(option => (
                <div key={option.key} className="flex items-center justify-between py-2" data-testid={`privacy-option-${option.key}`}>
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-gray-400">
                      {option.icon}
                    </div>
                    <div>
                      <Label className="text-white font-medium cursor-pointer">
                        {option.title}
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={privacySettings[option.key]}
                    onCheckedChange={() => handleToggleSetting(option.key)}
                    data-testid={`switch-${option.key}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {/* Blocked Users Section */}
        <Card className="bg-nxe-card border-nxe-surface/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg flex items-center space-x-2">
              <div className="text-nxe-primary">
                <Lock className="h-5 w-5" />
              </div>
              <span>Pengguna yang Diblokir</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400 text-sm mb-4">Belum ada pengguna yang diblokir</p>
              <Button 
                variant="outline" 
                className="border-nxe-border text-gray-300 hover:bg-nxe-surface/50"
                data-testid="button-manage-blocked-users"
              >
                Kelola Daftar Blokir
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSaveSettings}
          className="w-full bg-nxe-primary hover:bg-nxe-primary/90 text-white py-3 font-semibold"
          data-testid="button-save-privacy"
        >
          Simpan Pengaturan Privasi
        </Button>
      </div>
    </div>
  );
}
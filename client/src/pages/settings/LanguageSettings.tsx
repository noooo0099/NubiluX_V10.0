import { useState } from "react";
import { ChevronRight, Globe, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isAvailable: boolean;
}

export default function LanguageSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('id'); // Indonesian as default

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/settings");
    }
  };

  const languages: Language[] = [
    {
      code: 'id',
      name: 'Indonesian',
      nativeName: 'Bahasa Indonesia',
      flag: '🇮🇩',
      isAvailable: true
    },
    {
      code: 'en',
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
      isAvailable: true
    },
    {
      code: 'ms',
      name: 'Malay',
      nativeName: 'Bahasa Melayu',
      flag: '🇲🇾',
      isAvailable: false
    },
    {
      code: 'th',
      name: 'Thai',
      nativeName: 'ไทย',
      flag: '🇹🇭',
      isAvailable: false
    },
    {
      code: 'vi',
      name: 'Vietnamese',
      nativeName: 'Tiếng Việt',
      flag: '🇻🇳',
      isAvailable: false
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: '中文',
      flag: '🇨🇳',
      isAvailable: false
    },
    {
      code: 'ja',
      name: 'Japanese',
      nativeName: '日本語',
      flag: '🇯🇵',
      isAvailable: false
    },
    {
      code: 'ko',
      name: 'Korean',
      nativeName: '한국어',
      flag: '🇰🇷',
      isAvailable: false
    }
  ];

  const handleLanguageSelect = (languageCode: string, isAvailable: boolean) => {
    if (!isAvailable) {
      toast({
        title: "Bahasa belum tersedia",
        description: "Bahasa ini sedang dalam pengembangan dan akan tersedia segera.",
        variant: "destructive"
      });
      return;
    }

    setSelectedLanguage(languageCode);
    toast({
      title: "Bahasa berhasil diubah",
      description: `Bahasa aplikasi telah diubah ke ${languages.find(l => l.code === languageCode)?.nativeName}`,
    });
  };

  const availableLanguages = languages.filter(lang => lang.isAvailable);
  const upcomingLanguages = languages.filter(lang => !lang.isAvailable);

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
        <h1 className="text-xl font-semibold text-white">Bahasa</h1>
        <div className="w-6 h-6" /> {/* Spacer */}
      </div>

      <div className="space-y-6">
        {/* Header Info */}
        <Card className="bg-nxe-card border-nxe-surface/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-nxe-primary/20 rounded-full">
                <Globe className="h-6 w-6 text-nxe-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Pilih Bahasa Aplikasi</h2>
                <p className="text-sm text-gray-400">Ubah bahasa interface dan konten aplikasi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Languages */}
        <Card className="bg-nxe-card border-nxe-surface/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Bahasa Tersedia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {availableLanguages.map(language => (
              <button
                key={language.code}
                onClick={() => handleLanguageSelect(language.code, language.isAvailable)}
                className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                  selectedLanguage === language.code
                    ? 'border-nxe-primary bg-nxe-primary/10' 
                    : 'border-nxe-border bg-nxe-surface/50 hover:border-nxe-primary/50'
                }`}
                data-testid={`language-${language.code}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{language.flag}</span>
                  <div className="text-left">
                    <h3 className="text-white font-medium">{language.nativeName}</h3>
                    <p className="text-gray-400 text-sm">{language.name}</p>
                  </div>
                </div>
                
                {selectedLanguage === language.code && (
                  <div className="text-nxe-primary">
                    <Check className="h-5 w-5" />
                  </div>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Coming Soon Languages */}
        <Card className="bg-nxe-card border-nxe-surface/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Segera Hadir</CardTitle>
            <p className="text-gray-400 text-sm">Bahasa-bahasa yang sedang dalam pengembangan</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingLanguages.map(language => (
              <div
                key={language.code}
                className="w-full p-4 rounded-xl border-2 border-nxe-border bg-nxe-surface/30 opacity-60 flex items-center justify-between"
                data-testid={`language-upcoming-${language.code}`}
              >
                <div className="flex items-center space-x-4">
                  <span className="text-2xl opacity-50">{language.flag}</span>
                  <div className="text-left">
                    <h3 className="text-white font-medium">{language.nativeName}</h3>
                    <p className="text-gray-400 text-sm">{language.name}</p>
                  </div>
                </div>
                
                <div className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                  Coming Soon
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card className="bg-nxe-card border-nxe-surface/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-lg">Pengaturan Regional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-white font-medium">Format Mata Uang</h3>
                <p className="text-sm text-gray-400">IDR (Rupiah Indonesia)</p>
              </div>
              <div className="text-gray-400 text-sm">Auto</div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-white font-medium">Format Tanggal</h3>
                <p className="text-sm text-gray-400">DD/MM/YYYY</p>
              </div>
              <div className="text-gray-400 text-sm">Auto</div>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <div>
                <h3 className="text-white font-medium">Zona Waktu</h3>
                <p className="text-sm text-gray-400">WIB (GMT+7)</p>
              </div>
              <div className="text-gray-400 text-sm">Auto</div>
            </div>
          </CardContent>
        </Card>

        {/* Apply Button */}
        <Button
          className="w-full bg-nxe-primary hover:bg-nxe-primary/90 text-white py-3 font-semibold"
          data-testid="button-apply-language"
        >
          Terapkan Bahasa
        </Button>
      </div>
    </div>
  );
}
import { useState } from "react";
import { ChevronRight, Database, Trash2, Download, Upload, HardDrive, Cloud } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function DataStorage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [storageData] = useState({
    used: 245, // MB
    total: 1024, // MB
    images: 128,
    videos: 89,
    documents: 28,
    cache: 15,
    other: 8
  });

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      setLocation("/settings");
    }
  };

  const handleClearCache = () => {
    toast({
      title: "Cache berhasil dibersihkan",
      description: "Cache aplikasi telah dihapus untuk menghemat ruang penyimpanan.",
    });
  };

  const handleExportData = () => {
    toast({
      title: "Ekspor data dimulai",
      description: "Data Anda akan diunduh dalam format ZIP.",
    });
  };

  const handleDeleteAllData = () => {
    toast({
      title: "Konfirmasi diperlukan",
      description: "Fitur ini memerlukan konfirmasi tambahan untuk keamanan.",
      variant: "destructive"
    });
  };

  const usagePercentage = (storageData.used / storageData.total) * 100;

  const storageTypes = [
    { name: 'Gambar & Media', size: storageData.images, icon: Upload, color: 'bg-blue-500' },
    { name: 'Video', size: storageData.videos, icon: Upload, color: 'bg-purple-500' },
    { name: 'Dokumen', size: storageData.documents, icon: Download, color: 'bg-green-500' },
    { name: 'Cache App', size: storageData.cache, icon: Database, color: 'bg-yellow-500' },
    { name: 'Lainnya', size: storageData.other, icon: HardDrive, color: 'bg-gray-500' },
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
        <h1 className="text-xl font-semibold text-white">Data & Penyimpanan</h1>
        <div className="w-6 h-6" /> {/* Spacer */}
      </div>

      {/* Storage Overview */}
      <Card className="bg-nxe-card border-nxe-surface/30 mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <Database className="h-6 w-6 text-nxe-primary" />
            <CardTitle className="text-white text-lg">Ringkasan Penyimpanan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Terpakai</span>
            <span className="text-gray-300">{storageData.used}MB dari {storageData.total}MB</span>
          </div>
          <Progress value={usagePercentage} className="h-3" />
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Tersisa: {storageData.total - storageData.used}MB</span>
            <Badge variant={usagePercentage > 80 ? "destructive" : "secondary"}>
              {usagePercentage.toFixed(1)}% terpakai
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Storage Breakdown */}
      <Card className="bg-nxe-card border-nxe-surface/30 mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg">Rincian Penyimpanan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {storageTypes.map((type, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-nxe-surface rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${type.color}`}>
                  <type.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-medium">{type.name}</span>
              </div>
              <span className="text-gray-300">{type.size}MB</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Storage Actions */}
      <Card className="bg-nxe-card border-nxe-surface/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg">Kelola Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleClearCache}
            variant="outline"
            className="w-full justify-start bg-nxe-surface border-nxe-border text-white hover:bg-nxe-surface/80"
            data-testid="button-clear-cache"
          >
            <Trash2 className="h-4 w-4 mr-3" />
            Bersihkan Cache ({storageData.cache}MB)
          </Button>

          <Button
            onClick={handleExportData}
            variant="outline"
            className="w-full justify-start bg-nxe-surface border-nxe-border text-white hover:bg-nxe-surface/80"
            data-testid="button-export-data"
          >
            <Download className="h-4 w-4 mr-3" />
            Ekspor Data Pribadi
          </Button>

          <Button
            onClick={handleDeleteAllData}
            variant="outline"
            className="w-full justify-start border-red-600 text-red-400 hover:bg-red-600/10"
            data-testid="button-delete-all"
          >
            <Trash2 className="h-4 w-4 mr-3" />
            Hapus Semua Data
          </Button>
        </CardContent>
      </Card>

      {/* Cloud Storage Info */}
      <Card className="bg-nxe-card border-nxe-surface/30 mt-6">
        <CardHeader className="pb-4">
          <div className="flex items-center space-x-3">
            <Cloud className="h-6 w-6 text-nxe-primary" />
            <CardTitle className="text-white text-lg">Backup Cloud</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-400 mb-3">
              Backup otomatis ke cloud untuk melindungi data Anda
            </p>
            <Badge variant="secondary" className="bg-green-600/20 text-green-400">
              Backup Aktif
            </Badge>
            <p className="text-xs text-gray-500 mt-2">
              Terakhir backup: Hari ini, 14:30
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
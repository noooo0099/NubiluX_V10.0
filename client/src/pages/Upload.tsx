import { useState } from "react";
import { Upload as UploadIcon, Image, Video, DollarSign, ArrowLeft, Camera, FileText, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Upload() {
  const [uploadType, setUploadType] = useState<"product" | "poster" | "video">("product");
  const [selectedSkins, setSelectedSkins] = useState<string[]>([]);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const categories = [
    { value: "mobile_legends", label: "Mobile Legends" },
    { value: "pubg_mobile", label: "PUBG Mobile" },
    { value: "free_fire", label: "Free Fire" },
    { value: "valorant", label: "Valorant" },
    { value: "genshin_impact", label: "Genshin Impact" },
  ];

  const sampleSkins = [
    "Alucard - Viscount", "Miya - Moonlight Archer", "Layla - Malefic Gunner",
    "Tigreal - Fallen Guard", "Akai - Panda Warrior", "Franco - Wild Boar",
    "Bane - Count Dracula", "Alice - Blood Moon", "Nana - Wind Fairy",
    "Saber - Regulus", "Gord - Conqueror", "Zilong - Eastern Warrior"
  ];

  const handleSkinToggle = (skin: string) => {
    if (selectedSkins.includes(skin)) {
      setSelectedSkins(selectedSkins.filter(s => s !== skin));
    } else if (selectedSkins.length < 54) {
      setSelectedSkins([...selectedSkins, skin]);
    } else {
      toast({
        title: "Maximum limit reached",
        description: "You can select maximum 54 skins",
        variant: "destructive",
      });
    }
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement product upload
    toast({
      title: "Product uploaded successfully!",
      description: "Your product is now live on the marketplace.",
    });
  };

  const handlePosterGeneration = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement poster generation payment
    toast({
      title: "Poster generation started",
      description: "Please complete the payment to continue.",
    });
  };

  const handleVideoUpload = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement video upload
    toast({
      title: "Video uploaded successfully!",
      description: "Your video is now available in the feed.",
    });
  };

  const getUploadTypeTitle = () => {
    switch (uploadType) {
      case "product": return "Upload Akun Game";
      case "poster": return "Generate Poster";
      case "video": return "Upload Video";
      default: return "Upload Content";
    }
  };

  const getUploadTypeDescription = () => {
    switch (uploadType) {
      case "product": return "Post akun game Anda secara gratis";
      case "poster": return "AI akan membuat poster otomatis dari profile dan skin Anda";
      case "video": return "Share gameplay highlights Anda";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-nxe-dark">
      {/* Mobile Header */}
      <div className="sticky top-0 z-10 bg-nxe-dark border-b border-nxe-surface px-4 py-3">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 text-white" 
            data-testid="button-back"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white" data-testid="text-page-title">{getUploadTypeTitle()}</h1>
            <p className="text-sm text-gray-400" data-testid="text-page-description">{getUploadTypeDescription()}</p>
          </div>
        </div>
      </div>

      {/* Upload Type Selector - Mobile Optimized */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-6" data-testid="selector-upload-type">
          <Button
            onClick={() => setUploadType("product")}
            variant={uploadType === "product" ? "default" : "outline"}
            className={`flex flex-col items-center space-y-2 h-16 ${uploadType === "product" ? "bg-nxe-primary hover:bg-nxe-primary/80" : ""}`}
            data-testid="button-product-type"
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">Akun</span>
          </Button>
          <Button
            onClick={() => setUploadType("poster")}
            variant={uploadType === "poster" ? "default" : "outline"}
            className={`flex flex-col items-center space-y-2 h-16 ${uploadType === "poster" ? "bg-nxe-primary hover:bg-nxe-primary/80" : ""}`}
            data-testid="button-poster-type"
          >
            <Image className="h-5 w-5" />
            <span className="text-xs">Poster</span>
          </Button>
          <Button
            onClick={() => setUploadType("video")}
            variant={uploadType === "video" ? "default" : "outline"}
            className={`flex flex-col items-center space-y-2 h-16 ${uploadType === "video" ? "bg-nxe-primary hover:bg-nxe-primary/80" : ""}`}
            data-testid="button-video-type"
          >
            <PlayCircle className="h-5 w-5" />
            <span className="text-xs">Video</span>
          </Button>
        </div>
      </div>

      {/* Mobile Form Content */}
      <div className="px-4 pb-6">
        {uploadType === "product" && (
          <div className="space-y-4">
            <form id="product-form" onSubmit={handleProductSubmit} className="space-y-4 pb-20">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-white text-sm font-medium">Judul Akun</Label>
                <Input
                  id="title"
                  placeholder="Misal: Akun Mobile Legends Epic - 54 Skins"
                  className="bg-nxe-surface border-nxe-surface text-white h-12 text-base"
                  required
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-white text-sm font-medium">Kategori Game</Label>
                <Select required>
                  <SelectTrigger className="bg-nxe-surface border-nxe-surface text-white h-12" data-testid="select-category">
                    <SelectValue placeholder="Pilih game" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-white text-sm font-medium">Harga (IDR)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Misal: 2500000"
                  className="bg-nxe-surface border-nxe-surface text-white h-12 text-base"
                  required
                  data-testid="input-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white text-sm font-medium">Deskripsi Detail</Label>
                <Textarea
                  id="description"
                  placeholder="Jelaskan detail akun, rank, item, dan keunggulan lainnya..."
                  className="bg-nxe-surface border-nxe-surface text-white min-h-[120px] text-base resize-none"
                  required
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thumbnail" className="text-white text-sm font-medium">Upload Screenshot</Label>
                <div className="relative">
                  <Input
                    id="thumbnail"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    required
                    data-testid="input-thumbnail"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-nxe-surface border-nxe-surface text-white border-dashed"
                    onClick={() => document.getElementById('thumbnail')?.click()}
                    data-testid="button-upload-image"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Pilih Gambar Screenshot
                  </Button>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="fixed bottom-0 left-0 right-0 bg-nxe-dark border-t border-nxe-surface p-4">
                <Button
                  type="submit"
                  form="product-form"
                  className="w-full bg-nxe-primary hover:bg-nxe-primary/80 text-white h-12 text-base font-semibold"
                  data-testid="button-submit-product"
                >
                  Posting Akun Gratis
                </Button>
              </div>
            </form>
          </div>
        )}

        {uploadType === "poster" && (
          <div className="space-y-4">
            <div className="bg-nxe-accent/10 border border-nxe-accent/30 rounded-lg p-4 mb-4">
              <div className="flex items-center space-x-2 mb-2">
                <DollarSign className="h-5 w-5 text-nxe-accent" />
                <span className="text-white font-semibold">AI Poster Premium</span>
                <Badge className="bg-nxe-accent text-white">Rp 5,000</Badge>
              </div>
              <p className="text-sm text-gray-300">
                AI akan membuat poster otomatis dari profile dan skin Anda
              </p>
            </div>

            <form id="poster-form" onSubmit={handlePosterGeneration} className="space-y-4 pb-20">
              <div className="space-y-2">
                <Label htmlFor="profile-image" className="text-white text-sm font-medium">Upload Foto Profile</Label>
                <div className="relative">
                  <Input
                    id="profile-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    required
                    data-testid="input-profile-image"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-nxe-surface border-nxe-surface text-white border-dashed"
                    onClick={() => document.getElementById('profile-image')?.click()}
                    data-testid="button-upload-profile"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Pilih Foto Profile
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white text-sm font-medium">
                  Pilih Skins ({selectedSkins.length}/54)
                </Label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 bg-nxe-surface rounded-lg" data-testid="grid-skin-selection">
                  {sampleSkins.map((skin) => (
                    <Button
                      key={skin}
                      type="button"
                      onClick={() => handleSkinToggle(skin)}
                      variant={selectedSkins.includes(skin) ? "default" : "outline"}
                      className={`text-xs h-10 justify-start ${selectedSkins.includes(skin) ? "bg-nxe-primary" : ""}`}
                      data-testid={`button-skin-${skin.replace(/\s+/g, '-')}`}
                    >
                      {skin}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-nxe-surface p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Preview Layout Poster</h4>
                <div className="text-gray-400 text-sm space-y-1">
                  <p>• Foto profile di bagian atas</p>
                  <p>• Skins tersusun dalam grid 9×6</p>
                  <p>• Styling professional dengan tema game</p>
                  <p>• Output resolusi tinggi (720×1280)</p>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="fixed bottom-0 left-0 right-0 bg-nxe-dark border-t border-nxe-surface p-4">
                <Button
                  type="submit"
                  form="poster-form"
                  disabled={selectedSkins.length === 0}
                  className="w-full bg-nxe-accent hover:bg-nxe-accent/80 text-white h-12 text-base font-semibold"
                  data-testid="button-submit-poster"
                >
                  Generate Poster - Bayar Rp 5,000 via QRIS
                </Button>
              </div>
            </form>
          </div>
        )}

        {uploadType === "video" && (
          <div className="space-y-4">
            <form id="video-form" onSubmit={handleVideoUpload} className="space-y-4 pb-20">
              <div className="space-y-2">
                <Label htmlFor="video-title" className="text-white text-sm font-medium">Judul Video</Label>
                <Input
                  id="video-title"
                  placeholder="Misal: Epic Mobile Legends Gameplay"
                  className="bg-nxe-surface border-nxe-surface text-white h-12 text-base"
                  required
                  data-testid="input-video-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-category" className="text-white text-sm font-medium">Kategori Game</Label>
                <Select required>
                  <SelectTrigger className="bg-nxe-surface border-nxe-surface text-white h-12" data-testid="select-video-category">
                    <SelectValue placeholder="Pilih game" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video-file" className="text-white text-sm font-medium">Upload Video</Label>
                <div className="relative">
                  <Input
                    id="video-file"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    required
                    data-testid="input-video-file"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 bg-nxe-surface border-nxe-surface text-white border-dashed"
                    onClick={() => document.getElementById('video-file')?.click()}
                    data-testid="button-upload-video"
                  >
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Pilih File Video
                  </Button>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="fixed bottom-0 left-0 right-0 bg-nxe-dark border-t border-nxe-surface p-4">
                <Button
                  type="submit"
                  form="video-form"
                  className="w-full bg-nxe-primary hover:bg-nxe-primary/80 text-white h-12 text-base font-semibold"
                  data-testid="button-submit-video"
                >
                  Upload Video
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
